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
        required: false
    },
    password: {
        type: String,
        required: true
    }
});

module.exports = Mongoose.model(`User`, userSchema);
