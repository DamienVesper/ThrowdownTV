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

export default Chatter;
