/**
 * 𝒀𝑼𝑺𝑬𝑭 𝑩𝑂𝑻 - A WhatsApp Bot
 * ©𝙋𝙊𝙒𝙀𝙍𝙀𝘿 𝘽𝙔 𝙔𝙐𝙎𝙀𝙁 𝘿𝙀𝙑
 *
 * .yts / .ytsearch command - Search YouTube
 */
const yts = require('yt-search');

async function ytsCommand(sock, chatId, message, args) {
    const query = (args || []).join(' ').trim();

    if (!query) {
        await sock.sendMessage(chatId, {
            text: '╭┈┈┈┈━━━━━━┈┈┈┈◈◈\n┋❒ مثال الاستخدام:\n┋❒ .yts Ed Sheeran\n┋❒ .ytsearch ليونيل ميسي\n╰┈┈┈┈━━━━━━┈┈┈┈◈◈\n> ©𝙋𝙊𝙒𝙀𝙍𝙀𝘿 𝘽𝙔 𝙔𝙐𝙎𝙀𝙁 𝘿𝙀𝙑'
        }, { quoted: message });
        return;
    }

    try {
        const searchResult = await yts(query);
        const videos = searchResult.videos.slice(0, 5);

        if (!videos || videos.length === 0) {
            await sock.sendMessage(chatId, { text: `❌ لم أجد نتائج لـ "${query}"` }, { quoted: message });
            return;
        }

        let replyText = `╭┈┈┈┈━━━━━━┈┈┈┈◈◈\n┋🔎 *نتائج بحث يوتيوب:*\n┋📝 "${query}"\n╰┈┈┈┈━━━━━━┈┈┈┈◈◈\n\n`;

        videos.forEach((v, i) => {
            replyText += `┌┤🎬 *${i + 1}. ${v.title}*\n`;
            replyText += `│├⏳ المدة: ${v.timestamp}\n`;
            replyText += `│├👁️ المشاهدات: ${v.views}\n`;
            replyText += `│├📅 النشر: ${v.ago}\n`;
            replyText += `│╰🔗 ${v.url}\n\n`;
        });

        replyText += `╭┈┈┈┈━━━━━━┈┈┈┈◈◈\n┋📊 المجموع: ${videos.length} نتيجة\n╰┈┈┈┈━━━━━━┈┈┈┈◈◈\n> ©𝙋𝙊𝙒𝙀𝙍𝙀𝘿 𝘽𝙔 𝙔𝙐𝙎𝙀𝙁 𝘿𝙀𝙑`;

        await sock.sendMessage(chatId, {
            image: { url: videos[0].thumbnail },
            caption: replyText
        }, { quoted: message });

    } catch (e) {
        console.error('YouTube search error:', e);
        await sock.sendMessage(chatId, {
            text: '╭┈┈┈┈━━━━━━┈┈┈┈◈◈\n┋❌ حدث خطأ أثناء البحث!\n┋📌 حاول مرة أخرى لاحقاً\n╰┈┈┈┈━━━━━━┈┈┈┈◈◈\n> ©𝙋𝙊𝙒𝙀𝙍𝙀𝘿 𝘽𝙔 𝙔𝙐𝙎𝙀𝙁 𝘿𝙀𝙑'
        }, { quoted: message });
    }
}

module.exports = { ytsCommand };
