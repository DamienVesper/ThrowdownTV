const crypto = require(`crypto`);

const randomString = length => crypto.randomBytes(length).toString(`hex`);

module.exports = {
    randomString
};
