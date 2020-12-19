const mongoose = require('mongoose');
const cryptoRandomString = require('crypto-random-string');

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true
    },
    channelurl: {
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
        default: cryptoRandomString({ length: 50, type: 'alphanumeric' })
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
    email_verification_key: {
        type: String,
        default: cryptoRandomString({ length: 30, type: 'alphanumeric' })
    },
    verification_status: {
        type: Boolean,
        default: false
    },
    donation_link: {
        type: String,
        default: "https://streamelements.com"
    },
    can_stream: {
        type: Boolean,
        default: false
    },
    banned: {
        type: Boolean,
        default: false
    },
    token: {
        type: String,
        default: cryptoRandomString({ length: 100, type: 'alphanumeric' })
    },
    date: {
        type: Date,
        default: Date.now
    }
});

const User = mongoose.model('User', UserSchema);

module.exports = User;