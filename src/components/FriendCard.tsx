
import { Profile } from '../types';
import { Tag } from 'lucide-react';

interface FriendCardProps {
  profile: Profile;
  sharedTags: string[];
}

export function FriendCard({ profile, sharedTags }: FriendCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 flex items-center space-x-4 hover:shadow-md transition-shadow">
      <div className="relative">
        <img
          src={profile.avatar_url || `https://ui-avatars.com/api/?name=${profile.full_name}`}
          alt={profile.full_name}
          className="h-14 w-14 rounded-full object-cover border-2 border-white shadow-sm"
        />
        <div className="absolute bottom-0 right-0 h-3.5 w-3.5 bg-green-400 border-2 border-white rounded-full"></div>
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-bold text-gray-900 truncate">{profile.full_name}</h3>
        <div className="flex items-center mt-1 space-x-1 overflow-hidden">
          <Tag className="h-3 w-3 text-indigo-500 flex-shrink-0" />
          <p className="text-xs text-gray-500 truncate">
            {sharedTags.length > 0 ? sharedTags.join(', ') : 'New Friend'}
          </p>
        </div>
      </div>
      <button className="px-3 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 rounded-full hover:bg-indigo-100 transition-colors">
        Connect
      </button>
    </div>
  );
}
