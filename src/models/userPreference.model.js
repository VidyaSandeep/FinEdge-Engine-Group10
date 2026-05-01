import mongoose from 'mongoose';
import { CURRENCIES } from '../constants/constants.js';

const userPreferenceSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  currency: {
    type: String,
    default: CURRENCIES.USD.code
  },
}, {
  timestamps: true,
  versionKey: false
});

const UserPreference = mongoose.model('UserPreference', userPreferenceSchema);
export default UserPreference;
