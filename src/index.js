#!/usr/bin/env node

const { Client } = require('discord.js');
const { readFileSync } = require('fs');
const fetch = require('node-fetch');
const chalk = require('chalk');

const client = new Client({
    fetchAllMembers: true,
    disableEveryone: true,
});

let loggedIn = false;
let currentGuild;
let currentChannel;

let showChannels = true;
let history = [];
const clear = () => {
    history = history
        .flatMap(l =>
            l
                .split('\n')
                .filter((el, ind, arr) => el || (arr[ind - 1] && arr[ind + 1])),
        )
        .filter(x => x[0]);
    process.stdout.write('\u001b[3J\u001b[2J\u001b[1J');
    console.clear();
    let channels;
    if (currentGuild) {
        channels = currentGuild.channels.cache.filter(c => c.children);
        let i = 0;
        let channelsStr = [];
        if (currentGuild.channels.cache.filter(c => c.type !== 'category' && !c.parentID).size) {
            currentGuild.channels.cache
                .filter(c => c.type !== 'category' && !c.parentID)
                .forEach(c => channelsStr.push(`${(currentChannel || {}).id === c.id ? '> ' : ' #'}${c.name} (${c.id})`));
        }
        channelsStr.push(...channels.map(c => `${c.name}\n${
            c
                .children
                .map(ch => `${(currentChannel || {}).id === ch.id ? ' > ' : '  #'}${ch.name} (${ch.id})`)
                .join('\n')
        }`));
        while (channelsStr.length < history.length) channelsStr.push('');
        const oldStr = [ ...channelsStr ];
        channelsStr = channelsStr
            .map((s, _, a) => {
                const getSpaces = l => ' '.repeat(
                    a
                        .map(_l => _l.split('\n'))
                        .flat(Infinity)
                        .sort((_a, b) => b.length - _a.length)[0]
                        .length
                    - l.length + 1,
                );
                return s
                    .split('\n')
                    .map(l => `${showChannels ? `${l}${getSpaces(l)}| ` : ''}${history[i++] || ''}`)
                    .join('\n');
            })
            .join('\n');
        console.log(channelsStr);
        if (showChannels) process.stdout.write(
            ' '
                .repeat(
                    (
                        oldStr
                            .flatMap(l => l.split('\n'))
                            .sort((_a, b) => b.length - _a.length)[0] || { length: 0 }
                    )
                        .length + 1,
                ) + '| ',
        );
    } else console.log(history.join('\n'));
};
const log = (...args) => {
    history.push(args.map(a => `<${chalk.hex('#2ecc71')('System')}> - ${chalk.yellow(new Date().toLocaleString())}\n${a}`).join(' '));
    clear();
};

