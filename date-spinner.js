'use strict';

export class DateSpinner {
  constructor(options = {}) {
    this.minYear = options.minYear || 1984;
    this.maxYear = options.maxYear || new Date().getFullYear();
    this.onSpinComplete = options.onSpinComplete || (() => {});
    this.onSpinStart = options.onSpinStart || (() => {});
    this.onSpinStop = options.onSpinStop || (() => {});
    this.isSpinning = false;
    this.spinVelocity = 0;
    this.spinDeceleration = 0.98;
    this.currentYear = this.minYear;
    this.currentMonth = 1;
    this.currentDay = 1;
  }

  init(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) {
      console.error(`DateSpinner container #${containerId} not found`);
      return;
    }

    this.render();
    this.bindEvents();
  }

  render() {
    this.container.innerHTML = `
      <div class="date-spinner-container">
        <div class="wheel year-wheel" id="yearWheel">
          <div class="wheel-label">YEAR</div>
          <div class="wheel-value" id="yearValue">${this.currentYear}</div>
        </div>
        <div class="wheel month-wheel" id="monthWheel">
          <div class="wheel-label">MONTH</div>
          <div class="wheel-value" id="monthValue">${this.currentMonth}</div>
        </div>
        <div class="wheel day-wheel" id="dayWheel">
          <div class="wheel-label">DAY</div>
          <div class="wheel-value" id="dayValue">${this.currentDay}</div>
        </div>
        <button class="spin-button" id="spinButton">SPIN!</button>
        <div class="selected-date" id="selectedDate"></div>
      </div>
    `;

    this.yearWheel = this.container.querySelector('#yearWheel');
    this.monthWheel = this.container.querySelector('#monthWheel');
    this.dayWheel = this.container.querySelector('#dayWheel');
    this.yearValue = this.container.querySelector('#yearValue');
    this.monthValue = this.container.querySelector('#monthValue');
    this.dayValue = this.container.querySelector('#dayValue');
    this.spinButton = this.container.querySelector('#spinButton');
    this.selectedDateDisplay = this.container.querySelector('#selectedDate');
  }

  bindEvents() {
    this.spinButton.addEventListener('click', () => this.spin());
  }

  spin() {
    if (this.isSpinning) return;

    this.isSpinning = true;
    this.spinButton.disabled = true;
    this.onSpinStart();
    this.spinVelocity = 20 + Math.random() * 15;

    const yearVelocity = this.spinVelocity * (0.8 + Math.random() * 0.4);
    const monthVelocity = this.spinVelocity * (0.8 + Math.random() * 0.4);
    const dayVelocity = this.spinVelocity * (0.8 + Math.random() * 0.4);

    this.animateWheel('year', yearVelocity, this.minYear, this.maxYear);
    this.animateWheel('month', monthVelocity, 1, 12);
    this.animateWheel('day', dayVelocity, 1, this.getDaysInMonth(this.currentYear, this.currentMonth));
  }

  animateWheel(type, velocity, min, max) {
    let currentVelocity = velocity;
    let currentValue = type === 'year' ? this.currentYear : type === 'month' ? this.currentMonth : this.currentDay;
    let lastTimestamp = performance.now();

    const animate = (timestamp) => {
      const delta = timestamp - lastTimestamp;
      lastTimestamp = timestamp;

      if (currentVelocity < 0.5) {
        this.finalizeSpin(type, currentValue);
        return;
      }

      currentVelocity *= this.spinDeceleration;
      const change = Math.floor(currentVelocity * (delta / 16));
      currentValue = ((currentValue + change - min) % (max - min + 1)) + min;

      this.updateWheelValue(type, currentValue);

      requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  }

  updateWheelValue(type, value) {
    if (type === 'year') {
      this.currentYear = value;
      this.yearValue.textContent = value;
    } else if (type === 'month') {
      this.currentMonth = value;
      this.monthValue.textContent = value;
    } else if (type === 'day') {
      this.currentDay = value;
      this.dayValue.textContent = value;
    }
  }

  finalizeSpin(type, value) {
    this.updateWheelValue(type, value);

    if (type === 'day') {
      this.isSpinning = false;
      this.spinButton.disabled = false;
      this.onSpinStop();
      this.updateSelectedDate();
      this.onSpinComplete({
        year: this.currentYear,
        month: this.currentMonth,
        day: this.currentDay,
      });
    }
  }

  updateSelectedDate() {
    const dateStr = `${this.currentYear}-${String(this.currentMonth).padStart(2, '0')}-${String(this.currentDay).padStart(2, '0')}`;
    this.selectedDateDisplay.textContent = dateStr;
  }

  getDaysInMonth(year, month) {
    const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    if (month === 2 && this.isLeapYear(year)) {
      return 29;
    }
    return daysInMonth[month - 1];
  }

  isLeapYear(year) {
    return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  }

  getDate() {
    return {
      year: this.currentYear,
      month: this.currentMonth,
      day: this.currentDay,
    };
  }
}
