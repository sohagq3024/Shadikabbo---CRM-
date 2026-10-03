import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  Download,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCw,
  RotateCcw,
  Maximize2,
  Check,
  Image as ImageIcon,
} from 'lucide-react';

export interface ImageLightboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  images: string[];
  initialIndex?: number;
  title?: string;
  candidateId?: string;
}

/**
 * Robust helper function to download any image (base64 Data URL or remote URL)
 * with a clean, identifiable filename.
 */
export const downloadCandidateImage = async (
  imageUrl: string,
  candidateName?: string,
  candidateId?: string,
  index: number = 0
) => {
  if (!imageUrl) return;

  const cleanName = (candidateName || 'candidate')
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '_')
    .replace(/_+/g, '_');
  const cleanId = (candidateId || 'photo')
    .toUpperCase()
    .replace(/[^A-Z0-9_-]/g, '_');

  // Determine file extension
  let ext = 'jpg';
  if (imageUrl.startsWith('data:image/')) {
    const mime = imageUrl.split(';')[0].split(':')[1] || '';
    if (mime.includes('png')) ext = 'png';
    else if (mime.includes('webp')) ext = 'webp';
    else if (mime.includes('gif')) ext = 'gif';
    else ext = 'jpg';
  } else {
    const urlWithoutQuery = imageUrl.split('?')[0];
    const match = urlWithoutQuery.match(/\.([a-zA-Z0-9]+)$/);
    if (match && match[1]) {
      ext = match[1].toLowerCase();
    }
  }

  const filename = `${cleanName}_${cleanId}_photo_${index + 1}.${ext}`;

  try {
    if (imageUrl.startsWith('data:')) {
      // Base64 Data URL -> instant client download
      const a = document.createElement('a');
      a.href = imageUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return;
    }

    // Remote or relative URL -> fetch as Blob to bypass browser cross-origin download restrictions
    const response = await fetch(imageUrl, { mode: 'cors' });
    if (!response.ok) throw new Error('Network error');
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    setTimeout(() => {
      URL.revokeObjectURL(blobUrl);
    }, 1500);
  } catch (err) {
    console.warn('Fallback direct download triggered', err);
    // Fallback: create anchor
    const a = document.createElement('a');
    a.href = imageUrl;
    a.download = filename;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
};

