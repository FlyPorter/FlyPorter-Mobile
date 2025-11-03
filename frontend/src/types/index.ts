// Common types used across the application

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'customer' | 'admin';
  phone?: string;
}

export interface Flight {
  id: string;
  flightNumber: string;
  airline: {
    id: string;
    name: string;
    code: string;
  };
  route: {
    id: string;
    origin: Airport;
    destination: Airport;
  };
  departureTime: string;
  arrivalTime: string;
  date: string;
  duration: string;
  price: number;
  availableSeats: number;
  status: 'scheduled' | 'delayed' | 'cancelled' | 'completed';
}

export interface Airport {
  id: string;
  code: string;
  name: string;
  city: City;
}

export interface City {
  id: string;
  name: string;
  country: string;
  timezone: string;
}

export interface Airline {
  id: string;
  name: string;
  code: string;
}

export interface Route {
  id: string;
  origin: Airport;
  destination: Airport;
  airline: Airline;
  distance: number;
}

export interface Seat {
  id: string;
  row: number;
  column: string;
  type: 'economy' | 'business' | 'first';
  status: 'available' | 'occupied' | 'selected';
  price: number;
}

export interface Passenger {
  firstName: string;
  lastName: string;
  passportNumber: string;
  dateOfBirth?: string;
  seat?: Seat;
}

export interface Booking {
  id: string;
  bookingReference: string;
  user: User;
  flight: Flight;
  passengers: Passenger[];
  seats: Seat[];
  totalAmount: number;
  status: 'confirmed' | 'cancelled' | 'completed';
  paymentStatus: 'pending' | 'paid' | 'refunded';
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'booking_confirmed' | 'booking_cancelled' | 'flight_delayed' | 'flight_cancelled';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface Payment {
  id: string;
  bookingId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  method: 'card' | 'paypal' | 'bank_transfer';
  createdAt: string;
}

