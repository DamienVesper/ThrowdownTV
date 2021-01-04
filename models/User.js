const mongoose = require('mongoose');
const uniqueString = require('unique-string');

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
        default: uniqueString()
    },
    chat_key: {
        type: String,
        default: uniqueString()+uniqueString()
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
        default: uniqueString()
    },
    verification_status: {
        type: Boolean,
        default: false
    },
    donation_link: {
        type: String,
        default: "/streams/donate"
    },
    can_stream: {
        type: Boolean,
        default: false
    },
    banned: {
        type: Boolean,
        default: false
    },
    banreason: {
        type: String,
        default: "TOS Violation"
    },
    following: {
        type: Array,
    },
    followers: {
        type: Array,
    },
    live_viewers: {
        default: 0
    },
    date: {
        type: Date,
        default: Date.now
    },
    discordID: {
        type: String,
        default: "YOUR_DISCORD_ID_HERE"
    },
    isVip: {
        type: Boolean,
        default: false
    },
    isStaff: {
        type: Boolean,
        default: false
    },
    moderators: {
        type: Array
    },
    ips: {
        type: Array
    },
    banlist: {
        type: Array
    },
    banned_words: {
        type: Array
    }

});

const User = mongoose.model('User', UserSchema);

module.exports = User;