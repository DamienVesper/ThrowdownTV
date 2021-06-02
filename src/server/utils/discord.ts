import { Client } from 'discord.js';

import log from './log';
import { logHeader } from './logExtra';

const client: Client = new Client();
client.login(process.env.DISCORD_BOT_TOKEN);

client.on(`ready`, async () => {
    logHeader(() => {
        log(`green`, `Succesfully connected to Discord.`);
        logHeader();
    });
});

export default client;
