// src/types.ts

export interface PoolLocation {
  id: string;
  name: string;
  fullName: string;
  address: string;
  phone?: string;
  lanes: number;
  maxCapacity: number;
  amenities: string[];
  hours: {
    weekdays: { open: number; close: number };
    weekends: { open: number; close: number };
  };
}

export interface PricingTier {
  id: keyof SwimmerCounts;
  label: string;
  description: string;
  cansPerSession: number;
  emoji: string;
}

export interface TimeSlot {
  id: string;
  label: string;
  startHour: number;
  endHour: number;
  isPeak: boolean;
}

export interface SwimmerCounts {
  adults: number;
  seniors: number;
  youth: number;
  toddlers: number;
}

export interface PriceBreakdown {
  lineItems: Array<{ label: string; cans: number }>;
  peakSurcharge: number;
  total: number;
}

export interface BookingConfirmation {
  bookingId: string;
  poolName: string;
  poolAddress: string;
  date: string;
  timeSlot: string;
  isPeak: boolean;
  swimmers: Array<{ label: string; count: number }>;
  totalCans: number;
}
