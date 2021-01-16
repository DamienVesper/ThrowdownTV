const Discord = require('discord.js');
const config = require('../config.json')
const client = new Discord.Client();

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.login(config.discord_bottoken);

module.exports = {
    verifyEmailLogger: function (email) {
        const embed = new Discord.MessageEmbed()
            .setColor('#0099ff')
            .setTitle('Email Verification Sent')
            .setDescription('Email sent to **'+ email +'**' )
            .setTimestamp()
            .setFooter('Throwdown TV');
        client.channels.cache.get(`799533250401665024`).send(embed)
    }
}