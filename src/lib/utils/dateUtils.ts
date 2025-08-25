import { format, addDays } from 'date-fns';
import { formatInTimeZone, toZonedTime } from 'date-fns-tz';

const EST_TIMEZONE = 'America/New_York';

export const formatInEST = (date: Date, formatStr: string): string => {
  return formatInTimeZone(date, EST_TIMEZONE, formatStr);
};

export const formatFirestoreTimestamp = (timestamp: any, formatStr: string): string => {
  if (!timestamp) return '';
  
  let date: Date;
  if (timestamp.toDate) {
    // Firestore Timestamp object
    date = timestamp.toDate();
  } else if (timestamp.seconds) {
    // Firestore Timestamp with seconds
    date = new Date(timestamp.seconds * 1000);
  } else {
    // Regular Date object or string
    date = new Date(timestamp);
  }
  
  return formatInTimeZone(date, EST_TIMEZONE, formatStr);
};

// Convert Firestore timestamp to JavaScript Date
export const convertFirestoreTimestamp = (timestamp: any): Date => {
  if (!timestamp) return new Date();

  try {
    // Check if it's a Firestore Timestamp object
    if (timestamp.toDate && typeof timestamp.toDate === 'function') {
      return timestamp.toDate();
    }

    // Check if it's a Firestore Timestamp with seconds/nanoseconds
    if (timestamp.seconds) {
      return new Date(timestamp.seconds * 1000 + (timestamp.nanoseconds || 0) / 1000000);
    }

    // Check if it's a Firestore Timestamp with _seconds (serialized format)
    if (timestamp._seconds) {
      return new Date(timestamp._seconds * 1000 + (timestamp._nanoseconds || 0) / 1000000);
    }

    // Check if it's already a Date object
    if (timestamp instanceof Date) {
      return timestamp;
    }

    // Check if it's a string that looks like a Firestore timestamp
    if (typeof timestamp === 'string') {
      // Handle "August 25, 2025 at 11:14:17 AM UTC-4" format
      const dateMatch = timestamp.match(/(\w+ \d{1,2}, \d{4}) at (\d{1,2}:\d{2}:\d{2})/);
      if (dateMatch) {
        return new Date(`${dateMatch[1]} ${dateMatch[2]}`);
      }

      // Try parsing as regular date string
      const parsed = new Date(timestamp);
      if (!isNaN(parsed.getTime())) {
        return parsed;
      }
    }

    // Check if it's a number (Unix timestamp)
    if (typeof timestamp === 'number') {
      return new Date(timestamp);
    }

    // Last resort - try creating Date directly
    const date = new Date(timestamp);
    return isNaN(date.getTime()) ? new Date() : date;

  } catch (error) {
    console.error('Error converting Firestore timestamp:', error, timestamp);
    return new Date();
  }
};

export const getCurrentDateEST = (formatStr: string = 'yyyy-MM-dd'): string => {
  const now = new Date();
  const zonedDate = toZonedTime(now, EST_TIMEZONE);
  return format(zonedDate, formatStr);
};

export const formatCurrentDateEST = (formatStr: string): string => {
  return getCurrentDateEST(formatStr);
};

// Get the target date for orders (next day)
export const getOrderTargetDateEST = (formatStr: string = 'yyyy-MM-dd'): string => {
  const now = new Date();
  const zonedDate = toZonedTime(now, EST_TIMEZONE);
  const nextDay = addDays(zonedDate, 1);
  return format(nextDay, formatStr);
};

// Check if orders are currently allowed (9 AM to 9 PM EST)
export const areOrdersAllowed = (): { allowed: boolean; message?: string } => {
  const now = new Date();
  const estTime = toZonedTime(now, EST_TIMEZONE);
  const currentHour = estTime.getHours();
  
  if (currentHour < 9) {
    return {
      allowed: false,
      message: 'Orders are only accepted between 9 AM and 9 PM EST'
    };
  }
  
  if (currentHour >= 21) {
    return {
      allowed: false,
      message: 'Orders are only accepted between 9 AM and 9 PM EST'
    };
  }
  
  return { allowed: true };
};
