// Supabase Edge Function: delete-cloudinary-image
// Securely deletes an image from Cloudinary using API Secret

// @ts-ignore: Deno imports work in Edge Functions
import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
// @ts-ignore: Deno imports work in Edge Functions
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'
// @ts-ignore: Deno imports work in Edge Functions
import { crypto } from "https://deno.land/std@0.177.0/crypto/mod.ts"
// @ts-ignore: Deno imports work in Edge Functions
import { encodeHex } from "https://deno.land/std@0.177.0/encoding/hex.ts"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

async function generateSignature(publicId: string, timestamp: number, apiSecret: string) {
    const str = `public_id=${publicId}&timestamp=${timestamp}${apiSecret}`
    const msgUint8 = new TextEncoder().encode(str)
    const hashBuffer = await crypto.subtle.digest('SHA-1', msgUint8)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) throw new Error('Missing authorization header')

        const supabaseAdmin = createClient(
            // @ts-ignore
            Deno.env.get('SUPABASE_URL') ?? '',
            // @ts-ignore
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
            { auth: { autoRefreshToken: false, persistSession: false } }
        )

        const supabaseClient = createClient(
            // @ts-ignore
            Deno.env.get('SUPABASE_URL') ?? '',
            // @ts-ignore
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: authHeader } } }
        )

        const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
        if (userError || !user) throw new Error('Unauthorized')

        const { generationId } = await req.json()
        if (!generationId) throw new Error('Missing generationId')

        // 1. Get image details and verify ownership
        const { data: gen, error: genFetchError } = await supabaseAdmin
            .from('generations')
            .select('*, image:images(*)')
            .eq('id', generationId)
            .eq('user_id', user.id)
            .single()

        if (genFetchError || !gen) throw new Error('Generation not found or unauthorized')

        const publicId = gen.image?.cloudinary_public_id
        const imageId = gen.image?.id

        if (publicId) {
            // @ts-ignore
            const cloudName = Deno.env.get('CLOUDINARY_CLOUD_NAME')
            // @ts-ignore
            const apiKey = Deno.env.get('CLOUDINARY_API_KEY')
            // @ts-ignore
            const apiSecret = Deno.env.get('CLOUDINARY_API_SECRET')

            if (cloudName && apiKey && apiSecret) {
                const timestamp = Math.round(new Date().getTime() / 1000)
                const signature = await generateSignature(publicId, timestamp, apiSecret)

                const formData = new FormData()
                formData.append('public_id', publicId)
                formData.append('api_key', apiKey)
                formData.append('timestamp', timestamp.toString())
                formData.append('signature', signature)

                const cloudinaryRes = await fetch(
                    `https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`,
                    { method: 'POST', body: formData }
                )

                if (!cloudinaryRes.ok) {
                    console.error('Cloudinary destroy failed:', await cloudinaryRes.text())
                }
            } else {
                console.warn('Missing Cloudinary admin credentials, skipping asset deletion')
            }
        }

        // 2. Delete generation record
        const { error: deleteGenError } = await supabaseAdmin
            .from('generations')
            .delete()
            .eq('id', generationId)

        if (deleteGenError) throw deleteGenError

        // 3. Delete image record if no other generations use it
        if (imageId) {
            const { data: otherGens } = await supabaseAdmin
                .from('generations')
                .select('id')
                .eq('image_id', imageId)
                .limit(1)

            if (!otherGens || otherGens.length === 0) {
                await supabaseAdmin.from('images').delete().eq('id', imageId)
            }
        }

        return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    } catch (error) {
        console.error('Error:', error)
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }
})
