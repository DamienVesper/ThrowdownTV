import * as Mongoose from 'mongoose';
import { StickerDoc } from '../types/models';

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

const Sticker = Mongoose.model<StickerDoc>(`Sticker`, stickerSchema);

export default Sticker;
