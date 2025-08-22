export interface User {
  id: number;
  first_name: string;
  last_name: string;
  username: string;
  password?: string;
}

export interface Province {
  id: number;
  name: string;
  full_name: string;
  latitude: string;
  longitude: string;
  display_order: number | null;
}

export interface Location {
  id: number;
  name: string;
  id_province: number;
  latitude: string;
  longitude: string;
  province?: Province;
}

export interface EventLocation {
  id: number;
  id_location: number;
  name: string;
  full_address: string;
  max_capacity: string;
  latitude: string;
  longitude: string;
  id_creator_user: number;
  location?: Location;
  creator_user?: User;
}

export interface Tag {
  id: number;
  name: string;
}

export interface Event {
  id: number;
  name: string;
  description: string;
  id_event_location: number;
  start_date: string;
  duration_in_minutes: number;
  price: string;
  enabled_for_enrollment: string;
  max_assistance: number;
  id_creator_user: number;
  event_location?: EventLocation;
  creator_user?: User;
  tags?: Tag[];
}

export interface EventCollection {
  collection: Event[];
}

export interface Participant {
  user: User;
  attended: boolean;
  rating: number | null;
  description: string | null;
}

export interface ParticipantCollection {
  collection: Participant[];
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  token: string;
}

export interface RegisterRequest {
  first_name: string;
  last_name: string;
  username: string;
  password: string;
}

export interface CreateEventRequest {
  name: string;
  description: string;
  id_event_location: number;
  start_date: string;
  duration_in_minutes: number;
  price: string;
  enabled_for_enrollment: string;
  max_assistance: number;
  tags?: number[];
}

export interface CreateEventLocationRequest {
  id_location: number;
  name: string;
  full_address: string;
  max_capacity: string;
  latitude: string;
  longitude: string;
}

export interface SearchFilters {
  name?: string;
  startdate?: string;
  tag?: string;
}
