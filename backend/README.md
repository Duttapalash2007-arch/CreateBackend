# Healthcare Assistant Backend

An AI-powered healthcare assistant backend designed to generate preliminary medical reports based on user-provided symptoms and inputs. This is a production-ready Node.js/Express.js API with comprehensive AI orchestration, real-time chat, and admin management features.

## 🌟 Features

### Core Features
- **User Authentication**: Secure JWT-based authentication with role-based access control
- **Disease Assessment**: Support for 6 major diseases (Cancer, Allergy, Malaria, Diabetes, HIV, AIDS)
- **AI-Powered Analysis**: 
  - Multi-provider AI orchestration (OpenAI, Gemini, Anthropic)
  - Automatic fallback mechanism for reliability
  - Support for text, image, and voice inputs
  - Rule-based scoring with AI refinement
- **Medical Reports**: Comprehensive PDF report generation with doctor recommendations
- **Real-Time Chat**: Socket.io-powered chatbot for interactive discussions
- **Admin Dashboard**: Monitor reports, users, and high-risk cases
- **Email Notifications**: Automated alerts and report delivery
- **Scheduled Jobs**: Cron-based maintenance and notification tasks

### Security Features
- JWT authentication with configurable expiration
- Password hashing with bcrypt
- Input validation and sanitization
- Rate limiting
- CORS protection
- Helmet.js for HTTP header security
- Role-based access control (User/Admin)

## 📋 Prerequisites

- **Node.js**: v16.x or higher
- **MongoDB**: v5.0 or higher
- **npm**: v8.x or higher
- **API Keys**:
  - OpenAI API Key
  - Google Gemini API Key
  - Anthropic Claude API Key
  - Google Maps API Key
  - Cloudinary credentials

## 🚀 Installation

### 1. Clone Repository
```bash
git clone <repository-url>
cd backend
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Create a `.env` file in the root directory and add the following variables:

```env
# Server
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000

# Database
MONGODB_URI=mongodb://localhost:27017/healthcare-assistant
DB_NAME=healthcare-assistant

# JWT
JWT_SECRET=your_secure_jwt_secret_here
JWT_EXPIRE=7d

# AI Services (Gemini Primary -> Groq Fast -> HuggingFace Backup)
GEMINI_API_KEY=...
GROQ_API_KEY=...
HUGGINGFACE_API_KEY=...

# Google Maps
GOOGLE_MAPS_API_KEY=...

# Cloudinary
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...

# Email Service
EMAIL_SERVICE=gmail
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password

# Admin
ADMIN_EMAIL=admin@healthcareassistant.com
ADMIN_PASSWORD=secure_password

# File Upload
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=pdf,doc,docx,jpg,jpeg,png

# Logging
LOG_LEVEL=debug
```

### 4. Start MongoDB
```bash
# Using MongoDB locally
mongod

# Or using Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

### 5. Start the Backend Server

**Development Mode** (with auto-reload):
```bash
npm run dev
```

**Production Mode**:
```bash
npm start
```

