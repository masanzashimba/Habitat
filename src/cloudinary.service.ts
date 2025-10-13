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

  async uploadImageBuffer(fileBuffer: Buffer, filename: string): Promise<{ secure_url: string }> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: 'properties', public_id: filename.split('.')[0] },
        (error, result) => {
          if (error) return reject(error);
          resolve(result as { secure_url: string });
        },
      );
      streamifier.createReadStream(fileBuffer).pipe(uploadStream);
    });
  }
}
