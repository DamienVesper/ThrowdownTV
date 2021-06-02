import * as Mongoose from 'mongoose';
import { UserDoc } from '../types/models';

import randomString from '../utils/randomString';

const userSchema = new Mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    displayName: {
        type: String,
        required: true,
        unique: true
    },

    creationDate: {
        type: Date,
        required: true
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

    token: {
        type: String,
        default: randomString(64),
        required: false
    },
    recoverytoken: {
        type: String,
        default: randomString(64),
        required: false
    },

    password: {
        type: String,
        required: true
    },
    live: {
        type: Boolean,
        default: false,
        required: false
    },

    verified: {
        type: Boolean,
        required: false
    },
    verifyToken: {
        type: String,
        required: false
    },

    isSuspended: {
        type: Boolean,
        default: false,
        required: false
    },

    avatarURL: {
        type: String,
        default: `/assets/img/defaultpfp.png`,
        required: false
    },

    channel: {
        moderators: {
            type: Array,
            default: [],
            required: false
        },
        bans: {
            type: Array,
            default: [],
            required: false
        },
        timeouts: {
            type: Array,
            default: [],
            required: false
        }
    },

    perms: {
        staff: {
            type: Boolean,
            default: false,
            required: false
        },
        vip: {
            type: Boolean,
            default: false,
            required: false
        }
    },

    settings: {
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
        },

        rtmpServer: {
            type: String,
            default: `us01`,
            required: false
        },
        streamKey: {
            type: String,
            default: randomString(32),
            required: false,
            unique: true
        },

        useGlobalStickers: {
            type: Boolean,
            default: true,
            required: false
        },
        lockdown: {
            type: Boolean,
            default: false,
            required: false
        },
        notifications: {
            type: Boolean,
            default: true,
            required: false
        }
    },

    subscription: {
        paymentId: {
            type: String,
            default: ``,
            required: false
        },
        paymentToken: {
            type: String,
            default: ``,
            required: false
        },
        payerId: {
            type: String,
            default: ``,
            required: false
        }
    },

    viewers: {
        type: Array,
        default: [],
        required: false
    },
    followers: {
        type: Array,
        default: [],
        required: false
    }
});

const User = Mongoose.model<UserDoc>(`User`, userSchema);

export default User;
