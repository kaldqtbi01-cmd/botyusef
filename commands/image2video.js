// commands/image2video.js
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const crypto = require('crypto');

const channelInfo = {
    contextInfo: {
        forwardingScore: 1,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
            newsletterJid: '120363230090465542@newsletter',
            newsletterName: '𝒀𝑼𝑺𝑬𝑭 𝑩𝑂𝑻',
            serverMessageId: -1
        }
    }
};

/**
 * Vheer.com API Client for Image to Video conversion
 */
class VheerClient {
    constructor() {
        this.session = axios.create({
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            },
            timeout: 60000
        });
        
        // Encryption key (same as Python version)
        this.key = this._deriveKey();
    }

    _deriveKey() {
        const password = "vH33r_2025_AES_GCM_S3cur3_K3y_9X7mP4qR8nT2wE5yU1oI6aS3dF7gH0jK9lZ";
        const salt = "vheer-salt-2024";
        
        // PBKDF2 implementation (simplified)
        const iterations = 10000;
        const keyLength = 32;
        
        // Use Node.js crypto for PBKDF2
        return crypto.pbkdf2Sync(password, salt, iterations, keyLength, 'sha256');
    }

    _encrypt(data) {
        // AES-GCM encryption
        const nonce = crypto.randomBytes(12);
        const cipher = crypto.createCipheriv('aes-256-gcm', this.key, nonce);
        
        const jsonData = JSON.stringify(data);
        const encrypted = Buffer.concat([
            cipher.update(jsonData, 'utf8'),
            cipher.final()
        ]);
        
        const authTag = cipher.getAuthTag();
        
        // Combine: nonce + encrypted + authTag
        const result = Buffer.concat([nonce, encrypted, authTag]);
        return result.toString('base64');
    }

    _decrypt(encryptedBase64) {
        try {
            const data = Buffer.from(encryptedBase64, 'base64');
            
            // Extract components
            const nonce = data.subarray(0, 12);
            const authTag = data.subarray(data.length - 16);
            const encrypted = data.subarray(12, data.length - 16);
            
            const decipher = crypto.createDecipheriv('aes-256-gcm', this.key, nonce);
            decipher.setAuthTag(authTag);
            
            const decrypted = Buffer.concat([
                decipher.update(encrypted),
                decipher.final()
            ]);
            
            return JSON.parse(decrypted.toString('utf8'));
        } catch (error) {
            console.error('Decryption error:', error);
            return null;
        }
    }

    async _uploadImage(imageBuffer, filename) {
        try {
            // Get CSRF token
            await this.session.get('https://vheer.com/app/image-to-image');
            await this.session.get('https://vheer.com/app/api/auth/csrf');
            
            // Prepare upload
            const ext = filename.split('.').pop().toLowerCase() || 'jpg';
            const mimeTypes = {
                'jpg': 'image/jpeg',
                'jpeg': 'image/jpeg',
                'png': 'image/png',
                'webp': 'image/webp',
                'gif': 'image/gif'
            };
            const mimeType = mimeTypes[ext] || 'image/jpeg';
            
            // Encrypt params
            const encryptedParams = this._encrypt({
                taskType: 5,
                type: 5,
                filename: filename
            });
            
            // Create form data
            const formData = new FormData();
            formData.append('file', imageBuffer, {
                filename: filename,
                contentType: mimeType
            });
            formData.append('params', encryptedParams);
            
            const response = await this.session.post(
                'https://vheer.com/app/api/vheer/upload',
                formData,
                {
                    headers: {
                        ...formData.getHeaders()
                    }
                }
            );
            
            if (response.data && response.data.data_enc) {
                const decrypted = this._decrypt(response.data.data_enc);
                return decrypted;
            }
            
            return null;
        } catch (error) {
            console.error('Upload error:', error);
            return null;
        }
    }

    async _checkStatus(code) {
        try {
            const encryptedParams = this._encrypt({
                taskType: 5,
                type: 5,
                code: code
            });
            
            const response = await this.session.post(
                'https://vheer.com/app/api/vheer/status',
                {
                    params: encryptedParams
                }
            );
            
            if (response.data && response.data.data_enc) {
                const decrypted = this._decrypt(response.data.data_enc);
                return decrypted;
            }
            
            return null;
        } catch (error) {
            console.error('Status check error:', error);
            return null;
        }
    }

    async processImageToVideo(imageBuffer, filename, waitTime = 120) {
        try {
            console.log('🔄 Starting image to video conversion...');
            
            // Upload image
            console.log('📤 Uploading image...');
            const uploadResult = await this._uploadImage(imageBuffer, filename);
            
            if (!uploadResult) {
                return { success: false, error: 'Upload failed' };
            }
            
            const code = uploadResult.code || uploadResult.imageId;
            if (!code) {
                return { success: false, error: 'No code received from server' };
            }
            
            console.log(`✅ Uploaded successfully. Code: ${code}`);
            
            // Wait for processing
            console.log('⏳ Waiting for processing...');
            const startTime = Date.now();
            let lastStatus = '';
            
            while ((Date.now() - startTime) / 1000 < waitTime) {
                const statusResult = await this._checkStatus(code);
                
                if (statusResult) {
                    const status = statusResult.status;
                    console.log(`📊 Status: ${status}`);
                    
                    if (status === 'success') {
                        if (statusResult.downloadUrls && statusResult.downloadUrls.length > 0) {
                            return {
                                success: true,
                                downloadUrl: statusResult.downloadUrls[0],
                                result: statusResult
                            };
                        }
                        return { success: false, error: 'No download URLs found' };
                    }
                    
                    if (status === 'failed') {
                        return { success: false, error: 'Processing failed' };
                    }
                }
                
                // Wait before checking again
                await new Promise(resolve => setTimeout(resolve, 5000));
            }
            
            return { success: false, error: 'Processing timeout' };
        } catch (error) {
            console.error('Process error:', error);
            return { success: false, error: error.message };
        }
    }
}

