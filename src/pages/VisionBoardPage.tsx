import React, { useState, useEffect, useCallback } from 'react';
import { Sparkles, Plus, Image as ImageIcon, Trash2, X } from 'lucide-react';
import { useChallenge } from '../context/ChallengeContext';
import { api } from '../services/api';
import { VisionBoardItem } from '../types/database';

export const VisionBoardPage: React.FC = () => {
  const { activeChallenge } = useChallenge();
  const [items, setItems] = useState<VisionBoardItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [category, setCategory] = useState('Aesthetic');

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

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageUrl.trim()) return;

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

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-serif-title text-[#29272B]">
            Vision Board & Aesthetic Aspirations
          </h1>
          <p className="text-xs text-[#77727B]">
            Curate visual affirmations, dream lifestyle anchors, and aesthetic inspirations.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 rounded-xl bg-[#29272B] hover:bg-[#3E3B40] text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" /> Add Vision Pin
        </button>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium border whitespace-nowrap transition-all ${
              selectedCategory === cat
                ? 'bg-[#C9879B] text-white border-[#C9879B] shadow-xs'
                : 'bg-white text-[#29272B] border-[#E8E2D9] hover:bg-[#F2DDE3]/50'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Masonry / Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            className="group rounded-3xl bg-white border border-[#E8E2D9] overflow-hidden shadow-xs hover:shadow-medium transition-all flex flex-col"
          >
            <div className="relative h-64 w-full overflow-hidden bg-[#FAF7F2]">
              <img
                src={item.image_url}
                alt={item.caption || 'Vision'}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                loading="lazy"
              />
              <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handleDeleteItem(item.id)}
                  className="p-1.5 rounded-full bg-white/90 text-red-600 shadow-xs hover:bg-white transition-all"
                  title="Remove pin"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="absolute top-3 left-3">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/90 text-[#29272B] shadow-xs">
                  {item.category}
                </span>
              </div>
            </div>

            {item.caption && (
              <div className="p-4 bg-white border-t border-[#FAF7F2]">
                <p className="text-xs font-serif-title italic text-[#29272B] leading-relaxed">
                  "{item.caption}"
                </p>
              </div>
            )}
          </div>
        ))}

        {filteredItems.length === 0 && (
          <div className="col-span-full py-16 text-center bg-white rounded-3xl border border-[#E8E2D9] text-xs text-[#77727B]">
            No vision board pins in this category yet. Click "Add Vision Pin" to upload your dream life anchors!
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#29272B]/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl border border-[#E8E2D9] shadow-medium w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
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
              <div>
                <label className="block text-xs font-semibold text-[#29272B] mb-1">
                  Image URL * (Unsplash or direct image link)
                </label>
                <input
                  type="url"
                  required
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/photo-..."
                  className="w-full px-3.5 py-2 rounded-xl border border-[#E8E2D9] text-xs focus:outline-hidden focus:border-[#C9879B]"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#29272B] mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#E8E2D9] text-xs"
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
                  placeholder="e.g. Radiating calm, magnetic assurance and poise."
                  className="w-full px-3.5 py-2 rounded-xl border border-[#E8E2D9] text-xs focus:outline-hidden focus:border-[#C9879B]"
                />
              </div>

              <div className="pt-4 border-t border-[#E8E2D9] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-[#77727B]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#29272B] hover:bg-[#3E3B40] text-white text-xs font-semibold shadow-xs"
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
