import { format, addDays } from 'date-fns';
import { formatInTimeZone, toZonedTime } from 'date-fns-tz';
import { FirestoreTimestamp } from '@/lib/schemas';

const EST_TIMEZONE = 'America/New_York';

export const formatInEST = (date: Date, formatStr: string): string => {
  return formatInTimeZone(date, EST_TIMEZONE, formatStr);
};

export const formatFirestoreTimestamp = (timestamp: FirestoreTimestamp | Date | string | null | undefined, formatStr: string): string => {
  if (!timestamp) return '';
  
  let date: Date;
  if (typeof timestamp === 'object' && timestamp !== null && 'toDate' in timestamp) {
    // Firestore Timestamp object
    date = timestamp.toDate();
  } else if (typeof timestamp === 'object' && timestamp !== null && 'seconds' in timestamp) {
    // Firestore Timestamp with seconds
    date = new Date((timestamp as { seconds: number }).seconds * 1000);
  } else {
    // Regular Date object or string
    date = new Date(timestamp);
  }
  
  return formatInTimeZone(date, EST_TIMEZONE, formatStr);
};

// Convert Firestore timestamp to JavaScript Date
export const convertFirestoreTimestamp = (timestamp: FirestoreTimestamp | Date | string | null | undefined): Date => {
  if (!timestamp) return new Date();

  try {
    // Check if it's a Firestore Timestamp object
    if (typeof timestamp === 'object' && timestamp !== null && 'toDate' in timestamp && typeof timestamp.toDate === 'function') {
      return timestamp.toDate();
    }

    // Check if it's a Firestore Timestamp with seconds/nanoseconds
    if (typeof timestamp === 'object' && timestamp !== null && 'seconds' in timestamp) {
      const ts = timestamp as { seconds: number; nanoseconds?: number };
      return new Date(ts.seconds * 1000 + (ts.nanoseconds || 0) / 1000000);
    }

    // Check if it's a Firestore Timestamp with _seconds (serialized format)
    if (typeof timestamp === 'object' && timestamp !== null && '_seconds' in timestamp) {
      const ts = timestamp as { _seconds: number; _nanoseconds?: number };
      return new Date(ts._seconds * 1000 + (ts._nanoseconds || 0) / 1000000);
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

// Get the target date for orders.
// Policy: Orders placed before 00:00 EST are for the next day; orders at or after 00:00 are for the same day's next day as well (always tomorrow).
// Effectively, always return tomorrow's date in EST.
export const getOrderTargetDateEST = (formatStr: string = 'yyyy-MM-dd'): string => {
  const now = new Date();
  const zonedDate = toZonedTime(now, EST_TIMEZONE);
  const nextDay = addDays(zonedDate, 1);
  return format(nextDay, formatStr);
};

// Orders are allowed 24/7 with a midnight cutoff determining the target date (always tomorrow).
export const areOrdersAllowed = (): { allowed: boolean; message?: string } => {
  return { allowed: true };
};
