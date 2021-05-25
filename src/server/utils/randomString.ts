import crypto from 'crypto';

const randomString = async (length: number) => crypto.randomBytes(length).toString(`hex`);

export default randomString;
