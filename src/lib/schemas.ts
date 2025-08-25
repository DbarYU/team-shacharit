// Database schema definitions

// Firestore timestamp type
export interface FirestoreTimestamp {
  seconds: number;
  nanoseconds: number;
  toDate(): Date;
}

export const UserSchema = {
  uid: 'string', // Firebase Auth UID
  email: 'string',
  displayName: 'string',
  phoneNumber: 'string?', // Optional
  dietaryRestrictions: 'array<string>', // Array of dietary restrictions
  isAdmin: 'boolean', // Admin privileges for QR generation, etc.
  // Removed notifications - simplified system

  createdAt: 'timestamp',
  updatedAt: 'timestamp',
  lastLoginAt: 'timestamp'
};

export const DailyOrderSchema = {
  id: 'string', // Auto-generated document ID
  userId: 'string', // Reference to User document
  date: 'string', // Format: YYYY-MM-DD (EST)
  bagelType: 'string', // One of DEFAULT_BAGEL_TYPES
  withPotatoes: 'boolean',
  withCheese: 'boolean',
  dietaryNotes: 'string',
  orderTimestamp: 'timestamp',
  status: 'string' // One of ORDER_STATUS values
};

export const AttendanceSchema = {
  id: 'string', // Auto-generated document ID
  userId: 'string', // Reference to User document
  date: 'string', // Format: YYYY-MM-DD (EST)
  checkInTime: 'timestamp',
  qrCodeId: 'string' // Reference to QR code used
};

export const QRCodeSchema = {
  id: 'string', // Auto-generated document ID
  date: 'string', // Format: YYYY-MM-DD (EST)
  code: 'string', // The actual QR code content (hashed)
  createdAt: 'timestamp',
  createdBy: 'string', // User ID who generated it
  isActive: 'boolean',
  expiresAt: 'timestamp'
};

export const AnalyticsSchema = {
  id: 'string', // Auto-generated document ID
  date: 'string', // Format: YYYY-MM-DD (EST)
  totalOrders: 'number',
  totalAttendance: 'number',
  bagelBreakdown: 'object', // { plain: 5, everything: 3, ... }
  orderDeadlineMissed: 'number', // Count of users who missed deadline
  averageOrderTime: 'string', // Average time when orders were placed
  generatedAt: 'timestamp'
};

// Enums and Constants
export const ORDER_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed'
};

export const DEFAULT_BAGEL_TYPES = [
  'plain',
  'sesame',
  'everything',
  'wrap',
  'no_bagel'
];

export const COLLECTIONS = {
  USERS: 'users',
  DAILY_ORDERS: 'dailyOrders',
  ATTENDANCE: 'attendance',
  QR_CODES: 'qrCodes',
  ANALYTICS: 'analytics'
};

// Default system settings
export const SYSTEM_SETTINGS = {
  orderStartHour: 9, // 9 AM EST
  orderEndHour: 21, // 9 PM EST
  bagel_types: DEFAULT_BAGEL_TYPES,
  defaultBagelType: 'plain',
  systemTimezone: 'America/New_York'
};

export type User = {
  uid: string;
  email: string;
  displayName: string;
  phoneNumber?: string;
  dietaryRestrictions: string[];
  isAdmin?: boolean;
  createdAt: FirestoreTimestamp | Date;
  updatedAt: FirestoreTimestamp | Date;
  lastLoginAt: FirestoreTimestamp | Date;
};

export type DailyOrder = {
  id: string;
  userId: string;
  date: string;
  bagelType: string;
  withPotatoes: boolean;
  withCheese: boolean;
  dietaryNotes: string;
  orderTimestamp: FirestoreTimestamp | Date;
  status: string;
};

export type Attendance = {
  id: string;
  userId: string;
  date: string;
  checkInTime: FirestoreTimestamp | Date;
  qrCodeId: string;
};

export type QRCode = {
  id: string;
  date: string;
  code: string;
  createdAt: FirestoreTimestamp | Date;
  createdBy: string;
  isActive: boolean;
  expiresAt: FirestoreTimestamp | Date;
};