export const ImageLightboxModal: React.FC<ImageLightboxModalProps> = ({
  isOpen,
  onClose,
  images,
  initialIndex = 0,
  title = 'Candidate Photos',
  candidateId = '',
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // Sync index when initialIndex changes or modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(Math.max(0, Math.min(initialIndex, (images?.length || 1) - 1)));
      setZoomLevel(1);
      setRotation(0);
      setDownloadSuccess(false);
    }
  }, [isOpen, initialIndex, images]);

  // Keyboard navigation (ArrowLeft, ArrowRight, Escape)
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      }
    },
    [isOpen, images, currentIndex, onClose]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (!isOpen || !images || images.length === 0) return null;

  const currentImage = images[currentIndex] || images[0];

  const handleNext = () => {
    setZoomLevel(1);
    setRotation(0);
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  };

  const handlePrev = () => {
    setZoomLevel(1);
    setRotation(0);
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  };

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - 0.25, 0.5));
  };

  const handleResetZoom = () => {
    setZoomLevel(1);
    setRotation(0);
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      await downloadCandidateImage(currentImage, title, candidateId, currentIndex);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 2000);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadAll = async () => {
    setIsDownloading(true);
    try {
      for (let i = 0; i < images.length; i++) {
        await downloadCandidateImage(images[i], title, candidateId, i);
        // Small delay between downloads so browser doesn't block multiple files
        await new Promise((resolve) => setTimeout(resolve, 300));
      }
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 2500);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[100] overflow-hidden bg-black/92 backdrop-blur-md flex flex-col justify-between select-none animate-in fade-in duration-200"
    >
      {/* ============================================================
          TOP TOOLBAR: TITLE, COUNTER, ZOOM CONTROLS, DOWNLOAD, CLOSE
      ============================================================ */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 bg-black/60 border-b border-white/10 text-white z-20 shrink-0">
        {/* Candidate Info */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-white/80 shrink-0 border border-white/10">
            <ImageIcon className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-white truncate max-w-[200px] sm:max-w-md">
                {title || 'Candidate Photos'}
              </h2>
              {candidateId && (
                <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#181E54] text-white border border-white/20">
                  {candidateId}
                </span>
              )}
            </div>
            <p className="text-[11px] text-white/60 font-mono">
              Photo {currentIndex + 1} of {images.length}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Zoom Out */}
          <button
            type="button"
            onClick={handleZoomOut}
            title="Zoom Out (-)"
            className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
          >
            <ZoomOut className="w-4 h-4" />
          </button>

          {/* Zoom Percentage */}
          <button
            type="button"
            onClick={handleResetZoom}
            title="Reset Zoom (100%)"
            className="px-2 py-1 text-xs font-mono text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer hidden sm:block"
          >
            {Math.round(zoomLevel * 100)}%
          </button>

          {/* Zoom In */}
          <button
            type="button"
            onClick={handleZoomIn}
            title="Zoom In (+)"
            className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          {/* Rotate */}
          <button
            type="button"
            onClick={handleRotate}
            title="Rotate 90°"
            className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
          >
            <RotateCw className="w-4 h-4" />
          </button>

          {/* Download Single Image */}
          <button
            type="button"
            onClick={handleDownload}
            disabled={isDownloading}
            title="Download this photo"
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all shadow-md cursor-pointer ml-1 ${
              downloadSuccess
                ? 'bg-emerald-600 text-white'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white active:scale-95'
            }`}
          >
            {downloadSuccess ? (
              <>
                <Check className="w-4 h-4" />
                <span className="hidden sm:inline">Downloaded</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Download</span>
              </>
            )}
          </button>

          {/* Download All (if multiple images) */}
          {images.length > 1 && (
            <button
              type="button"
              onClick={handleDownloadAll}
              disabled={isDownloading}
              title="Download all photos of this candidate"
              className="px-3 py-1.5 text-xs font-semibold bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors cursor-pointer hidden md:flex items-center gap-1.5 border border-white/15"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Download All ({images.length})</span>
            </button>
          )}

          {/* Close Modal Button */}
          <button
            type="button"
            onClick={onClose}
            title="Close Full Screen View (Esc)"
            className="p-2 text-white/80 hover:text-white hover:bg-rose-600/80 rounded-lg transition-colors cursor-pointer ml-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* ============================================================
          MAIN CENTER PREVIEW: LARGE IMAGE DISPLAY & NAV BUTTONS
      ============================================================ */}
      <div className="relative flex-1 flex items-center justify-center p-4 overflow-hidden">
        {/* Previous Button */}
        {images.length > 1 && (
          <button
            type="button"
            onClick={handlePrev}
            title="Previous photo (Arrow Left)"
            className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/60 hover:bg-white text-white hover:text-slate-900 border border-white/20 hover:border-white flex items-center justify-center transition-all cursor-pointer z-20 shadow-xl group"
          >
            <ChevronLeft className="w-6 h-6 group-hover:-translate-x-0.5 transition-transform" />
          </button>
        )}

        {/* Display Image with Dynamic Zoom and Rotation */}
        <div
          className="relative max-w-full max-h-full flex items-center justify-center transition-transform duration-200 ease-out"
          style={{
            transform: `scale(${zoomLevel}) rotate(${rotation}deg)`,
          }}
        >
          <img
            src={currentImage}
            alt={`${title} - Photo ${currentIndex + 1}`}
            className="max-h-[75vh] max-w-[88vw] object-contain rounded-xl shadow-2xl border border-white/10"
            referrerPolicy="no-referrer"
          />
        </div>

        {/* Next Button */}
        {images.length > 1 && (
          <button
            type="button"
            onClick={handleNext}
            title="Next photo (Arrow Right)"
            className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/60 hover:bg-white text-white hover:text-slate-900 border border-white/20 hover:border-white flex items-center justify-center transition-all cursor-pointer z-20 shadow-xl group"
          >
            <ChevronRight className="w-6 h-6 group-hover:translate-x-0.5 transition-transform" />
          </button>
        )}
      </div>

      {/* ============================================================
          BOTTOM BAR: THUMBNAILS CAROUSEL STRIP (IF MULTIPLE PHOTOS)
      ============================================================ */}
      {images.length > 1 && (
        <div className="px-4 py-3 bg-black/60 border-t border-white/10 z-20 shrink-0">
          <div className="flex items-center justify-center gap-2 overflow-x-auto max-w-2xl mx-auto py-1 scrollbar-thin">
            {images.map((img, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setZoomLevel(1);
                  setRotation(0);
                  setCurrentIndex(idx);
                }}
                className={`relative w-12 h-12 rounded-lg overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                  currentIndex === idx
                    ? 'border-emerald-500 ring-2 ring-emerald-500/50 scale-105 shadow-md'
                    : 'border-white/20 opacity-60 hover:opacity-100 hover:border-white/50'
                }`}
                title={`Go to photo ${idx + 1}`}
              >
                <img
                  src={img}
                  alt={`Thumbnail ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
                <span className="absolute bottom-0 right-0 bg-black/80 text-[8px] font-mono font-bold text-white px-1 rounded-tl">
                  {idx + 1}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
