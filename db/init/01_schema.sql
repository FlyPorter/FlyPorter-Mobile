BEGIN;

-- Ensure timestamps are in UTC semantics at application level. DB stores TIMESTAMPTZ.
SET TIME ZONE 'UTC';

-- 1) Core tables --------------------------------------------------------------

CREATE TABLE IF NOT EXISTS users (
  user_id SERIAL PRIMARY KEY,
  role VARCHAR(20) NOT NULL CHECK (role IN ('customer','admin')),
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name VARCHAR(100),
  phone VARCHAR(20),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cities (
  city_id SERIAL PRIMARY KEY,
  city_name VARCHAR(100) NOT NULL,
  country VARCHAR(100),
  timezone VARCHAR(50), -- e.g. 'America/Toronto'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS airports (
  airport_id SERIAL PRIMARY KEY,
  city_id INT NOT NULL REFERENCES cities(city_id) ON DELETE CASCADE,
  airport_code VARCHAR(10) UNIQUE NOT NULL, -- e.g. YYZ
  airport_name VARCHAR(150) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS airlines (
  airline_id SERIAL PRIMARY KEY,
  airline_name VARCHAR(100) NOT NULL,
  airline_code VARCHAR(10) UNIQUE NOT NULL, -- e.g. AC
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS routes (
  route_id SERIAL PRIMARY KEY,
  airline_id INT NOT NULL REFERENCES airlines(airline_id),
  origin_airport_id INT NOT NULL REFERENCES airports(airport_id),
  destination_airport_id INT NOT NULL REFERENCES airports(airport_id),
  domestic BOOLEAN DEFAULT TRUE,
  seasonal BOOLEAN DEFAULT FALSE,
  active BOOLEAN DEFAULT TRUE,
  notes TEXT,
  CONSTRAINT routes_origin_not_destination CHECK (origin_airport_id <> destination_airport_id),
  CONSTRAINT routes_unique UNIQUE (airline_id, origin_airport_id, destination_airport_id)
);

CREATE TABLE IF NOT EXISTS flights (
  flight_id SERIAL PRIMARY KEY,
  airline_id INT NOT NULL REFERENCES airlines(airline_id),
  departure_airport_id INT NOT NULL REFERENCES airports(airport_id),
  arrival_airport_id INT NOT NULL REFERENCES airports(airport_id),
  departure_time TIMESTAMPTZ NOT NULL, -- stored in UTC
  arrival_time TIMESTAMPTZ NOT NULL,   -- stored in UTC
  flight_duration INTERVAL GENERATED ALWAYS AS (arrival_time - departure_time) STORED,
  base_price NUMERIC(10,2) NOT NULL,
  seat_capacity INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT flights_time_order CHECK (arrival_time > departure_time),
  CONSTRAINT flights_capacity_positive CHECK (seat_capacity > 0)
);

CREATE TABLE IF NOT EXISTS seats (
  seat_id SERIAL PRIMARY KEY,
  flight_id INT NOT NULL REFERENCES flights(flight_id) ON DELETE CASCADE,
  seat_number VARCHAR(5) NOT NULL, -- e.g. '12A'
  class VARCHAR(20) NOT NULL CHECK (class IN ('economy','business','first')),
  price_modifier NUMERIC(5,2) DEFAULT 1.0, -- 1.2 = +20%
  is_available BOOLEAN DEFAULT TRUE,
  UNIQUE (flight_id, seat_number)
);

CREATE TABLE IF NOT EXISTS bookings (
  booking_id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(user_id),
  flight_id INT NOT NULL REFERENCES flights(flight_id),
  seat_id INT NOT NULL REFERENCES seats(seat_id),
  booking_time TIMESTAMPTZ DEFAULT NOW(),
  status VARCHAR(20) NOT NULL CHECK (status IN ('pending','confirmed','cancelled')),
  total_price NUMERIC(10,2),
  confirmation_code VARCHAR(12) UNIQUE,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT bookings_total_price_nonneg CHECK (total_price IS NULL OR total_price >= 0),
  -- Prevent double-selling a seat across multiple bookings:
  CONSTRAINT bookings_unique_seat UNIQUE (seat_id)
);

CREATE TABLE IF NOT EXISTS customer_info (
  info_id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  passport_number VARCHAR(30),
  nationality VARCHAR(50),
  date_of_birth DATE,
  gender VARCHAR(10),
  address TEXT,
  emergency_contact_name VARCHAR(100),
  emergency_contact_phone VARCHAR(20)
);

-- 2) Helpful indexes for joins and lookups -----------------------------------

CREATE INDEX IF NOT EXISTS idx_airports_city_id ON airports(city_id);
CREATE INDEX IF NOT EXISTS idx_routes_airline ON routes(airline_id);
CREATE INDEX IF NOT EXISTS idx_routes_origin_dest ON routes(origin_airport_id, destination_airport_id);
CREATE INDEX IF NOT EXISTS idx_flights_airline ON flights(airline_id);
CREATE INDEX IF NOT EXISTS idx_flights_dep_airports_time ON flights(departure_airport_id, arrival_airport_id, departure_time);
CREATE INDEX IF NOT EXISTS idx_seats_flight_available ON seats(flight_id, is_available);
CREATE INDEX IF NOT EXISTS idx_bookings_user ON bookings(user_id, booking_time DESC);
CREATE INDEX IF NOT EXISTS idx_bookings_flight ON bookings(flight_id);

-- 3) Generic updated_at trigger for mutable tables ---------------------------

CREATE OR REPLACE FUNCTION set_updated_at() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_users_updated_at'
  ) THEN
    CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_bookings_updated_at'
  ) THEN
    CREATE TRIGGER trg_bookings_updated_at
    BEFORE UPDATE ON bookings
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END;
$$;

COMMIT;
