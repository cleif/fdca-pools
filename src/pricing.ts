// src/pricing.ts

import type { PriceBreakdown, SwimmerCounts, TimeSlot } from './types';
import { pricingTiers, PEAK_SURCHARGE_PER_SWIMMER } from './data';

export function calculatePrice(swimmers: SwimmerCounts, timeSlot: TimeSlot): PriceBreakdown {
  const lineItems: Array<{ label: string; cans: number }> = [];
  let subtotal = 0;
  let totalSwimmers = 0;

  for (const tier of pricingTiers) {
    const count = swimmers[tier.id];
    if (count > 0) {
      const cans = count * tier.cansPerSession;
      lineItems.push({
        label: `${count}× ${tier.label} (${tier.cansPerSession} 🍺 ea.)`,
        cans,
      });
      subtotal += cans;
      totalSwimmers += count;
    }
  }

  const peakSurcharge = timeSlot.isPeak ? PEAK_SURCHARGE_PER_SWIMMER * totalSwimmers : 0;

  return { lineItems, peakSurcharge, total: subtotal + peakSurcharge };
}
