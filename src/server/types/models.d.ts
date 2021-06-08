import * as Mongoose from 'mongoose';

interface BanDoc extends Mongoose.Document {
    IP: string;
    comment?: string;
}

interface StickerDoc extends Mongoose.Document {
    stickerName: string;
    ownerUsername: string;
    path: string;
    channelsBannedOn?: string[];
}

interface UserDoc extends Mongoose.Document {
    username: string;
    displayName: string;

    creationDate: any;
    email: string;

    creationIP?: string;
    lastIP?: string;

    token?: string;
    recoverytoken?: string;

    password: string;
    live?: boolean;

    verified?: boolean;
    verifyToken?: string;

    isSuspended?: boolean;

    avatarURL?: string;

    channel?: {
        moderators: string[];
        bans: string[];
        timeouts: string[];
    }

    perms: {
        staff?: boolean;
        vip?: boolean;
    }

    settings?: {
        title: string;
        description: string;
        donationLink?: string;

        rtmpServer?: string;
        streamKey?: string;

        useGlobalStickers?: boolean;
        lockdown?: boolean;
        notifications?: boolean;
    }

    subscription?: {
        paymentId: string;
        paymentToken: string;
        payerId: string;
    },

    viewers: string[];
    followers: string[];
}

export {
    BanDoc,
    StickerDoc,
    UserDoc
};
