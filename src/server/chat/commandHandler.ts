import config from '../../../config/config';
import Chatter from './socket';

import * as fs from 'fs';
import * as path from 'path';

import * as xssFilters from 'xss-filters';
import log from '../utils/log';

// Load commands.
const commands = [];

fs.readdir(path.resolve(__dirname, `./commands`), (err, files) => {
    if (err) return log(`red`, err.stack);

    for (const command of files) {
        const commandName = command.split(`.`)[0].toLowerCase();
        const cmd = require(`./commands/${command}`);

        commands.push({
            name: commandName,
            description: cmd.config.description,
            aliases: cmd.config.aliases || [],
            usage: cmd.usage || ``,
            run: cmd.run
        });

        log(`yellow`, `Loaded command ${command.split(`.`)[0]}.`);
    }
});

const run = async (message: string, chatter: Chatter, chatUsers: Chatter[]) => {
    const args = message.slice(config.chatPrefix.length).trim().split(` `);
    const command = args.shift();

    const cmd = commands.find(cmd => cmd.name === command || cmd.aliases.includes(command));
    if (!cmd) return chatter.socket.emit(`commandMessage`, `That command does not exist!`);
    else if (args.length < cmd.usage.split(`<`).length - 1) return chatter.socket.emit(`commandMessage`, `Proper usage is: ${config.chatPrefix + command} ${xssFilters.inHTMLData(cmd.usage)}.`);
    return cmd.run(message, args, chatter, chatUsers);
};

export {
    commands,
    run
};
