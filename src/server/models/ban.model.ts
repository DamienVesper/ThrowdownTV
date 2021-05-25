import * as Mongoose from 'mongoose';

interface banInterface extends Mongoose.Document {
    IP?: string,
    comment?: string
}

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

const Ban = Mongoose.model<banInterface>(`Ban`, banSchema);

export default Ban;
