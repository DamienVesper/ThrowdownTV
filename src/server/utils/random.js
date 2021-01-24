const crypto = require(`crypto`);

const randomString = length => {
    return crypto.randomBytes(length).toString(`hex`);
};

module.exports = {
    randomString
};
