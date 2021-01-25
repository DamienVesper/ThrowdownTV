const { randomString } = require(`../utils/random.js`);

const Mongoose = require(`mongoose`);

const userSchema = Mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: false,
        unique: true
    },
    creationIP: {
        type: String,
        required: false
    },
    lastIP: {
        type: String,
        required: false
    },
    creationDate: {
        type: Date,
        required: true
    },
    token: {
        type: String,
        default: randomString(128),
        required: false
    },
    password: {
        type: String,
        required: true
    },
    live: {
        type: String,
        default: false,
        required: false
    },
    settings: {
        streamKey: {
            type: String,
            default: randomString(32),
            required: false
        },
        title: {
            type: String,
            default: `My Cool Stream!`,
            required: false
        },
        description: {
            type: String,
            default: `A description about my cool stream!`,
            required: false
        },
        donationLink: {
            type: String,
            default: `/streams/donate`,
            required: false
        }
    }
});

module.exports = Mongoose.model(`User`, userSchema);
