import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';

// Return type for a successful upload
export interface S3UploadResult {
  key:  string; // e.g. "backups/backup_manual_2026-08-14_00-27-00.json.gz"
  size: number; // bytes uploaded
}

// Wraps the AWS SDK v3 S3 client and exposes typed, service-safe methods for
// backup upload and deletion. Download and existence-check methods have been
// removed — the system no longer supports backup download or verify-integrity.
@Injectable()
export class S3StorageService {
  private readonly logger = new Logger(S3StorageService.name);
  private readonly client: S3Client;
  private readonly bucket: string;

  constructor(private readonly configService: ConfigService) {
    // ── Validate required AWS configuration at startup ──────────────────────
    const region    = this.configService.get<string>('AWS_REGION');
    const accessKey = this.configService.get<string>('AWS_ACCESS_KEY_ID');
    const secretKey = this.configService.get<string>('AWS_SECRET_ACCESS_KEY');
    const bucket    = this.configService.get<string>('S3_BACKUP_BUCKET');

    const missing = (
      [
        ['AWS_REGION',            region],
        ['AWS_ACCESS_KEY_ID',     accessKey],
        ['AWS_SECRET_ACCESS_KEY', secretKey],
        ['S3_BACKUP_BUCKET',      bucket],
      ] as [string, string | undefined][]
    )
      .filter(([, v]) => !v)
      .map(([k]) => k);

    if (missing.length > 0) {
      throw new Error(
        `S3StorageService: missing required environment variable(s): ${missing.join(', ')}. ` +
        `Add them to your .env file before starting the server.`,
      );
    }

    this.bucket = bucket!;

    this.client = new S3Client({
      region: region!,
      credentials: {
        accessKeyId:     accessKey!,
        secretAccessKey: secretKey!,
      },
    });

    this.logger.log(`S3StorageService initialised — bucket: "${this.bucket}", region: "${region}"`);
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────

  /** Converts a bare filename to the S3 key used for all backup objects. */
  buildKey(filename: string): string {
    return `backups/${filename}`;
  }

  // ── Public API ───────────────────────────────────────────────────────────────

  /**
   * Uploads a gzip-compressed backup buffer to S3.
   * S3 path: backups/<filename>
   * AES-256 server-side encryption is applied on every upload.
   */
  async uploadBackup(buffer: Buffer, filename: string): Promise<S3UploadResult> {
    const key = this.buildKey(filename);

    this.logger.log(`Uploading backup to S3: ${key} (${buffer.byteLength} bytes)`);

    try {
      await this.client.send(
        new PutObjectCommand({
          Bucket:        this.bucket,
          Key:           key,
          Body:          buffer,
          ContentType:   'application/gzip', // always .json.gz
          ContentLength: buffer.byteLength,
          // Server-side encryption — AES-256 applied by AWS at rest
          ServerSideEncryption: 'AES256',
        }),
      );

      this.logger.log(`S3 upload complete: ${key}`);
      return { key, size: buffer.byteLength };
    } catch (err) {
      this.logger.error(`S3 upload failed for key "${key}"`, err);
      throw new Error(
        `Failed to upload backup to S3: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  /**
   * Deletes a backup object from S3.
   */
  async deleteBackup(key: string): Promise<void> {
    this.logger.log(`Deleting backup from S3: ${key}`);

    try {
      await this.client.send(
        new DeleteObjectCommand({ Bucket: this.bucket, Key: key }),
      );
      this.logger.log(`S3 delete complete: ${key}`);
    } catch (err) {
      this.logger.error(`S3 delete failed for key "${key}"`, err);
      throw new Error(
        `Failed to delete backup from S3: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  /**
   * Downloads a backup object from S3 and returns the raw buffer.
   * Used exclusively by the restore flow.
   */
  async downloadBackup(key: string): Promise<Buffer> {
    this.logger.log(`Downloading backup from S3: ${key}`);

    try {
      const response = await this.client.send(
        new GetObjectCommand({ Bucket: this.bucket, Key: key }),
      );

      // The Body is a ReadableStream (Node.js); collect all chunks into a Buffer.
      const stream = response.Body as NodeJS.ReadableStream;
      const chunks: Buffer[] = [];
      await new Promise<void>((resolve, reject) => {
        stream.on('data', (chunk: Buffer) => chunks.push(chunk));
        stream.on('end', resolve);
        stream.on('error', reject);
      });

      const buffer = Buffer.concat(chunks);
      this.logger.log(`S3 download complete: ${key} (${buffer.byteLength} bytes)`);
      return buffer;
    } catch (err) {
      this.logger.error(`S3 download failed for key "${key}"`, err);
      throw new Error(
        `Failed to download backup from S3: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }
}
