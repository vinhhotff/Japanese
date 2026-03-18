import { supabase } from '../config/supabase';

export interface UploadResult {
  url: string;
  error?: string;
}

/**
 * Upload file to Supabase Storage
 * @param file File to upload
 * @param bucketName Bucket name (e.g., 'audio-files', 'images')
 * @param folder Optional folder path
 * @returns Public URL of uploaded file
 */
export const uploadFile = async (
  file: File,
  bucketName: string,
  folder?: string
): Promise<UploadResult> => {
  try {
    // Generate unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
    const filePath = folder ? `${folder}/${fileName}` : fileName;

    // Upload file
    const { data, error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return { url: '', error: uploadError.message };
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath);

    return { url: publicUrl };
  } catch (error: any) {
    console.error('File upload error:', error);
    return { url: '', error: error.message || 'Upload failed' };
  }
};

/**
 * Upload video file
 */
export const uploadVideo = async (file: File): Promise<UploadResult> => {
  return uploadFile(file, 'videos');
};

/**
 * Upload document file
 */
export const uploadDocument = async (file: File): Promise<UploadResult> => {
  return uploadFile(file, 'documents');
};

/**
 * Get file type from mime type or extension
 */
export const getFileType = (file: File): 'image' | 'audio' | 'video' | 'document' | 'other' => {
  if (file.type.startsWith('image/')) return 'image';
  if (file.type.startsWith('audio/')) return 'audio';
  if (file.type.startsWith('video/')) return 'video';
  if (file.type === 'application/pdf' ||
    file.type.includes('msword') ||
    file.type.includes('officedocument')) return 'document';
  return 'other';
};

/**
 * Upload audio file
 */
export const uploadAudio = async (file: File): Promise<UploadResult> => {
  return uploadFile(file, 'audio-files');
};

/**
 * Upload audio file (optionally into a folder)
 */
export const uploadAudioToFolder = async (file: File, folder?: string): Promise<UploadResult> => {
  return uploadFile(file, 'audio-files', folder);
};

/**
 * Upload image file
 */
export const uploadImage = async (file: File, folder?: string): Promise<UploadResult> => {
  return uploadFile(file, 'images', folder);
};

/**
 * Validate file type
 */
export const validateFileType = (file: File, allowedTypes: string[]): boolean => {
  return allowedTypes.some(type => {
    if (type.endsWith('/*')) {
      return file.type.startsWith(type.replace('/*', '/'));
    }
    return file.type === type;
  });
};

/**
 * Validate file size (in MB)
 */
export const validateFileSize = (file: File, maxSizeMB: number): boolean => {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxSizeBytes;
};

/**
 * Format file size into readable string
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

