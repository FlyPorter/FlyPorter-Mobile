# ECE1778 Project Proposal -- FlyPorter Mobile Flight Booking App

Yiyang Wang: 1010033278 <br>
Yuan Wang: 1002766526 <br>
Yiyang Liu: 1011770512 <br>
Zihan Wan: 1011617779

---

### 1. Motivation

In today’s mobile focused world, booking a flight should be fast, clear, and reliable, but many existing apps fail to deliver. Users often face cluttered interfaces, hidden fees, slow performance, or inconsistent seat availability. Some platforms do not even allow users to manage their bookings directly, relying only on confirmation emails. These limitations create unnecessary frustration and reduce trust in the booking process.

FlyPorter Mobile addresses these issues with a clean, responsive mobile app designed for real-world use. Built with React Native and Expo, the app enables users to search for flights, view real-time seat and price availability, and manage bookings entirely from their phone. Local and push notifications provide timely updates, while account-based booking ensures users can view, modify, or cancel flights without relying on customer support. The design emphasizes speed, clarity, and transparency, removing common friction points found in legacy systems.

The app targets three groups: business travelers who need speed and reliability, students and frequent flyers seeking affordability and control, and airline administrators managing routes and inventory. For each group, FlyPorter Mobile offers practical benefits and a better overall experience.

This project is both technically feasible and educationally valuable. It aligns well with course goals, covering core mobile development areas such as navigation, state management, persistence, notifications, and backend integration, while addressing real user pain points with a focused and achievable scope.

---

### 2. Objective and Key Features

FlyPorter Mobile aims to deliver a modern flight booking application that enables users to search, book, and manage flights while providing administrators with tools to maintain routes, pricing, and bookings. The project focuses on building a responsive and reliable experience using React Native and Expo, supported by backend and persistent data storage.

The solution is organized into three parts: an Expo (React Native, TypeScript) client for interaction and navigation; a Node/Express REST API for core logic and admin operations; and a PostgreSQL database for persistent storage. Docker Compose supports local development of the API and database, while mobile builds are distributed via Expo EAS for device testing. Persistent storage ensures flight, seat inventory, and booking data remain intact across deployments.

#### Core Features

- **React Native & Expo Development**  
  - Built with Expo (React Native) and TypeScript. All props, navigation params, and API models use strict typing for reliability and clarity.  
  - Screens (initial launch: 4+): Search → Results → Flight Detail & Seat Map → Checkout (traveler details) → Confirmation.  
  - Additional: Bookings, Profile, and Admin panel (visible only for admin users).  
  - UI approach: core RN components (View, Text, TextInput, FlatList). All screens responsive with proper accessibility roles and labels.

- **Navigation**  
  - Expo Router with file-based routes:  
    `app/(tabs)/search.tsx`, `app/flight/[id].tsx`, `app/checkout/index.tsx`, `app/bookings/index.tsx`, `app/profile/index.tsx`, `app/(auth)/sign-in.tsx`, `app/(admin)/routes.tsx`, `app/_layout.tsx`.  
  - All route parameters fully typed. Deep links and navigation actions (e.g., `push`) can target dynamic routes like `/booking/[id]` or `/flight/[id]`.

- **State Management & Persistence**  
  - App state via Context + `useReducer` slices: `auth`, `searchFilters`, `seatSelection`, `cart/checkout`, `bookings`.  
  - Persistence: AsyncStorage for non-sensitive data (last search, prefs); SecureStore for tokens/MFA secrets.  
  - Patterns: loading/error/retry flags; cancellation with `AbortController`; optimistic updates only where safe.

- **Notifications**  
  - Implement with `expo-notifications`; request permission on first run.  
  - Handle taps with `addNotificationResponseReceivedListener` and deep-link (Expo Router) to `/search` if no active bookings, otherwise `/bookings`.

- **Backend Integration**  
  - Custom REST API (Node/Express + PostgreSQL). Key endpoints:  
    - Public: `GET /airports`, `GET /routes`, `GET /flights?from&to&date&airline&priceMax`, `GET /flights/:id/seats`  
    - Bookings: `POST /bookings`, `GET /bookings/me`, `DELETE /bookings/:id`  
    - Auth: `POST /auth/register`, `POST /auth/login`, `POST /auth/google`, `POST /auth/mfa/verify`, `POST /auth/logout`  
    - Admin: CRUD for cities/airports/routes/flights/prices/seats, `GET /bookings`  
  - Time: store all schedules in UTC; client renders device-local time.  
  - Reliability: server-side seat holds + transactional booking to prevent oversell; idempotent booking create (client sends `Idempotency-Key`).  
  - Errors: normalized JSON `{ code, message, details }`; client shows inline errors and retry.

