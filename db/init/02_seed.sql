SET TIME ZONE 'UTC';

-- Cities
INSERT INTO cities (city_name, country, timezone) VALUES
  ('Toronto', 'Canada', 'America/Toronto'),
  ('Vancouver', 'Canada', 'America/Vancouver'),
  ('Montréal', 'Canada', 'America/Toronto')
ON CONFLICT DO NOTHING;

-- Airports
INSERT INTO airports (city_id, airport_code, airport_name)
SELECT c.city_id, 'YYZ', 'Toronto Pearson International Airport'
FROM cities c WHERE c.city_name='Toronto'
ON CONFLICT DO NOTHING;

INSERT INTO airports (city_id, airport_code, airport_name)
SELECT c.city_id, 'YVR', 'Vancouver International Airport'
FROM cities c WHERE c.city_name='Vancouver'
ON CONFLICT DO NOTHING;

INSERT INTO airports (city_id, airport_code, airport_name)
SELECT c.city_id, 'YUL', 'Montréal–Trudeau International Airport'
FROM cities c WHERE c.city_name='Montréal'
ON CONFLICT DO NOTHING;

-- Airlines
INSERT INTO airlines (airline_name, airline_code) VALUES
  ('Air Canada', 'AC'),
  ('WestJet', 'WS')
ON CONFLICT DO NOTHING;

-- Routes (domestic, active)
INSERT INTO routes (airline_id, origin_airport_id, destination_airport_id, domestic, seasonal, active)
SELECT a.airline_id, ap_from.airport_id, ap_to.airport_id, TRUE, FALSE, TRUE
FROM airlines a
JOIN airports ap_from ON ap_from.airport_code='YYZ'
JOIN airports ap_to   ON ap_to.airport_code IN ('YVR','YUL')
WHERE a.airline_code='AC'
ON CONFLICT DO NOTHING;

-- Flights for next 3 days, 09:00->12:00 UTC-ish (adjust front-end by local tz)
WITH ac AS (
  SELECT airline_id FROM airlines WHERE airline_code='AC'
),
pairs AS (
  SELECT r.route_id, r.origin_airport_id, r.destination_airport_id
  FROM routes r JOIN airlines a ON r.airline_id=a.airline_id AND a.airline_code='AC'
),
days AS (
  SELECT generate_series(1,3) AS d
)
INSERT INTO flights (airline_id, departure_airport_id, arrival_airport_id, departure_time, arrival_time, base_price, seat_capacity)
SELECT (SELECT airline_id FROM ac),
       p.origin_airport_id,
       p.destination_airport_id,
       date_trunc('day', NOW()) + d.d * INTERVAL '1 day' + TIME '09:00',
       date_trunc('day', NOW()) + d.d * INTERVAL '1 day' + TIME '12:00',
       199.00,
       120
FROM pairs p CROSS JOIN days d
ON CONFLICT DO NOTHING;

-- Seats: 20 rows x 6 letters = 120 seats per flight
WITH letters AS (
  SELECT unnest(ARRAY['A','B','C','D','E','F']) AS col
),
rows AS (
  SELECT generate_series(1,20) AS r
)
INSERT INTO seats (flight_id, seat_number, class, price_modifier, is_available)
SELECT f.flight_id,
       (r.r::text || l.col),
       CASE WHEN r.r <= 3 THEN 'business' ELSE 'economy' END,
       CASE WHEN r.r <= 3 THEN 1.80 ELSE 1.00 END,
       TRUE
FROM flights f
CROSS JOIN rows r
CROSS JOIN letters l
ON CONFLICT DO NOTHING;

-- Demo user (password hash placeholder)
INSERT INTO users (role, email, password_hash, full_name, phone)
VALUES ('customer', 'demo@example.com', '$2b$12$replace_this_with_a_real_bcrypt_hash', 'Demo User', '+1-000-000-0000')
ON CONFLICT DO NOTHING;
