/**
 * 𝒀𝑼𝑺𝑬𝑭 𝑩𝑂𝑻 - ssearch.js (sticker search via Tenor GIFs)
 * ©𝙋𝙊𝙒𝙀𝙍𝙀𝘿 𝘽𝙔 𝙔𝙐𝙎𝙀𝙁 𝘿𝙀𝙑
 *
 * Commands: .ssearch <query> | .stickersearch <query>
 *
 * NOTE: This version does NOT use "wa-sticker-formatter" (which pulls in
 * the native "sharp" library and was confirmed to crash this bot's server
 * with native heap corruption). It reuses the same ffmpeg + node-webpmux
 * based sticker pipeline already proven safe in commands/igs.js.
 */
const axios = require('axios');
const { convertBufferToStickerWebp } = require('./igs');

async function ssearchCommand(sock, chatId, message, args) {
    if (!args || !args.trim()) {
        return sock.sendMessage(chatId, {
            text: `Please enter a word to search for stickers!\nExample: .ssearch funny cat`
        }, { quoted: message });
    }

    try {
        await sock.sendMessage(chatId, { react: { text: '🔍', key: message.key } });

        const tenorApiKey = 'AIzaSyCyouca1_KKy4W_MG1xsPzuku5oa8W358c';

        const gifResponse = await axios.get(
            `https://tenor.googleapis.com/v2/search?q=${encodeURIComponent(args)}&key=${tenorApiKey}&client_key=my_project&limit=5&media_filter=gif`
        );

        const results = gifResponse.data.results;
        if (!results || results.length === 0) {
            return sock.sendMessage(chatId, {
                text: `No stickers found for "${args}"`
            }, { quoted: message });
        }

        for (let i = 0; i < Math.min(5, results.length); i++) {
            const gifUrl = results[i].media_formats.gif.url;

            try {
                const gifBuffer = (await axios.get(gifUrl, { responseType: 'arraybuffer' })).data;
                const stickerBuffer = await convertBufferToStickerWebp(gifBuffer, true, false);
                await sock.sendMessage(chatId, { sticker: stickerBuffer }, { quoted: message });
            } catch (innerErr) {
                console.error('[.ssearch] failed to convert one GIF, skipping:', innerErr.message);
            }
        }

        await sock.sendMessage(chatId, { react: { text: '✅', key: message.key } });

    } catch (error) {
        console.error(`Sticker Error:`, error);
        await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
        await sock.sendMessage(chatId, {
            text: `An error occurred while fetching stickers.`
        }, { quoted: message });
    }
}

module.exports = ssearchCommand;
