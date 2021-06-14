import * as Mongoose from 'mongoose';
import { UserDoc } from '../types/models';

import randomString from '../utils/randomString';

const userSchema = new Mongoose.Schema({
    username: { type: String, required: true, unique: true },
    displayName: { type: String, required: true, unique: true },

    creationDate: { type: Date, required: true },
    email: { type: String, required: false, unique: true },

    creationIP: { type: String, required: false },
    lastIP: { type: String, required: false },

    token: { type: String, required: false, default: randomString(64) },
    recoverytoken: { type: String, required: false, default: randomString(64) },

    password: { type: String, required: true },
    live: { type: Boolean, required: false, default: false },

    verified: { type: Boolean, required: false },
    verifyToken: { type: String, required: false },

    deleteToken: { type: String, required: false },

    isSuspended: { type: Boolean, required: false, default: false },

    avatarURL: { type: String, required: false, default: `/assets/img/defaultpfp.png` },

    channel: {
        moderators: { type: Array, required: false, default: [] },
        bans: { type: Array, required: false, default: [] },
        timeouts: { type: Array, required: false, default: [] }
    },

    perms: {
        staff: { type: Boolean, required: false, default: false },
        vip: { type: Boolean, required: false, default: false }
    },

    settings: {
        title: { type: String, required: false, default: `My Cool Stream!` },
        description: { type: String, required: false, default: `A description about my cool stream!` },
        donationLink: { type: String, required: false, default: `/streams/donate` },

        rtmpServer: { type: String, required: false, default: `live` },
        streamKey: { type: String, required: false, unique: true, default: randomString(32) },

        useGlobalStickers: { type: Boolean, required: false, default: true },
        lockdown: { type: Boolean, required: false, default: false },
        notifications: { type: Boolean, required: false, default: true }
    },

    subscription: {
        paymentToken: { type: String, required: false, default: `` },
        payerId: { type: String, required: false, default: `` }
    },

    viewers: { type: Array, required: false, default: [] },
    followers: { type: Array, required: false, default: [] }
});

const User = Mongoose.model<UserDoc>(`User`, userSchema);

export default User;
