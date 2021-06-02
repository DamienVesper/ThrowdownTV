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

export {
    BanDoc,
    StickerDoc,
    UserDoc
};
