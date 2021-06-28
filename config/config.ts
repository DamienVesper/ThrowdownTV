import { name, version } from '../package.json';

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

import * as dotenv from 'dotenv';
dotenv.config();

interface Args {
    mode: string
}

const argv = (yargs(hideBin(process.argv)).options({
    mode: { type: `string`, default: `dev` }
}).argv as Args);

const config = {
    name,
    mode: argv.mode,

    domain: `throwdown.tv`,

    port: argv.mode === `prod` ? 8750 : 8080,
    socketPort: 8443,

    version,
    blacklistedUsernames: [`admin`, `apps`, `panel`, `adminpanel`, `moderation`, `moderation-dashboard`, `api`, `signup`, `login`, `tos`, `browse`, `following`, `dashboard`, `changestreamkey`, `widget`, `follow`, `unfollow`, `throwdown`, `vip`, `staff`, `recoveraccount`, `changepassword`, `report`],
    chatPrefix: `/`,

    discordConfig: {
        reportChannel: `811173931741347850`
    },

    paypal: {
        username: argv.mode === `prod` ? `datcenhaventechnologies_api1.gmail.com` : `sb-4ibo95146099_api1.business.example.com`,
        password: argv.mode === `prod` ? `EVGKMEC6RVH4PGFE` : `KTMHKJEJCTJ6D8W2`,
        signature: argv.mode === `prod` ? `Ag8VIcK7teHMrquHEHTYI9FmQ9ANAqv5D6KB-E5kvz1KDzVnDTfFjtWJ` : `Ar8aq-lvhfzkE9GRa5QPneSHEBDxAPIYQ0.I35vQ7wIdHQN5.msGdHLY`,
        RETURNURL: argv.mode === `prod` ? `https://throwdown.tv/vip/success` : `http://localhost:8080/vip/success`,
        CANCELURL: argv.mode === `prod` ? `https://throwdown.tv/vip/cancel` : `http://localhost:8080/vip/cancel`
    }
};

export default config;
