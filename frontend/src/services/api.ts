import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Backend API configuration
// For iOS Simulator: use 'http://localhost:3000/api'
// For Android Emulator: use 'http://10.0.2.2:3000/api'
// For Physical Device: use 'http://YOUR_COMPUTER_IP:3000/api'
const API_BASE_URL = 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout
});

// Add token to requests
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle response errors
api.interceptors.response.use(
  (response) => {
    // Backend returns data in { success, data, message } format
    return response;
  },
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
    }
    return Promise.reject(error);
  }
);

export default api;

// API endpoints matching backend routes
export const authAPI = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  register: (email: string, password: string) =>
    api.post('/auth/register', { email, password }),
  logout: () => api.post('/auth/logout'),
};

export const flightAPI = {
  // GET /flight - Search flights (public)
  search: (params?: any) => api.get('/flight', { params }),
  // GET /flight/:id - Get single flight (public)
  getById: (id: string) => api.get(`/flight/${id}`),
};

export const seatAPI = {
  // GET /seat/:flightId - Get available seats for a flight (public)
  getSeatsForFlight: (flightId: string) => api.get(`/seat/${flightId}`),
};

export const bookingAPI = {
  // POST /bookings - Create booking (requires auth)
  create: (data: { flight_id: number; seat_number: string }) => 
    api.post('/bookings', data),
  // GET /bookings - Get user's bookings (requires auth)
  getMyBookings: (filter?: 'upcoming' | 'past') => 
    api.get('/bookings', { params: filter ? { filter } : undefined }),
  // GET /bookings/:id - Get single booking (requires auth)
  getById: (id: string) => api.get(`/bookings/${id}`),
  // DELETE /bookings/:id - Cancel booking (requires auth)
  cancel: (id: string) => api.delete(`/bookings/${id}`),
};

export const profileAPI = {
  // GET /profile - Get current user profile (requires auth)
  get: () => api.get('/profile'),
  // PATCH /profile - Update profile (requires auth)
  update: (data: {
    full_name?: string;
    phone_number?: string;
    passport_number?: string;
    date_of_birth?: string;
  }) => api.patch('/profile', data),
};

export const paymentAPI = {
  // POST /payment/validate - Validate payment (mock)
  validate: (data: {
    cardNumber: string;
    expiry: string;
    ccv: string;
    bookingDate: string;
  }) => api.post('/payment/validate', data),
};

export const notificationAPI = {
  // GET /notifications - Get user notifications (requires auth)
  getNotifications: () => api.get('/notifications'),
};

export const cityAPI = {
  // GET /city - Get all cities (public)
  getCities: () => api.get('/city'),
  // GET /city/:id - Get single city (public)
  getById: (id: string) => api.get(`/city/${id}`),
};

export const airportAPI = {
  // GET /airport - Get all airports (public)
  getAirports: () => api.get('/airport'),
  // GET /airport/:id - Get single airport (public)
  getById: (id: string) => api.get(`/airport/${id}`),
};

export const airlineAPI = {
  // GET /airline - Get all airlines (public)
  getAirlines: () => api.get('/airline'),
  // GET /airline/:id - Get single airline (public)
  getById: (id: string) => api.get(`/airline/${id}`),
};

export const routeAPI = {
  // GET /route - Get all routes (public)
  getRoutes: () => api.get('/route'),
  // GET /route/:id - Get single route (public)
  getById: (id: string) => api.get(`/route/${id}`),
};

// Admin APIs (require admin role)
export const adminAPI = {
  // Cities
  createCity: (data: { name: string; country: string; timezone: string }) => 
    api.post('/city', data),
  updateCity: (id: string, data: any) => api.put(`/city/${id}`, data),
  deleteCity: (id: string) => api.delete(`/city/${id}`),
  
  // Airports
  createAirport: (data: { code: string; name: string; city_id: number }) => 
    api.post('/airport', data),
  updateAirport: (id: string, data: any) => api.put(`/airport/${id}`, data),
  deleteAirport: (id: string) => api.delete(`/airport/${id}`),
  
  // Airlines
  createAirline: (data: { name: string; code: string }) => 
    api.post('/airline', data),
  updateAirline: (id: string, data: any) => api.put(`/airline/${id}`, data),
  deleteAirline: (id: string) => api.delete(`/airline/${id}`),
  
  // Routes
  createRoute: (data: { origin_airport_id: number; destination_airport_id: number; airline_id: number }) => 
    api.post('/route', data),
  updateRoute: (id: string, data: any) => api.put(`/route/${id}`, data),
  deleteRoute: (id: string) => api.delete(`/route/${id}`),
  
  // Flights
  createFlight: (data: {
    route_id: number;
    departure_time: string;
    arrival_time: string;
    base_price: number;
    total_seats: number;
  }) => api.post('/flight', data),
  updateFlight: (id: string, data: any) => api.put(`/flight/${id}`, data),
  deleteFlight: (id: string) => api.delete(`/flight/${id}`),
  
  // Customer management
  getAllCustomers: () => api.get('/customers'),
  getCustomerById: (id: string) => api.get(`/customers/${id}`),
  updateCustomer: (id: string, data: any) => api.put(`/customers/${id}`, data),
  deleteCustomer: (id: string) => api.delete(`/customers/${id}`),
};

