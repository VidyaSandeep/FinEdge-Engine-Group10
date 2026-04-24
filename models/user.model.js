const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
    select: false
  },
  preferences: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UserPreference',
    default: null,
  },
  isActive: {
    type: Boolean,
    default: true,
  }
}, {
  timestamps: true,
  versionKey: false
});
userSchema.index({ email: 1 }, { unique: true });
module.exports = mongoose.model('User', userSchema);