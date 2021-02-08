const fs = require(`fs`);
const path = require(`path`);

const config = require(`../../../config/config.js`);
const log = require(`../utils/log.js`);

const xssFilters = require(`xss-filters`);

// Load commands.
const commands = [];
fs.readdir(path.resolve(__dirname, `./commands`), (err, files) => {
    if (err) return log(`red`, err.stack);

    for (const command of files) {
        const commandName = command.split(`.`)[0];
        if (commandName === `_template`) continue;
        const cmd = require(`./commands/${command}`);
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

const run = (message, chatter, chatUsers) => {
    const args = message.slice(config.chatPrefix.length).trim().split(` `);
    const command = args.shift();

    const cmd = commands.find(cmd => cmd.name === command || cmd.aliases.includes(command));
    if (!cmd) return chatter.emit(`commandMessage`, `That command does not exist!`);
    else if (args.length < cmd.usage.split(`<`).length - 1) return chatter.emit(`commandMessage`, `Proper usage is: ${config.chatPrefix + command} ${xssFilters.inHTMLData(cmd.usage)}.`);
    return cmd.run(message, args, chatter, chatUsers);
};

module.exports = {
    commands,
    run
};
