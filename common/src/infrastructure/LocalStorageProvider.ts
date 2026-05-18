import * as fs from 'fs';
import * as path from 'path';
import { IStorageProvider } from '../core/interfaces/IStorageProvider';
import { ILogger } from '../core/interfaces/ILogger';

/**
 * A local filesystem implementation of IStorageProvider for development.
 * Mimics bucket behavior by using a base directory.
 */
export class LocalStorageProvider implements IStorageProvider {
    private baseDir: string;

    constructor(baseDir: string, private logger?: ILogger) {
        this.baseDir = path.resolve(baseDir);
        if (!fs.existsSync(this.baseDir)) {
            fs.mkdirSync(this.baseDir, { recursive: true });
        }
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
            const targetPath = path.join(this.baseDir, destinationPath);
            const targetDir = path.dirname(targetPath);

            if (!fs.existsSync(targetDir)) {
                fs.mkdirSync(targetDir, { recursive: true });
            }

            fs.copyFileSync(localPath, targetPath);
            const localUri = `gs://local-bucket/${destinationPath}`; // Mimic GCS URI
            this.logInfo(`[LocalStorageProvider] Copied ${localPath} to ${targetPath}`);
            return localUri;
        } catch (error) {
            this.logError(`[LocalStorageProvider] Error copying ${localPath} to ${destinationPath}:`, error);
            throw error;
        }
    }

    async downloadFile(remotePath: string, localPath: string): Promise<void> {
        try {
            const sourcePath = path.join(this.baseDir, remotePath);
            const targetDir = path.dirname(localPath);

            if (!fs.existsSync(targetDir)) {
                fs.mkdirSync(targetDir, { recursive: true });
            }

            fs.copyFileSync(sourcePath, localPath);
            this.logInfo(`[LocalStorageProvider] Copied ${sourcePath} to ${localPath}`);
        } catch (error) {
            this.logError(`[LocalStorageProvider] Error copying ${remotePath} to ${localPath}:`, error);
            throw error;
        }
    }

    async deleteFile(remotePath: string): Promise<void> {
        try {
            const filePath = path.join(this.baseDir, remotePath);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
                this.logInfo(`[LocalStorageProvider] Deleted ${filePath}`);
            }
        } catch (error) {
            this.logError(`[LocalStorageProvider] Error deleting ${remotePath}:`, error);
            throw error;
        }
    }

    async exists(remotePath: string): Promise<boolean> {
        try {
            const filePath = path.join(this.baseDir, remotePath);
            return fs.existsSync(filePath);
        } catch (error) {
            this.logError(`[LocalStorageProvider] Error checking existence of ${remotePath}:`, error);
            return false;
        }
    }

    async getSignedUrl(remotePath: string, expiresInSeconds: number = 3600): Promise<string> {
        // For local dev, just return the path or a mock URL
        const filePath = path.join(this.baseDir, remotePath);
        return `file://${filePath}`;
    }

    async getResumableUploadUrl(destinationPath: string, contentType: string): Promise<string> {
        // For local development, we point to our own API which will mock the resumable behavior
        const apiBaseUrl = process.env.API_URL || 'http://localhost:3000';
        return `${apiBaseUrl}/games/upload/local-mock-session?path=${encodeURIComponent(destinationPath)}`;
    }
}
