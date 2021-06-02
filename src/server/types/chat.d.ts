import { Socket } from 'socket.io';

interface Chatter {
    username: string;
    displayName: string;

    token: string;
    channel: string;

    perms?: {
        streamer: boolean;
        staff: boolean;
        moderator: boolean;
        vip: boolean;
    }

    socket: Socket
}

interface CommandConfig {
    desc: string;
    usage?: string;
    aliases?: string[];
}
interface Command {
    name: string;
    config: CommandConfig;
    run: any;
}

export {
    Chatter,
    Command,
    CommandConfig
};
