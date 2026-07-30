export interface CompressOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0.0 to 1.0
  mimeType?: string; // 'image/webp', 'image/jpeg', etc.
}

/**
 * Compresses an image file client-side using HTML5 Canvas API.
 * Resizes the image to fit within maxWidth/maxHeight and encodes it at the specified quality.
 */
export const compressImage = (file: File, options: CompressOptions = {}): Promise<File> => {
  const {
    maxWidth = 1600,
    maxHeight = 1600,
    quality = 0.8,
    mimeType = 'image/webp' // webp has superior compression and handles alpha transparency
  } = options;

  // Only attempt to compress images
  if (!file.type.startsWith('image/')) {
    return Promise.resolve(file);
  }

  // Do not compress SVG or animated GIF as canvas rendering will lose their vectors/animations
  if (file.type === 'image/gif' || file.type === 'image/svg+xml') {
    return Promise.resolve(file);
  }

  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    
    img.src = objectUrl;
    
    img.onload = () => {
      // Clean up the object URL to prevent memory leaks
      URL.revokeObjectURL(objectUrl);

      let width = img.width;
      let height = img.height;

      // Determine dimensions maintaining aspect ratio
      if (width > maxWidth || height > maxHeight) {
        if (width > height) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        } else {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(file);
        return;
      }

      // Draw image onto the canvas
      ctx.drawImage(img, 0, 0, width, height);

      // Export canvas drawing back to blob
      // WebP is optimal. For PNG, if transparency is needed, canvas.toBlob on image/webp preserves it.
      // We fall back to original mime type if there are issues.
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(file);
            return;
          }

          // If the compressed image file is somehow larger than the original, keep original
          if (blob.size >= file.size) {
            resolve(file);
            return;
          }

          // Generate file extension matching output MIME type
          const dotIndex = file.name.lastIndexOf('.');
          const nameWithoutExt = dotIndex !== -1 ? file.name.substring(0, dotIndex) : file.name;
          const ext = mimeType === 'image/webp' ? '.webp' : (mimeType === 'image/jpeg' ? '.jpg' : '.png');
          
          const compressedFile = new File([blob], `${nameWithoutExt}${ext}`, {
            type: mimeType,
            lastModified: Date.now()
          });

          resolve(compressedFile);
        },
        mimeType,
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(file);
    };
  });
};
