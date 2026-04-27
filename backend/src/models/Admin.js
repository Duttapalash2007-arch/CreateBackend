import mongoose from 'mongoose';

const adminSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    adminLevel: {
      type: String,
      enum: ['super_admin', 'admin', 'moderator'],
      default: 'admin',
    },
    permissions: [
      {
        type: String,
        enum: [
          'view_all_reports',
          'delete_reports',
          'edit_user_details',
          'manage_admins',
          'view_analytics',
          'manage_questions',
          'send_alerts',
          'generate_reports',
        ],
      },
    ],
    activityLog: [
      {
        action: String,
        description: String,
        timestamp: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export const Admin = mongoose.model('Admin', adminSchema);
