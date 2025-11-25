-- Add push_token column to User table
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "push_token" VARCHAR(255);

-- Add new NotificationType enum values
-- Note: These values are added to support the updated schema
-- The old values (booking_confirmed, booking_cancelled, flight_cancelled) remain for backward compatibility
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'BOOKING_CONFIRMATION';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'BOOKING_CANCELLATION';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'PAYMENT_SUCCESS';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'PAYMENT_FAILED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'FLIGHT_REMINDER';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'FLIGHT_DELAYED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'FLIGHT_CANCELLED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'GENERAL';

