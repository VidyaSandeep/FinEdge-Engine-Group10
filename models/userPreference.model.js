import mongoose from 'mongoose';

const userPreferenceSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            unique: true,
        },
        currency: {
            type: String,
            trim: true,
            uppercase: true,
            default: 'INR',
            minlength: 3,
            maxlength: 3,
        },
    },
    { timestamps: true }
);
userPreferenceSchema.index({ userId: 1 }, { unique: true });
export const UserPreferenceModel = mongoose.model('UserPreference', userPreferenceSchema);