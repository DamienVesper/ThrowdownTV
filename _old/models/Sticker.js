const mongoose = require(`mongoose`);

const StickerSchema = new mongoose.Schema({
    stickername: {
        type: String,
        required: true
    },
    stickerurl: {
        type: String,
        required: true
    },
    stickerowner: {
        type: String,
        required: true
    }
});

const User = mongoose.model(`Sticker`, StickerSchema);

module.exports = User;
