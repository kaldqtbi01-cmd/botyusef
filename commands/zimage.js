/**
 * 𝒀𝑼𝑺𝑬𝑭 𝑩𝑂𝑻 - A WhatsApp Bot
 * ©𝙋𝙊𝙒𝙀𝙍𝙀𝘿 𝘽𝙔 𝙔𝙐𝙎𝙀𝙁 𝘿𝙀𝙑
 *
 * .zimage command - Text to image generation (Z Image / aitubo.ai)
 */
const axios = require('axios');

const GENERATE_URL = 'https://api.aitubo.ai/api/image/generate-zimage';
const QUERY_URL = 'https://api.aitubo.ai/api/image/query-zimage';
const MODEL_ID = '692902b3c1d5c8cc2bd8fb98';
const MODEL_NAME = 'Z Image';

const MAX_POLL_ATTEMPTS = 40; // ~40s max wait
const POLL_INTERVAL_MS = 1000;

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function startGeneration(prompt, count) {
    const res = await axios.post(
        GENERATE_URL,
        {
            modelId: MODEL_ID,
            modelName: MODEL_NAME,
            prompt,
            count,
            width: 512,
            height: 512,
            mode: 'free_image',
            styles: ['None'],
        },
        { timeout: 30000 }
    );

    const taskId = res.data?.data?.id;
    if (!taskId) {
        throw new Error('No task id returned from generate-zimage: ' + JSON.stringify(res.data));
    }
    return taskId;
}

async function pollForImages(taskId) {
    for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt++) {
        const res = await axios.get(QUERY_URL, {
            params: { id: taskId },
            timeout: 15000
        });

        const images = res.data?.data?.result?.images || [];
        if (images.length > 0) {
            return images.map(img => `https://file.aitubo.ai/${img}`);
        }

        await sleep(POLL_INTERVAL_MS);
    }
    return [];
}

async function zimageCommand(sock, chatId, message, args) {
    const prompt = (args || []).join(' ').trim();

    if (!prompt) {
        await sock.sendMessage(chatId, {
            text: `❌ Please provide a prompt.\n\nUsage: .zimage <prompt>\nExample: .zimage a cat astronaut floating in space`
        }, { quoted: message });
        return;
    }

    try {
        await sock.sendMessage(chatId, { text: '🎨 Generating your image(s), please wait...' }, { quoted: message });

        const taskId = await startGeneration(prompt, 1);
        const imageUrls = await pollForImages(taskId);

        if (imageUrls.length === 0) {
            await sock.sendMessage(chatId, {
                text: '❌ Timed out waiting for the image(s). Please try again later.'
            }, { quoted: message });
            return;
        }

        for (let i = 0; i < imageUrls.length; i++) {
            await sock.sendMessage(chatId, {
                image: { url: imageUrls[i] },
                caption: i === 0
                    ? `🎨 *${prompt}*\n\n©𝙋𝙊𝙒𝙀𝙍𝙀𝘿 𝘽𝙔 𝙔𝙐𝙎𝙀𝙁 𝘿𝙀𝙑`
                    : undefined
            }, { quoted: message });
        }

    } catch (error) {
        if (error.response) {
            console.error('Error in .zimage command - status:', error.response.status);
            console.error('Error in .zimage command - body:', JSON.stringify(error.response.data));
        } else {
            console.error('Error in .zimage command:', error.message);
        }
        await sock.sendMessage(chatId, {
            text: '❌ Something went wrong while generating the image(s). Please try again later.'
        }, { quoted: message });
    }
}

module.exports = { zimageCommand };
