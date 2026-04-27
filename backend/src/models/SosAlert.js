import mongoose from 'mongoose';

const sosAlertSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    phoneNumber: {
      type: String,
      default: '',
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    sourcePage: {
      type: String,
      default: 'home',
      trim: true,
    },
    countdownSeconds: {
      type: Number,
      default: 15,
      min: 1,
    },
    status: {
      type: String,
      enum: ['active', 'resolved', 'pending', 'approved', 'cancelled'],
      default: 'pending',
    },
    triggeredAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

sosAlertSchema.index({ status: 1, createdAt: -1 });
sosAlertSchema.index({ userId: 1, createdAt: -1 });

export const SosAlert = mongoose.model('SosAlert', sosAlertSchema);
