'use client';

/**
 * ============================================================================
 * IMAGE UPLOAD COMPONENT
 * ============================================================================
 * A reusable image upload component that allows admin to:
 * - Upload images directly from their device
 * - Preview images before upload
 * - Drag and drop support
 * - Falls back to URL input if needed
 * ============================================================================
 */

import { useState, useRef, useCallback } from 'react';
import { Upload, X, Image as ImageIcon, Link, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  onUpload?: (file: File) => Promise<string>;
}

export default function ImageUpload({ value, onChange, onUpload }: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMode, setUploadMode] = useState<'upload' | 'url'>('upload');
  const [preview, setPreview] = useState<string | null>(value || null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(async (file: File) => {
    setError(null);
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload if handler provided
    if (onUpload) {
      setIsUploading(true);
      try {
        const url = await onUpload(file);
        onChange(url);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Upload failed');
        setPreview(null);
      } finally {
        setIsUploading(false);
      }
    } else {
      // Convert to base64 data URL as fallback
      const dataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
      onChange(dataUrl);
    }
  }, [onChange, onUpload]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  const handleUrlChange = useCallback((url: string) => {
    onChange(url);
    setPreview(url || null);
    setError(null);
  }, [onChange]);

  const handleRemove = useCallback(() => {
    onChange('');
    setPreview(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [onChange]);

  return (
    <div className="space-y-3">
      {/* Mode Toggle */}
      <div className="flex gap-2">
        <Button
          type="button"
          variant={uploadMode === 'upload' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setUploadMode('upload')}
          className="gap-2"
        >
          <Upload className="w-4 h-4" />
          Upload
        </Button>
        <Button
          type="button"
          variant={uploadMode === 'url' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setUploadMode('url')}
          className="gap-2"
        >
          <Link className="w-4 h-4" />
          URL
        </Button>
      </div>

      {uploadMode === 'upload' ? (
        <>
          {/* Upload Area */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`
              relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
              transition-all duration-200
              ${isDragging 
                ? 'border-green-500 bg-green-50 dark:bg-green-900/20' 
                : 'border-gray-300 dark:border-gray-600 hover:border-green-400 hover:bg-gray-50 dark:hover:bg-gray-800'
              }
              ${isUploading ? 'pointer-events-none opacity-60' : ''}
            `}
          >
            {isUploading ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="w-8 h-8 animate-spin text-green-500" />
                <span className="text-sm text-gray-500">Uploading...</span>
              </div>
            ) : preview ? (
              <div className="relative">
                <img
                  src={preview}
                  alt="Preview"
                  className="max-h-40 mx-auto rounded-lg object-contain"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute -top-2 -right-2 w-6 h-6"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemove();
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <ImageIcon className="w-10 h-10 text-gray-400" />
                <div>
                  <span className="text-sm font-medium text-green-600 dark:text-green-400">
                    Click to upload
                  </span>
                  <span className="text-sm text-gray-500"> or drag and drop</span>
                </div>
                <span className="text-xs text-gray-400">PNG, JPG, GIF up to 5MB</span>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleInputChange}
              className="hidden"
            />
          </div>
        </>
      ) : (
        <>
          {/* URL Input */}
          <Input
            value={value}
            onChange={(e) => handleUrlChange(e.target.value)}
            placeholder="https://example.com/image.jpg"
          />
          {value && (
            <div className="relative mt-2">
              <img
                src={value}
                alt="Preview"
                className="max-h-40 rounded-lg object-contain"
                onError={() => setError('Failed to load image from URL')}
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 w-6 h-6"
                onClick={handleRemove}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}
        </>
      )}

      {/* Error Message */}
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
    </div>
  );
}
