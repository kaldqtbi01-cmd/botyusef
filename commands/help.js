const settings = require('../settings');
const fs = require('fs');
const path = require('path');

async function helpCommand(sock, chatId, message) {
    const helpMessage = `
*╭────(* *༒𝒀𝑼𝑺𝑬𝑭 𝑩𝑂𝑻༒* *)──╮*
*│* 友 ɴᴀᴍᴇ ʙᴏᴛ : 𝒀𝑼𝑺𝑬𝑭 𝑩𝑂𝑻
*│* 友 ᴠᴇʀsɪᴏɴ : ${settings.version}
*│* 友 ᴅᴇᴠᴇʟᴏᴘᴇʀ : 𝙔𝙐𝙎𝙀𝙁 𝘿𝙀𝙑
*╰────────────────────╯*

*𝗦𝗖𝗥𝗢𝗟𝗟 𝗗𝗢𝗪𝗡 𝗙𝗢𝗥 𝗖𝗠𝗗:*

╭─「📁*GENERAL»*
*│* ✧ .help or .menu
*│* ✧ .ping
*│* ✧ .alive
*│* ✧ .owner
*│* ✧ .news
*│* ✧ .lyrics <song_title>
*│* ✧ .8ball <question>
*│* ✧ .trt <text> <lang>
*│* ✧ .jid
╰━━━━━━━━━━━━━━━━━━⭓ 

╭─«📁 *ADMIN»*
*│* ✯ .ban @user
*│* ✯ .demote @user
*│* ✯ .delete or .del
*│* ✯ .antilink
*│* ✯ .antibadword
*│* ✯ .clear
*│* ✯ .antitag <on/off>
*│* ✯ .chatbot
╰━━━━━━━━━━━━━━━━━━⭓

╭─«📁 *OWNER»*
*│* ☠︎︎ .mode <public/private>
*│* ☠︎ .clearsession
*│* ☠︎ .antidelete
*│* ☠︎ .cleartmp
*│* ☠︎ .autoreact <on/off>
*│* ☠︎ .autostatus <on/off>
*│* ☠︎ .autotyping <on/off>
*│* ☠︎ .autoread <on/off>
*│* ☠︎ .anticall <on/off>
╰━━━━━━━━━━━━━━━━━━⭓

╭─「«📁 *IMAGE/STICKER»*
*│* ⏣ .emojimix <emj1>+<emj2>
*│* ⏣ .igs <insta link>
*│* ⏣ .igsc <insta link>
╰━━━━━━━━━━━━━━━━━━⭓  

╭─「«📁 *PIES»*
*│* ⏣ .pies <country>
*│* ⏣ .china 
*│* ⏣ .indonesia 
*│* ⏣ .japan 
*│* ⏣ .korea 
*│* ⏣ .hijab
╰━━━━━━━━━━━━━━━━━━⭓

╭─「«📁 *GAMES»*
*│* ⏣ .dare
╰━━━━━━━━━━━━━━━━━━⭓

╭─「«📁 *FUN»*
*│* ⏣ .compliment @user
*│* ⏣ .character @user
╰━━━━━━━━━━━━━━━━━━⭓

╭─「«📁 *DOWNLOADER»*
*│* ⏣ .play <song_name>
*│* ⏣ .song <song_name>
*│* ⏣ .music <song_name>
*│* ⏣ .instagram <link>
*│* ⏣ .facebook <link>
*│* ⏣ .tiktok <link>
*│* ⏣ .video <song name>
*│* ⏣ .ytmp4 <Link>
╰━━━━━━━━━━━━━━━━━━⭓

©𝙋𝙊𝙒𝙀𝙍𝙀𝘿 𝘽𝙔 𝙔𝙐𝙎𝙀𝙁 𝘿𝙀𝙑`;

    try {
        const imagePath = path.join(__dirname, '../assets/bot_image.jpg');
        
        if (fs.existsSync(imagePath)) {
            const imageBuffer = fs.readFileSync(imagePath);
            
            await sock.sendMessage(chatId, {
                image: imageBuffer,
                caption: helpMessage,
                contextInfo: {
                    forwardingScore: 1,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: '120363230090465542@newsletter',
                        newsletterName: '𝒀𝑼𝑺𝑬𝑭 𝑩𝑂𝑻',
                        serverMessageId: -1
                    }
                }
            },{ quoted: message });
        } else {
            console.error('Bot image not found at:', imagePath);
            await sock.sendMessage(chatId, { 
                text: helpMessage,
                contextInfo: {
                    forwardingScore: 1,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: '120363230090465542@newsletter',
                        newsletterName: '𝒀𝑼𝑺𝑬𝑭 𝑩𝑂𝑻',
                        serverMessageId: -1
                    } 
                }
            });
        }
    } catch (error) {
        console.error('Error in help command:', error);
        await sock.sendMessage(chatId, { text: helpMessage });
    }
}

module.exports = helpCommand;
