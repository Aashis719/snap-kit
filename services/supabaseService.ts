import { supabase } from '../lib/supabase';
import { SocialKitResult } from '../types';

export const saveGeneration = async (
    userId: string,
    imageUrl: string,
    imagePublicId: string,
    inputs: any,
    result: SocialKitResult,
    options?: {
        api_key_source?: 'admin' | 'user';
        admin_key_id?: string;
    }
) => {
    // 1. Save Image Record
    const { data: imageData, error: imageError } = await supabase
        .from('images')
        .insert({
            user_id: userId,
            cloudinary_url: imageUrl,
            cloudinary_public_id: imagePublicId,
        })
        .select()
        .single();

    if (imageError) throw imageError;

    // 2. Save Generation Record
    const { error: genError } = await supabase
        .from('generations')
        .insert({
            user_id: userId,
            image_id: imageData.id,
            inputs,
            results: result,
            api_key_source: options?.api_key_source || 'user',
            admin_key_id: options?.admin_key_id || null
        });

    if (genError) throw genError;
};

export const getUserHistory = async (userId: string) => {
    const { data, error } = await supabase
        .from('generations')
        .select(`
      *,
      image:images(*)
    `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
};

export const deleteGeneration = async (generationId: string) => {
    const { error } = await supabase
        .from('generations')
        .delete()
        .eq('id', generationId);

    if (error) throw error;
};

/**
 * Get the Gemini API key for the current user
 */
export const getUserApiKey = async (userId: string): Promise<string | null> => {
    const { data, error } = await supabase
        .from('profiles')
        .select('gemini_api_key')
        .eq('id', userId)
        .single();

    if (error) throw error;
    return data?.gemini_api_key || null;
};

/**
 * Update or set the Gemini API key for the current user
 */
export const updateUserApiKey = async (userId: string, apiKey: string): Promise<void> => {
    const { error } = await supabase
        .from('profiles')
        .update({
            gemini_api_key: apiKey,
            updated_at: new Date().toISOString()
        })
        .eq('id', userId);

    if (error) throw error;
};

/**
 * V2: Get user's free generation stats
 */
export const getUserFreeGenerationStats = async (userId: string) => {
    const { data, error } = await supabase
        .from('profiles')
        .select('free_generations_used, free_generations_limit, free_tier_exhausted_at, gemini_api_key')
        .eq('id', userId)
        .single();

    if (error) throw error;

    const hasOwnKey = !!(data?.gemini_api_key && data.gemini_api_key.trim() !== '');
    const remaining = Math.max(0, (data?.free_generations_limit || 3) - (data?.free_generations_used || 0));

    return {
        used: data?.free_generations_used || 0,
        limit: data?.free_generations_limit || 3,
        remaining,
        exhaustedAt: data?.free_tier_exhausted_at,
        hasOwnKey,
        canUseFreeTier: !hasOwnKey && remaining > 0,
        gemini_api_key: data?.gemini_api_key
    };
};

/**
 * V2: Generate content directly using rotated admin keys (Bypasses Edge Function)
 */
export const getAdminKeyForFreeTier = async (): Promise<{ key: string; id: string }> => {
    const { data: adminKey, error } = await supabase.rpc('get_next_admin_key').single() as { data: any; error: any };
    if (error || !adminKey) {
        throw new Error('No free generation credits available or service busy. Please try again later.');
    }
    return { key: adminKey.api_key, id: adminKey.key_id };
};

/**
 * V2: Increment the free generation counter for a user
 */
export const incrementFreeUsage = async (userId: string) => {
    const { error } = await supabase.rpc('increment_free_generation', { user_id_param: userId });
    if (error) console.error('Failed to increment usage:', error);
};
