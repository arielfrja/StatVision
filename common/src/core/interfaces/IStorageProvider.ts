export interface IStorageProvider {
    /**
     * Uploads a file to the storage bucket.
     * @param localPath The path to the file on the local filesystem.
     * @param destinationPath The path (key) where the file should be stored in the bucket.
     * @returns The public or internal URL/URI of the stored file.
     */
    uploadFile(localPath: string, destinationPath: string): Promise<string>;

    /**
     * Downloads a file from the storage bucket to a local path.
     * @param remotePath The path (key) of the file in the bucket.
     * @param localPath The path where the file should be saved locally.
     */
    downloadFile(remotePath: string, localPath: string): Promise<void>;

    /**
     * Deletes a file from the storage bucket.
     * @param remotePath The path (key) of the file in the bucket.
     */
    deleteFile(remotePath: string): Promise<void>;

    /**
     * Checks if a file exists in the storage bucket.
     * @param remotePath The path (key) of the file in the bucket.
     */
    exists(remotePath: string): Promise<boolean>;

    /**
     * Gets a signed URL for temporary access to a private file.
     * @param remotePath The path (key) of the file in the bucket.
     * @param expiresInSeconds Duration in seconds for which the URL is valid.
     */
    getSignedUrl(remotePath: string, expiresInSeconds?: number): Promise<string>;
}