The server will start on `http://localhost:5000`

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/           # Configuration files
│   │   ├── db.js         # MongoDB connection
│   │   ├── env.js        # Environment variables
│   │   ├── cloudinary.js # Cloudinary setup
│   │   └── ai.config.js  # AI provider configuration
│   │
│   ├── controllers/      # Request handlers
│   │   ├── auth.controller.js
│   │   ├── user.controller.js
│   │   ├── report.controller.js
│   │   ├── admin.controller.js
│   │   ├── disease.controller.js
│   │   └── chatbot.controller.js
│   │
│   ├── models/           # MongoDB schemas
│   │   ├── User.js
│   │   ├── Report.js
│   │   ├── Question.js
│   │   └── Admin.js
│   │
│   ├── routes/           # API endpoints
│   │   ├── auth.routes.js
│   │   ├── user.routes.js
│   │   ├── report.routes.js
│   │   ├── admin.routes.js
│   │   ├── disease.routes.js
│   │   └── chatbot.routes.js
│   │
│   ├── middlewares/      # Express middlewares
│   │   ├── auth.middleware.js
│   │   ├── admin.middleware.js
│   │   ├── error.middleware.js
│   │   ├── upload.middleware.js
│   │   └── validate.middleware.js
│   │
│   ├── services/         # Business logic
│   │   ├── ai/
│   │   │   ├── openai.service.js
│   │   │   ├── gemini.service.js
│   │   │   ├── anthropic.service.js
│   │   │   ├── aiRouter.service.js
│   │   │   ├── speechToText.service.js
│   │   │   └── imageToText.service.js
│   │   ├── pdf/
│   │   │   └── pdf.service.js
│   │   ├── maps/
│   │   │   └── map.service.js
│   │   ├── email/
│   │   │   └── email.service.js
│   │   └── storage/
│   │       └── upload.service.js
│   │
│   ├── utils/            # Utility functions
│   │   ├── logger.js
│   │   ├── scoreCalculator.js
│   │   ├── riskLevel.js
│   │   ├── promptBuilder.js
│   │   └── constants.js
│   │
│   ├── sockets/          # Socket.io handlers
│   │   └── chat.socket.js
│   │
│   ├── jobs/             # Scheduled jobs
│   │   ├── report.job.js
│   │   └── alert.job.js
│   │
│   ├── app.js            # Express app setup
│   └── server.js         # Server entry point
│
├── uploads/              # File upload directory
├── logs/                 # Application logs
├── .env                  # Environment variables
├── package.json          # Dependencies
└── README.md            # This file
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout

### User Management
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `DELETE /api/users/account` - Delete account

### Reports
- `POST /api/reports` - Create new medical report with AI analysis
- `GET /api/reports` - Get user's reports
- `GET /api/reports/:reportId` - Get specific report
- `PUT /api/reports/:reportId` - Update report
- `DELETE /api/reports/:reportId` - Delete report

### Diseases & Questions
- `GET /api/diseases` - Get all diseases
- `GET /api/diseases/:disease/questions` - Get MCQ questions for disease
- `POST /api/diseases/:disease/questions` - Create question (admin only)
- `PUT /api/diseases/questions/:questionId` - Update question (admin only)
- `DELETE /api/diseases/questions/:questionId` - Delete question (admin only)

### Chatbot
- `POST /api/chat/:reportId/message` - Send chat message
- `GET /api/chat/:reportId/history` - Get chat history
- `DELETE /api/chat/:reportId/history` - Clear chat history

### Admin
- `GET /api/admin/reports` - Get all reports with filtering
- `GET /api/admin/reports/high-risk` - Get high-risk reports
- `GET /api/admin/dashboard/stats` - Get dashboard statistics
- `PUT /api/admin/reports/:reportId` - Update report status
- `GET /api/admin/users/:userId` - Get user details

## 🤖 AI Orchestration System

The backend implements an intelligent AI routing system that:

1. **Primary Provider**: Google Gemini (high quality, good balance)
2. **Fast Fallback**: Groq (ultra-fast inference, cost-effective)
3. **Final Backup**: HuggingFace (open-source models, always available)

### Flow
```
User Request
    ↓
Gemini (Primary)
    ↓ (fail)
Groq (Fast Fallback)
    ↓ (fail)
HuggingFace (Final Backup)
    ↓
Response
```

### Features
- Automatic input type detection (text, image, voice)
- Converts all inputs to text format
- Provider failover on timeout or error
- Response parsing and structuring
- 30-second timeout per provider

### Usage Example
```javascript
import { AIRouter } from './services/ai/aiRouter.service.js';

// Generate medical analysis
const analysis = await AIRouter.generateMedicalAnalysis(prompt);

// Generate chat response
const response = await AIRouter.generateChatResponse(chatPrompt);
```

## 📊 Scoring System

The scoring algorithm combines:
- **Rule-Based Scoring**: MCQ answers mapped to health scores (0-100)
- **AI Refinement**: OpenAI/Gemini analysis adjusts score based on symptoms
- **Risk Classification**:
  - Low Risk: 0-40
  - Medium Risk: 40-70
  - High Risk: 70-100

