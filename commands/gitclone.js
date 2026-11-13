/**
 * 𝒀𝑼𝑺𝑬𝑭 𝑩𝑂𝑻 - A WhatsApp Bot
 * ©𝙋𝙊𝙒𝙀𝙍𝙀𝘿 𝘽𝙔 𝙔𝙐𝙎𝙀𝙁 𝘿𝙀𝙑
 *
 * .gitclone command - Download a GitHub repo, gist, or raw file
 */
const fetch = require('node-fetch');

const regexRepo = /(?:https|git)(?::\/\/|@)github\.com[\/:]([^\/:]+)\/([^\/:]+)(?:\/tree\/[^\/]+|\/blob\/[^\/]+)?(?:\/(.+))?/i;
const regexGist = /https:\/\/gist\.github\.com\/([^\/]+)\/([a-zA-Z0-9]+)/i;
const regexRawGitHub = /https:\/\/raw\.githubusercontent\.com\/([^\/:]+)\/([^\/:]+)\/([^\/:]+)\/(.+)/i;

async function gitcloneCommand(sock, chatId, message, args) {
    const url = (args || []).join(' ').trim();

    if (!url) {
        await sock.sendMessage(chatId, {
            text: '❌ Please enter a GitHub URL.\n\nExample: .gitclone https://github.com/user/repo'
        }, { quoted: message });
        return;
    }

    const isRepo = regexRepo.test(url);
    const isGist = regexGist.test(url);
    const isRawGitHub = regexRawGitHub.test(url);

    if (!isRepo && !isGist && !isRawGitHub) {
        await sock.sendMessage(chatId, { text: '❌ Invalid GitHub URL!' }, { quoted: message });
        return;
    }

    try {
        if (isRepo) {
            let [, user, repo] = url.match(regexRepo) || [];
            repo = repo.replace(/\.git$/, '');
            const apiUrl = `https://api.github.com/repos/${user}/${repo}/zipball`;

            let filename = `${repo}.zip`;
            try {
                const headResponse = await fetch(apiUrl, { method: 'HEAD' });
                const contentDisposition = headResponse.headers.get('content-disposition');
                if (contentDisposition) {
                    const match = contentDisposition.match(/attachment; filename=(.*)/);
                    if (match && match[1]) filename = match[1];
                }
            } catch (e) { /* fall back to default filename */ }

            await sock.sendMessage(chatId, {
                document: { url: apiUrl },
                fileName: filename,
                mimetype: 'application/zip',
                caption: `✅ Repository downloaded!\nUser: ${user}\nRepository: ${repo}\n\n©𝙋𝙊𝙒𝙀𝙍𝙀𝘿 𝘽𝙔 𝙔𝙐𝙎𝙀𝙁 𝘿𝙀𝙑`
            }, { quoted: message });

        } else if (isGist) {
            const [, user, gistId] = url.match(regexGist) || [];
            const gistUrl = `https://gist.github.com/${user}/${gistId}/download`;

            await sock.sendMessage(chatId, {
                document: { url: gistUrl },
                fileName: `${gistId}.zip`,
                mimetype: 'application/zip',
                caption: `✅ Gist downloaded!\nID: ${gistId}\n\n©𝙋𝙊𝙒𝙀𝙍𝙀𝘿 𝘽𝙔 𝙔𝙐𝙎𝙀𝙁 𝘿𝙀𝙑`
            }, { quoted: message });

        } else if (isRawGitHub) {
            const [, user, repo, branch, filepath] = url.match(regexRawGitHub) || [];
            const rawUrl = `https://raw.githubusercontent.com/${user}/${repo}/${branch}/${filepath}`;
            const filename = filepath.split('/').pop() || 'file.txt';

            await sock.sendMessage(chatId, {
                document: { url: rawUrl },
                fileName: filename,
                mimetype: 'application/octet-stream',
                caption: `✅ File downloaded!\nPath: ${filepath}\n\n©𝙋𝙊𝙒𝙀𝙍𝙀𝘿 𝘽𝙔 𝙔𝙐𝙎𝙀𝙁 𝘿𝙀𝙑`
            }, { quoted: message });
        }

    } catch (error) {
        console.error('Error in .gitclone command:', error.message);
        await sock.sendMessage(chatId, {
            text: `❌ Download error: ${error.message}`
        }, { quoted: message });
    }
}

module.exports = { gitcloneCommand };