const cmds = {
    login: token => {
        if (loggedIn) return log(`Already logged in as ${client.user.id} (${client.user.tag}).\n`);
        loggedIn = true;
        client.login(token).then(() => {
            if (client.guilds.cache.size === 1) currentGuild = client.guilds.cache.first();
            log(`Logged in as ${chalk.cyan(client.user.tag)} (${chalk.blue(client.user.id)}).\nUse the info command for info about the client.\n`);
            clear();
        }).catch(() => log('Invalid token.\n'));
        client.on('message', msg => {
            if (msg.channel.id !== (currentChannel || {}).id) return;
            history.push(
                `@${
                    chalk.hex(msg.member.displayColor || '#ffffff')(msg.author.tag)
                }${
                    msg.author.bot ? ' ' + chalk.blue('[bot]') : ''
                } - ${
                    chalk.yellow(msg.createdAt.toLocaleString())
                }:\n${
                    msg.content
                        .replace(/`{1,3}([\s\S]+)`{1,3}/g, (_, t) => (_.startsWith('```') ? '\n' : '') + chalk.inverse(t.replace(/(^`+|`+$)/g, '')))
                        .replace(/\*\*([\s\S]+)\*\*/g, (_, t) => chalk.bold(t))
                        .replace(/\*([\s\S]+)\*/g, (_, t) => chalk.italic(t))
                        .replace(/__([\s\S]+)__/g, (_, t) => chalk.underline(t))
                        .replace(/~~([\s\S]+)~~/g, (_, t) => chalk.strikethrough(t))
                }\n`);
            clear();
        });
    },
    logout: () => {
        if (!loggedIn) return log('Not logged in\n');
        loggedIn = false;
        client.removeAllListeners('message');
        client
            .destroy()
            .then(() => log('Successfully logged out'));
    },
    info: () => {
        if (!loggedIn) return log('Not logged in\n');
        log(`CLIENT INFO\nID: ${client.user.id}\nUsername: ${client.user.username}\nDiscriminator: ${client.user.discriminator}\nTag: ${client.user.tag}\n`);
        if (currentGuild) log(`GUILD INFO\nID: ${currentGuild.id}\nName: ${currentGuild.name}\nMembers: ${currentGuild.members.cache.size}\nChannels: ${currentGuild.channels.cache.size}\n`);
        if (currentChannel) log(`CHANNEL INFO\nID: ${currentChannel.id}\nName: ${currentChannel.name}\n`);
    },
    guild: (...id) => {
        id = id
            .join(' ')
            .trim();
        if (!loggedIn) return log('Not logged in\n');
        const found = client.guilds.cache.find(g => g.name.toLowerCase() === id.toLowerCase() || g.id === id);
        if (found) {
            currentGuild = found;
            log(`\n${found.name} (${found.id}):\n${found.channels.cache.filter(c => c.type === 'tex\n').map(c => '#' + c.name).join('\n')}\n`);
        }
        else {log('Couldn\'t find a guild with the name or ID ' + id);}
    },
    channel: (...id) => {
        id = id.join(' ').trim();
        if (!loggedIn) return log('Not logged in\n');
        if (!currentGuild) return log('Currently not in a guild\n');
        const found = currentGuild.channels.cache.find(g => g.name.toLowerCase() === id.toLowerCase() || g.id === id);
        if (found) {
            if (found.type !== 'text') return log('Only text channels are allowed\n');
            currentChannel = found;
            log(`\n#${currentChannel.name} (${currentChannel.id})\n`);
        }
        else {log('Couldn\'t find a channel with the name or ID ' + id);}
    },
    send: (...content) => {
        content = content.join(' ').trim();
        if (!loggedIn) return log('Not logged in\n');
        if (!currentChannel) return log('Currently not in a channel. Use the channel command to switch to a channel, but be sure you\'re in a guild first. Use the help command for more info\n');
        currentChannel.send(content).catch(() => log('There was an error sending a message to ' + chalk.cyan(currentChannel.name)));
    },
    sendfile: path => {
        if (!loggedIn) return log('Not logged in\n');
        if (!currentChannel) return log('Currently not in a channel. Use the channel command to switch to a channel, but be sure you\'re in a guild first. Use the help command for more info\n');
        try {
            currentChannel.send(readFileSync(path).toString()).catch(() => log('There was an error sending a message to ' + chalk.cyan(currentChannel.name)));
        } catch {
            log('Invalid path');
        }
    },
    sendhaste: link => {
        if (!loggedIn) return log('Not logged in\n');
        if (!currentChannel) return log('Currently not in a channel. Use the channel command to switch to a channel, but be sure you\'re in a guild first. Use the help command for more info\n');
        const haste = (link || '').split('/')[(link || '').split('/').length - 1];
        if (!haste) return log('Invalid haste URL');
        const tryURL = async url => {
            const d = await fetch(url + haste);
            if (!d.ok) return url === 'https://hastebin.com/raw/' ? log('Invalid haste URL') : tryURL('https://hastebin.com/raw/');
            currentChannel.send(await d.text()).catch(() => log('There was an error sending a message to ' + chalk.cyan(currentChannel.name)));
        };
        tryURL('https://hasteb.in/raw/');
    },
    exit: () => process.exit(1),
    clear: () => {
        history = [];
        clear();
    },
    channels: () => clear(showChannels = !showChannels),
    help: () => {
        log('login <token>\nLogs in a client using a bot token');
        log('logout\nLogs out of the client');
        log('info\nShows info about the currently logged in client, guild, & channel');
        log('guild <id|name>\nChanges guilds to the found one, either by name or by ID');
        log('channel <id|name>\nChanges channels to the found one in the current guild, which the bot will send messages to and recieve them from (must be in a guild to use!)');
        log('send <content>\nSends a message to the current channel (must be in a channel to use!)');
        log('sendFile <path>\nSends a file\'s contents to the current channel (must be in a channel to use!)');
        log('sendHaste <url>\nSends a haste\'s (hastebin.com & hasteb.in) contents to the current channel (must be in a channel to use!)');
        log('clear\nClears the text history');
        log('exit\nExits the process.');
        log('channels\nToggles showing channels on the left side');
    },
};

process.stdin.resume();
process.stdin.on('data', d => {
    const [ cmd, ...args ] = d.toString().split(/\s+/g);
    if (cmds[cmd.toLowerCase()]) {
        history.push(`<${chalk.hex('#2ecc71')('Console')}> - ${chalk.yellow(new Date().toLocaleString())}:\n${d.toString()}\n`);
        cmds[cmd.toLowerCase()](...(args.map(a => a.trim())));
    } else log('Unknown command. Use the help command for a list of commands');
});

log('Welcome to Discord CLI.\nUse the help command for a list of commands');