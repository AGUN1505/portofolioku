// src/infrastructure/storage/supabase-storage.service.ts
// Supabase Storage integration for persistent, serverless-safe uploads (certificates and project thumbnails).

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let cachedClient: SupabaseClient | null | undefined = undefined;

/**
 * Retrieves an authenticated Supabase client for storage operations.
 * Reads environment variables:
 * - NEXT_PUBLIC_SUPABASE_URL or SUPABASE_URL (default: project idovxaociyafaloyelrp)
 * - SUPABASE_SERVICE_ROLE_KEY (preferred for backend) or NEXT_PUBLIC_SUPABASE_ANON_KEY / SUPABASE_ANON_KEY
 */
export function getSupabaseStorageClient(): SupabaseClient | null {
  if (cachedClient !== undefined) {
    return cachedClient;
  }

  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    'https://idovxaociyafaloyelrp.supabase.co';

  // Support service_role key (preferred for server without RLS friction) or anon key
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseKey) {
    cachedClient = null;
    return null;
  }

  cachedClient = createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return cachedClient;
}

export const SUPABASE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET || 'portfolio';

/**
 * Checks if a given file URL is managed by Supabase Storage
 */
export function isSupabaseStorageUrl(url: string | null | undefined): boolean {
  if (!url || typeof url !== 'string') return false;
  return (
    url.includes('.supabase.co/storage/v1/object/') ||
    url.includes('/storage/v1/object/public/')
  );
}

/**
 * Uploads a buffer to Supabase Storage and returns the public URL.
 */
export async function uploadToSupabaseStorage(
  folder: 'certificates' | 'projects',
  filename: string,
  buffer: Buffer,
  contentType: string
): Promise<{ success: boolean; publicUrl?: string; error?: string }> {
  const client = getSupabaseStorageClient();
  if (!client) {
    return {
      success: false,
      error: 'Supabase Storage credentials are not configured.',
    };
  }

  const bucket = SUPABASE_BUCKET;
  const filePath = `${folder}/${filename}`;

  try {
    const { error: uploadError } = await client.storage
      .from(bucket)
      .upload(filePath, buffer, {
        contentType,
        upsert: true,
      });

    if (uploadError) {
      // If bucket not found, attempt to auto-create public bucket (works with service_role key)
      const isBucketNotFound =
        uploadError.message?.toLowerCase().includes('bucket not found') ||
        (uploadError as unknown as { statusCode?: number }).statusCode === 404;

      if (isBucketNotFound) {
        const { error: createError } = await client.storage.createBucket(bucket, {
          public: true,
        });

        if (!createError) {
          const { error: retryError } = await client.storage
            .from(bucket)
            .upload(filePath, buffer, {
              contentType,
              upsert: true,
            });

          if (retryError) {
            return { success: false, error: retryError.message };
          }
        } else {
          return {
            success: false,
            error: `Storage bucket "${bucket}" not found. Please create a public bucket named "${bucket}" in your Supabase Dashboard under Storage.`,
          };
        }
      } else {
        return { success: false, error: uploadError.message };
      }
    }

    const { data: publicData } = client.storage.from(bucket).getPublicUrl(filePath);
    return {
      success: true,
      publicUrl: publicData.publicUrl,
    };
  } catch (err) {
    return {
      success: false,
      error:
        err instanceof Error ? err.message : 'Failed to upload file to Supabase Storage',
    };
  }
}

/**
 * Deletes a file from Supabase Storage by its public URL.
 */
export async function deleteFromSupabaseStorage(publicUrl: string): Promise<boolean> {
  const client = getSupabaseStorageClient();
  if (!client || !isSupabaseStorageUrl(publicUrl)) {
    return false;
  }

  try {
    // Format: https://<project>.supabase.co/storage/v1/object/public/<bucket>/<path>
    const match = publicUrl.match(/\/storage\/v1\/object\/public\/([^/]+)\/(.+)$/);
    if (!match) return false;

    const bucket = match[1];
    const filePath = match[2];

    const { error } = await client.storage.from(bucket).remove([filePath]);
    return !error;
  } catch {
    return false;
  }
}
