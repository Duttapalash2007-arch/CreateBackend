# Healthcare Assistant Backend - Quick Start Guide

## ✅ What's Included

This complete backend project includes:

### 🔧 Core Infrastructure
- Express.js server with middleware stack
- MongoDB connection and schema management
- JWT authentication with role-based access
- Error handling and request validation
- CORS and security headers (Helmet.js)
- Rate limiting for API protection

### 🤖 AI Orchestration (Core Feature)
- Multi-provider AI system (OpenAI → Gemini → Anthropic)
- Automatic fallback mechanism for reliability
- Input type detection (text, image, voice)
- Intelligent prompt building
- Response parsing and structuring

### 📊 Medical Assessment System
- Disease-specific MCQ questions
- Rule-based scoring algorithm
- AI-enhanced score refinement
- Risk level classification
- Doctor recommendation engine (Google Maps integration)

### 📄 Report Management
- Automated PDF report generation
- Email delivery with attachments
- File upload and storage (Cloudinary)
- Report history and filtering

### 💬 Real-Time Features
- Socket.io powered chatbot
- Real-time chat history
- Typing indicators
- Connection management

### 👨‍💼 Admin Dashboard
- User and report management
- High-risk case monitoring
- Dashboard statistics
- Report status tracking

### 🔔 Automation
- Scheduled jobs (daily summaries, alerts)
- Email notifications
- High-risk alerts
- Report reminders

---

## 🚀 Quick Start (5 Minutes)

### Step 1: Install Dependencies
```bash
cd backend
npm install
```

### Step 2: Configure Environment
```bash
# Copy example to .env
cp .env.example .env

# Edit .env with your API keys
# Minimum required:
# - MONGODB_URI
# - JWT_SECRET (any strong string)
# - At least one AI provider key (OPENAI_API_KEY recommended)
```

### Step 3: Start MongoDB
```bash
# Using Docker (easiest)
docker run -d -p 27017:27017 --name mongodb mongo:latest

# Or if MongoDB is installed locally
mongod
```

### Step 4: Start the Server
```bash
# Development mode with auto-reload
npm run dev

# Or production mode
npm start
```

✅ Server will be running on `http://localhost:5000`

---

## 🧪 Test the API

### 1. Check Health
```bash
curl http://localhost:5000/health
```

### 2. Register a User
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "password": "password123",
    "age": 35,
    "gender": "male"
  }'
```

Response will include a JWT token - save it!

### 3. Get Diseases
```bash
curl http://localhost:5000/api/diseases
```

### 4. Get Questions for a Disease
```bash
curl http://localhost:5000/api/diseases/Diabetes/questions
```

### 5. Create a Medical Report
```bash
curl -X POST http://localhost:5000/api/reports \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "disease": "Diabetes",
    "symptoms": "Frequent urination, increased thirst, fatigue",
    "mcqAnswers": {
      "question1": "Yes",
      "question2": "No"
    },
    "personalDetails": {
      "age": 35,
      "gender": "male",
      "latitude": 40.7128,
      "longitude": -74.0060
    }
  }'
```

---

## 📦 Project Structure at a Glance

```
backend/
├── src/
│   ├── config/           # Database, environment, AI setup
│   ├── controllers/      # Business logic for each feature
│   ├── models/           # MongoDB schemas
│   ├── routes/           # API endpoints
│   ├── middlewares/      # Auth, validation, error handling
│   ├── services/         # External services (AI, PDF, Maps, Email)
│   ├── utils/            # Helper functions
│   ├── sockets/          # Real-time chat
│   ├── jobs/             # Scheduled tasks
│   ├── app.js            # Express configuration
│   └── server.js         # Server startup
├── .env                  # Your configuration
├── package.json          # Dependencies
└── README.md             # Full documentation
```

---

## 🔑 Key API Endpoints

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/api/auth/register` | POST | ❌ | Register new user |
| `/api/auth/login` | POST | ❌ | User login |
| `/api/users/profile` | GET | ✅ | Get profile |
| `/api/reports` | POST | ✅ | Create medical report |
| `/api/reports` | GET | ✅ | Get user's reports |
| `/api/chat/:reportId/message` | POST | ✅ | Send chat message |
| `/api/admin/reports` | GET | ✅👑 | Get all reports (admin) |
| `/api/diseases` | GET | ❌ | Get all diseases |

