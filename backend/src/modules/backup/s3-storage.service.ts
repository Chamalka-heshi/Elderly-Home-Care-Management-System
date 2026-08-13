import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { Readable } from 'stream';

// ─────────────────────────────────────────────────────────────────────────────
// Return type for a successful upload
// ─────────────────────────────────────────────────────────────────────────────
export interface S3UploadResult {
  key: string;      // e.g. "backups/backup_manual_2026-08-05_22-12-45.json.gz"
  location: string; // virtual-hosted-style URL for display
  size: number;     // bytes uploaded
}

// Wraps the AWS SDK v3 S3 client and exposes typed, service-safe methods for
// all backup file operations (upload / download / delete / existence-check).
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

  /** Virtual-hosted-style URL (used for display only; bucket may not be public). */
  private buildUrl(key: string): string {
    const region = this.configService.get<string>('AWS_REGION')!;
    return `https://${this.bucket}.s3.${region}.amazonaws.com/${key}`;
  }

  /** Drains an AWS SDK Readable / ReadableStream body into a Node.js Buffer. */
  private async streamToBuffer(stream: Readable | ReadableStream | Blob): Promise<Buffer> {
    if (stream instanceof Readable) {
      return new Promise<Buffer>((resolve, reject) => {
        const chunks: Buffer[] = [];
        stream.on('data', (chunk: Buffer) =>
          chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)),
        );
        stream.on('end',   () => resolve(Buffer.concat(chunks)));
        stream.on('error', reject);
      });
    }
    // Web ReadableStream / Blob (SDK may return these in certain environments)
    const arrayBuffer = (stream as ReadableStream).getReader
      ? await new Response(stream as ReadableStream).arrayBuffer()
      : await (stream as Blob).arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  // ── Public API ───────────────────────────────────────────────────────────────

  /**
   * Uploads a backup buffer to S3.
   * S3 path: backups/<filename>
   */
  async uploadBackup(buffer: Buffer, filename: string): Promise<S3UploadResult> {
    const key         = this.buildKey(filename);
    const contentType = filename.endsWith('.gz')
      ? 'application/gzip'
      : 'application/json';

    this.logger.log(`Uploading backup to S3: ${key} (${buffer.byteLength} bytes)`);

    try {
      await this.client.send(
        new PutObjectCommand({
          Bucket:        this.bucket,
          Key:           key,
          Body:          buffer,
          ContentType:   contentType,
          ContentLength: buffer.byteLength,
          // Server-side encryption — uses bucket default (AES-256 if configured)
          ServerSideEncryption: 'AES256',
        }),
      );

      this.logger.log(`S3 upload complete: ${key}`);

      return {
        key,
        location: this.buildUrl(key),
        size:     buffer.byteLength,
      };
    } catch (err) {
      this.logger.error(`S3 upload failed for key "${key}"`, err);
      throw new Error(
        `Failed to upload backup to S3: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  /**
   * Downloads a backup from S3 and returns it as a Buffer.
   */
  async downloadBackup(key: string): Promise<Buffer> {
    this.logger.log(`Downloading backup from S3: ${key}`);

    try {
      const response = await this.client.send(
        new GetObjectCommand({ Bucket: this.bucket, Key: key }),
      );

      if (!response.Body) {
        throw new Error(`S3 response body is empty for key: ${key}`);
      }

      const buffer = await this.streamToBuffer(response.Body as Readable);
      this.logger.log(`S3 download complete: ${key} (${buffer.byteLength} bytes)`);
      return buffer;
    } catch (err) {
      this.logger.error(`S3 download failed for key "${key}"`, err);
      throw new Error(
        `Failed to download backup from S3: ${err instanceof Error ? err.message : String(err)}`,
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
   * Returns true if the object exists in S3, false otherwise.
   */
  async verifyBackupExists(key: string): Promise<boolean> {
    try {
      await this.client.send(
        new HeadObjectCommand({ Bucket: this.bucket, Key: key }),
      );
      return true;
    } catch (err: any) {
      // HeadObject throws NotFound / 404 when the object doesn't exist
      if (err?.name === 'NotFound' || err?.$metadata?.httpStatusCode === 404) {
        return false;
      }
      this.logger.error(`S3 HeadObject failed for key "${key}"`, err);
      throw new Error(
        `Failed to check S3 object existence: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }
}
