// Utility functions for formatting data

export const formatCurrency = (amount: number, currency: string = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
};

export const formatDate = (date: string | Date, format: 'short' | 'long' = 'short'): string => {
  let dateObj: Date;
  
  if (typeof date === 'string') {
    // Check if it's just a date string (YYYY-MM-DD) without time
    // To avoid timezone shifts, parse it as local date
    if (date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const [year, month, day] = date.split('-').map(Number);
      dateObj = new Date(year, month - 1, day); // Create as local date
    } else {
      // Parse ISO timestamp strings with timezone info
      // e.g., "2026-01-01T11:00:00.000Z" or "2026-01-01 11:00:00.000000 +00:00"
      dateObj = new Date(date);
    }
  } else {
    dateObj = date;
  }
  
  // Check if date is valid
  if (isNaN(dateObj.getTime())) {
    return date as string; // Return original if invalid
  }
  
  // Display in user's local timezone (JavaScript default behavior)
  if (format === 'long') {
    return dateObj.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }
  
  return dateObj.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

export const formatTime = (time: string | Date): string => {
  // If it's a Date object or ISO timestamp, format it to local time
  if (time instanceof Date || (typeof time === 'string' && (time.includes('T') || time.includes('+')))) {
    const dateObj = time instanceof Date ? time : new Date(time);
    return dateObj.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  }
  
  // Legacy format: "HH:MM"
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes} ${ampm}`;
};

export const calculateDuration = (departureTime: string, arrivalTime: string): string => {
  const [depHours, depMinutes] = departureTime.split(':').map(Number);
  const [arrHours, arrMinutes] = arrivalTime.split(':').map(Number);
  
  const depTotalMinutes = depHours * 60 + depMinutes;
  const arrTotalMinutes = arrHours * 60 + arrMinutes;
  
  let durationMinutes = arrTotalMinutes - depTotalMinutes;
  if (durationMinutes < 0) {
    durationMinutes += 24 * 60; // Handle overnight flights
  }
  
  const hours = Math.floor(durationMinutes / 60);
  const minutes = durationMinutes % 60;
  
  return `${hours}h ${minutes}m`;
};

export const formatPhoneNumber = (phone: string): string => {
  // Format: +1 (555) 123-4567
  const cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  } else if (cleaned.length === 11) {
    return `+${cleaned[0]} (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }
  
  return phone;
};

export const formatPassengerName = (firstName: string, lastName: string): string => {
  return `${firstName} ${lastName}`;
};

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
};

export const getInitials = (name: string): string => {
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

// Format UTC timestamp to local date and time
export const formatDateTime = (timestamp: string | Date): { date: string; time: string } => {
  const dateObj = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
  
  if (isNaN(dateObj.getTime())) {
    return { date: '', time: '' };
  }
  
  const date = dateObj.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  
  const time = dateObj.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
  
  return { date, time };
};

// Format UTC timestamp to a specific timezone (e.g., for departure/arrival cities)
export const formatTimeInTimezone = (timestamp: string | Date, timezone?: string): string => {
  if (!timestamp) return '';
  
  try {
    const dateObj = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
    
    if (isNaN(dateObj.getTime())) return '';
    
    // If timezone is provided (e.g., 'America/Toronto', 'America/Vancouver')
    if (timezone) {
      return dateObj.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: false,
        timeZone: timezone,
      });
    }
    
    // Fallback to local timezone
    return dateObj.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: false,
    });
  } catch (error) {
    // If timezone is invalid, fall back to local time
    return formatTime(timestamp);
  }
};

// Get timezone abbreviation for display (e.g., "EST", "PST")
export const getTimezoneAbbr = (timestamp: string | Date, timezone?: string): string => {
  if (!timestamp || !timezone) return '';
  
  try {
    const dateObj = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
    
    if (isNaN(dateObj.getTime())) return '';
    
    // Get timezone abbreviation
    const formatted = dateObj.toLocaleTimeString('en-US', {
      timeZone: timezone,
      timeZoneName: 'short',
    });
    
    // Extract abbreviation (e.g., "3:00:00 PM EST" -> "EST")
    const match = formatted.match(/\b[A-Z]{3,4}\b/);
    return match ? match[0] : '';
  } catch {
    return '';
  }
};