✅ = Requires JWT token  
👑 = Requires admin role

---

## 🤖 AI Configuration

### New Fallback System
1. **Google Gemini** (Primary) - Best quality
2. **Groq** (Fast Fallback) - Ultra-fast inference
3. **HuggingFace** (Final Backup) - Open-source models

### Get API Keys
- **Google Gemini**: https://aistudio.google.com/app/apikey
- **Groq**: https://console.groq.com/keys
- **HuggingFace**: https://huggingface.co/settings/tokens

### Test AI Integration
The system will automatically try the next provider if one fails. Set `.env`:
```env
GEMINI_API_KEY=your_key...
GROQ_API_KEY=your_key...
HUGGINGFACE_API_KEY=your_token...
```

All three are recommended for reliability, but the system can work with just one!

---

## 🐛 Troubleshooting

### MongoDB Connection Failed
```bash
# Check if MongoDB is running
mongod --version

# Or start Docker MongoDB
docker run -d -p 27017:27017 mongo:latest
```

### AI Provider Errors
- Check your API keys in `.env`
- Verify you have credits/quota in the service
- Check internet connection
- System will fallback to next provider automatically

### Port Already in Use
```bash
# Change PORT in .env
PORT=5001

# Or kill process using port 5000
# Windows:
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Mac/Linux:
lsof -i :5000
kill -9 <PID>
```

### File Upload Issues
- Ensure `uploads/` directory exists
- Check `MAX_FILE_SIZE` in `.env` (default 10MB)
- Verify `ALLOWED_FILE_TYPES` includes your file type

---

## 📚 Next Steps

### 1. **Add Database Questions**
Load disease-specific MCQ questions into MongoDB:
```javascript
// See models/Question.js for schema
// Add questions for each disease to enable scoring
```

### 2. **Setup Email Service**
Update `.env` with Gmail credentials:
```env
EMAIL_SERVICE=gmail
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=app_specific_password
```

### 3. **Integrate Frontend**
Frontend should connect to:
- REST API at `http://localhost:5000/api/*`
- Socket.io at `http://localhost:5000` for real-time chat

### 4. **Deploy to Production**
- Use environment variables for secrets
- Set `NODE_ENV=production`
- Use strong `JWT_SECRET`
- Enable HTTPS
- Configure MongoDB Atlas
- Setup error logging/monitoring

---

## 📖 Documentation

- **Full API Docs**: See `README.md`
- **Code Comments**: Well-commented throughout
- **Examples**: Check each controller for implementation details
- **Schema**: MongoDB schemas in `src/models/`

---

## ✨ Tips & Best Practices

1. **Monitor Logs**: Check `logs/` folder for debugging
   ```bash
   tail -f logs/info.log
   tail -f logs/error.log
   ```

2. **Use Admin Account**: Create admin users for management
   ```javascript
   // Run in MongoDB console
   db.users.updateOne({email: "admin@example.com"}, {$set: {role: "admin"}})
   ```

3. **Test with Postman**: Import endpoints for easy testing

4. **WebSocket Testing**: Use Socket.io client library for real-time chat

5. **Rate Limiting**: Default 100 req/15min - adjust if needed

---

## 🆘 Need Help?

1. Check `README.md` for detailed documentation
2. Review example requests in this guide
3. Check server logs: `tail -f logs/error.log`
4. Verify `.env` configuration
5. Ensure all dependencies are installed: `npm install`

---

**Happy Coding! 🚀**

For more details, see the complete `README.md` file.