/**
 * Download image from WhatsApp message
 */
async function downloadImageFromMessage(sock, message) {
    try {
        let mediaMessage = null;
        
        if (message.message?.imageMessage) {
            mediaMessage = message.message.imageMessage;
        } else if (message.message?.videoMessage) {
            mediaMessage = message.message.videoMessage;
        } else if (message.message?.documentMessage) {
            mediaMessage = message.message.documentMessage;
        }
        
        if (!mediaMessage) {
            throw new Error('No image found in message');
        }
        
        const stream = await downloadMediaMessage(
            message,
            'buffer',
            {},
            {
                logger: console,
                reuploadRequest: sock.updateMediaMessage
            }
        );
        
        return stream;
    } catch (error) {
        throw new Error('Failed to download image: ' + error.message);
    }
}

/**
 * Handle .image2video command
 */
async function image2videoCommand(sock, chatId, message) {
    try {
        // Check if message contains an image
        const hasImage = message.message?.imageMessage || 
                        message.message?.videoMessage ||
                        message.message?.documentMessage;
        
        if (!hasImage) {
            await sock.sendMessage(chatId, {
                text: '❌ Please reply to an image message or send an image with the command.\n\n📝 Usage:\n1. Send an image with caption: `.image2video`\n2. Reply to an image with: `.image2video`\n\n⏱️ Processing time: 30-120 seconds',
                ...channelInfo
            }, { quoted: message });
            return;
        }
        
        // Send processing message
        const processingMsg = await sock.sendMessage(chatId, {
            text: '🎬 Converting image to video...\n⏳ This may take 30-120 seconds.\n\nPlease wait...',
            ...channelInfo
        }, { quoted: message });
        
        // Download image
        let imageBuffer;
        let filename = 'image.jpg';
        
        try {
            imageBuffer = await downloadImageFromMessage(sock, message);
            
            // Get filename from message if available
            if (message.message?.imageMessage?.fileName) {
                filename = message.message.imageMessage.fileName;
            } else if (message.message?.documentMessage?.fileName) {
                filename = message.message.documentMessage.fileName;
            }
        } catch (error) {
            await sock.sendMessage(chatId, {
                text: `❌ Failed to download image: ${error.message}`,
                ...channelInfo
            }, { quoted: message });
            return;
        }
        
        // Process image to video
        const client = new VheerClient();
        const result = await client.processImageToVideo(imageBuffer, filename, 120);
        
        if (!result.success) {
            await sock.sendMessage(chatId, {
                text: `❌ Image to video conversion failed.\n\nError: ${result.error}\n\nPlease try again later or use a different image.`,
                ...channelInfo
            }, { quoted: message });
            return;
        }
        
        // Download the video
        console.log('📥 Downloading video from:', result.downloadUrl);
        const videoResponse = await axios.get(result.downloadUrl, {
            responseType: 'arraybuffer',
            timeout: 60000
        });
        
        const videoBuffer = Buffer.from(videoResponse.data);
        
        // Send the video
        await sock.sendMessage(chatId, {
            video: videoBuffer,
            caption: `🎬 *Image to Video Conversion Complete*\n\n✅ Successfully converted image to video.\n\n🤖 Powered by Vheer.com AI`,
            ...channelInfo
        }, { quoted: message });
        
    } catch (error) {
        console.error('Image2Video command error:', error);
        await sock.sendMessage(chatId, {
            text: `❌ An error occurred: ${error.message}\n\nPlease try again later.`,
            ...channelInfo
        }, { quoted: message });
    }
}

module.exports = {
    image2videoCommand
};