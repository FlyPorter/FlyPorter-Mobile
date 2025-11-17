import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Backend API configuration
const API_BASE_URL = 'https://api.flyporter.website/api';

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
    // Handle authentication errors
    if (error.response?.status === 401) {
      // Token expired or invalid
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
    }
    return Promise.reject(error);
  }
);

export { api };

// API endpoints matching backend routes
export const authAPI = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  register: (email: string, password: string) =>
    api.post('/auth/register', { email, password }),
  logout: () => api.post('/auth/logout'),
};

export const flightAPI = {
  // GET /flight/search - Search flights with filters (public)
  // Returns flights with origin/destination city timezone info from joined City table
  // Expected response includes: departure_time, arrival_time (UTC timestamps)
  // and origin/destination objects with timezone field (e.g., 'America/Toronto')
  search: (params?: {
    departure_airport?: string;
    destination_airport?: string;
    date?: string;
    min_price?: number;
    max_price?: number;
    min_duration?: number;
    max_duration?: number;
    min_departure_time?: string;
    max_departure_time?: string;
  }) => api.get('/flight/search', { params }),
  // GET /flight - List all flights (public, legacy)
  // Returns flights with city timezone info for timezone-aware time display
  getAll: () => api.get('/flight'),
  // GET /flight/:id - Get single flight (public)
  // Returns detailed flight info including origin/destination timezone
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
  // PATCH /bookings/:id/seat - Change seat for existing booking (requires auth)
  changeSeat: (id: string, data: { seat_number: string }) => 
    api.patch(`/bookings/${id}/seat`, data),
};

export const profileAPI = {
  // GET /profile - Get current user profile (requires auth)
  get: () => api.get('/profile'),
  // PATCH /profile - Update profile (requires auth)
  update: (data: {
    full_name?: string;
    phone?: string;
    passport_number?: string;
    date_of_birth?: string;
    emergency_contact_name?: string;
    emergency_contact_phone?: string;
  }) => api.patch('/profile', data),
  // POST /profile/push-token - Register push notification token (requires auth)
  registerPushToken: (pushToken: string) => api.post('/profile/push-token', { pushToken }),
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
  // GET /notifications/unread/count - Get unread notifications count (requires auth)
  getUnreadCount: () => api.get('/notifications/unread/count'),
  // PATCH /notifications/:id/read - Mark notification as read (requires auth)
  markAsRead: (id: number) => api.patch(`/notifications/${id}/read`),
  // PATCH /notifications/read-all - Mark all notifications as read (requires auth)
  markAllAsRead: () => api.patch('/notifications/read-all'),
};

export const pdfAPI = {
  // GET /pdf/invoice/:id - Get invoice URL from Digital Ocean Spaces (requires auth)
  getInvoiceUrl: (bookingId: string) => api.get(`/pdf/invoice/${bookingId}`),
  // GET /pdf/invoice/:id/download - Direct download invoice bypassing Spaces (requires auth)
  downloadInvoice: (bookingId: string) => api.get(`/pdf/invoice/${bookingId}/download`, {
    responseType: 'blob',
  }),
  // POST /pdf/invoice/:id/upload - Upload invoice to Digital Ocean Spaces (requires auth)
  uploadInvoice: (bookingId: string) => api.post(`/pdf/invoice/${bookingId}/upload`),
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
  // Cities (Admin Setup)
  createCity: (data: { name: string; country: string; timezone: string }) => 
    api.post('/city', data),
  updateCity: (id: string, data: Partial<{ name: string; country: string; timezone: string }>) => 
    api.put(`/city/${id}`, data),
  deleteCity: (id: string) => api.delete(`/city/${id}`),
  
  // Airports (Admin Setup)
  createAirport: (data: { code: string; name: string; city_id: number }) => 
    api.post('/airport', data),
  updateAirport: (id: string, data: Partial<{ code: string; name: string; city_id: number }>) => 
    api.put(`/airport/${id}`, data),
  deleteAirport: (id: string) => api.delete(`/airport/${id}`),
  
  // Airlines (Admin Setup)
  createAirline: (data: { name: string; code: string }) => 
    api.post('/airline', data),
  updateAirline: (id: string, data: Partial<{ name: string; code: string }>) => 
    api.put(`/airline/${id}`, data),
  deleteAirline: (id: string) => api.delete(`/airline/${id}`),
  
  // Routes (Admin Setup)
  createRoute: (data: { 
    origin_airport_id: number; 
    destination_airport_id: number; 
    airline_id: number;
  }) => api.post('/route', data),
  updateRoute: (id: string, data: Partial<{
    origin_airport_id: number; 
    destination_airport_id: number; 
    airline_id: number;
  }>) => api.put(`/route/${id}`, data),
  deleteRoute: (id: string) => api.delete(`/route/${id}`),
  
  // Flights (Admin Setup)
  createFlight: (data: {
    route_id: number;
    departure_time: string;
    arrival_time: string;
    base_price: number;
    total_seats: number;
  }) => api.post('/flight', data),
  updateFlight: (id: string, data: Partial<{
    route_id: number;
    departure_time: string;
    arrival_time: string;
    base_price: number;
    total_seats: number;
  }>) => api.put(`/flight/${id}`, data),
  deleteFlight: (id: string) => api.delete(`/flight/${id}`),
  
  // Customer Management (Admin)
  // Note: There is no "get all customers" endpoint. Use adminAPI.getAllBookings() to derive customer count.
  getCustomerById: (id: string) => api.get(`/customers/${id}`),
  updateCustomer: (id: string, data: Partial<{
    email: string;
    full_name: string;
    phone: string;
    passport_number: string;
    date_of_birth: string;
    emergency_contact_name: string;
    emergency_contact_phone: string;
  }>) => api.patch(`/customers/${id}`, data),
  deleteCustomer: (id: string) => api.delete(`/customers/${id}`),
  
  // Bookings Management (Admin - view all bookings)
  getAllBookings: () => api.get('/bookings/admin/all'),
  // Cancel any booking (admin only)
  cancelBooking: (id: string) => api.delete(`/bookings/admin/${id}`),
};

