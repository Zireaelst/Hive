export interface WalrusFileInfo {
  blobId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  endEpoch: number;
}

class WalrusService {
  private publisherUrl = 'https://publisher.walrus-testnet.walrus.space';
  private aggregatorUrl = 'https://aggregator.walrus-testnet.walrus.space';
  private epochs = 3; // Store for 3 epochs

  async uploadFile(file: File, recipientAddress?: string): Promise<WalrusFileInfo> {
    try {
      // Check file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        throw new Error('File size must be less than 10MB');
      }

      // Prepare the upload URL
      let uploadUrl = `${this.publisherUrl}/v1/blobs?epochs=${this.epochs}`;
      if (recipientAddress) {
        uploadUrl += `&send_object_to=${recipientAddress}`;
      }

      // Upload file to Walrus
      const response = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
      }

      const storageInfo = await response.json();
      
      // Extract blob ID and end epoch from response
      let blobId: string;
      let endEpoch: number;

      if ('alreadyCertified' in storageInfo) {
        blobId = storageInfo.alreadyCertified.blobId;
        endEpoch = storageInfo.alreadyCertified.endEpoch;
      } else if ('newlyCreated' in storageInfo) {
        blobId = storageInfo.newlyCreated.blobObject.blobId;
        endEpoch = storageInfo.newlyCreated.blobObject.storage.endEpoch;
      } else {
        throw new Error('Unexpected response format from Walrus');
      }

      return {
        blobId,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        endEpoch,
      };
    } catch (error) {
      console.error('Walrus upload error:', error);
      throw error;
    }
  }

  async downloadFile(blobId: string): Promise<Blob> {
    try {
      const response = await fetch(`${this.aggregatorUrl}/v1/blobs/${blobId}`);
      
      if (!response.ok) {
        throw new Error(`Download failed: ${response.status} ${response.statusText}`);
      }

      return await response.blob();
    } catch (error) {
      console.error('Walrus download error:', error);
      throw error;
    }
  }

  getFileUrl(blobId: string): string {
    return `${this.aggregatorUrl}/v1/blobs/${blobId}`;
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  isImageFile(fileName: string): boolean {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg'];
    const lowerFileName = fileName.toLowerCase();
    return imageExtensions.some(ext => lowerFileName.endsWith(ext));
  }

  isVideoFile(mimeType: string): boolean {
    return mimeType.startsWith('video/');
  }

  isAudioFile(mimeType: string): boolean {
    return mimeType.startsWith('audio/');
  }
}

export const walrusService = new WalrusService();
