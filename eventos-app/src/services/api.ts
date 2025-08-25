import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import {
  Event,
  EventCollection,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  CreateEventRequest,
  CreateEventLocationRequest,
  EventLocation,
  Tag,
  Province,
  Location,
  SearchFilters,
  ParticipantCollection
} from '../types';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    const token = await SecureStore.getItemAsync('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Auth Services
export const authService = {
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>('/user/login', credentials);
    return response.data;
  },

  register: async (userData: RegisterRequest): Promise<any> => {
    const response = await api.post('/user/register', userData);
    return response.data;
  },
};

// Event Services
export const eventService = {
  getEvents: async (filters?: SearchFilters): Promise<EventCollection> => {
    const params = new URLSearchParams();
    if (filters?.name) params.append('name', filters.name);
    if (filters?.startdate) params.append('startdate', filters.startdate);
    if (filters?.tag) params.append('tag', filters.tag);

    const response = await api.get<EventCollection>(`/event/?${params.toString()}`);
    return response.data;
  },

  getEventById: async (id: number): Promise<Event> => {
    const response = await api.get<Event>(`/event/${id}`);
    return response.data;
  },

  createEvent: async (eventData: CreateEventRequest): Promise<Event> => {
    const response = await api.post<Event>('/event/', eventData);
    return response.data;
  },

  updateEvent: async (eventData: CreateEventRequest & { id: number }): Promise<Event> => {
    const response = await api.put<Event>('/event/', eventData);
    return response.data;
  },

  deleteEvent: async (id: number): Promise<any> => {
    const response = await api.delete(`/event/${id}`);
    return response.data;
  },

  enrollInEvent: async (eventId: number): Promise<any> => {
    const response = await api.post(`/event/${eventId}/enrollment/`);
    return response.data;
  },

  unenrollFromEvent: async (eventId: number): Promise<any> => {
    const response = await api.delete(`/event/${eventId}/enrollment/`);
    return response.data;
  },

  getEventParticipants: async (eventId: number): Promise<ParticipantCollection> => {
    const response = await api.get<ParticipantCollection>(`/event/${eventId}/participants`);
    return response.data;
  },
};

// Event Location Services
export const eventLocationService = {
  getEventLocations: async (): Promise<EventLocation[]> => {
    const response = await api.get<{ collection: EventLocation[] }>('/event-location');
    return response.data.collection;
  },

  getEventLocationById: async (id: number): Promise<EventLocation> => {
    const response = await api.get<EventLocation>(`/event-location/${id}`);
    return response.data;
  },

  createEventLocation: async (locationData: CreateEventLocationRequest): Promise<EventLocation> => {
    const response = await api.post<EventLocation>('/event-location/', locationData);
    return response.data;
  },

  updateEventLocation: async (
    id: number,
    locationData: CreateEventLocationRequest,
  ): Promise<EventLocation> => {
    const response = await api.put<EventLocation>(
      `/event-location/${id}`,
      locationData,
    );
    return response.data;
  },

  deleteEventLocation: async (id: number): Promise<any> => {
    const response = await api.delete(`/event-location/${id}`);
    return response.data;
  },
};

// Tag Services
export const tagService = {
  getTags: async (): Promise<Tag[]> => {
    const response = await api.get<Tag[]>('/tags');
    return response.data;
  },
};

// Province Services
export const provinceService = {
  getProvinces: async (): Promise<Province[]> => {
    const response = await api.get<Province[]>('/provinces');
    return response.data;
  },
};

// Location Services
export const locationService = {
  getLocations: async (): Promise<Location[]> => {
    const response = await api.get<Location[]>('/locations');
    return response.data;
  },

  getLocationsByProvince: async (provinceId: number): Promise<Location[]> => {
    const response = await api.get<Location[]>(`/locations?province=${provinceId}`);
    return response.data;
  },
};

export default api;
