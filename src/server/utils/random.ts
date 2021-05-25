import crypto from 'crypto';

const randomInt = async (min: number, max: number) => Math.random() * (max - min) + min;
const randomString = async (length: number) => crypto.randomBytes(length).toString(`hex`);

export {
    randomInt,
    randomString
};
