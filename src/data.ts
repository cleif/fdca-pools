// src/data.ts

import type { PoolLocation, PricingTier, TimeSlot } from './types';

export const pools: PoolLocation[] = [
  {
    id: 'west',
    name: 'West Location',
    fullName: 'FDCA West Aquatic Center',
    address: '1501 S 179th Ave, Omaha, NE 68130',
    lanes: 8,
    maxCapacity: 120,
    amenities: ['Tiki Pavilion', 'Multiple Large Flat Screen TVs', 'Hot Tub', 'Indoor Restrooms', '1 Wrinkly Dog'],
    hours: {
      weekdays: { open: 6,  close: 21 },
      weekends: { open: 8,  close: 19 },
    },
  },
  {
    id: 'south',
    name: 'South Location',
    fullName: 'FDCA South Family Aquatic Center',
    address: '10207 Emiline St, La Vista, NE 68128',
    lanes: 6,
    maxCapacity: 80,
    amenities: ['New Trees', '2 Spunky Dogs', 'Outdoor TVs', 'Pine Scented Restrooms', 'Sprawling Recycling Pavilion'],
    hours: {
      weekdays: { open: 7,  close: 20 },
      weekends: { open: 9,  close: 18 },
    },
  },
];

export const pricingTiers: PricingTier[] = [
  { id: 'adults',   label: 'Adult',   description: 'Ages 18–64', cansPerSession: 3, emoji: '🏊' },
  { id: 'seniors',  label: 'Senior',  description: 'Ages 65+',   cansPerSession: 2, emoji: '👴' },
  { id: 'youth',    label: 'Youth',   description: 'Ages 5–17',  cansPerSession: 2, emoji: '🧑' },
  { id: 'toddlers', label: 'Toddler', description: 'Under 5',    cansPerSession: 1, emoji: '👶' },
];

export const PEAK_SURCHARGE_PER_SWIMMER = 1;

export function getTimeSlotsForPool(poolId: string, date: Date): TimeSlot[] {
  const pool = pools.find(p => p.id === poolId);
  if (!pool) return [];

  const day = date.getDay();
  const isWeekend = day === 0 || day === 6;
  const { open, close } = isWeekend ? pool.hours.weekends : pool.hours.weekdays;

  const slots: TimeSlot[] = [];
  for (let h = open; h < close; h++) {
    const isPeak = isWeekend || h >= 17;
    slots.push({
      id: String(h),
      label: `${formatHour(h)} – ${formatHour(h + 1)}`,
      startHour: h,
      endHour: h + 1,
      isPeak,
    });
  }
  return slots;
}

export function formatHour(h: number): string {
  const period = h < 12 ? 'AM' : 'PM';
  const display = h % 12 === 0 ? 12 : h % 12;
  return `${display}:00 ${period}`;
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year:    'numeric',
    month:   'long',
    day:     'numeric',
  });
}

export function generateBookingId(): string {
  return 'FDCA-' + Math.random().toString(36).toUpperCase().slice(2, 8);
}