## 🔔 Real-Time Features

### Socket.io Events
- `chatMessage` - Send message to chatbot
- `chatResponse` - Receive AI response
- `typing` - Show typing indicator
- `stopTyping` - Clear typing indicator

### Chat Example
```javascript
const socket = io('http://localhost:5000');

socket.on('connect', () => {
  socket.emit('joinRoom', reportId);
  socket.emit('chatMessage', {
    reportId: reportId,
    message: 'What should I do?',
    disease: 'Diabetes'
  });
});

socket.on('chatResponse', (data) => {
  console.log('AI Response:', data.message);
});
```

## 📧 Email Notifications

The system automatically sends:
- **Welcome Email**: Upon user registration
- **Report Email**: When report is generated (with PDF attachment)
- **High-Risk Alert**: To admin when risk score > 70
- **Status Updates**: Email notifications for report status changes

## 🔐 Security Considerations

1. **JWT Tokens**: All endpoints except login/register require valid JWT
2. **Password Security**: Passwords hashed with 10-round bcrypt
3. **Rate Limiting**: 100 requests per 15 minutes per IP
4. **Input Validation**: All inputs validated with express-validator
5. **CORS**: Configured for specified origins only
6. **File Upload**: Restricted to whitelisted file types
7. **Admin Access**: Special middleware for admin-only routes

## 🧪 Testing

### Create a Test User
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "password": "password123",
    "age": 30,
    "gender": "male"
  }'
```

### Create a Medical Report
```bash
curl -X POST http://localhost:5000/api/reports \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "disease": "Diabetes",
    "symptoms": "Frequent urination, increased thirst",
    "mcqAnswers": {
      "q1": "Yes",
      "q2": "No"
    },
    "personalDetails": {
      "age": 30,
      "gender": "male",
      "latitude": 40.7128,
      "longitude": -74.0060
    }
  }'
```

## 📊 Database Schema

### User Model
```javascript
{
  firstName, lastName, email, password,
  age, gender, phoneNumber, address,
  medicalHistory[], allergies[],
  role (user/admin), isActive, lastLogin
}
```

### Report Model
```javascript
{
  userId, disease, personalDetails,
  symptoms, mcqAnswers, uploadedDocument,
  aiAnalysis (score, riskLevel, summary, advice, medicines[]),
  doctorSuggestions[], pdfReportUrl,
  chatHistory[], status, adminNotes, isHighRisk
}
```

## 🐛 Debugging

Enable debug logs:
```env
LOG_LEVEL=debug
```

View logs:
```bash
tail -f logs/info.log
tail -f logs/error.log
```

## 🚀 Deployment

### Using Docker
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY src ./src

EXPOSE 5000

CMD ["npm", "start"]
```

### Build & Run
```bash
docker build -t healthcare-assistant:latest .
docker run -p 5000:5000 --env-file .env healthcare-assistant:latest
```

### Environment Variables for Production
Update all sensitive keys in `.env` before deploying:
- Use strong `JWT_SECRET` (min 32 characters)
- Use app-specific passwords for email
- Use production API keys from all services

## 🤝 Contributing

1. Create a feature branch: `git checkout -b feature/amazing-feature`
2. Commit changes: `git commit -m 'Add amazing feature'`
3. Push to branch: `git push origin feature/amazing-feature`
4. Submit a pull request

## ⚖️ License

This project is licensed under the ISC License.

## 📞 Support

For issues and bug reports, please create an issue in the repository.

## ⚠️ MEDICAL DISCLAIMER

**IMPORTANT**: This system is designed for **preliminary assessment purposes only**. It is **NOT** a substitute for professional medical diagnosis or treatment. Users must always consult with licensed healthcare professionals for:
- Accurate diagnosis
- Treatment decisions
- Emergency medical care
- Any serious health concerns

This AI-powered tool should be used as a general information resource and guide, not as medical advice.

---

**Built with ❤️ for healthcare innovation**
