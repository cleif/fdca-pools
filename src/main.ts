// src/main.ts

import {
  pools,
  pricingTiers,
  getTimeSlotsForPool,
  formatHour,
  formatDate,
  generateBookingId,
  PEAK_SURCHARGE_PER_SWIMMER,
} from './data';
import { calculatePrice } from './pricing';
import type { TimeSlot, SwimmerCounts, BookingConfirmation } from './types';

// ─────────────────────────────────────────────
// State
// ─────────────────────────────────────────────

let selectedPoolId: string  = pools[0]!.id;
let selectedDate:   Date | null = null;
let selectedSlot:   TimeSlot | null = null;

const swimmerCounts: SwimmerCounts = {
  adults:   0,
  seniors:  0,
  youth:    0,
  toddlers: 0,
};

function totalSwimmers(): number {
  return (Object.values(swimmerCounts) as number[]).reduce((a, b) => a + b, 0);
}

// ─────────────────────────────────────────────
// Render: Location Cards
// ─────────────────────────────────────────────

function renderLocations(): void {
  const grid = document.getElementById('locations-grid');
  if (!grid) return;

  grid.innerHTML = pools.map(pool => {
    const wd = pool.hours.weekdays;
    const we = pool.hours.weekends;
    const tag = pool.id === 'west' ? '🌊 West Location' : '🔥 South Location';

    return `
      <div class="pool-card">
        <div class="pool-card-header ${pool.id}">
          <div class="pool-card-tag">${tag}</div>
          <div class="pool-card-name">${pool.fullName}</div>
          <div class="pool-card-address">📍 ${pool.address}</div>
        </div>

        <div class="pool-card-stats">
          <div class="pool-stat">
            <span class="pool-stat-num">${pool.lanes}</span>
            <span class="pool-stat-label">Lanes</span>
          </div>
          <div class="pool-stat">
            <span class="pool-stat-num">${pool.maxCapacity}</span>
            <span class="pool-stat-label">Capacity</span>
          </div>
          <div class="pool-stat">
            <span class="pool-stat-num">${pool.amenities.length}</span>
            <span class="pool-stat-label">Amenities</span>
          </div>
        </div>

        <div class="pool-card-body">
          <div class="pool-section-title">Amenities</div>
          <ul class="amenities-list">
            ${pool.amenities.map(a => `<li class="amenity-tag">${a}</li>`).join('')}
          </ul>

          <div class="pool-section-title">Hours</div>
          <div class="hours-grid">
            <div class="hours-item">
              <div class="hours-day">Mon – Fri</div>
              <div class="hours-time">${formatHour(wd.open)} – ${formatHour(wd.close)}</div>
            </div>
            <div class="hours-item">
              <div class="hours-day">Sat – Sun</div>
              <div class="hours-time">${formatHour(we.open)} – ${formatHour(we.close)}</div>
            </div>
          </div>

          <div class="pool-section-title">Phone</div>
          ${pool.phone ? `<p class="pool-card-phone">${pool.phone}</p>` : ''}

          <a href="#schedule" class="btn pool-card-cta" data-pool-id="${pool.id}">
            Book at ${pool.name} →
          </a>
        </div>
      </div>
    `;
  }).join('');

  // "Book at …" buttons pre-select the correct pool in the scheduler
  grid.querySelectorAll<HTMLElement>('[data-pool-id]').forEach(el => {
    el.addEventListener('click', () => {
      const id = el.dataset['poolId']!;
      const radio = document.querySelector<HTMLInputElement>(`input[name="pool"][value="${id}"]`);
      if (radio) {
        radio.checked = true;
        radio.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });
  });
}

// ─────────────────────────────────────────────
// Render: Pricing Section
// ─────────────────────────────────────────────

function renderPricing(): void {
  const container = document.getElementById('pricing-content');
  if (!container) return;

  const cards = pricingTiers.map(tier => {
    const cans = Array(tier.cansPerSession).fill('<div class="can-icon">🍺</div>').join('');
    return `
      <div class="pricing-card">
        <div class="pricing-emoji">${tier.emoji}</div>
        <div class="pricing-tier">${tier.label}</div>
        <div class="pricing-desc">${tier.description}</div>
        <div class="pricing-cans-visual">${cans}</div>
        <div class="pricing-cans-label">${tier.cansPerSession} 🍺 can${tier.cansPerSession !== 1 ? 's' : ''}</div>
        <div class="pricing-cans-sub">per session</div>
      </div>
    `;
  }).join('');

  container.innerHTML = `
    <div class="pricing-grid">${cards}</div>
    <div class="pricing-peak-note">
      <span class="peak-icon">⚡</span>
      <div>
        <strong>Peak Hours Surcharge: +${PEAK_SURCHARGE_PER_SWIMMER} 🍺 can per swimmer</strong>
        Applies on weekends and weekday evenings (5:00 PM and later).
        We call it the "rush hour splash tax."
      </div>
    </div>
  `;
}

// ─────────────────────────────────────────────
// Render: Pool Picker (scheduler)
// ─────────────────────────────────────────────

function renderPoolOptions(): void {
  const container = document.getElementById('pool-options');
  if (!container) return;

  container.innerHTML = pools.map((pool, i) => `
    <div class="pool-option">
      <input
        type="radio"
        name="pool"
        id="pool-${pool.id}"
        value="${pool.id}"
        ${i === 0 ? 'checked' : ''}
      />
      <label class="pool-option-label" for="pool-${pool.id}">
        <div class="pool-option-name">${pool.id === 'west' ? '🌊' : '🔥'} ${pool.name}</div>
        <div class="pool-option-addr">${pool.address}</div>
      </label>
    </div>
  `).join('');
}

// ─────────────────────────────────────────────
// Render: Swimmer Counters
// ─────────────────────────────────────────────

function renderSwimmerCounts(): void {
  const container = document.getElementById('swimmer-counts');
  if (!container) return;

  container.innerHTML = pricingTiers.map(tier => `
    <div class="swimmer-row">
      <div class="swimmer-info">
        <div class="swimmer-label">${tier.emoji} ${tier.label}</div>
        <div class="swimmer-desc">${tier.description}</div>
      </div>
      <div class="swimmer-price">${tier.cansPerSession} 🍺/session</div>
      <div class="swimmer-counter">
        <button
          type="button"
          class="counter-btn"
          data-action="dec"
          data-tier="${tier.id}"
          aria-label="Remove ${tier.label}"
        >−</button>
        <span class="counter-value" id="count-${tier.id}">0</span>
        <button
          type="button"
          class="counter-btn"
          data-action="inc"
          data-tier="${tier.id}"
          aria-label="Add ${tier.label}"
        >+</button>
      </div>
    </div>
  `).join('');
}

// ─────────────────────────────────────────────
// Update: Time Slots
// ─────────────────────────────────────────────

function updateTimeSlots(): void {
  const container = document.getElementById('time-slots');
  if (!container) return;

  if (!selectedDate) {
    container.innerHTML = '<p class="placeholder-text">Select a date to see available times</p>';
    return;
  }

  const slots = getTimeSlotsForPool(selectedPoolId, selectedDate);

  if (slots.length === 0) {
    container.innerHTML = '<p class="placeholder-text">No slots available for this selection</p>';
    return;
  }

  selectedSlot = null;

  container.innerHTML = slots.map(slot => `
    <div class="time-slot">
      <input type="radio" name="timeslot" id="slot-${slot.id}" value="${slot.id}" />
      <label class="time-slot-label" for="slot-${slot.id}">
        <span class="time-slot-time">${slot.label}</span>
        ${slot.isPeak ? '<span class="time-slot-peak">⚡ Peak</span>' : ''}
      </label>
    </div>
  `).join('');

  container.querySelectorAll<HTMLInputElement>('input[name="timeslot"]').forEach(radio => {
    radio.addEventListener('change', () => {
      const slot = slots.find(s => s.id === radio.value);
      if (slot) {
        selectedSlot = slot;
        refreshPriceSummary();
        refreshBookButton();
      }
    });
  });

  refreshPriceSummary();
  refreshBookButton();
}

// ─────────────────────────────────────────────
// Update: Price Summary
// ─────────────────────────────────────────────

function refreshPriceSummary(): void {
  const summary    = document.getElementById('price-summary');
  const breakdownEl = document.getElementById('price-breakdown');
  const totalEl    = document.getElementById('total-cans');
  if (!summary || !breakdownEl || !totalEl) return;

  if (!selectedSlot || totalSwimmers() === 0) {
    summary.classList.add('hidden');
    return;
  }

  summary.classList.remove('hidden');
  const bd = calculatePrice(swimmerCounts, selectedSlot);

  breakdownEl.innerHTML = [
    ...bd.lineItems.map(item => `
      <div class="price-line">
        <span>${item.label}</span>
        <span>${item.cans} 🍺</span>
      </div>
    `),
    bd.peakSurcharge > 0 ? `
      <hr class="price-divider" />
      <div class="price-line peak">
        <span>⚡ Peak surcharge (${totalSwimmers()}× swimmers)</span>
        <span>+${bd.peakSurcharge} 🍺</span>
      </div>
    ` : '',
  ].join('');

  totalEl.textContent = `${bd.total} 🍺 cans`;
}

// ─────────────────────────────────────────────
// Update: Book Button
// ─────────────────────────────────────────────

function refreshBookButton(): void {
  const btn = document.getElementById('book-btn') as HTMLButtonElement | null;
  if (!btn) return;
  btn.disabled = !(selectedDate && selectedSlot && totalSwimmers() > 0);
}

// ─────────────────────────────────────────────
// Modal
// ─────────────────────────────────────────────

function openModal(conf: BookingConfirmation): void {
  const modal = document.getElementById('booking-modal');
  const body  = document.getElementById('modal-body');
  if (!modal || !body) return;

  const swimmerSummary = conf.swimmers
    .filter(s => s.count > 0)
    .map(s => `${s.count}× ${s.label}`)
    .join(', ');

  body.innerHTML = `
    <div class="modal-detail">
      <span class="modal-detail-label">Booking ID</span>
      <span class="modal-detail-value">${conf.bookingId}</span>
    </div>
    <div class="modal-detail">
      <span class="modal-detail-label">Location</span>
      <span class="modal-detail-value">${conf.poolName}</span>
    </div>
    <div class="modal-detail">
      <span class="modal-detail-label">Address</span>
      <span class="modal-detail-value">${conf.poolAddress}</span>
    </div>
    <div class="modal-detail">
      <span class="modal-detail-label">Date</span>
      <span class="modal-detail-value">${conf.date}</span>
    </div>
    <div class="modal-detail">
      <span class="modal-detail-label">Time</span>
      <span class="modal-detail-value">${conf.timeSlot}${conf.isPeak ? ' ⚡' : ''}</span>
    </div>
    <div class="modal-detail">
      <span class="modal-detail-label">Swimmers</span>
      <span class="modal-detail-value">${swimmerSummary}</span>
    </div>
    <div class="modal-detail">
      <span class="modal-detail-label" style="font-weight:800;color:var(--navy-dark)">Amount Due</span>
      <span class="modal-detail-value modal-total">${conf.totalCans} 🍺 cans</span>
    </div>
  `;

  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal(): void {
  document.getElementById('booking-modal')?.classList.remove('open');
  document.body.style.overflow = '';
}

// ─────────────────────────────────────────────
// Init
// ─────────────────────────────────────────────

function init(): void {
  renderLocations();
  renderPricing();
  renderPoolOptions();
  renderSwimmerCounts();

  // Date input — default to today
  const dateInput = document.getElementById('swim-date') as HTMLInputElement;
  const todayStr  = new Date().toISOString().split('T')[0]!;
  dateInput.min   = todayStr;
  dateInput.value = todayStr;
  selectedDate    = new Date(`${todayStr}T12:00:00`);

  dateInput.addEventListener('change', () => {
    selectedDate = dateInput.value ? new Date(`${dateInput.value}T12:00:00`) : null;
    selectedSlot = null;
    updateTimeSlots();
  });

  // Pool picker
  document.getElementById('pool-options')!.addEventListener('change', e => {
    const radio = e.target as HTMLInputElement;
    if (radio.type === 'radio' && radio.name === 'pool') {
      selectedPoolId = radio.value;
      selectedSlot   = null;
      updateTimeSlots();
    }
  });

  // Swimmer counters (event delegation)
  document.getElementById('swimmer-counts')!.addEventListener('click', e => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('.counter-btn');
    if (!btn) return;

    const action = btn.dataset['action']!;
    const tier   = btn.dataset['tier']! as keyof SwimmerCounts;

    if (action === 'inc') {
      swimmerCounts[tier]++;
    } else if (action === 'dec' && swimmerCounts[tier] > 0) {
      swimmerCounts[tier]--;
    }

    const el = document.getElementById(`count-${tier}`);
    if (el) el.textContent = String(swimmerCounts[tier]);

    refreshPriceSummary();
    refreshBookButton();
  });

  // Form submit → booking confirmation
  const form = document.getElementById('booking-form') as HTMLFormElement;
  form.addEventListener('submit', e => {
    e.preventDefault();
    if (!selectedDate || !selectedSlot) return;

    const pool = pools.find(p => p.id === selectedPoolId)!;
    const bd   = calculatePrice(swimmerCounts, selectedSlot);

    const conf: BookingConfirmation = {
      bookingId:   generateBookingId(),
      poolName:    pool.fullName,
      poolAddress: pool.address,
      date:        formatDate(selectedDate),
      timeSlot:    selectedSlot.label,
      isPeak:      selectedSlot.isPeak,
      swimmers:    pricingTiers.map(t => ({ label: t.label, count: swimmerCounts[t.id] })),
      totalCans:   bd.total,
    };

    openModal(conf);
  });

  // Modal close
  document.getElementById('modal-close')!.addEventListener('click', closeModal);
  document.querySelector('.modal-backdrop')!.addEventListener('click', closeModal);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

  // Initial time slot load
  updateTimeSlots();
}

document.addEventListener('DOMContentLoaded', init);
