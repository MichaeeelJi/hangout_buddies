
import { useState } from 'react';
import { X, Heart, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { CATEGORIES } from '../types';

interface InterestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function InterestModal({ isOpen, onClose }: InterestModalProps) {
  const { user } = useAuth();
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const toggleInterest = (interest: string) => {
    setSelectedInterests(prev => 
      prev.includes(interest)
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
  };

  const handleSave = async () => {
    if (!user) {
      alert('Please login to save interests');
      return;
    }

    setLoading(true);
    try {
      // 1. Get current tags
      const { data: profile } = await supabase
        .from('profiles')
        .select('tags')
        .eq('id', user.id)
        .single();

      const currentTags = profile?.tags || [];
      
      // 2. Merge new interests with existing tags (avoid duplicates)
      const newTags = Array.from(new Set([...currentTags, ...selectedInterests]));

      // 3. Update profile
      const { error } = await supabase
        .from('profiles')
        .update({ tags: newTags })
        .eq('id', user.id);

      if (error) throw error;
      
      onClose();
      // Optional: Trigger a refresh or show success message
      alert('Interests updated successfully!');
    } catch (err) {
      console.error('Error saving interests:', err);
      alert('Failed to save interests');
    } finally {
      setLoading(false);
    }
  };

  // Filter out 'All' from categories for selection
  const interestOptions = CATEGORIES.filter(c => c !== 'All');

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} aria-hidden="true"></div>
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                Tell us your interests
              </h3>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <p className="text-sm text-gray-500 mb-6">
              Select topics you enjoy. We'll use this to recommend better events for you.
            </p>

            <div className="flex flex-wrap gap-2 mb-6">
              {interestOptions.map((interest) => (
                <button
                  key={interest}
                  onClick={() => toggleInterest(interest)}
                  className={`
                    inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium transition-colors border
                    ${selectedInterests.includes(interest)
                      ? 'bg-blue-100 text-blue-800 border-blue-200'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }
                  `}
                >
                  {interest}
                  {selectedInterests.includes(interest) && (
                    <Check className="ml-1.5 h-3.5 w-3.5" />
                  )}
                </button>
              ))}
            </div>

            <div className="mt-5 sm:mt-6">
              <button
                type="button"
                onClick={handleSave}
                disabled={loading || selectedInterests.length === 0}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Saving...' : 'Save Interests'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
