import { SocialKitConfig, SocialKitResult } from "../types";

// Helper to convert file to base64
export const fileToGenerativePart = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
      const base64Data = base64String.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const responseSchema = {
  type: "object",
  properties: {
    analysis: {
      type: "object",
      properties: {
        summary: { type: "string", description: "Brief visual description of the image" },
        mood: { type: "string", description: "The emotional tone of the image" },
        keywords: { type: "array", items: { type: "string" }, description: "5 key visual elements" }
      },
      required: ["summary", "mood", "keywords"]
    },
    captions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          platform: { type: "string", description: "e.g., Instagram, TikTok" },
          hook: { type: "string", description: "Attention grabbing opening line (max 10 words)" },
          text: { type: "string", description: "Short, punchy caption body (max 2 sentences)" },
          cta: { type: "string", description: "Short call to action" }
        },
        required: ["platform", "hook", "text", "cta"]
      }
    },
    hashtags: {
      type: "array",
      items: {
        type: "object",
        properties: {
          category: { type: "string", enum: ["Reach (High Vol)", "Niche (Targeted)", "Community (Low Vol)"] },
          tags: { type: "array", items: { type: "string" } }
        },
        required: ["category", "tags"]
      }
    },
    scripts: {
      type: "object",
      properties: {
        tiktok: {
          type: "object",
          properties: {
            title: { type: "string" },
            hook: { type: "string" },
            scene_breakdown: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  timestamp: { type: "string" },
                  visual: { type: "string" },
                  audio: { type: "string" }
                }
              }
            },
            cta: { type: "string" }
          }
        },
        shorts: {
          type: "object",
          properties: {
            title: { type: "string" },
            hook: { type: "string" },
            scene_breakdown: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  timestamp: { type: "string" },
                  visual: { type: "string" },
                  audio: { type: "string" }
                }
              }
            },
            cta: { type: "string" }
          }
        }
      }
    },
    linkedin_post: { type: "string", description: "Professional post for LinkedIn" },
    twitter_thread: { type: "array", items: { type: "string" }, description: "Array of tweets for a thread" }
  },
  required: ["analysis", "captions", "hashtags", "scripts", "linkedin_post", "twitter_thread"]
};

export const generateContent = async (
  apiKey: string,
  imageBase64: string,
  mimeType: string,
  config: SocialKitConfig
): Promise<SocialKitResult> => {
  if (!apiKey) throw new Error("API Key is required");

  // Raw API call to use the exact model shown in the user's dashboard (2.5-flash)
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [
            { inline_data: { mime_type: mimeType, data: imageBase64 } },
            { text: "Generate a comprehensive social media kit for this image." }
          ]
        }],
        systemInstruction: {
          parts: [{
            text: `You are an expert Social Media Manager and Content Strategist.
Your goal is to analyze the provided image and generate a complete social media kit.

Configuration:
- Tone: ${config.tone}
- Include Emojis: ${config.includeEmoji}
- Language: ${config.language}

Deliverables:
1. Visual analysis of the image.
2. 3 distinct caption variations (Instagram, Generic, Story).
3. 3 sets of hashtags (High volume, Niche, Community).
4. Video scripts for TikTok and YouTube Shorts.
5. A short LinkedIn post and Twitter/X thread.`
          }]
        },
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: responseSchema
        }
      })
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const message = errorData.error?.message || "Generation failed";
    const code = response.status;

    // Throw error with status code so App.tsx can handle rotation
    throw new Error(`[${code}] ${message}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("No response generated");

  return JSON.parse(text) as SocialKitResult;
};