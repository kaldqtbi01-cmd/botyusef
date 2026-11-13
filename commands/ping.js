const os = require('os');
const settings = require('../settings.js');

function formatTime(seconds) {
    const days = Math.floor(seconds / (24 * 60 * 60));
    seconds = seconds % (24 * 60 * 60);
    const hours = Math.floor(seconds / (60 * 60));
    seconds = seconds % (60 * 60);
    const minutes = Math.floor(seconds / 60);
    seconds = Math.floor(seconds % 60);

    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (seconds > 0 || parts.length === 0) parts.push(`${seconds}s`);

    return parts.join(' ');
}

async function pingCommand(sock, chatId, message) {
    try {
        const start = Date.now();
        await sock.sendMessage(chatId, { text: 'Pong!' }, { quoted: message });
        const end = Date.now();
        const ping = Math.round((end - start) / 2);

        const uptimeInSeconds = process.uptime();
        const uptimeFormatted = formatTime(uptimeInSeconds);

        const botInfoWithButtons = {
            text: `
┏━━〔 🔥𝒀𝑼𝑺𝑬𝑭 𝑩𝑂𝑻🔥 〕━━┓
┃ ☠︎︎ Ping     : ${ping} ms
┃ ☠︎︎ Uptime   : ${uptimeFormatted}
┃ ☠︎︎ Version  : v${settings.version}
┃ ☠︎︎ Platform : ${os.platform()}
┃ ☠︎︎ Memory   : ${Math.round((os.totalmem() - os.freemem()) / (1024 * 1024 * 1024))}GB / ${Math.round(os.totalmem() / (1024 * 1024 * 1024))}GB
┗━━━━━━━━━━━━━━━━━━━┛`.trim(),
            footer: "𝒀𝑼𝑺𝑬𝑭 𝑩𝑂𝑻 • Use buttons below",
            buttons: [
                { buttonId: '.menu', buttonText: { displayText: '📋 Menu' }, type: 1 },
                { buttonId: 'https://whatsapp.com/channel/0029VaN2eQQ59PwNixDnvD16', buttonText: { displayText: '📢 Channel' }, type: 1 }
            ],
            headerType: 1
        };

        await sock.sendMessage(chatId, botInfoWithButtons, { quoted: message });

    } catch (error) {
        console.error('Error in ping command:', error);
        await sock.sendMessage(chatId, { 
            text: '❌ Failed to get bot status. Please try again later.' 
        }, { quoted: message });
    }
}

module.exports = pingCommand;