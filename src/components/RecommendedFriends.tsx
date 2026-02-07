import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Profile } from '../types';
import { useAuth } from '../context/AuthContext';
import { Users } from 'lucide-react';
import { FriendCard } from './FriendCard';
import { Link } from 'react-router-dom';

export function RecommendedFriends() {
  const { user } = useAuth();
  const [recommendations, setRecommendations] = useState<{ profile: Profile; sharedTags: string[] }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchRecommendations();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchRecommendations = async () => {
    try {
      // 1. Get current user profile tags
      const { data: currentUserProfile } = await supabase
        .from('profiles')
        .select('tags')
        .eq('id', user!.id)
        .single();

      const userTags = currentUserProfile?.tags || [];

      // 2. Fetch other users
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .neq('id', user!.id)
        .limit(20);

      if (!profiles) return;

      // 3. Calculate overlap
      const scoredProfiles = profiles.map((profile: Profile) => {
        const friendTags = profile.tags || [];
        const sharedTags = friendTags.filter(tag => userTags.includes(tag));
        // Bonus for having ANY tags if we have no tags (just to show someone)
        const score = sharedTags.length + (friendTags.length > 0 ? 0.1 : 0);
        return { profile, sharedTags, score };
      });

      // 4. Sort and top 3
      const topFriends = scoredProfiles
        .sort((a, b) => b.score - a.score)
        .slice(0, 3);

      setRecommendations(topFriends);
    } catch (error) {
      console.error('Error fetching friend recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !user) return null;

  if (recommendations.length === 0) {
     return (
      <div className="bg-gradient-to-r from-pink-50 to-rose-50 p-6 rounded-2xl border border-pink-100 h-full">
        <div className="flex items-center gap-2 mb-4">
          <Users className="h-5 w-5 text-rose-600" />
          <h2 className="text-xl font-bold text-gray-900">Suggested Buddies</h2>
        </div>
        <div className="text-center py-4">
          <p className="text-gray-600 text-sm mb-2">No suggestions yet.</p>
           <Link
            to="/profile"
            className="text-sm text-indigo-600 font-medium hover:text-indigo-700"
          >
            Update Profile
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-pink-50 to-rose-50 p-6 rounded-2xl border border-pink-100 h-full">
      <div className="flex items-center gap-2 mb-4">
        <Users className="h-5 w-5 text-rose-600" />
        <h2 className="text-xl font-bold text-gray-900">Suggested Buddies</h2>
      </div>
      <div className="space-y-4">
        {recommendations.map(({ profile, sharedTags }) => (
          <FriendCard key={profile.id} profile={profile} sharedTags={sharedTags} />
        ))}
      </div>
    </div>
  );
}
