import { Report } from '../models/Report.js';
import { Question } from '../models/Question.js';
import { AIRouter } from '../services/ai/aiRouter.service.js';
import { PDFService } from '../services/pdf/pdf.service.js';
import { EmailService } from '../services/email/email.service.js';
import { UploadService } from '../services/storage/upload.service.js';
import { buildMedicalAnalysisPrompt } from '../utils/promptBuilder.js';
import { calculateAssessmentScore, finalizeAssessmentScore } from '../utils/scoreCalculator.js';
import { getRiskLevel, isHighRisk } from '../utils/riskLevel.js';
import { GENERAL_ANALYSIS_DISEASE, HTTP_STATUS, SUCCESS_MESSAGES, ERROR_MESSAGES } from '../utils/constants.js';
import { logger } from '../utils/logger.js';
import { User } from '../models/User.js';
import path from 'path';

const buildUploadedDocumentContext = async (file) => {
  if (!file) {
    return 'No uploaded file was provided.';
  }

  const extension = path.extname(file.originalname || file.path || '').toLowerCase();
  const isImage = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'].includes(extension);

  if (isImage) {
    try {
      const imageSummary = await AIRouter.analyzeUploadedImage({
        imagePath: file.path,
        mimeType: file.mimetype || 'image/jpeg',
      });

      return `Uploaded image analysis: ${imageSummary}`;
    } catch (error) {
      logger.warn('Uploaded image analysis failed:', error.message);
    }
  }

  return `Uploaded document received: ${file.originalname || 'supporting file'} (${file.mimetype || 'unknown type'}). The file was included as supporting context, but its full text could not be automatically extracted, so the AI should combine the symptom description with the document type and recommend clinician review of the uploaded report.`;
};

