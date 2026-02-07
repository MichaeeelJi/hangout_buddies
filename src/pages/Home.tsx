import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Event, CATEGORIES } from '../types';
import { EventCard } from '../components/EventCard';
import { RecommendedEvents } from '../components/RecommendedEvents';
import { RecommendedFriends } from '../components/RecommendedFriends';
import { AiSearchModal } from '../components/AiSearchModal';
import { InterestModal } from '../components/InterestModal';
import { EventStatistics } from '../components/EventStatistics';
import { Search, MapPin, Clock, Sparkles, Heart } from 'lucide-react';

// Distance calculation helper (Haversine formula)
function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
}

function deg2rad(deg: number) {
  return deg * (Math.PI / 180);
}

const TIME_FILTERS = [
  { label: 'Any Time', value: 'all' },
  { label: 'Today', value: 'today' },
  { label: 'This Week', value: 'week' },
  { label: 'This Month', value: 'month' },
];

const DISTANCE_FILTERS = [
  { label: 'Any Distance', value: 0 },
  { label: '< 5 km', value: 5 },
  { label: '< 10 km', value: 10 },
  { label: '< 25 km', value: 25 },
  { label: '< 50 km', value: 50 },
];

export function Home() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedTime, setSelectedTime] = useState('all');
  const [selectedDistance, setSelectedDistance] = useState(0);
  
  // AI Modal
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isInterestModalOpen, setIsInterestModalOpen] = useState(false);
  
  // Data for filters
  const [availableCities, setAvailableCities] = useState<string[]>([]);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    // Get user location on mount
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.log('Error getting location:', error);
        }
      );
    }
    
    fetchEvents();
  }, []);

  // Re-filter when local filter state changes (search, distance, city, time)
  // Note: Category is handled by refetching or filtering. 
  // For simplicity, let's fetch all and filter client-side for this demo, 
  // or trigger fetchEvents on major changes.
  useEffect(() => {
    fetchEvents();
  }, [selectedCategory, selectedCity, selectedTime]);

  const fetchEvents = async () => {
    setLoading(true);
    let query = supabase
      .from('events')
      .select('*, organizer:profiles!events_organizer_id_fkey(full_name, avatar_url)')
      .order('event_date', { ascending: true });

    if (selectedCategory && selectedCategory !== 'All') {
      query = query.eq('category', selectedCategory);
    }

    if (selectedCity) {
      query = query.eq('city', selectedCity);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching events:', error);
    } else {
      let filteredData = data as Event[];
      
      // Extract cities for filter
      const cities = Array.from(new Set(filteredData.map(e => e.city).filter(Boolean))) as string[];
      setAvailableCities(prev => [...new Set([...prev, ...cities])].sort());

      // 1. Search Filter
      if (searchQuery) {
        const lowerQuery = searchQuery.toLowerCase();
        filteredData = filteredData.filter(
          (event) =>
            event.title.toLowerCase().includes(lowerQuery) ||
            event.description.toLowerCase().includes(lowerQuery) ||
            event.location.toLowerCase().includes(lowerQuery)
        );
      }

      // 2. Time Filter
      const now = new Date();
      if (selectedTime === 'today') {
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        filteredData = filteredData.filter(e => {
          const date = new Date(e.event_date);
          return date >= now && date < tomorrow;
        });
      } else if (selectedTime === 'week') {
        const nextWeek = new Date(now);
        nextWeek.setDate(nextWeek.getDate() + 7);
        filteredData = filteredData.filter(e => {
          const date = new Date(e.event_date);
          return date >= now && date < nextWeek;
        });
      } else if (selectedTime === 'month') {
        const nextMonth = new Date(now);
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        filteredData = filteredData.filter(e => {
          const date = new Date(e.event_date);
          return date >= now && date < nextMonth;
        });
      }

      // 3. Distance Filter
      if (selectedDistance > 0 && userLocation) {
        filteredData = filteredData.filter(e => {
          if (!e.latitude || !e.longitude) return false;
          const dist = getDistanceFromLatLonInKm(
            userLocation.lat,
            userLocation.lng,
            e.latitude,
            e.longitude
          );
          return dist <= selectedDistance;
        });
      }

      setEvents(filteredData);
    }
    setLoading(false);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchEvents();
  };

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center py-12 px-4 sm:px-6 lg:px-8 bg-blue-600 rounded-3xl text-white relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl">
            Find Your Hangout Buddies
          </h1>
          <p className="mt-6 max-w-2xl mx-auto text-xl text-blue-100">
            Discover local events, meet new people, and explore shared interests in your community.
          </p>
          <button
            onClick={() => setIsInterestModalOpen(true)}
            className="mt-8 inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-full text-blue-600 bg-white hover:bg-blue-50 shadow-sm transition-all duration-200 transform hover:scale-105"
          >
            <Heart className="mr-2 h-5 w-5 text-rose-500" />
            Tell us your interests
          </button>
        </div>
      </div>

      {/* Statistics Section */}
      <EventStatistics />

      {/* Recommendations Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <RecommendedEvents />
        </div>
        <div className="lg:col-span-1">
          <RecommendedFriends />
        </div>
      </div>

      {/* Main Filter Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 space-y-4">
        {/* Top Row: Search & Category */}
        <div className="flex flex-col md:flex-row gap-4 justify-between">
           {/* Category Chips */}
          <div className="flex overflow-x-auto pb-2 md:pb-0 gap-2 w-full md:w-auto no-scrollbar items-center">
            {CATEGORIES.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors flex-shrink-0 ${
                  selectedCategory === category
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
          
          <div className="flex gap-2 w-full md:w-auto flex-shrink-0">
             {/* Search Input */}
            <form onSubmit={handleSearchSubmit} className="relative flex-1 md:w-64">
              <input
                type="text"
                placeholder="Search events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            </form>

            {/* AI Search Button */}
            <button
              onClick={() => setIsAiModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-full font-medium hover:from-indigo-600 hover:to-purple-700 transition-all shadow-md whitespace-nowrap"
            >
              <Sparkles className="h-4 w-4" />
              <span className="hidden sm:inline">Search with AI</span>
              <span className="sm:hidden">AI</span>
            </button>
          </div>
        </div>

        {/* Bottom Row: Advanced Filters (City, Time, Distance) */}
        <div className="flex flex-wrap gap-4 pt-2 border-t border-gray-100">
          
          {/* City Filter */}
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-gray-500" />
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-transparent py-1 pl-2 pr-8"
            >
              <option value="">All Cities</option>
              {availableCities.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>

          {/* Time Filter */}
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-gray-500" />
            <select
              value={selectedTime}
              onChange={(e) => setSelectedTime(e.target.value)}
              className="text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-transparent py-1 pl-2 pr-8"
            >
              {TIME_FILTERS.map(filter => (
                <option key={filter.value} value={filter.value}>{filter.label}</option>
              ))}
            </select>
          </div>

          {/* Distance Filter */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 font-medium">Distance:</span>
            <select
              value={selectedDistance}
              onChange={(e) => setSelectedDistance(Number(e.target.value))}
              className="text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-transparent py-1 pl-2 pr-8"
              disabled={!userLocation}
            >
              {DISTANCE_FILTERS.map(filter => (
                <option key={filter.value} value={filter.value}>{filter.label}</option>
              ))}
            </select>
            {!userLocation && (
              <span className="text-xs text-orange-500">(Enable location)</span>
            )}
          </div>
        </div>
      </div>

      {/* Event Grid */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading events...</p>
        </div>
      ) : events.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200 border-dashed">
          <p className="text-gray-500 text-lg">No events found matching your criteria.</p>
          <button
            onClick={() => {
              setSelectedCategory('All');
              setSearchQuery('');
              setSelectedCity('');
              setSelectedTime('all');
              setSelectedDistance(0);
            }}
            className="mt-4 text-blue-600 font-medium hover:text-blue-500"
          >
            Clear filters
          </button>
        </div>
      )}

      {/* AI Search Modal */}
      <AiSearchModal isOpen={isAiModalOpen} onClose={() => setIsAiModalOpen(false)} />
      
      {/* Interest Modal */}
      <InterestModal isOpen={isInterestModalOpen} onClose={() => setIsInterestModalOpen(false)} />
    </div>
  );
}
