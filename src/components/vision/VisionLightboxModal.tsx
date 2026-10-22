import React, { useEffect, useState } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Download,
  Trash2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Sparkles,
} from 'lucide-react';
import { VisionBoardItem } from '../../types/database';

interface VisionLightboxModalProps {
  item: VisionBoardItem | null;
  isOpen: boolean;
  onClose: () => void;
  onDelete: (id: string) => void;
  onPrev?: () => void;
  onNext?: () => void;
  hasPrev?: boolean;
  hasNext?: boolean;
}

export const VisionLightboxModal: React.FC<VisionLightboxModalProps> = ({
  item,
  isOpen,
  onClose,
  onDelete,
  onPrev,
  onNext,
  hasPrev = false,
  hasNext = false,
}) => {
  const [isZoomed, setIsZoomed] = useState(false);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && onPrev && hasPrev) onPrev();
      if (e.key === 'ArrowRight' && onNext && hasNext) onNext();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, onPrev, onNext, hasPrev, hasNext]);

  // Reset zoom on item switch
  useEffect(() => {
    setIsZoomed(false);
  }, [item?.id]);

  if (!isOpen || !item) return null;

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = item.image_url;
    link.download = `glowup-vision-${item.id}.jpg`;
    link.target = '_blank';
    link.rel = 'noreferrer';
    link.click();
  };

  const handleDelete = () => {
    if (window.confirm('Remove this vision pin from your board?')) {
      onDelete(item.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-[#29272B]/85 backdrop-blur-md animate-in fade-in duration-200">
      {/* Backdrop */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Main Container */}
      <div className="relative z-10 w-full max-w-5xl flex flex-col max-h-[95vh] rounded-3xl bg-[#FAF7F2] border border-[#E8E2D9] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Top Header Bar */}
        <div className="px-5 py-3.5 bg-white border-b border-[#E8E2D9] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="text-xs uppercase font-bold tracking-wider px-3 py-1 rounded-full bg-[#F2DDE3] text-[#7C3A4D] shrink-0">
              {item.category}
            </span>
            {item.caption && (
              <p className="text-sm font-serif-title italic text-[#29272B] truncate hidden sm:block">
                "{item.caption}"
              </p>
            )}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Zoom toggle button */}
            <button
              onClick={() => setIsZoomed(!isZoomed)}
              className="p-2 rounded-xl text-[#77727B] hover:text-[#29272B] hover:bg-[#FAF7F2] transition-colors"
              title={isZoomed ? 'Zoom Out' : 'Zoom In'}
            >
              {isZoomed ? <ZoomOut className="w-4 h-4" /> : <ZoomIn className="w-4 h-4" />}
            </button>

            {/* Download */}
            <button
              onClick={handleDownload}
              className="p-2 rounded-xl text-[#77727B] hover:text-[#29272B] hover:bg-[#FAF7F2] transition-colors"
              title="Open / Download Photo"
            >
              <Download className="w-4 h-4" />
            </button>

            {/* Delete Pin */}
            <button
              onClick={handleDelete}
              className="p-2 rounded-xl text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors"
              title="Remove Pin"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            {/* Close */}
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-[#77727B] hover:text-[#29272B] hover:bg-[#FAF7F2] transition-colors ml-1"
              title="Close (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Center Image Display */}
        <div className="relative flex-1 bg-[#1A181C] flex items-center justify-center p-2 sm:p-4 overflow-auto min-h-[350px] max-h-[75vh]">
          {/* Navigation Chevron Left */}
          {hasPrev && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onPrev?.();
              }}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-2.5 rounded-full bg-black/50 hover:bg-black/75 text-white backdrop-blur-xs transition-all shadow-lg"
              title="Previous Photo (Left Arrow)"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}

          {/* Full Image */}
          <div
            className={`transition-all duration-300 flex items-center justify-center ${
              isZoomed ? 'scale-125 cursor-zoom-out' : 'cursor-zoom-in'
            }`}
            onClick={() => setIsZoomed(!isZoomed)}
          >
            <img
              src={item.image_url}
              alt={item.caption || 'Vision Pin'}
              className="max-h-[72vh] w-auto max-w-full object-contain rounded-xl shadow-2xl select-none"
            />
          </div>

          {/* Navigation Chevron Right */}
          {hasNext && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onNext?.();
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-2.5 rounded-full bg-black/50 hover:bg-black/75 text-white backdrop-blur-xs transition-all shadow-lg"
              title="Next Photo (Right Arrow)"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          )}
        </div>

        {/* Bottom Caption & Affirmation Bar */}
        <div className="px-6 py-4 bg-white border-t border-[#E8E2D9] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="space-y-0.5">
            {item.caption ? (
              <p className="text-base font-serif-title font-semibold text-[#29272B] leading-relaxed">
                "{item.caption}"
              </p>
            ) : (
              <p className="text-sm text-[#77727B] italic">Visual Affirmation Anchor</p>
            )}
            <p className="text-xs text-[#77727B] flex items-center gap-1.5 pt-0.5">
              <Sparkles className="w-3.5 h-3.5 text-[#C9879B]" /> Click image to toggle zoom • Use arrow keys to navigate
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-[#77727B] shrink-0">
            <span className="bg-[#FAF7F2] px-3 py-1 rounded-lg border border-[#E8E2D9]">
              Full Resolution View
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
