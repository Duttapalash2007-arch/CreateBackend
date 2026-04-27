import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema(
  {
    disease: {
      type: String,
      enum: ['Cancer', 'Allergy', 'Malaria', 'Diabetes', 'HIV', 'AIDS'],
      required: true,
      index: true,
    },
    questionNumber: {
      type: Number,
      required: true,
    },
    question: {
      type: String,
      required: true,
    },
    questionType: {
      type: String,
      enum: ['multiple_choice', 'yes_no', 'rating_scale'],
      required: true,
    },
    options: [
      {
        text: String,
        score: Number, // Weight for scoring
      },
    ],
    category: {
      type: String,
      enum: ['symptoms', 'medical_history', 'lifestyle', 'demographics'],
    },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    isRequired: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Compound index for disease and question number
questionSchema.index({ disease: 1, questionNumber: 1 }, { unique: true });

export const Question = mongoose.model('Question', questionSchema);
