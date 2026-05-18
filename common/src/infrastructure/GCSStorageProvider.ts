import { Storage } from '@google-cloud/storage';
import { IStorageProvider } from '../core/interfaces/IStorageProvider';
import { ILogger } from '../core/interfaces/ILogger';

export class GCSStorageProvider implements IStorageProvider {
    private storage: Storage;
    private bucketName: string;

    constructor(bucketName: string, private logger?: ILogger) {
        this.storage = new Storage();
        this.bucketName = bucketName;
    }

    private logInfo(message: string, ...meta: any[]): void {
        if (this.logger) {
            this.logger.info(message, ...meta);
        } else {
            console.log(message, ...meta);
        }
    }

    private logError(message: string, ...meta: any[]): void {
        if (this.logger) {
            this.logger.error(message, ...meta);
        } else {
            console.error(message, ...meta);
        }
    }

    async uploadFile(localPath: string, destinationPath: string): Promise<string> {
        try {
            await this.storage.bucket(this.bucketName).upload(localPath, {
                destination: destinationPath,
                resumable: true
            });
            const gcsUri = `gs://${this.bucketName}/${destinationPath}`;
            this.logInfo(`[GCSStorageProvider] Uploaded ${localPath} to ${gcsUri}`);
            return gcsUri;
        } catch (error) {
            this.logError(`[GCSStorageProvider] Error uploading ${localPath} to ${destinationPath}:`, error);
            throw error;
        }
    }

    async downloadFile(remotePath: string, localPath: string): Promise<void> {
        try {
            await this.storage.bucket(this.bucketName).file(remotePath).download({
                destination: localPath
            });
            this.logInfo(`[GCSStorageProvider] Downloaded ${remotePath} to ${localPath}`);
        } catch (error) {
            this.logError(`[GCSStorageProvider] Error downloading ${remotePath} to ${localPath}:`, error);
            throw error;
        }
    }

    async deleteFile(remotePath: string): Promise<void> {
        try {
            await this.storage.bucket(this.bucketName).file(remotePath).delete();
            this.logInfo(`[GCSStorageProvider] Deleted ${remotePath}`);
        } catch (error) {
            this.logError(`[GCSStorageProvider] Error deleting ${remotePath}:`, error);
            throw error;
        }
    }

    async exists(remotePath: string): Promise<boolean> {
        try {
            const [exists] = await this.storage.bucket(this.bucketName).file(remotePath).exists();
            return exists;
        } catch (error) {
            this.logError(`[GCSStorageProvider] Error checking existence of ${remotePath}:`, error);
            return false;
        }
    }

    async getSignedUrl(remotePath: string, expiresInSeconds: number = 3600): Promise<string> {
        try {
            const [url] = await this.storage.bucket(this.bucketName).file(remotePath).getSignedUrl({
                version: 'v4',
                action: 'read',
                expires: Date.now() + expiresInSeconds * 1000
            });
            return url;
        } catch (error) {
            this.logError(`[GCSStorageProvider] Error getting signed URL for ${remotePath}:`, error);
            throw error;
        }
    }

    async getResumableUploadUrl(destinationPath: string, contentType: string): Promise<string> {
        try {
            const [url] = await this.storage.bucket(this.bucketName).file(destinationPath).createResumableUpload({
                origin: process.env.FRONTEND_URL || 'http://localhost:3001',
                metadata: {
                    contentType
                }
            });
            this.logInfo(`[GCSStorageProvider] Created resumable upload URL for ${destinationPath}`);
            return url;
        } catch (error) {
            this.logError(`[GCSStorageProvider] Error creating resumable upload URL for ${destinationPath}:`, error);
            throw error;
        }
    }
}
