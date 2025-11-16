// Navigation types for type-safe navigation

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

export type AuthStackParamList = {
  FlightSearch: undefined;
  FlightResults: {
    origin: string;
    destination: string;
    departDate: string;
    returnDate?: string;
    passengers: number;
  };
  FlightDetails: {
    flight: any;
    passengers: number;
  };
  Login: undefined;
  Register: undefined;
};

export type MainStackParamList = {
  Tabs: undefined;
  FlightDetails: {
    flight: any;
    passengers: number;
  };
  BookingDetails: {
    booking: any;
  };
  SeatSelection: {
    flight: any;
    passengers: number;
  };
  PassengerInfo: {
    flight: any;
    passengers: number;
    selectedSeats: any[];
    seatCharges: number;
  };
  Payment: {
    flight: any;
    passengers: number;
    selectedSeats: any[];
    seatCharges: number;
    passengerData: any[];
  };
  BookingConfirmation: {
    bookingId: string;
    flight: any;
    passengers: number;
    selectedSeats: any[];
    passengerData: any[];
    totalAmount: number;
  };
};

export type CustomerTabParamList = {
  SearchTab: undefined;
  BookingsTab: undefined;
  ProfileTab: undefined;
};

export type AdminTabParamList = {
  DashboardTab: undefined;
  BookingsTab: undefined;
  ManageTab: undefined;
  ProfileTab: undefined;
};

export type SearchStackParamList = {
  Search: undefined;
  Results: {
    origin: string;
    destination: string;
    departDate: string;
    returnDate?: string;
    passengers: number;
  };
};