- **Deployment**  
  - Mobile: Expo EAS Build for iOS/Android test builds; channels: `dev`, `preview`, `prod`.  
  - Config: `.env` per channel for API base URL; feature flags for push/payments.  
  - API/DB: local via Docker Compose (persistent PG volume). Prod: simple VM/container host (scope-friendly).

- **Authentication & Authorization**  
  - Email/password registration and login. Roles: `customer` and `admin`.  
  - Customers: search, book, manage own flights.  
  - Admins: add/update/remove flight listings.  
  - MFA with email verification for added security.

- **Flight Search & Booking**  
  - Search criteria:  
    - Trip type (one-way or round-trip)  
    - Departure/arrival dates & times  
    - Departure/arrival cities or airports  
    - Flight duration  
    - Airlines  
    - Price range  
  - Users can book available flights and choose seats once booking is confirmed.

- **Payment Page**  
  - Payments via mock or third-party API.  
  - Invoices generated and stored in DigitalOcean Spaces.  
  - Past payment records visible on the account page.

- **Booking Management**  
  - View, modify, or cancel bookings.  
  - Backend ensures consistency between `flights` and `bookings` tables.

- **Admin Panel**  
  - Manage flights: create routes, adjust prices, change seat availability.  
  - Protected by role-based authorization.

- **PostgreSQL for Flight & Booking Data**  
  - Schema:

