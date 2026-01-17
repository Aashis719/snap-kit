// Supabase Edge Function: generate-content
// Handles secure content generation with admin API key rotation

// @ts-ignore: Deno imports work in Edge Functions
import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
// @ts-ignore: Deno imports work in Edge Functions
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface GenerateRequest {
    imageBase64: string
    mimeType: string
    config: {
        tone: string
        platforms: string[]
        includeEmoji: boolean
        language: string
    }
    imageUrl: string
    imagePublicId: string
}

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // Get user from auth header
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) {
            throw new Error('Missing authorization header')
        }

        // Initialize Supabase client with service role for admin operations
        const supabaseAdmin = createClient(
            // @ts-ignore: Deno global available in Edge Functions
            Deno.env.get('SUPABASE_URL') ?? '',
            // @ts-ignore: Deno global available in Edge Functions
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false
                }
            }
        )

        // Initialize Supabase client for user operations
        const supabaseClient = createClient(
            // @ts-ignore: Deno global available in Edge Functions
            Deno.env.get('SUPABASE_URL') ?? '',
            // @ts-ignore: Deno global available in Edge Functions
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            {
                global: {
                    headers: { Authorization: authHeader }
                }
            }
        )

        // Get authenticated user
        const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
        if (userError || !user) {
            throw new Error('Unauthorized')
        }

        // Parse request body
        const { imageBase64, mimeType, config, imageUrl, imagePublicId }: GenerateRequest = await req.json()

        // Get user profile
        const { data: profile, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('gemini_api_key, free_generations_used, free_generations_limit')
            .eq('id', user.id)
            .single()

        if (profileError) {
            throw new Error('Failed to fetch user profile')
        }

        let apiKey: string
        let apiKeySource: 'admin' | 'user'
        let adminKeyId: string | null = null

        // Determine which API key to use
        if (profile.gemini_api_key && profile.gemini_api_key.trim() !== '') {
            // User has their own API key - use it
            apiKey = profile.gemini_api_key
            apiKeySource = 'user'
        } else {
            // Check if user can use free tier
            if (profile.free_generations_used >= profile.free_generations_limit) {
                return new Response(
                    JSON.stringify({
                        error: 'Free tier exhausted',
                        message: 'You have used all your free generations. Please add your own API key to continue.',
                        freeGenerationsUsed: profile.free_generations_used,
                        freeGenerationsLimit: profile.free_generations_limit
                    }),
                    {
                        status: 403,
                        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                    }
                )
            }

            // Get admin API key using round-robin
            const { data: adminKey, error: keyError } = await supabaseAdmin
                .rpc('get_next_admin_key')
                .single()

            if (keyError || !adminKey) {
                throw new Error('No admin API keys available')
            }

            apiKey = adminKey.api_key
            apiKeySource = 'admin'
            adminKeyId = adminKey.key_id
        }

        // Call Gemini API
        const geminiResponse = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [
                            {
                                inline_data: {
                                    mime_type: mimeType,
                                    data: imageBase64
                                }
                            },
                            {
                                text: "Generate a comprehensive social media kit for this image."
                            }
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

IMPORTANT RULES:
1. **Captions must be SHORT and EFFECTIVE.** Avoid long paragraphs. Focus on viral hooks and punchy 1-2 sentence bodies.
2. **Hooks** must stop the scroll.
3. **Video scripts** should be fast-paced.

Deliverables:
1. Visual analysis of the image.
2. 3 distinct caption variations (Instagram, Generic, Story).
3. 3 sets of hashtags (High volume, Niche, Community).
4. Video scripts for TikTok and YouTube Shorts based on the image context.
5. A short and professional LinkedIn post.
6. A Twitter/X thread (3-5 tweets).`
                        }]
                    },
                    generationConfig: {
                        response_mime_type: "application/json",
                        response_schema: {
                            type: "object",
                            properties: {
                                analysis: {
                                    type: "object",
                                    properties: {
                                        summary: { type: "string" },
                                        mood: { type: "string" },
                                        keywords: { type: "array", items: { type: "string" } }
                                    },
                                    required: ["summary", "mood", "keywords"]
                                },
                                captions: {
                                    type: "array",
                                    items: {
                                        type: "object",
                                        properties: {
                                            platform: { type: "string" },
                                            hook: { type: "string" },
                                            text: { type: "string" },
                                            cta: { type: "string" }
                                        },
                                        required: ["platform", "hook", "text", "cta"]
                                    }
                                },
                                hashtags: {
                                    type: "array",
                                    items: {
                                        type: "object",
                                        properties: {
                                            category: { type: "string" },
                                            tags: { type: "array", items: { type: "string" } }
                                        }
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
                                                scene_breakdown: { type: "array" },
                                                cta: { type: "string" }
                                            }
                                        },
                                        shorts: {
                                            type: "object",
                                            properties: {
                                                title: { type: "string" },
                                                hook: { type: "string" },
                                                scene_breakdown: { type: "array" },
                                                cta: { type: "string" }
                                            }
                                        }
                                    }
                                },
                                linkedin_post: { type: "string" },
                                twitter_thread: { type: "array", items: { type: "string" } }
                            },
                            required: ["analysis", "captions", "hashtags", "scripts", "linkedin_post", "twitter_thread"]
                        }
                    }
                })
            }
        )

        if (!geminiResponse.ok) {
            const errorText = await geminiResponse.text()
            throw new Error(`Gemini API error: ${errorText}`)
        }

        const geminiData = await geminiResponse.json()
        const resultText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text

        if (!resultText) {
            throw new Error('No content generated from Gemini')
        }

        const result = JSON.parse(resultText)

        // Save image record
        const { data: imageData, error: imageError } = await supabaseAdmin
            .from('images')
            .insert({
                user_id: user.id,
                cloudinary_url: imageUrl,
                cloudinary_public_id: imagePublicId
            })
            .select()
            .single()

        if (imageError) {
            throw new Error('Failed to save image record')
        }

        // Save generation record
        const { error: genError } = await supabaseAdmin
            .from('generations')
            .insert({
                user_id: user.id,
                image_id: imageData.id,
                inputs: config,
                results: result,
                api_key_source: apiKeySource,
                admin_key_id: adminKeyId
            })

        if (genError) {
            throw new Error('Failed to save generation record')
        }

        // If using admin key, increment free generation counter
        if (apiKeySource === 'admin') {
            const { error: incrementError } = await supabaseAdmin
                .rpc('increment_free_generation', { user_id_param: user.id })

            if (incrementError) {
                console.error('Failed to increment free generation counter:', incrementError)
            }
        }

        // Get updated free generations count
        const { data: updatedProfile } = await supabaseAdmin
            .from('profiles')
            .select('free_generations_used, free_generations_limit')
            .eq('id', user.id)
            .single()

        return new Response(
            JSON.stringify({
                result,
                apiKeySource,
                freeGenerationsRemaining: updatedProfile
                    ? updatedProfile.free_generations_limit - updatedProfile.free_generations_used
                    : 0
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
        )

    } catch (error) {
        console.error('Error:', error)
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
        )
    }
})
