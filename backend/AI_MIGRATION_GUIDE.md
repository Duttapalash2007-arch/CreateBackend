# AI Provider Migration Guide

## Summary of Changes

Your Healthcare Assistant backend has been updated with a new **AI Provider System** switching from OpenAI-first to **Gemini-first with fast fallback options**.

---

## 🔄 Migration: Old vs New System

### Old System ❌ (DEPRECATED)
```
OpenAI (GPT-4)
    ↓ (fail)
Gemini (Backup)
    ↓ (fail)
Anthropic Claude (Final)
```

### New System ✅ (ACTIVE)
```
Gemini (Primary)
    ↓ (fail)
Groq (Fast Fallback)
    ↓ (fail)
HuggingFace (Final Backup)
```

---

## 📝 Files Changed

### ✅ Configuration Files
| File | Change |
|------|--------|
| `.env` | Updated API keys: removed `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`; added `GROQ_API_KEY`, `HUGGINGFACE_API_KEY` |
| `.env.example` | Updated with new provider keys and documentation |
| `src/config/ai.config.js` | Updated provider configuration and fallback order |
| `src/config/env.js` | Updated environment variable mapping |

### ✅ Service Files
| File | Change |
|------|--------|
| `src/services/ai/aiRouter.service.js` | Updated provider imports: removed OpenAI, Anthropic; kept Gemini; added Groq, HuggingFace |
| `src/services/ai/groq.service.js` | **NEW** - Groq service implementation |
| `src/services/ai/huggingface.service.js` | **NEW** - HuggingFace service implementation |

### ✅ Utility Files
| File | Change |
|------|--------|
| `src/utils/constants.js` | Updated `AI_PROVIDER_NAMES` enum |

### ✅ Dependencies
| File | Change |
|------|--------|
| `package.json` | Removed: `openai`, `@anthropic-ai/sdk`; Kept: `@google/generative-ai`, `axios` |

### ✅ Documentation
| File | Change |
|------|--------|
| `README.md` | Updated AI orchestration description and API key setup |
| `QUICKSTART.md` | Updated AI configuration section |

---

## 🔑 API Keys Required

### New Configuration
Update your `.env` file:

```env
# OLD KEYS - REMOVE THESE
# OPENAI_API_KEY=...
# ANTHROPIC_API_KEY=...

# NEW KEYS - ADD THESE
GEMINI_API_KEY=your_gemini_api_key
GROQ_API_KEY=your_groq_api_key  
HUGGINGFACE_API_KEY=your_huggingface_token
```

### Getting API Keys

#### 1. Google Gemini (Primary)
```
https://aistudio.google.com/app/apikey
- Click "Get API Key"
- Create new API key
- Copy and paste into .env
```

#### 2. Groq (Fast Fallback)
```
https://console.groq.com/keys
- Sign up for free
- Create API key
- Copy and paste into .env
```

#### 3. HuggingFace (Final Backup)
```
https://huggingface.co/settings/tokens
- Create read access token
- Copy and paste into .env
```

---

## 📊 Provider Comparison

| Feature | Gemini | Groq | HuggingFace |
|---------|--------|------|-------------|
| **Speed** | Medium | ⚡ Very Fast | Slow |
| **Quality** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Cost** | $$ | $ | Free |
| **Reliability** | Very High | High | Medium |
| **Available** | Yes | Yes | Yes |

**Strategy**: Use Gemini first (best quality), Groq as backup (fastest), HuggingFace as final fallback (always available).

---

## 🚀 What's the Same?

✅ **No Breaking Changes**: All existing API endpoints work exactly the same  
✅ **Database**: MongoDB schema unchanged  
✅ **Authentication**: JWT system unchanged  
✅ **Real-Time Chat**: Socket.io unchanged  
✅ **PDF Reports**: Report generation unchanged  
✅ **Email Service**: Email notifications unchanged  

---

## 🔧 Installation Steps

### 1. Update Dependencies
```bash
npm install
```

### 2. Update Environment
```bash
cp .env.example .env
# Edit .env and add your API keys
```

### 3. Get API Keys
- Google Gemini: https://aistudio.google.com/app/apikey
- Groq: https://console.groq.com/keys
- HuggingFace: https://huggingface.co/settings/tokens

### 4. Start Server
```bash
npm run dev   # Development
npm start     # Production
```

---

## 🧪 Testing the New System

### Test Gemini (Primary)
```bash
# Create a medical report - will use Gemini
curl -X POST http://localhost:5000/api/reports \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "disease": "Diabetes",
    "symptoms": "Frequent urination, increased thirst",
    "mcqAnswers": {"q1": "Yes"},
    "personalDetails": {"age": 30}
  }'
```

### Test Fallback (Disable Gemini)
To test fallback to Groq, temporarily set invalid Gemini key:
```env
GEMINI_API_KEY=invalid_key_test
```

The system will automatically try Groq next! Check logs:
```bash
tail -f logs/info.log
# Will show: "Trying AI provider: gemini"
# Then: "gemini failed: ..."
# Then: "Trying AI provider: groq"
# Then: "Successfully used AI provider: groq"
```

---

## 📊 Performance Improvements

| Metric | Before | After |
|--------|--------|-------|
| **Primary Provider** | OpenAI (slower, paid) | Gemini (fast, paid) |
| **Fallback Speed** | Anthropic (slow) | Groq (ultra-fast ⚡) |
| **Reliability** | 2 fallbacks | 3 robust fallbacks |
| **Cost** | Higher | Lower (Groq is cheaper) |

---

## 🆘 Troubleshooting

### "All AI providers failed"
**Check**:
1. Verify `.env` has all three API keys
2. Check internet connection
3. Verify API keys are valid (not truncated)
4. Check service status:
   - Gemini: https://status.cloud.google.com/
   - Groq: https://www.groqstatus.com/
   - HuggingFace: https://huggingface.co/

### "Provider timeout"
- Default timeout is 30 seconds
- Groq should respond in <1 second typically
- HuggingFace may take 10-30 seconds

### Logs not showing provider attempts
```env
LOG_LEVEL=debug  # Set in .env
```

Check logs:
```bash
tail -f logs/debug.log
```

---

## 📌 Important Notes

1. **API Keys**: Keep them secure! Never commit `.env` to Git
2. **Minimum Setup**: Need at least ONE API key (Gemini recommended)
3. **Recommended**: Have all three for maximum reliability
4. **Cost**: Gemini and Groq are paid but cheap; HuggingFace is free but slower
5. **Quota**: Monitor usage in each provider's dashboard

---

## ✅ Checklist

- [ ] Installed new dependencies: `npm install`
- [ ] Got Google Gemini API key
- [ ] Got Groq API key
- [ ] Got HuggingFace API token
- [ ] Updated `.env` file with all keys
- [ ] Started MongoDB: `docker run -d -p 27017:27017 mongo:latest`
- [ ] Started backend: `npm run dev`
- [ ] Tested with sample request
- [ ] Checked logs for successful provider selection

---

## 📖 More Information

- **ai.config.js**: Provider configuration
- **aiRouter.service.js**: Fallback logic
- **README.md**: Full documentation
- **QUICKSTART.md**: Quick setup guide

---

**Migration Complete! 🎉**

Your system is now using Gemini → Groq → HuggingFace with automatic fallback!
