const fs = require(`fs`);
const path = require(`path`);
const log = require(`../../utils/log.js`);

// Load commands.
const commands = [];
fs.readdir(path.resolve(__dirname, `../commands`), (err, files) => {
    if (err) return log(`red`, err.stack);

    for (const command of files) {
        const commandName = command.split(`.`)[0];
        if (commandName === `_template`) continue;
        const cmd = require(`../commands/${command}`);
        commands.push({
            name: commandName,
            description: cmd.description,
            aliases: cmd.aliases,
            usage: cmd.usage,
            run: cmd.run
        });
        log(`yellow`, `Loaded command ${command.split(`.`)[0]}.`);
    }
});

module.exports = {
    description: `List all commands!`,
    aliases: [`h`],
    usage: ``
};

module.exports.run = async (message, args, chatter, chatUsers) => {
    chatter.emit(`commandMessage`, `Available Commands:`);
    for (const command of commands) chatter.emit(`commandMessage`, `/${command.name} - ${command.description}`);
};
