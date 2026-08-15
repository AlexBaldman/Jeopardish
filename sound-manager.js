'use strict';

export class SoundManager {
  constructor() {
    this.audioContext = null;
    this.enabled = true;
    this.volume = 0.3;
    this.nodePool = new Map();
    this.poolSize = 5;
  }

  init() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      this.initializePool();
    }
  }

  initializePool() {
    const ctx = this.audioContext;
    
    // Pre-allocate oscillator nodes
    for (let i = 0; i < this.poolSize; i++) {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      gainNode.gain.value = 0;
      oscillator.start();
      
      this.nodePool.set(i, { oscillator, gainNode, inUse: false });
    }
  }

  getNode() {
    for (const [id, node] of this.nodePool) {
      if (!node.inUse) {
        node.inUse = true;
        return node;
      }
    }
    // Pool exhausted, create temporary node
    return this.createTemporaryNode();
  }

  releaseNode(node) {
    if (node.isTemporary) {
      node.oscillator.stop();
      node.oscillator.disconnect();
      node.gainNode.disconnect();
      return;
    }
    
    // Reset and return to pool
    node.gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
    node.inUse = false;
  }

  createTemporaryNode() {
    const ctx = this.audioContext;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    gainNode.gain.value = 0;
    oscillator.start();
    
    return { oscillator, gainNode, inUse: true, isTemporary: true };
  }

  ensureContext() {
    if (!this.audioContext) {
      this.init();
    }
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
  }

  playCorrect() {
    this.ensureContext();
    this.playDing();
  }

  playIncorrect() {
    this.ensureContext();
    this.playBuzz();
  }

  playWheelSpin() {
    this.ensureContext();
    this.playClick();
  }

  playWheelStop() {
    this.ensureContext();
    this.playClack();
  }

  playBadgeEarned() {
    this.ensureContext();
    this.playChime();
  }

  playDing() {
    const ctx = this.audioContext;
    const node = this.getNode();
    const now = ctx.currentTime;

    node.oscillator.frequency.setValueAtTime(880, now);
    node.oscillator.frequency.exponentialRampToValueAtTime(1760, now + 0.1);

    node.gainNode.gain.setValueAtTime(0, now);
    node.gainNode.gain.linearRampToValueAtTime(this.volume, now + 0.05);
    node.gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

    setTimeout(() => this.releaseNode(node), 300);
  }

  playBuzz() {
    const ctx = this.audioContext;
    const node = this.getNode();
    const now = ctx.currentTime;

    node.oscillator.type = 'sawtooth';
    node.oscillator.frequency.setValueAtTime(150, now);
    node.oscillator.frequency.exponentialRampToValueAtTime(50, now + 0.2);

    node.gainNode.gain.setValueAtTime(0, now);
    node.gainNode.gain.linearRampToValueAtTime(this.volume * 0.5, now + 0.05);
    node.gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

    setTimeout(() => this.releaseNode(node), 300);
  }

  playClick() {
    const ctx = this.audioContext;
    const node = this.getNode();
    const now = ctx.currentTime;

    node.oscillator.type = 'square';
    node.oscillator.frequency.setValueAtTime(200 + Math.random() * 100, now);

    node.gainNode.gain.setValueAtTime(0, now);
    node.gainNode.gain.linearRampToValueAtTime(this.volume * 0.2, now + 0.01);
    node.gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.05);

    setTimeout(() => this.releaseNode(node), 50);
  }

  playClack() {
    const ctx = this.audioContext;
    const node = this.getNode();
    const now = ctx.currentTime;

    node.oscillator.type = 'triangle';
    node.oscillator.frequency.setValueAtTime(600, now);
    node.oscillator.frequency.exponentialRampToValueAtTime(200, now + 0.1);

    node.gainNode.gain.setValueAtTime(0, now);
    node.gainNode.gain.linearRampToValueAtTime(this.volume * 0.3, now + 0.01);
    node.gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

    setTimeout(() => this.releaseNode(node), 150);
  }

  playChime() {
    const ctx = this.audioContext;
    const now = ctx.currentTime;

    this.playNote(523.25, now, 0.1);
    this.playNote(659.25, now + 0.1, 0.1);
    this.playNote(783.99, now + 0.2, 0.2);
  }

  playNote(frequency, startTime, duration) {
    const ctx = this.audioContext;
    const node = this.getNode();

    node.oscillator.type = 'sine';
    node.oscillator.frequency.setValueAtTime(frequency, startTime);

    node.gainNode.gain.setValueAtTime(0, startTime);
    node.gainNode.gain.linearRampToValueAtTime(this.volume * 0.4, startTime + 0.02);
    node.gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

    setTimeout(() => this.releaseNode(node), duration * 1000);
  }

  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume));
  }

  toggleMute() {
    this.enabled = !this.enabled;
    return this.enabled;
  }

  setEnabled(enabled) {
    this.enabled = enabled;
  }
}
