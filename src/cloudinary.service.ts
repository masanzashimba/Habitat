import { Injectable } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import streamifier from 'streamifier';

@Injectable()
export class CloudinaryService {
  constructor() {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  async uploadImageBuffer(
    fileBuffer: Buffer,
    filename: string,
  ): Promise<{ secure_url: string }> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'properties',
          public_id: filename.split('.')[0],
          // 🚀 Optimisations pour la vitesse
          quality: 'auto:good', // Compression automatique intelligente
          fetch_format: 'auto', // Format optimal automatique
          flags: 'progressive', // Chargement progressif
          transformation: [
            { width: 1200, height: 800, crop: 'limit' }, // Limiter la taille max
            { quality: 85 }, // Qualité optimisée
          ],
          // 🚀 Upload plus rapide
          resource_type: 'image',
          timeout: 60000, // 60s timeout
        },
        (error, result) => {
          if (error) {
            console.error('❌ Cloudinary upload error:', error);
            return reject(error);
          }
          resolve(result as { secure_url: string });
        },
      );

      streamifier.createReadStream(fileBuffer).pipe(uploadStream);
    });
  }

  async uploadProfileImage(
    fileBuffer: Buffer,
    filename: string,
  ): Promise<{ secure_url: string }> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'profiles',
          public_id: filename.split('.')[0],
          transformation: [
            { width: 500, height: 500, crop: 'fill', gravity: 'face' },
            { quality: 'auto' },
          ],
        },
        (error, result) => {
          if (error) return reject(error);
          resolve(result as { secure_url: string });
        },
      );
      streamifier.createReadStream(fileBuffer).pipe(uploadStream);
    });
  }

  async uploadTenantImage(
    fileBuffer: Buffer,
    filename: string,
  ): Promise<{ secure_url: string }> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'tenants',
          public_id: filename.split('.')[0],
          transformation: [
            { width: 500, height: 500, crop: 'fill', gravity: 'face' },
            { quality: 'auto' },
          ],
        },
        (error, result) => {
          if (error) return reject(error);
          resolve(result as { secure_url: string });
        },
      );
      streamifier.createReadStream(fileBuffer).pipe(uploadStream);
    });
  }

  async uploadFile(
    fileBuffer: Buffer,
    filename: string,
    folder: string = 'documents',
  ): Promise<{ secure_url: string; public_id: string }> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          public_id: filename.split('.')[0],
          resource_type: 'auto', // Allows any file type
        },
        (error, result) => {
          if (error) return reject(error);
          if (!result) return reject(new Error('Upload failed'));
          resolve({
            secure_url: result.secure_url,
            public_id: result.public_id,
          });
        },
      );
      streamifier.createReadStream(fileBuffer).pipe(uploadStream);
    });
  }

  async deleteFile(publicId: string): Promise<void> {
    try {
      await cloudinary.uploader.destroy(publicId);
    } catch (error) {
      console.error('Error deleting file from Cloudinary:', error);
      throw error;
    }
  }
}
