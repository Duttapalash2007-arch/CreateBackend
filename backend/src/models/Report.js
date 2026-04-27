import mongoose from 'mongoose';
import { SUPPORTED_REPORT_DISEASES } from '../utils/constants.js';

const reportSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    disease: {
      type: String,
      enum: SUPPORTED_REPORT_DISEASES,
      required: true,
    },
    personalDetails: {
      age: Number,
      gender: String,
      weight: Number,
      height: Number,
      bloodType: String,
    },
    symptoms: {
      type: String,
      required: true,
    },
    mcqAnswers: {
      type: Map,
      of: String,
    },
    uploadedDocument: {
      url: String,
      fileName: String,
      fileType: String,
    },
    aiAnalysis: {
      score: {
        type: Number,
        min: 0,
        max: 100,
      },
      riskLevel: {
        type: String,
        enum: ['Low', 'Medium', 'High'],
      },
      confidence: {
        type: Number,
        min: 0,
        max: 1,
      },
      summary: String,
      symptomAnalysis: String,
      likelyCondition: String,
      probableConditions: [String],
      documentAnalysis: String,
      riskFactors: [String],
      keyFindings: [String],
      recommendations: [String],
      medicalAdvice: String,
      urgentCare: String,
      followUpTests: [String],
      sentiment: Number,
      scoreBreakdown: {
        questionnaireScore: Number,
        symptomScore: Number,
        aiScore: Number,
        finalScore: Number,
        answeredQuestions: Number,
        contributingFactors: [String],
      },
      suggestedMedicines: [
        {
          name: String,
          dosage: String,
          frequency: String,
          reason: String,
        },
      ],
    },
    doctorSuggestions: [
      {
        name: String,
        specialty: String,
        placeType: String,
        distance: Number,
        address: String,
        rating: Number,
        phoneNumber: String,
        website: String,
        hours: [String],
        mapsUrl: String,
        latitude: Number,
        longitude: Number,
      },
    ],
    pdfReportUrl: String,
    chatHistory: [
      {
        sender: String,
        message: String,
        timestamp: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    status: {
      type: String,
      enum: ['pending', 'completed', 'reviewed'],
      default: 'pending',
    },
    adminNotes: String,
    isHighRisk: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Index for faster queries
reportSchema.index({ userId: 1, disease: 1 });
reportSchema.index({ createdAt: -1 });
reportSchema.index({ isHighRisk: 1 });

export const Report = mongoose.model('Report', reportSchema);
