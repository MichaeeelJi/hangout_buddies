import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Event, Profile } from '../types';
import { Calendar, MapPin, Users, User as UserIcon } from 'lucide-react';

interface ParticipantWithProfile {
  user_id: string;
  joined_at: string;
  user: Profile; // Joined data
}

export function EventDetails() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [event, setEvent] = useState<Event | null>(null);
  const [participants, setParticipants] = useState<ParticipantWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchEventDetails();
    }
  }, [id]);

  const fetchEventDetails = async () => {
    setLoading(true);
    try {
      // Fetch event
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select('*, organizer:profiles!events_organizer_id_fkey(full_name, avatar_url)')
        .eq('id', id)
        .single();

      if (eventError) throw eventError;

      // Fetch participants
      const { data: participantsData, error: participantsError } = await supabase
        .from('participants')
        .select('*, user:profiles!participants_user_id_fkey(id, full_name, avatar_url)')
        .eq('event_id', id);

      if (participantsError) throw participantsError;

      setEvent(eventData);
      setParticipants(participantsData as unknown as ParticipantWithProfile[]);
    } catch (err) {
      setError('Failed to load event details');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (!event) return;

    setActionLoading(true);
    try {
      const { error } = await supabase
        .from('participants')
        .insert([{ event_id: event.id, user_id: user.id }]);

      if (error) throw error;
      await fetchEventDetails();
    } catch (err) {
      console.error('Error joining event:', err);
      alert('Failed to join event');
    } finally {
      setActionLoading(false);
    }
  };

  const handleLeave = async () => {
    if (!user || !event) return;

    setActionLoading(true);
    try {
      const { error } = await supabase
        .from('participants')
        .delete()
        .eq('event_id', event.id)
        .eq('user_id', user.id);

      if (error) throw error;
      await fetchEventDetails();
    } catch (err) {
      console.error('Error leaving event:', err);
      alert('Failed to leave event');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-12">Loading...</div>;
  }

  if (error || !event) {
    return <div className="text-center py-12 text-red-600">{error || 'Event not found'}</div>;
  }

  const isOrganizer = user?.id === event.organizer_id;
  const isParticipant = user ? participants.some(p => p.user_id === user.id) : false;
  const isFull = participants.length >= event.max_attendees;
  const eventDate = new Date(event.event_date).toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Card */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="h-48 bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center text-white">
          <span className="text-4xl font-bold opacity-20">{event.category}</span>
        </div>
        <div className="p-6 sm:p-8">
          <div className="flex justify-between items-start mb-4">
            <div>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 mb-2">
                {event.category}
              </span>
              <h1 className="text-3xl font-bold text-gray-900">{event.title}</h1>
            </div>
            {user && !isOrganizer && (
              isParticipant ? (
                <button
                  onClick={handleLeave}
                  disabled={actionLoading}
                  className="px-6 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                >
                  {actionLoading ? 'Processing...' : 'Leave Event'}
                </button>
              ) : (
                <button
                  onClick={handleJoin}
                  disabled={actionLoading || isFull}
                  className={`px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 ${
                    isFull ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {actionLoading ? 'Processing...' : isFull ? 'Event Full' : 'Join Event'}
                </button>
              )
            )}
            {isOrganizer && (
              <span className="px-4 py-2 bg-gray-100 text-gray-600 rounded-md font-medium text-sm">
                You are organizing this
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div className="space-y-4">
              <div className="flex items-start">
                <Calendar className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
                <div>
                  <p className="font-medium text-gray-900">Date and Time</p>
                  <p className="text-gray-600">{eventDate}</p>
                </div>
              </div>
              <div className="flex items-start">
                <MapPin className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
                <div>
                  <p className="font-medium text-gray-900">Location</p>
                  <p className="text-gray-600">{event.location}</p>
                </div>
              </div>
              <div className="flex items-start">
                <Users className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
                <div>
                  <p className="font-medium text-gray-900">Capacity</p>
                  <p className="text-gray-600">
                    {participants.length} / {event.max_attendees} attendees
                  </p>
                </div>
              </div>
              <div className="flex items-start">
                <UserIcon className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
                <div>
                  <p className="font-medium text-gray-900">Organizer</p>
                  <p className="text-gray-600">{event.organizer?.full_name || 'Unknown'}</p>
                </div>
              </div>
            </div>

            <div className="border-t md:border-t-0 md:border-l border-gray-100 pt-6 md:pt-0 md:pl-6">
              <h3 className="text-lg font-medium text-gray-900 mb-2">About this event</h3>
              <p className="text-gray-600 whitespace-pre-wrap">{event.description}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Participants List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">
          Attendees ({participants.length})
        </h3>
        {participants.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {participants.map((participant) => (
              <div key={participant.user_id} className="flex items-center space-x-3 p-3 rounded-md bg-gray-50">
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium">
                  {participant.user.full_name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{participant.user.full_name}</p>
                  <p className="text-xs text-gray-500">
                    Joined {new Date(participant.joined_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 italic">No attendees yet. Be the first to join!</p>
        )}
      </div>
    </div>
  );
}