~~~sql
CREATE TABLE users (
  user_id SERIAL PRIMARY KEY,
  role VARCHAR(20) NOT NULL CHECK (role IN ('customer','admin')),
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name VARCHAR(100),
  phone VARCHAR(20),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE cities (
  city_id SERIAL PRIMARY KEY,
  city_name VARCHAR(100) NOT NULL,
  country VARCHAR(100),
  timezone VARCHAR(50), -- e.g. 'America/Toronto'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE airports (
  airport_id SERIAL PRIMARY KEY,
  city_id INT REFERENCES cities(city_id) ON DELETE CASCADE,
  airport_code VARCHAR(10) UNIQUE NOT NULL, -- e.g. YYZ
  airport_name VARCHAR(150) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE airlines (
  airline_id SERIAL PRIMARY KEY,
  airline_name VARCHAR(100) NOT NULL,
  airline_code VARCHAR(10) UNIQUE NOT NULL, -- e.g. AC
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE routes (
  route_id SERIAL PRIMARY KEY,
  airline_id INT REFERENCES airlines(airline_id),
  origin_airport_id INT REFERENCES airports(airport_id),
  destination_airport_id INT REFERENCES airports(airport_id),
  domestic BOOLEAN DEFAULT TRUE,
  seasonal BOOLEAN DEFAULT FALSE,
  active BOOLEAN DEFAULT TRUE,
  notes TEXT
);

CREATE TABLE flights (
  flight_id SERIAL PRIMARY KEY,
  airline_id INT REFERENCES airlines(airline_id),
  departure_airport_id INT REFERENCES airports(airport_id),
  arrival_airport_id INT REFERENCES airports(airport_id),
  departure_time TIMESTAMPTZ NOT NULL, -- stored in UTC
  arrival_time TIMESTAMPTZ NOT NULL,   -- stored in UTC
  flight_duration INTERVAL GENERATED ALWAYS AS (arrival_time - departure_time) STORED,
  base_price NUMERIC(10,2) NOT NULL,
  seat_capacity INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE seats (
  seat_id SERIAL PRIMARY KEY,
  flight_id INT REFERENCES flights(flight_id) ON DELETE CASCADE,
  seat_number VARCHAR(5) NOT NULL, -- e.g. '12A'
  class VARCHAR(20) NOT NULL CHECK (class IN ('economy','business','first')),
  price_modifier NUMERIC(5,2) DEFAULT 1.0, -- 1.2 = +20%
  is_available BOOLEAN DEFAULT TRUE,
  UNIQUE (flight_id, seat_number)
);

CREATE TABLE bookings (
  booking_id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(user_id),
  flight_id INT REFERENCES flights(flight_id),
  seat_id INT REFERENCES seats(seat_id),
  booking_time TIMESTAMPTZ DEFAULT NOW(),
  status VARCHAR(20) NOT NULL CHECK (status IN ('pending','confirmed','cancelled')),
  total_price NUMERIC(10,2),
  confirmation_code VARCHAR(12) UNIQUE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE customer_info (
  info_id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
  passport_number VARCHAR(30),
  nationality VARCHAR(50),
  date_of_birth DATE,
  gender VARCHAR(10),
  address TEXT,
  emergency_contact_name VARCHAR(100),
  emergency_contact_phone VARCHAR(20)
);
~~~


#### Advanced Features

- **User Authentication**  
  - Google sign-in via OAuth/OpenID; token exchange at backend; secure token storage; link to existing accounts by email.

- **Push Notifications**  
  - Register Expo push tokens at login.  
  - Booking lifecycle alerts (departure reminders, delay updates); deep-link to the relevant screen.


#### Optional Features (post-core, if time permits)

- **Nearest Airport Suggestion**  
  - Use `expo-location` on launch (with permission) to prefill departure with the nearest airport.


#### How this fulfills course requirements

- React Native + Expo + TypeScript: strict typing across UI, navigation, API.  
- Navigation & data passing: Expo Router, dynamic routes, typed params.  
- State & persistence: Context/`useReducer` + AsyncStorage/SecureStore.  
- Notifications: at least one local notification; push as advanced.  
- Backend integration: live REST API, real-time fetch, robust error handling, API-driven navigation.  
- Deployment: EAS builds with testable links; API/DB containerized for reliability.  
- Advanced features (≥2): Google login + Push notifications.


#### Scope Control

MVP covers Search → Detail/Seat → Checkout → Confirmation → Bookings, plus basic admin CRUD. Payments use a mock to limit risk.


#### Timeline (6 sprints)

- **S1:** scaffold + navigation  
- **S2:** search/results API  
- **S3:** booking + seat map  
- **S4:** auth (email/password) + bookings  
- **S5:** admin + local notifications  
- **S6:** polish, Google OAuth + push, EAS builds

---

### 3. Tentative Plan

We split responsibilities by user role (customer/admin) and application layer (frontend/backend). Each member owns clear deliverables and meets at defined integration points. Agile sprints, weekly meetings, and GitHub Projects drive execution.

**Yiyang Wang — Backend (Admin & Data Model/Infra)**
- DB schema/migrations (cities, airports, routes, flights [UTC], prices, seats, bookings).
- RBAC middleware; Admin CRUD (prices/capacity/flight schedule); booking oversight.
- OpenAPI (single source) → Swagger UI + Postman collection.
- PDF receipt & object storage (optional if time is tight); seat-hold cleanup job.
- Deploy API/DB (Docker Compose on a small VM); observability basics.

**Zihan Wan — Backend (Customer APIs & Auth)**
- Auth: email + password, MFA (email code), JWT; Google OAuth token exchange.
- Customer APIs: airports/routes/flights search; booking create/cancel (with seat hold + DB transaction); user profile.
- Validation/middleware; unit tests; seed data for users & public refs.
- In-app/push event emitters for booking lifecycle.

**Yuan Wang — Mobile Frontend (Admin & Platform)**
- Admin screens: cities, airports, routes, flights, prices, seats; booking list/actions.
- Auth UI: register/login, Google sign-in, MFA; SecureStore; route guards.
- Push notifications (Expo Push); deep links to `/booking/[id]`; settings/opt-in.
- CI for mobile (builds on PR); QA checklist; accessibility pass.

**Yiyang Liu — Mobile Frontend (Customer App)**
- Expo RN + TypeScript scaffold; Expo Router structure.
- Screens: Search, Results, Flight Detail & Seat Map, Checkout, Confirmation, Bookings, Profile.
- State: Context + reducer; AsyncStorage (prefs/last search); error/loading UX.
- Payment page (mock validation); local notifications; EAS builds (dev/preview/prod).

#### Collaboration & Integration

- **Weekly meeting (Google Meet):** Frontend (Expo RN) and backend (Express + PostgreSQL) proceed in parallel: start with mock data, then swap to stable APIs. OpenAPI keeps contracts aligned.
- **Version control (GitHub):** We will manage project code through feature branches and merges to ensure code consistency and prevent conflicts. 
- **Deployment:** Deploy API/DB via Docker Compose locally and a small cloud VM; mobile builds via Expo EAS (dev/preview/prod). 
- **Final phase focus:** End-to-end integration (Google sign-in, booking flow, push notifications), then testing, accessibility pass, and polish before submission.

The project is scoped for delivery within the course timeframe. Each team member has distinct, non-overlapping responsibilities to minimize conflicts. Early use of mock data ensures frontend progress while the backend stabilizes. We’ve already planned for deployment, testing, and fallback options. All core and advanced features align with course requirements, and the team’s skill sets and weekly coordination make this execution plan realistic and sustainable.