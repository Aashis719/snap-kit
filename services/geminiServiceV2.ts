import { supabase } from '../lib/supabase';
import { SocialKitResult } from '../types';

export const fileToGenerativePart = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64String = reader.result as string;
            const base64Data = base64String.split(',')[1];
            resolve(base64Data);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};

interface GenerateContentParams {
    imageFile: File;
    imageUrl: string;
    imagePublicId: string;
    config: {
        tone: string;
        platforms: string[];
        includeEmoji: boolean;
        language: string;
    };
}

interface GenerateContentResponse {
    result: SocialKitResult;
    apiKeySource: 'admin' | 'user';
    freeGenerationsRemaining: number;
}

/**
 * V2: Generate content using Supabase Edge Function
 * This securely handles API key rotation and free tier management
 */
export const generateContentV2 = async (
    params: GenerateContentParams
): Promise<GenerateContentResponse> => {
    const { imageFile, imageUrl, imagePublicId, config } = params;

    // Convert image to base64
    const imageBase64 = await fileToGenerativePart(imageFile);
    const mimeType = imageFile.type;

    // Get current session
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        throw new Error('User must be authenticated');
    }

    // Call Edge Function
    const { data, error } = await supabase.functions.invoke('generate-content', {
        body: {
            imageBase64,
            mimeType,
            config,
            imageUrl,
            imagePublicId
        }
    });

    if (error) {
        throw new Error(error.message || 'Failed to generate content');
    }

    if (data.error) {
        throw new Error(data.message || data.error);
    }

    return data as GenerateContentResponse;
};

/**
 * Get user's remaining free generations
 */
export const getFreeGenerationsRemaining = async (userId: string): Promise<number> => {
    const { data, error } = await supabase
        .rpc('get_free_generations_remaining', { user_id_param: userId });

    if (error) {
        console.error('Error fetching free generations:', error);
        return 0;
    }

    return data || 0;
};

/**
 * Check if user can use free tier
 */
export const canUseFreeTier = async (userId: string): Promise<boolean> => {
    const { data, error } = await supabase
        .rpc('can_use_free_tier', { user_id_param: userId });

    if (error) {
        console.error('Error checking free tier eligibility:', error);
        return false;
    }

    return data || false;
};
