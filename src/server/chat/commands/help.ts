import { Chatter, CommandConfig } from '../../types/chat';
import log from '../../utils/log';

import * as fs from 'fs';
import * as path from 'path';

// Load commands.
const commands = [];
fs.readdir(path.resolve(__dirname), async (err, files) => {
    if (err) return log(`red`, err.stack);

    for (const command of files) {
        const commandName = command.split(`.`)[0];

        const cmd = await import(`../commands/${command}`);
        commands.push({
            name: commandName,
            description: cmd.description,
            aliases: cmd.aliases,
            usage: cmd.usage,
            run: cmd.run
        });
    }
});

const config: CommandConfig = {
    description: `List all commands!`,
    aliases: [`h`]
};

const run = async (message: string, args: string[], chatter: Chatter, chatUsers: Chatter[]) => {
    chatter.socket.emit(`commandMessage`, `Available Commands:`);
    for (const command of commands) chatter.socket.emit(`commandMessage`, `/${command.name} - ${command.description}`);
};

export {
    config,
    run
};
