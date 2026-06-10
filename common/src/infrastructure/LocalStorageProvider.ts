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

            // OPTIMIZATION: Use hard link if possible to save space
            try {
                if (fs.existsSync(targetPath)) fs.unlinkSync(targetPath);
                fs.linkSync(localPath, targetPath);
                this.logInfo(`[LocalStorageProvider] Created hard link from ${localPath} to ${targetPath}`);
            } catch (linkErr) {
                fs.copyFileSync(localPath, targetPath);
                this.logInfo(`[LocalStorageProvider] Copied ${localPath} to ${targetPath} (hard link failed)`);
            }

            const localUri = `gs://local-bucket/${destinationPath}`; // Mimic GCS URI
            return localUri;
        } catch (error) {
            this.logError(`[LocalStorageProvider] Error uploading ${localPath} to ${destinationPath}:`, error);
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

            // OPTIMIZATION: Use hard link if possible to save space
            try {
                if (fs.existsSync(localPath)) fs.unlinkSync(localPath);
                fs.linkSync(sourcePath, localPath);
                this.logInfo(`[LocalStorageProvider] Created hard link from ${sourcePath} to ${localPath}`);
            } catch (linkErr) {
                fs.copyFileSync(sourcePath, localPath);
                this.logInfo(`[LocalStorageProvider] Copied ${sourcePath} to ${localPath} (hard link failed)`);
            }
        } catch (error) {
            this.logError(`[LocalStorageProvider] Error downloading ${remotePath} to ${localPath}:`, error);
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

    async deleteFilesByPrefix(prefix: string): Promise<void> {
        try {
            const dirToDelete = path.join(this.baseDir, prefix);
            if (fs.existsSync(dirToDelete) && fs.lstatSync(dirToDelete).isDirectory()) {
                fs.rmSync(dirToDelete, { recursive: true, force: true });
                this.logInfo(`[LocalStorageProvider] Deleted directory ${dirToDelete}`);
            } else {
                // If it's just a file prefix and not a directory, we could glob it,
                // but for our use case (videos/{gameId}/), it's usually a directory.
                this.logInfo(`[LocalStorageProvider] No directory found for prefix ${prefix}`);
            }
        } catch (error) {
            this.logError(`[LocalStorageProvider] Error deleting files with prefix ${prefix}:`, error);
            throw error;
        }
    }
}
