# SnapKit - AI-Powered Social Media Content Generator

<div align="center">
  <img src="public/snap kit.png" alt="SnapKit Banner" width="800">
</div>

### Transform Photos into Viral Content ⚡ 

**SnapKit** is an intelligent social media assistant that uses AI to generate content for social media. By analyzing your images, it instantly generates tailored captions, hashtags, and scripts optimized for every major platform.

---

## 🚀 Key Features

### 🧠 AI-Powered Vision
SnapKit doesn't just see pixels; it understands context, mood, and subject matter to write copy that actually resonates with your audience.

### 📱 Multi-Platform Optimization
Generate platform-specific content in a single click:
- **Instagram**: Engaging captions & trending hashtags
- **TikTok**: Viral video scripts & hooks
- **LinkedIn**: Professional, industry-relevant posts
- **Twitter/X**: Short, punchy threads
- **YouTube Shorts**: Fast-paced video scripts

### ⚡ Lightning Fast
From upload to complete social media kit in under 15 seconds. Spend less time brainstorming and more time creating.

### 🎁 Free Tier
- **3 free generations** per account
- No credit card required
- Instant access after email verification

### 🔐 Privacy First
Built with security at its core. Your data and API keys are encrypted and handled with the highest standards of privacy.

---

## 🛠️ Technology Stack

Built with a modern, high-performance web architecture:

**Frontend:**
- React 18 & TypeScript
- TailwindCSS (Styling)
- Vite (Build Tool)
- React Router (Navigation)

**Backend:**
- Supabase (Auth & Database)
- Supabase Edge Functions (Serverless API)
- Google Gemini AI (Multimodal Vision)

**Services:**
- Cloudinary (Image Storage)

---

## 🏗️ Project Structure

```
snapkit/
├── components/          # React components
│   ├── pages/          # Page components
│   ├── ui/             # UI components
│   └── ...
├── services/           # API services
│   ├── geminiServiceV2.ts    # Gemini AI integration
│   ├── supabaseService.ts    # Supabase operations
│   └── cloudinaryService.ts  # Image uploads
├── supabase/
│   └── functions/      # Edge Functions
│       └── generate-content/
├── lib/                # Utilities
├── public/             # Static assets
├── supabase_schema.sql # Database schema
```


## 🔐 Security

- ✅ Admin API keys stored securely in database (never exposed to client)
- ✅ Email verification required before generating content
- ✅ Row Level Security (RLS) enabled on all tables
- ✅ Server-side API key rotation to prevent rate limits
- ✅ User API keys encrypted in database

---

## 💡 How It Works

1. **User Signs Up** → Email verification sent 
2. **User Verifies Email** → Account activated
3. **User Uploads Image** → Stored securely in Cloudinary
4. **AI Analyzes Image** → Gemini Vision API
5. **Content Generated** → Captions, hashtags, scripts for all platforms
6. **Free Tier** → 3 generations using admin API keys
7. **Unlimited** → Add own Gemini API key for unlimited use

---

<div align="center">
  <p><b>SnapKit - Transform Photos into Viral Content</b></p>
  <p>© 2026 SnapKit. All rights reserved.</p>
</div>
