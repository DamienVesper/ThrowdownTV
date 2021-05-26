import * as Mongoose from 'mongoose';

interface stickerType extends Mongoose.Document {
    stickerName: string;
    ownerUsername: string;
    path: string;
    channelsBannedOn?: string[];
}

const stickerSchema = new Mongoose.Schema({
    stickerName: {
        type: String,
        required: true
    },
    ownerUsername: {
        type: String,
        required: true
    },
    path: {
        type: String,
        required: true
    },
    channelsBannedOn: {
        type: Array,
        default: [],
        required: false
    }
});

const Sticker = Mongoose.model<stickerType>(`Sticker`, stickerSchema);

export default Sticker;
