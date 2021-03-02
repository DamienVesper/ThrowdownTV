const Mongoose = require(`mongoose`);

const banSchema = Mongoose.Schema({
    IP: {
        type: String,
        required: true
    },
    comment: {
        type: String,
        required: false
    }
});

module.exports = Mongoose.model(`Ban`, banSchema);
