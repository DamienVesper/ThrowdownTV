import crypto from 'crypto';

const randomInt = (min: number, max: number) => Math.random() * (max - min) + min;
const randomString = (length: number) => crypto.randomBytes(length).toString(`hex`);

export {
    randomInt,
    randomString
};
