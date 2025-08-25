import { format } from 'date-fns';
import { formatInTimeZone, toZonedTime } from 'date-fns-tz';

const EST_TIMEZONE = 'America/New_York';

export const formatInEST = (date: Date, formatStr: string): string => {
  return formatInTimeZone(date, EST_TIMEZONE, formatStr);
};

export const formatFirestoreTimestamp = (timestamp: any, formatStr: string): string => {
  if (!timestamp || !timestamp.seconds) return '';
  const date = new Date(timestamp.seconds * 1000);
  return formatInTimeZone(date, EST_TIMEZONE, formatStr);
};

export const getCurrentDateEST = (formatStr: string = 'yyyy-MM-dd'): string => {
  const now = new Date();
  const zonedDate = toZonedTime(now, EST_TIMEZONE);
  return format(zonedDate, formatStr);
};

export const formatCurrentDateEST = (formatStr: string): string => {
  return getCurrentDateEST(formatStr);
};
