import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Event, POPULAR_TAGS } from '../types';
import { EventCard } from '../components/EventCard';
import { User, Calendar, Settings, Tag } from 'lucide-react';

export function Profile() {
  const { user } = useAuth();
  const [joinedEvents, setJoinedEvents] = useState<Event[]>([]);
  const [organizedEvents, setOrganizedEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'joined' | 'organized'>('joined');
  
  // Profile update state
  const [fullName, setFullName] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user]);

  const fetchUserData = async () => {
    setLoading(true);
    try {
      if (!user) return;

      // Fetch profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, tags')
        .eq('id', user.id)
        .single();
      
      if (profile) {
        setFullName(profile.full_name);
        setTags(profile.tags || []);
      }

      // Fetch joined events
      const { data: joinedData } = await supabase
        .from('participants')
        .select('event:events(*, organizer:profiles(full_name))')
        .eq('user_id', user.id);

      if (joinedData) {
        // Flatten the structure
        const events = joinedData.map((item: any) => item.event) as Event[];
        setJoinedEvents(events);
      }

      // Fetch organized events
      const { data: organizedData } = await supabase
        .from('events')
        .select('*, organizer:profiles(full_name)')
        .eq('organizer_id', user.id);

      if (organizedData) {
        setOrganizedEvents(organizedData as Event[]);
      }

    } catch (err) {
      console.error('Error fetching profile data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setUpdating(true);
    setMessage(null);
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: fullName, tags: tags })
        .eq('id', user.id);

      if (error) throw error;
      setMessage({ type: 'success', text: 'Profile updated successfully' });
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to update profile' });
    } finally {
      setUpdating(false);
    }
  };

  const toggleTag = (tag: string) => {
    setTags(prev => 
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  if (loading) {
    return <div className="flex justify-center py-12">Loading...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Profile Settings Card */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
        <div className="flex items-center space-x-4 mb-6">
          <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-2xl font-bold">
            {fullName ? fullName.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{fullName || 'User'}</h1>
            <p className="text-gray-500">{user?.email}</p>
          </div>
        </div>

        <form onSubmit={handleUpdateProfile} className="space-y-6">
          <div className="max-w-md">
            <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Your Interests & Vibe
            </label>
            <div className="flex flex-wrap gap-2">
              {POPULAR_TAGS.map(tag => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    tags.includes(tag)
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-gray-500">
              Select tags to get better event recommendations.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <button
              type="submit"
              disabled={updating}
              className="px-4 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {updating ? 'Saving...' : 'Save Changes'}
            </button>
            {message && (
              <p className={`text-sm ${message.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                {message.text}
              </p>
            )}
          </div>
        </form>
      </div>

      {/* Events Tabs */}
      <div>
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('joined')}
              className={`pb-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                activeTab === 'joined'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Calendar className="h-4 w-4 mr-2" />
              Upcoming Events ({joinedEvents.length})
            </button>
            <button
              onClick={() => setActiveTab('organized')}
              className={`pb-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                activeTab === 'organized'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Settings className="h-4 w-4 mr-2" />
              Organized by Me ({organizedEvents.length})
            </button>
          </nav>
        </div>

        {activeTab === 'joined' && (
          joinedEvents.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {joinedEvents.map(event => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
              <p className="text-gray-500">You haven't joined any events yet.</p>
            </div>
          )
        )}

        {activeTab === 'organized' && (
          organizedEvents.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {organizedEvents.map(event => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
              <p className="text-gray-500">You haven't organized any events yet.</p>
            </div>
          )
        )}
      </div>
    </div>
  );
}
