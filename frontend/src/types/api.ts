/** Shared API entity types mirroring the backend serializers. */

export interface TravelProfile {
  avatar_url: string;
  home_city: string;
  preferred_currency: string;
  travel_style: string;
  interests: string[];
  accommodation_preference: string;
  transportation_preference: string;
  dietary_preferences: string[];
  accessibility_preferences: string[];
}

export interface AuthUser {
  id: string;
  email: string;
  full_name: string;
  is_active: boolean;
  profile: TravelProfile;
  created_at: string | null;
}

export interface Tokens {
  access: string;
  refresh: string;
}

export interface Activity {
  name: string;
  description: string;
  start_time: string;
  duration_minutes: number;
  location: string;
  coordinates: { lat: number | null; lng: number | null };
  category: string;
  cost_estimate: number;
  notes: string;
}

export interface ItineraryDay {
  day_number: number;
  date: string | null;
  title: string;
  estimated_cost: number;
  activities: Activity[];
}

export interface Itinerary {
  days: ItineraryDay[];
  total_estimated_cost: number;
}

export interface Trip {
  id: string;
  title: string;
  destination: string;
  start_date: string | null;
  end_date: string | null;
  duration_days: number;
  travelers: number;
  budget: { amount: number | null; currency: string; level: string };
  travel_style: string;
  interests: string[];
  status: string;
  visibility: string;
  notes: string;
  itinerary: Itinerary;
  optimization: {
    score: number | null;
    breakdown: Record<string, number>;
    insights: string[];
  };
  created_at: string | null;
}

export interface TripListData {
  count: number;
  page: number;
  pages: number;
  results: Trip[];
}
