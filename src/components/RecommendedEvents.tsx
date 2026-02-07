import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Event } from '../types';
import { EventCard } from './EventCard';
import { useAuth } from '../context/AuthContext';
import { Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

export function RecommendedEvents() {
  const { user } = useAuth();
  const [recommendations, setRecommendations] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [userTags, setUserTags] = useState<string[]>([]);

  useEffect(() => {
    if (user) {
      fetchRecommendations();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchRecommendations = async () => {
    try {
      // 1. Get user profile tags
      const { data: profile } = await supabase
        .from('profiles')
        .select('tags')
        .eq('id', user!.id)
        .single();

      const tags = profile?.tags || [];
      setUserTags(tags);

      // 2. Get all upcoming events with tags
      const { data: events } = await supabase
        .from('events')
        .select('*, organizer:profiles!events_organizer_id_fkey(full_name, avatar_url)')
        .gt('event_date', new Date().toISOString())
        .order('event_date', { ascending: true });

      if (!events) return;

      // 3. Score events based on tag overlap
      const scoredEvents = events.map((event: Event) => {
        const eventTags = event.tags || [];
        const overlap = eventTags.filter(tag => tags.includes(tag)).length;
        return { event, score: overlap };
      });

      // 4. Sort by score and take top 3
      const topEvents = scoredEvents
        .filter(item => item.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 3)
        .map(item => item.event);

      // If no tag matches, maybe show some random/popular ones?
      // For now, let's stick to strict matching but handle the UI state.
      setRecommendations(topEvents);
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !user) return null;

  // Render a prompt if user has no tags
  if (userTags.length === 0) {
    return (
      <div className="bg-gradient-to-r from-indigo-50 to-blue-50 p-6 rounded-2xl border border-indigo-100">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="h-5 w-5 text-indigo-600" />
          <h2 className="text-xl font-bold text-gray-900">Recommended for You</h2>
        </div>
        <div className="text-center py-4">
          <p className="text-gray-600 mb-4">
            We can't recommend events yet because we don't know your interests!
          </p>
          <Link
            to="/profile"
            className="inline-block px-4 py-2 bg-indigo-600 text-white rounded-md font-medium hover:bg-indigo-700 transition-colors"
          >
            Add Interests to Profile
          </Link>
        </div>
      </div>
    );
  }

  // Render a message if no events match tags
  if (recommendations.length === 0) {
    return (
      <div className="bg-gradient-to-r from-indigo-50 to-blue-50 p-6 rounded-2xl border border-indigo-100">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="h-5 w-5 text-indigo-600" />
          <h2 className="text-xl font-bold text-gray-900">Recommended for You</h2>
        </div>
        <p className="text-gray-600 mb-2">
          Based on your interests: <span className="font-medium text-indigo-600">{userTags.join(', ')}</span>
        </p>
        <div className="text-center py-4 bg-white/50 rounded-lg">
          <p className="text-gray-500">
            No upcoming events match your specific tags right now. Try adding more general interests!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-indigo-50 to-blue-50 p-6 rounded-2xl border border-indigo-100 h-full">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="h-5 w-5 text-indigo-600" />
        <h2 className="text-xl font-bold text-gray-900">Recommended for You</h2>
      </div>
      <p className="text-gray-600 mb-6 text-sm">
        Based on your interests: <span className="font-medium text-indigo-600">{userTags.join(', ')}</span>
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {recommendations.map(event => (
          <EventCard key={event.id} event={event} />
        ))}
      </div>
    </div>
  );
}
