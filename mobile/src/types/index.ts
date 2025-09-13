export interface PriceDetail {
  currencyCode: string;
  units: string;
}

export interface PriceRange {
  startPrice?: PriceDetail;
  endPrice?: PriceDetail;
}

export interface OpeningHours {
  openNow?: boolean;
  weekdayDescriptions?: string[];
}

export interface Cafe {
  id: string;
  name: string;
  rating?: number;
  address?: string;
  phone?: string;
  google_maps_uri?: string;
  business_status?: string;
  primary_type?: string;
  price_range?: PriceRange;
  opening_hours?: OpeningHours;
  photos?: string[];
  allows_dogs?: boolean;
  delivery?: boolean;
  reservable?: boolean;
  serves_breakfast?: boolean;
  serves_lunch?: boolean;
  serves_dinner?: boolean;
  serves_vegetarian_food?: boolean;
}

export interface User {
  user_id: string;  // Public UUID from backend
  email: string;
  name: string;
}

export interface SearchResponse {
  cafes: Cafe[];
  total: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name?: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user_name: string;
}

export interface FavoritesResponse {
  cafes: Cafe[];
  total: number;
}
