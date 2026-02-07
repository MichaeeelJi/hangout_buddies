import { Link, useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Users, ImageOff, Check, Plus } from 'lucide-react';
import { Event } from '../types';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

interface EventCardProps {
  event: Event;
}

export function EventCard({ event }: EventCardProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  
  // Join state
  const [joined, setJoined] = useState(false);
  const [participantCount, setParticipantCount] = useState(0);
  const [joinLoading, setJoinLoading] = useState(true);

  const eventDate = new Date(event.event_date).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

  useEffect(() => {
    fetchParticipantStatus();
  }, [event.id, user]);

  const fetchParticipantStatus = async () => {
    try {
      // 1. Get total count
      const { count, error: countError } = await supabase
        .from('participants')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', event.id);

      if (countError) throw countError;
      setParticipantCount(count || 0);

      // 2. Check if user joined (only if logged in)
      if (user) {
        const { data, error: joinError } = await supabase
          .from('participants')
          .select('user_id')
          .eq('event_id', event.id)
          .eq('user_id', user.id)
          .single();

        if (joinError && joinError.code !== 'PGRST116') { // PGRST116 is "no rows found"
          console.error('Error checking join status:', joinError);
        }
        
        setJoined(!!data);
      }
    } catch (err) {
      console.error('Error fetching participant details:', err);
    } finally {
      setJoinLoading(false);
    }
  };

  const handleJoinToggle = async (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigation
    e.stopPropagation();

    if (!user) {
      navigate('/login');
      return;
    }

    setJoinLoading(true);

    try {
      if (joined) {
        // Leave
        const { error } = await supabase
          .from('participants')
          .delete()
          .eq('event_id', event.id)
          .eq('user_id', user.id);

        if (error) throw error;
        setJoined(false);
        setParticipantCount(prev => Math.max(0, prev - 1));
      } else {
        // Join
        if (participantCount >= event.max_attendees) {
          alert('Event is full!');
          return;
        }

        const { error } = await supabase
          .from('participants')
          .insert({
            event_id: event.id,
            user_id: user.id
          });

        if (error) throw error;
        setJoined(true);
        setParticipantCount(prev => prev + 1);
      }
    } catch (err) {
      console.error('Error toggling join:', err);
      alert('Failed to update status. Please try again.');
    } finally {
      setJoinLoading(false);
    }
  };

  const isFull = participantCount >= event.max_attendees;

  return (
    <Link to={`/events/${event.id}`} className="block group h-full">
      <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden border border-gray-100 h-full flex flex-col relative">
        <div className="h-40 bg-gray-200 relative overflow-hidden">
          {event.image_url && !imageError ? (
            <>
              {imageLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-200 animate-pulse">
                  <span className="sr-only">Loading image...</span>
                </div>
              )}
              <img 
                src={event.image_url} 
                alt={event.title} 
                className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ${imageLoading ? 'opacity-0' : 'opacity-100'}`}
                onLoad={() => setImageLoading(false)}
                onError={() => {
                  setImageError(true);
                  setImageLoading(false);
                }}
              />
            </>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100 text-gray-400">
              {imageError ? (
                <>
                  <ImageOff className="h-8 w-8 mb-1" />
                  <span className="text-xs">Image unavailable</span>
                </>
              ) : (
                <span className="font-medium text-lg">{event.category}</span>
              )}
            </div>
          )}
          
          {/* Category Badge - moved to top right over image for better layout with button */}
          <div className="absolute top-2 right-2">
             <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-white/90 backdrop-blur-sm text-gray-800 shadow-sm">
              {event.category}
            </span>
          </div>
        </div>

        <div className="p-4 flex-1 flex flex-col">
          <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 mb-2 line-clamp-2">
            {event.title}
          </h3>
          
          <div className="space-y-2 mb-4 text-sm text-gray-600">
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-2 text-gray-400 flex-shrink-0" />
              <span>{eventDate}</span>
            </div>
            <div className="flex items-center">
              <MapPin className="h-4 w-4 mr-2 text-gray-400 flex-shrink-0" />
              <span className="truncate">
                {event.city ? `${event.city}` : event.location}
              </span>
            </div>
            <div className="flex items-center">
              <Users className="h-4 w-4 mr-2 text-gray-400 flex-shrink-0" />
              <span>{participantCount} / {event.max_attendees} spots</span>
            </div>
          </div>

          <div className="mt-auto pt-2 flex items-center justify-between border-t border-gray-50">
             <button
              onClick={handleJoinToggle}
              disabled={joinLoading || (!joined && isFull)}
              className={`
                flex-1 flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium transition-colors
                ${joined 
                  ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                  : isFull 
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm hover:shadow'
                }
              `}
            >
              {joinLoading ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : joined ? (
                <>
                  <Check className="h-4 w-4 mr-1.5" />
                  Joined
                </>
              ) : isFull ? (
                'Full'
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-1.5" />
                  Join
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}
