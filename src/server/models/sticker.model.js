const Mongoose = require(`mongoose`);

const stickerSchema = Mongoose.Schema({
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

module.exports = Mongoose.model(`Sticker`, stickerSchema);
