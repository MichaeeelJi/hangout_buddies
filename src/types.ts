export interface Profile {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  tags?: string[];
}

export interface Event {
  id: string;
  organizer_id: string;
  title: string;
  description: string;
  category: string;
  location: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  image_url?: string;
  tags?: string[];
  event_date: string;
  max_attendees: number;
  created_at: string;
  organizer?: Profile; // Joined data
  participants?: { count: number }[]; // Joined data
}

export interface Participant {
  event_id: string;
  user_id: string;
  joined_at: string;
}

export const CATEGORIES = [
  'All',
  'Hiking',
  'Sports',
  'Dining',
  'Music',
  'Art',
  'Technology',
  'Travel',
  'Social',
  'Education',
  'Networking',
  'Health',
  'Other'
] as const;

export const POPULAR_TAGS = [
  'Gen Z',
  'Millennials',
  'Students',
  'Young Professionals',
  'Introvert Friendly',
  'Dog Lovers',
  'Foodies',
  'Tech Enthusiasts',
  'Outdoor Lovers',
  'Wellness',
  'Nightlife',
  'Creative',
  'Chill Vibes',
  'Adrenaline',
  'Family Friendly',
  'LGBTQ+ Friendly'
];
