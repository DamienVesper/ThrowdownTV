import * as Mongoose from 'mongoose';
import { BanDoc } from '../types/models';

const banSchema = new Mongoose.Schema({
    IP: {
        type: String,
        required: true
    },
    comment: {
        type: String,
        required: false
    }
});

const Ban = Mongoose.model<BanDoc>(`Ban`, banSchema);

export default Ban;
