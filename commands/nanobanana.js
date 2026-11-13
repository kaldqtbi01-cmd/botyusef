/**
 * 𝒀𝑼𝑺𝑬𝑭 𝑩𝑂𝑻 - A WhatsApp Bot
 * ©𝙋𝙊𝙒𝙀𝙍𝙀𝘿 𝘽𝙔 𝙔𝙐𝙎𝙀𝙁 𝘿𝙀𝙑
 *
 * .nanobanana command - AI image editing (Nano Banana / a1d.ai)
 */
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const { TelegraPh } = require('../lib/uploader');

const EDIT_URL = 'https://a1d.ai/api/nano-banana/edit';
const STATUS_URL = 'https://a1d.ai/api/nano-banana/status';

const MAX_POLL_ATTEMPTS = 20; // ~100s max wait
const POLL_INTERVAL_MS = 5000;

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function streamToBuffer(stream) {
    const chunks = [];
    for await (const chunk of stream) {
        chunks.push(chunk);
    }
    return Buffer.concat(chunks);
}

async function startEdit(imageUrl, prompt) {
    const res = await axios.post(
        EDIT_URL,
        {
            prompt: String(prompt),
            images: [imageUrl],
            enable_base64_output: false
        },
        {
            timeout: 30000,
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
                'Accept': 'application/json',
                'Origin': 'https://a1d.ai',
                'Referer': 'https://a1d.ai/'
            }
        }
    );

    const taskId = res.data?.data?.id;
    if (!taskId) {
        throw new Error('No task id returned from nano-banana/edit: ' + JSON.stringify(res.data));
    }
    return taskId;
}

async function pollForOutput(taskId) {
    for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt++) {
        const res = await axios.get(STATUS_URL, {
            params: { id: taskId },
            timeout: 15000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
                'Accept': 'application/json',
                'Referer': 'https://a1d.ai/'
            }
        });

        const outputs = res.data?.data?.outputs || [];
        if (outputs.length > 0) {
            return outputs[0];
        }

        await sleep(POLL_INTERVAL_MS);
    }
    return null;
}

async function nanobananaCommand(sock, chatId, message, args) {
    const prompt = (args || []).join(' ').trim();

    if (!prompt) {
        await sock.sendMessage(chatId, {
            text: `❌ Please provide an editing instruction.\n\nUsage: reply to an image with:\n.nanobanana <what to change>\nExample: .nanobanana turn this into an anime style drawing`
        }, { quoted: message });
        return;
    }

    const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const imageMessage = quoted?.imageMessage || message.message?.imageMessage;

    if (!imageMessage) {
        await sock.sendMessage(chatId, {
            text: '❌ Please reply to an image with .nanobanana <instruction>, or send an image with that caption.'
        }, { quoted: message });
        return;
    }

    let tempPath;
    try {
        await sock.sendMessage(chatId, { text: '🍌 Editing your image with Nano Banana, please wait...' }, { quoted: message });

        const stream = await downloadContentFromMessage(imageMessage, 'image');
        const buffer = await streamToBuffer(stream);

        tempPath = path.join(os.tmpdir(), `nanobanana_${Date.now()}.jpg`);
        fs.writeFileSync(tempPath, buffer);
        const publicUrl = await TelegraPh(tempPath);
        console.log('[.nanobanana] uploaded image URL:', publicUrl);

        let taskId;
        try {
            taskId = await startEdit(publicUrl, prompt);
            console.log('[.nanobanana] task id:', taskId);
        } catch (e) {
            console.error('[.nanobanana] FAILED at edit request. URL:', EDIT_URL);
            console.error('[.nanobanana] status:', e.response?.status);
            console.error('[.nanobanana] body:', JSON.stringify(e.response?.data));
            throw e;
        }

        let outputUrl;
        try {
            outputUrl = await pollForOutput(taskId);
        } catch (e) {
            console.error('[.nanobanana] FAILED at status request. URL:', STATUS_URL);
            console.error('[.nanobanana] status:', e.response?.status);
            console.error('[.nanobanana] body:', JSON.stringify(e.response?.data));
            throw e;
        }

        if (!outputUrl) {
            await sock.sendMessage(chatId, {
                text: '❌ Timed out waiting for the edited image. Please try again later.'
            }, { quoted: message });
            return;
        }

        await sock.sendMessage(chatId, {
            image: { url: outputUrl },
            caption: `🍌 *${prompt}*\n\n©𝙋𝙊𝙒𝙀𝙍𝙀𝘿 𝘽𝙔 𝙔𝙐𝙎𝙀𝙁 𝘿𝙀𝙑`
        }, { quoted: message });

    } catch (error) {
        if (error.response) {
            console.error('Error in .nanobanana command - status:', error.response.status);
            console.error('Error in .nanobanana command - body:', JSON.stringify(error.response.data));
        } else {
            console.error('Error in .nanobanana command:', error.message);
        }
        await sock.sendMessage(chatId, {
            text: '❌ Something went wrong while editing the image. Please try again later.'
        }, { quoted: message });
    } finally {
        if (tempPath && fs.existsSync(tempPath)) {
            fs.unlink(tempPath, () => {});
        }
    }
}

module.exports = { nanobananaCommand };
