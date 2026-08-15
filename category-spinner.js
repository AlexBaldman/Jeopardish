'use strict';

export class CategorySpinner {
  constructor(options = {}) {
    this.onSpinComplete = options.onSpinComplete || (() => {});
    this.onSpinStart = options.onSpinStart || (() => {});
    this.onSpinStop = options.onSpinStop || (() => {});
    this.isSpinning = false;
    this.container = null;
    this.wheel = null;
    this.categories = [];
  }

  init(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) {
      console.error(`CategorySpinner: Container with id "${containerId}" not found`);
      return;
    }

    this.render();
  }

  setCategories(categories) {
    this.categories = categories;
    this.renderWheel();
  }

  render() {
    this.container.innerHTML = `
      <div class="category-spinner-container">
        <div class="category-wheel" id="categoryWheel">
          <div class="category-arrow">▼</div>
        </div>
        <button class="spin-button" id="categorySpinButton">Spin Wheel</button>
      </div>
    `;

    this.wheel = this.container.querySelector('#categoryWheel');
    const spinButton = this.container.querySelector('#categorySpinButton');
    spinButton.addEventListener('click', () => this.spin());
  }

  renderWheel() {
    if (!this.wheel) return;

    const segments = this.categories.length;
    const segmentAngle = 360 / segments;

    let wheelHTML = '<div class="category-arrow">▼</div>';
    
    this.categories.forEach((category, index) => {
      const rotation = index * segmentAngle;
      wheelHTML += `
        <div class="category-segment" style="transform: rotate(${rotation}deg)">
          <span class="category-label">${category}</span>
        </div>
      `;
    });

    this.wheel.innerHTML = wheelHTML;
  }

  spin() {
    if (this.isSpinning || this.categories.length === 0) return;

    this.isSpinning = true;
    this.onSpinStart();

    const spinButton = this.container.querySelector('#categorySpinButton');
    spinButton.disabled = true;

    const totalRotation = 1800 + Math.random() * 1800; // 5-10 full rotations
    const duration = 3000; // 3 seconds

    this.wheel.style.transition = `transform ${duration}ms cubic-bezier(0.17, 0.67, 0.12, 0.99)`;
    this.wheel.style.transform = `rotate(${totalRotation}deg)`;

    setTimeout(() => {
      this.finalizeSpin(totalRotation);
    }, duration);
  }

  finalizeSpin(totalRotation) {
    this.isSpinning = false;
    this.onSpinStop();

    const spinButton = this.container.querySelector('#categorySpinButton');
    spinButton.disabled = false;

    const segmentAngle = 360 / this.categories.length;
    const normalizedRotation = totalRotation % 360;
    const winningIndex = Math.floor((360 - normalizedRotation) / segmentAngle) % this.categories.length;
    const selectedCategory = this.categories[winningIndex];

    this.onSpinComplete(selectedCategory);
  }

  show() {
    this.container.hidden = false;
  }

  hide() {
    this.container.hidden = true;
  }

  reset() {
    if (this.wheel) {
      this.wheel.style.transition = 'none';
      this.wheel.style.transform = 'rotate(0deg)';
    }
  }
}
