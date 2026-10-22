import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Sparkles,
  Plus,
  Image as ImageIcon,
  Trash2,
  X,
  Maximize2,
  Eye,
  Upload,
  Link,
  Layers,
  ZoomIn,
} from 'lucide-react';
import { useChallenge } from '../context/ChallengeContext';
import { api } from '../services/api';
import { VisionBoardItem } from '../types/database';
import { VisionLightboxModal } from '../components/vision/VisionLightboxModal';

export const VisionBoardPage: React.FC = () => {
  const { activeChallenge } = useChallenge();
  const [items, setItems] = useState<VisionBoardItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [fitMode, setFitMode] = useState<'cover' | 'contain'>('cover');

  // Lightbox State
  const [activeItemIndex, setActiveItemIndex] = useState<number | null>(null);

  // Add Pin Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [addMode, setAddMode] = useState<'url' | 'file'>('url');
  const [imageUrl, setImageUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [category, setCategory] = useState('Aesthetic');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const loadVisionBoard = useCallback(async () => {
    try {
      const data = await api.getVisionBoard(activeChallenge?.id);
      setItems(data);
    } catch (err) {
      console.error('Failed to load vision board:', err);
    }
  }, [activeChallenge]);

  useEffect(() => {
    loadVisionBoard();
  }, [loadVisionBoard]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (PNG, JPG, WebP, etc.)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        setImageUrl(event.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageUrl.trim()) {
      alert('Please provide an image URL or choose a photo file to upload.');
      return;
    }

    await api.createVisionBoardItem({
      user_id: activeChallenge?.user_id || 'demo-user-001',
      challenge_id: activeChallenge?.id || null,
      image_url: imageUrl.trim(),
      caption: caption.trim() || undefined,
      category,
      display_order: items.length + 1,
    });

    setIsModalOpen(false);
    setImageUrl('');
    setCaption('');
    await loadVisionBoard();
  };

  const handleDeleteItem = async (id: string) => {
    await api.deleteVisionBoardItem(id);
    await loadVisionBoard();
  };

  const categories = ['All', 'Aesthetic', 'Physical', 'Mindset', 'Inspiration'];

  const filteredItems = items.filter(
    (i) => selectedCategory === 'All' || i.category.toLowerCase() === selectedCategory.toLowerCase()
  );

  const activeItem = activeItemIndex !== null ? filteredItems[activeItemIndex] || null : null;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-serif-title text-[#29272B]">
            Vision Board & Aesthetic Aspirations
          </h1>
          <p className="text-sm text-[#77727B] mt-1">
            Curate visual affirmations, dream lifestyle anchors, and high-resolution aesthetic inspirations.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-5 py-2.5 rounded-xl bg-[#29272B] hover:bg-[#3E3B40] text-white text-sm font-semibold shadow-xs flex items-center gap-2 transition-colors self-start sm:self-auto shrink-0"
        >
          <Plus className="w-4 h-4" /> Add Vision Pin
        </button>
      </div>

      {/* Toolbar: Category Pills & Image Fit Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold border whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-[#C9879B] text-white border-[#C9879B] shadow-xs'
                  : 'bg-white text-[#29272B] border-[#E8E2D9] hover:bg-[#F2DDE3]/50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Display controls */}
        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
          <span className="text-xs text-[#77727B] font-medium hidden md:inline">Photo Display:</span>
          <div className="bg-white border border-[#E8E2D9] rounded-xl p-1 flex items-center gap-1 shadow-2xs">
            <button
              onClick={() => setFitMode('cover')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                fitMode === 'cover'
                  ? 'bg-[#29272B] text-white shadow-xs'
                  : 'text-[#77727B] hover:text-[#29272B]'
              }`}
              title="Crop to fill cards uniformly"
            >
              Fill Cards
            </button>
            <button
              onClick={() => setFitMode('contain')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                fitMode === 'contain'
                  ? 'bg-[#29272B] text-white shadow-xs'
                  : 'text-[#77727B] hover:text-[#29272B]'
              }`}
              title="Show entire uncropped photo"
            >
              Full Image
            </button>
          </div>
        </div>
      </div>

      {/* Spacious Pins Grid (Increased Heights & Click to View) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.map((item, idx) => (
          <div
            key={item.id}
            onClick={() => setActiveItemIndex(idx)}
            className="group cursor-pointer rounded-3xl bg-white border border-[#E8E2D9] overflow-hidden shadow-xs hover:shadow-medium hover:border-[#C9879B]/50 transition-all flex flex-col"
          >
            {/* Enlarged Photo Container */}
            <div className="relative h-80 sm:h-96 w-full overflow-hidden bg-[#FAF7F2] flex items-center justify-center">
              <img
                src={item.image_url}
                alt={item.caption || 'Vision Pin'}
                className={`w-full h-full transition-transform duration-500 group-hover:scale-105 ${
                  fitMode === 'contain' ? 'object-contain p-2' : 'object-cover'
                }`}
                loading="lazy"
              />

              {/* Hover Overlay with Click to View action */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-4 pointer-events-none">
                <div className="flex items-center justify-between pointer-events-auto">
                  <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-white/95 text-[#29272B] shadow-xs">
                    {item.category}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm('Delete this pin?')) {
                        handleDeleteItem(item.id);
                      }
                    }}
                    className="p-2 rounded-full bg-white/90 text-red-600 shadow-xs hover:bg-white hover:scale-110 transition-all"
                    title="Remove pin"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center justify-center">
                  <span className="px-3.5 py-2 rounded-xl bg-white/90 text-[#29272B] font-semibold text-xs flex items-center gap-1.5 shadow-md backdrop-blur-xs">
                    <Maximize2 className="w-3.5 h-3.5 text-[#C9879B]" /> Click to View Full Photo
                  </span>
                </div>

                <div className="text-right pointer-events-none">
                  <span className="text-[11px] text-white/90 font-medium">Click photo to zoom</span>
                </div>
              </div>

              {/* Persistent Badge (when not hovering) */}
              <div className="absolute top-3 left-3 group-hover:opacity-0 transition-opacity">
                <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-white/90 text-[#29272B] shadow-xs">
                  {item.category}
                </span>
              </div>
            </div>

            {/* Caption */}
            {item.caption && (
              <div className="p-4 bg-white border-t border-[#FAF7F2] flex items-center justify-between gap-2">
                <p className="text-sm font-serif-title italic text-[#29272B] leading-relaxed line-clamp-2">
                  "{item.caption}"
                </p>
                <Maximize2 className="w-4 h-4 text-[#77727B] opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
              </div>
            )}
          </div>
        ))}

        {filteredItems.length === 0 && (
          <div className="col-span-full py-20 text-center bg-white rounded-3xl border border-[#E8E2D9] p-8 space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-[#F2DDE3] text-[#C9879B] mx-auto flex items-center justify-center shadow-xs">
              <ImageIcon className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold font-serif-title text-[#29272B]">
              No Vision Pins in this category
            </h3>
            <p className="text-sm text-[#77727B] max-w-sm mx-auto">
              Add photographs of your dream habits, fitness aspirations, travel retreats, or aesthetic goals.
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-5 py-2.5 rounded-xl bg-[#29272B] text-white text-xs font-semibold hover:bg-[#3E3B40] transition-colors inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Add Your First Pin
            </button>
          </div>
        )}
      </div>

      {/* Lightbox Full Photo Modal */}
      <VisionLightboxModal
        item={activeItem}
        isOpen={activeItemIndex !== null}
        onClose={() => setActiveItemIndex(null)}
        onDelete={(id) => {
          handleDeleteItem(id);
          setActiveItemIndex(null);
        }}
        onPrev={() => {
          if (activeItemIndex !== null && activeItemIndex > 0) {
            setActiveItemIndex(activeItemIndex - 1);
          }
        }}
        onNext={() => {
          if (activeItemIndex !== null && activeItemIndex < filteredItems.length - 1) {
            setActiveItemIndex(activeItemIndex + 1);
          }
        }}
        hasPrev={activeItemIndex !== null && activeItemIndex > 0}
        hasNext={activeItemIndex !== null && activeItemIndex < filteredItems.length - 1}
      />

      {/* Add Pin Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#29272B]/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-[#E8E2D9] shadow-medium w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-[#E8E2D9] flex items-center justify-between bg-[#FAF7F2]/50">
              <h2 className="text-base font-bold text-[#29272B] font-serif-title flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#C9879B]" /> Pin to Vision Board
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-[#77727B] hover:text-[#29272B] rounded-xl hover:bg-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddItem} className="p-6 space-y-4">
              {/* Method Tabs: Link vs Upload */}
              <div className="flex rounded-xl bg-[#FAF7F2] p-1 border border-[#E8E2D9]">
                <button
                  type="button"
                  onClick={() => setAddMode('url')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                    addMode === 'url'
                      ? 'bg-white text-[#29272B] shadow-xs'
                      : 'text-[#77727B] hover:text-[#29272B]'
                  }`}
                >
                  <Link className="w-3.5 h-3.5" /> Paste Image Link
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAddMode('file');
                    setTimeout(() => fileInputRef.current?.click(), 50);
                  }}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                    addMode === 'file'
                      ? 'bg-white text-[#29272B] shadow-xs'
                      : 'text-[#77727B] hover:text-[#29272B]'
                  }`}
                >
                  <Upload className="w-3.5 h-3.5" /> Upload Photo File
                </button>
              </div>

              {addMode === 'url' ? (
                <div>
                  <label className="block text-xs font-semibold text-[#29272B] mb-1">
                    Image URL * (Unsplash or direct image web link)
                  </label>
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/photo-..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E2D9] text-sm focus:outline-hidden focus:border-[#C9879B]"
                    autoFocus
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-[#29272B] mb-1">
                    Choose Photo from Computer
                  </label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="w-full px-3.5 py-2 rounded-xl border border-[#E8E2D9] text-xs file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#F2DDE3] file:text-[#7C3A4D] hover:file:bg-[#C9879B] hover:file:text-white"
                  />
                </div>
              )}

              {/* Preview if image URL exists */}
              {imageUrl && (
                <div className="relative h-44 w-full rounded-2xl overflow-hidden bg-[#FAF7F2] border border-[#E8E2D9]">
                  <img
                    src={imageUrl}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute bottom-2 left-2 text-[10px] font-bold bg-black/60 text-white px-2 py-0.5 rounded-md">
                    Preview
                  </span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#29272B] mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-[#E8E2D9] text-xs font-medium"
                  >
                    <option value="Aesthetic">Aesthetic</option>
                    <option value="Physical">Physical & Wellness</option>
                    <option value="Mindset">Mindset & Peace</option>
                    <option value="Inspiration">Inspiration & Lifestyle</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#29272B] mb-1">Affirmation / Caption</label>
                  <input
                    type="text"
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="e.g. Calm, radiant and poised."
                    className="w-full px-3.5 py-2 rounded-xl border border-[#E8E2D9] text-xs focus:outline-hidden focus:border-[#C9879B]"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-[#E8E2D9] flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#77727B] hover:text-[#29272B]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!imageUrl.trim()}
                  className="px-5 py-2.5 rounded-xl bg-[#29272B] hover:bg-[#3E3B40] text-white text-xs font-semibold shadow-xs disabled:opacity-50 transition-colors"
                >
                  Pin to Board
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
