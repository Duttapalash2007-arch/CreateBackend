import nodemailer from 'nodemailer';
import { envConfig } from '../../config/env.js';
import { logger } from '../../utils/logger.js';

const transporter = nodemailer.createTransport({
  service: envConfig.emailService,
  auth: {
    user: envConfig.emailUser,
    pass: envConfig.emailPassword,
  },
});

export class EmailService {
  /**
   * Send report via email
   */
  static async sendReportEmail(email, reportData) {
    try {
      const mailOptions = {
        from: envConfig.emailUser,
        to: email,
        subject: `Your Healthcare Report - ${reportData.disease}`,
        html: this._generateEmailHTML(reportData),
        attachments: reportData.pdfPath
          ? [
              {
                path: reportData.pdfPath,
              },
            ]
          : [],
      };

      const result = await transporter.sendMail(mailOptions);
      logger.info(`Report email sent to ${email}`);
      return result;
    } catch (error) {
      logger.error('Error sending report email:', error.message);
      throw error;
    }
  }

  /**
   * Send alert to admin about high-risk case
   */
  static async sendHighRiskAlert(adminEmail, reportData) {
    try {
      const mailOptions = {
        from: envConfig.emailUser,
        to: adminEmail,
        subject: `⚠️ HIGH RISK ALERT - ${reportData.disease}`,
        html: this._generateAlertHTML(reportData),
      };

      await transporter.sendMail(mailOptions);
      logger.info(`High-risk alert sent to admin`);
    } catch (error) {
      logger.error('Error sending alert email:', error.message);
      throw error;
    }
  }

  /**
   * Send welcome email
   */
  static async sendWelcomeEmail(email, firstName) {
    try {
      const mailOptions = {
        from: envConfig.emailUser,
        to: email,
        subject: 'Welcome to Healthcare Assistant',
        html: `
          <h2>Welcome, ${firstName}!</h2>
          <p>Thank you for registering with Healthcare Assistant.</p>
          <p>You can now log in and access our medical assessment tools.</p>
          <p>Remember: This tool provides preliminary assessments only. Always consult a healthcare professional for proper diagnosis.</p>
        `,
      };

      await transporter.sendMail(mailOptions);
      logger.info(`Welcome email sent to ${email}`);
    } catch (error) {
      logger.error('Error sending welcome email:', error.message);
    }
  }

  /**
   * Send SOS alert to admin
   */
  static async sendSosAlert(adminEmail, alertData) {
    try {
      const mailOptions = {
        from: envConfig.emailUser,
        to: adminEmail,
        subject: `SOS ALERT - ${alertData.name}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #b91c1c; color: white; padding: 20px; text-align: center; border-radius: 5px;">
              <h1>SOS Emergency Alert</h1>
            </div>
            <div style="padding: 20px; background-color: #f8f9fa;">
              <p><strong>Name:</strong> ${alertData.name}</p>
              <p><strong>Email:</strong> ${alertData.email}</p>
              <p><strong>Phone:</strong> ${alertData.phoneNumber}</p>
              <p><strong>Source:</strong> ${alertData.sourcePage}</p>
              <p><strong>Triggered At:</strong> ${new Date(alertData.triggeredAt).toLocaleString()}</p>
              <p><strong>Message:</strong> ${alertData.message}</p>
            </div>
          </div>
        `,
      };

      await transporter.sendMail(mailOptions);
      logger.info(`SOS alert email sent to admin ${adminEmail}`);
    } catch (error) {
      logger.error('Error sending SOS alert email:', error.message);
      throw error;
    }
  }

  /**
   * Generate report email HTML
   */
  static _generateEmailHTML(data) {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #007bff; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0;">
          <h1>Your Healthcare Report</h1>
        </div>
        
        <div style="padding: 20px; background-color: #f8f9fa;">
          <h2>Disease Assessment: ${data.disease}</h2>
          
          <div style="background-color: white; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <h3>Health Score: <span style="color: ${data.aiAnalysis?.riskLevel === 'High' ? '#dc3545' : data.aiAnalysis?.riskLevel === 'Medium' ? '#ffc107' : '#28a745'}; font-size: 32px;">${data.aiAnalysis?.score}</span></h3>
            <p><strong>Risk Level:</strong> ${data.aiAnalysis?.riskLevel}</p>
          </div>

          <h3>Summary</h3>
          <p>${data.aiAnalysis?.summary || 'No summary'}</p>

          <h3>Medical Advice</h3>
          <p>${data.aiAnalysis?.medicalAdvice || 'Consult a healthcare professional'}</p>

          <div style="background-color: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <strong>⚠️ Important Disclaimer:</strong>
            <p>This report is generated by an AI system for preliminary assessment only. It is NOT a substitute for professional medical diagnosis or treatment. Please consult a licensed healthcare professional.</p>
          </div>

          <p style="margin-top: 30px; font-size: 12px; color: #666;">
            For more details and doctor recommendations, please check the attached PDF report or log in to your account.
          </p>
        </div>
      </div>
    `;
  }

  /**
   * Generate alert email HTML
   */
  static _generateAlertHTML(data) {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #dc3545; color: white; padding: 20px; text-align: center; border-radius: 5px;">
          <h1>⚠️ HIGH RISK ALERT</h1>
        </div>
        
        <div style="padding: 20px; background-color: #f8f9fa;">
          <p><strong>Disease:</strong> ${data.disease}</p>
          <p><strong>Health Score:</strong> ${data.aiAnalysis?.score}</p>
          <p><strong>Risk Level:</strong> ${data.aiAnalysis?.riskLevel}</p>
          <p><strong>Patient Email:</strong> ${data.userEmail}</p>
          
          <p style="margin-top: 20px; color: #dc3545;">
            <strong>Action Required:</strong> A patient has been assessed with a HIGH RISK score. Please review the report and take appropriate action.
          </p>
        </div>
      </div>
    `;
  }
}
