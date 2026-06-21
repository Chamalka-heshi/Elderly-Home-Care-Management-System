import { Injectable, BadRequestException, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';

@Injectable()
export class CloudinaryService implements OnModuleInit {
  private readonly allowedMimeTypes = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
  ];
  private readonly maxFileSizeBytes = 5 * 1024 * 1024; // 5 MB

  constructor(private readonly configService: ConfigService) {}

  // Configures the Cloudinary SDK once NestJS has fully loaded all env vars via ConfigModule.
  onModuleInit() {
    cloudinary.config({
      cloud_name: this.configService.get<string>('CLOUDINARY_CLOUD_NAME'),
      api_key: this.configService.get<string>('CLOUDINARY_API_KEY'),
      api_secret: this.configService.get<string>('CLOUDINARY_API_SECRET'),
    });
  }

  // Validates the file and streams the buffer directly to Cloudinary, returning the secure CDN URL.
  async uploadFile(
    file: { mimetype: string; size: number; buffer: Buffer },
    folder = 'ecms/avatars',
  ): Promise<UploadApiResponse> {
    if (!this.allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Only JPEG, PNG, WEBP, or GIF images are allowed',
      );
    }
    if (file.size > this.maxFileSizeBytes) {
      throw new BadRequestException('Avatar image must be smaller than 5 MB');
    }

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder, resource_type: 'image' },
        (error, result) => {
          if (error) return reject(error);
          resolve(result!);
        },
      );
      uploadStream.end(file.buffer);
    });
  }

  // Removes an image from Cloudinary by its public ID (e.g. when a user deletes their avatar).
  async deleteFile(publicId: string): Promise<void> {
    await cloudinary.uploader.destroy(publicId);
  }
}
