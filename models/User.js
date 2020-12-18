const mongoose = require('mongoose');
const cryptoRandomString = require('crypto-random-string');

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    stream_key: {
        type: String,
        default: cryptoRandomString({ length: 20, type: 'alphanumeric' })
    },
    stream_title: {
        type: String,
        default: "My cool stream :)"
    },
    stream_description: {
        type: String,
        default: "Description of my cool stream :)"
    },
    avatar_url: {
        type: String,
        default: "https://cdn.discordapp.com/attachments/736368923590525039/789419292214820894/defaulltpfp.png"
    },
    date: {
        type: Date,
        default: Date.now
    }
});

const User = mongoose.model('User', UserSchema);

module.exports = User;