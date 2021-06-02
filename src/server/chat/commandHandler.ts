import config from '../../../config/config';
import { Chatter, Command } from '../types/chat';

import * as fs from 'fs';
import * as path from 'path';

import * as xssFilters from 'xss-filters';
import log from '../utils/log';

// Load commands.
const commands: Command[] = [];

fs.readdir(path.resolve(__dirname, `./commands`), async (err, files) => {
    for (const file of files) {
        if (err) log(`red`, err);

        const fileName = file.split(`.`)[0].toLowerCase();
        log(`yellow`, `Loaded command ${fileName}.`);

        const command = await import(`./commands/${file}`);
        commands.push({
            name: fileName,
            config: {
                desc: command.cmd.desc,
                usage: command.cmd.usage || ``,
                aliases: command.cmd.aliases || []
            },
            run: command.run
        });
    }
});

const run = async (message: string, chatter: Chatter, chatUsers: Chatter[]) => {
    const args = message.slice(config.chatPrefix.length).trim().split(` `);
    const command = args.shift();

    const cmd = commands.find(cmd => cmd.name === command || cmd.config.aliases.includes(command));
    if (!cmd) return chatter.socket.emit(`commandMessage`, `That command does not exist!`);
    else if (args.length < cmd.config.usage.split(`<`).length - 1) return chatter.socket.emit(`commandMessage`, `Proper usage is: ${config.chatPrefix + command} ${xssFilters.inHTMLData(cmd.config.usage)}.`);
    return cmd.run(message, args, chatter, chatUsers);
};

export {
    commands,
    run
};