export const reportController = {
  /**
   * Create a new medical report
   */
  async createReport(req, res) {
    try {
      const mcqAnswers =
        typeof req.body.mcqAnswers === 'string'
          ? JSON.parse(req.body.mcqAnswers || '{}')
          : req.body.mcqAnswers || {};
      const personalDetails =
        typeof req.body.personalDetails === 'string'
          ? JSON.parse(req.body.personalDetails || '{}')
          : req.body.personalDetails || {};
      const { disease, symptoms } = req.body;
      const userId = req.user.id;
      const user = await User.findById(userId);
      const isGeneralAnalysis = disease === GENERAL_ANALYSIS_DISEASE;
      const uploadedDocumentContext = await buildUploadedDocumentContext(req.file);

      // Get questions for scoring
      const questions = await Question.find({ disease });

      const scoreSnapshot = calculateAssessmentScore({
        answers: mcqAnswers,
        questions,
        symptoms,
        personalDetails,
      });

      // Build prompt for AI analysis
      const prompt = buildMedicalAnalysisPrompt({
        disease,
        symptoms,
        answers: mcqAnswers,
        personalDetails,
        questions,
        documentAnalysis: uploadedDocumentContext,
        analysisMode: isGeneralAnalysis ? 'general-condition' : 'disease-specific',
        baseScore: scoreSnapshot.baseScore,
        questionnaireScore: scoreSnapshot.questionnaireScore,
        symptomScore: scoreSnapshot.symptomScore,
      });

      // Get AI analysis
      const aiResponseText = await AIRouter.generateMedicalAnalysis(prompt);
      const aiAnalysis = AIRouter.parseAnalysisResponse(aiResponseText);
      const aiModelScore = Number.isFinite(aiAnalysis.score) ? aiAnalysis.score : null;

      // Blend rule-based and AI scores into a final 0-100 score
      const finalScore = finalizeAssessmentScore({
        baseScore: scoreSnapshot.baseScore,
        questionnaireScore: scoreSnapshot.questionnaireScore,
        symptomScore: scoreSnapshot.symptomScore,
        aiScore: aiModelScore,
        aiSentiment: aiAnalysis.sentiment || 0,
      });
      aiAnalysis.score = finalScore;

      // Get risk level
      const riskLevel = getRiskLevel(finalScore);
      aiAnalysis.riskLevel = riskLevel.level;
      aiAnalysis.confidence = Number.isFinite(aiAnalysis.confidence) ? aiAnalysis.confidence : 0.72;
      aiAnalysis.summary =
        aiAnalysis.summary ||
        'The submitted symptoms and questionnaire responses suggest that medical follow-up is recommended.';
      aiAnalysis.symptomAnalysis =
        aiAnalysis.symptomAnalysis ||
        `Symptoms reported for ${disease} were evaluated together with the questionnaire and patient details.`;
      aiAnalysis.likelyCondition =
        aiAnalysis.likelyCondition ||
        (isGeneralAnalysis ? 'A clinician should confirm the likely condition after reviewing symptoms and the uploaded file.' : disease);
      aiAnalysis.probableConditions = Array.isArray(aiAnalysis.probableConditions)
        ? aiAnalysis.probableConditions
        : isGeneralAnalysis
          ? []
          : [disease];
      aiAnalysis.documentAnalysis =
        aiAnalysis.documentAnalysis ||
        uploadedDocumentContext;
      aiAnalysis.riskFactors = Array.isArray(aiAnalysis.riskFactors)
        ? aiAnalysis.riskFactors
        : scoreSnapshot.contributingFactors;
      aiAnalysis.keyFindings = Array.isArray(aiAnalysis.keyFindings)
        ? aiAnalysis.keyFindings
        : scoreSnapshot.contributingFactors;
      aiAnalysis.recommendations = Array.isArray(aiAnalysis.recommendations)
        ? aiAnalysis.recommendations
        : [riskLevel.recommendation];
      aiAnalysis.urgentCare =
        aiAnalysis.urgentCare ||
        (riskLevel.level === 'High'
          ? 'Immediate or urgent medical care is advised if symptoms worsen or high-risk warning signs appear.'
          : 'Seek urgent care if symptoms suddenly worsen, breathing becomes difficult, or new severe pain begins.');
      aiAnalysis.followUpTests = Array.isArray(aiAnalysis.followUpTests) ? aiAnalysis.followUpTests : [];
      aiAnalysis.scoreBreakdown = {
        questionnaireScore: scoreSnapshot.questionnaireScore,
        symptomScore: scoreSnapshot.symptomScore,
        aiScore: aiModelScore,
        finalScore,
        answeredQuestions: scoreSnapshot.answeredQuestions,
        contributingFactors: scoreSnapshot.contributingFactors,
      };

      // Doctor/hospital finder intentionally disabled for now so the report can focus on richer AI analysis.
      const doctorSuggestions = [];

      // Handle file upload if present
      let uploadedDocument = null;
      if (req.file) {
        try {
          const uploadResult = await UploadService.uploadFile(req.file.path);
          uploadedDocument = {
            url: uploadResult.url,
            fileName: uploadResult.fileName,
            fileType: uploadResult.fileType,
          };
        } catch (uploadError) {
          logger.warn('File upload failed:', uploadError.message);
        }
      }

      // Create report
      const report = new Report({
        userId,
        disease,
        personalDetails,
        symptoms,
        mcqAnswers,
        uploadedDocument,
        aiAnalysis,
        doctorSuggestions,
        isHighRisk: isHighRisk(finalScore),
      });

      await report.save();

      // Generate PDF report
      let pdfReportUrl = null;
      try {
        const pdfResult = await PDFService.generateReport({
          reportId: report._id,
          ...report.toObject(),
        });
        report.pdfReportUrl = pdfResult.publicUrl;
        await report.save();
        pdfReportUrl = pdfResult.publicUrl;
      } catch (pdfError) {
        logger.warn('PDF generation failed:', pdfError.message);
      }

      // Send report via email
      try {
        await EmailService.sendReportEmail(user.email, {
          disease,
          personalDetails,
          aiAnalysis,
          doctorSuggestions,
          pdfPath: pdfReportUrl,
        });
      } catch (emailError) {
        logger.warn('Failed to send report email:', emailError.message);
      }

      // Send high-risk alert to admin
      if (report.isHighRisk) {
        try {
          await EmailService.sendHighRiskAlert(process.env.ADMIN_EMAIL, {
            disease,
            aiAnalysis,
            userEmail: user.email,
          });
        } catch (alertError) {
          logger.warn('Failed to send high-risk alert:', alertError.message);
        }
      }

      logger.info(`Report created: ${report._id}`);

      res.status(HTTP_STATUS.CREATED).json({
        success: true,
        message: SUCCESS_MESSAGES.REPORT_CREATED,
        report,
      });
    } catch (error) {
      logger.error('Create report error:', error.message);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: ERROR_MESSAGES.INTERNAL_ERROR,
      });
    }
  },

  /**
   * Get user's reports
   */
  async getUserReports(req, res) {
    try {
      const userId = req.user.id;
      const { disease, startDate, endDate } = req.query;

      let query = { userId };

      if (disease) {
        query.disease = disease;
      }

      if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) {
          query.createdAt.$gte = new Date(startDate);
        }
        if (endDate) {
          query.createdAt.$lte = new Date(endDate);
        }
      }

      const reports = await Report.find(query).sort({ createdAt: -1 });

      res.status(HTTP_STATUS.OK).json({
        success: true,
        count: reports.length,
        reports,
      });
    } catch (error) {
      logger.error('Get reports error:', error.message);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: ERROR_MESSAGES.INTERNAL_ERROR,
      });
    }
  },

  /**
   * Get specific report
   */
  async getReport(req, res) {
    try {
      const { reportId } = req.params;

      const report = await Report.findById(reportId);

      if (!report) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          message: ERROR_MESSAGES.REPORT_NOT_FOUND,
        });
      }

      // Check authorization
      if (report.userId.toString() !== req.user.id && req.user.role !== 'admin') {
        return res.status(HTTP_STATUS.FORBIDDEN).json({
          success: false,
          message: ERROR_MESSAGES.UNAUTHORIZED_ACCESS,
        });
      }

      res.status(HTTP_STATUS.OK).json({
        success: true,
        report,
      });
    } catch (error) {
      logger.error('Get report error:', error.message);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: ERROR_MESSAGES.INTERNAL_ERROR,
      });
    }
  },

  /**
   * Update report
   */
  async updateReport(req, res) {
    try {
      const { reportId } = req.params;
      const { status, adminNotes } = req.body;

      const report = await Report.findByIdAndUpdate(
        reportId,
        { status, adminNotes },
        { new: true, runValidators: true }
      );

      if (!report) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          message: ERROR_MESSAGES.REPORT_NOT_FOUND,
        });
      }

      logger.info(`Report updated: ${reportId}`);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: SUCCESS_MESSAGES.REPORT_UPDATED,
        report,
      });
    } catch (error) {
      logger.error('Update report error:', error.message);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: ERROR_MESSAGES.INTERNAL_ERROR,
      });
    }
  },

  /**
   * Delete report
   */
  async deleteReport(req, res) {
    try {
      const { reportId } = req.params;

      const report = await Report.findByIdAndDelete(reportId);

      if (!report) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          message: ERROR_MESSAGES.REPORT_NOT_FOUND,
        });
      }

      logger.info(`Report deleted: ${reportId}`);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: SUCCESS_MESSAGES.REPORT_DELETED,
      });
    } catch (error) {
      logger.error('Delete report error:', error.message);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: ERROR_MESSAGES.INTERNAL_ERROR,
      });
    }
  },
};
