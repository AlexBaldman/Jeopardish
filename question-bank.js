'use strict';

import { seededRandom } from './utils.js';

export class QuestionBank {
    constructor(options = {}) {
      this.starterSource = options.starterSource || './questions/starter-pack.json';
      this.manifestSource = options.manifestSource || './questions/manifest.json';
      this.loadedQuestions = [];
      this.questionById = new Map();
      this.loadedShardFiles = new Set();
      this.manifest = null;
      this.pendingShardLoad = null;
      this.lastIndex = -1;
    }

    stableHash(value) {
      let hash = 2166136261;
      const input = String(value);

      for (let i = 0; i < input.length; i += 1) {
        hash ^= input.charCodeAt(i);
        hash = Math.imul(hash, 16777619);
      }

      return hash >>> 0;
    }

    async init() {
      const starterQuestions = await this.fetchJson(this.starterSource);
      this.addQuestions(starterQuestions);

      try {
        this.manifest = await this.fetchJson(this.manifestSource);
      } catch (error) {
        console.warn('Question manifest unavailable; starter pack only.', error);
      }

      return {
        starterCount: starterQuestions.length,
        totalQuestions: this.manifest?.totalQuestions || starterQuestions.length,
        shardCount: this.manifest?.shardCount || 0,
      };
    }

    async fetchJson(source) {
      const response = await fetch(source);

      if (!response.ok) {
        throw new Error(`Failed to load ${source}: ${response.status}`);
      }

      return response.json();
    }

    normalizeQuestion(rawQuestion, index) {
      const id = rawQuestion.id ?? `${rawQuestion.category || 'clue'}-${index}`;

      return {
        id,
        category: rawQuestion.category || 'Unknown Category',
        question: rawQuestion.question || 'No clue text available.',
        answer: rawQuestion.answer || 'No answer available.',
        value: rawQuestion.value,
        airdate: rawQuestion.airdate ?? null,
      };
    }

    addQuestions(questions) {
      for (const [index, rawQuestion] of questions.entries()) {
        const question = this.normalizeQuestion(rawQuestion, index);

        if (this.questionById.has(question.id)) continue;

        this.loadedQuestions.push(question);
        this.questionById.set(question.id, question);
      }
    }

    getById(id) {
      return this.questionById.get(id) || null;
    }

    getLoadedCount() {
      return this.loadedQuestions.length;
    }

    getTotalCount() {
      return this.manifest?.totalQuestions || this.loadedQuestions.length;
    }

    getReviewQuestions(ids) {
      return ids.map((id) => this.getById(id)).filter(Boolean);
    }

    getRandomLoadedQuestion(filterIds = null) {
      const candidates = filterIds?.length ? this.getReviewQuestions(filterIds) : this.loadedQuestions;
      if (candidates.length === 0) return null;

      let index = Math.floor(Math.random() * candidates.length);

      if (candidates.length > 1 && index === this.lastIndex) {
        index = (index + 1) % candidates.length;
      }

      this.lastIndex = index;
      return candidates[index] || null;
    }

    async loadRandomShard() {
      if (!this.manifest || this.loadedShardFiles.size >= this.manifest.shards.length) {
        return null;
      }

      const unloaded = this.manifest.shards.filter((shard) => !this.loadedShardFiles.has(shard.file));
      const shard = unloaded[Math.floor(Math.random() * unloaded.length)];
      return this.loadShardFile(shard.file);
    }

    async loadShardFile(file) {
      if (this.loadedShardFiles.has(file)) {
        return null;
      }

      const source = `./questions/${file}`;
      const questions = await this.fetchJson(source);

      this.loadedShardFiles.add(file);
      this.addQuestions(questions);

      const shard = this.manifest?.shards.find((entry) => entry.file === file);
      return {
        file,
        count: questions.length,
        loadedCount: this.loadedQuestions.length,
        totalQuestions: this.getTotalCount(),
        expectedCount: shard?.count ?? questions.length,
      };
    }

    async ensureQuestions(ids) {
      if (!this.manifest || !Array.isArray(ids) || ids.length === 0) {
        return [];
      }

      const files = new Set();
      for (const id of ids) {
        if (this.questionById.has(id)) continue;

        const shardId = this.stableHash(id) % this.manifest.shardCount;
        const shard = this.manifest.shards[shardId];
        if (shard) files.add(shard.file);
      }

      const loaded = [];
      for (const file of files) {
        const result = await this.loadShardFile(file);
        if (result) loaded.push(result);
      }

      return loaded;
    }

    warmNextShard() {
      if (this.pendingShardLoad) return this.pendingShardLoad;

      this.pendingShardLoad = this.loadRandomShard()
        .catch((error) => {
          console.warn('Unable to warm question shard.', error);
          return null;
        })
        .finally(() => {
          this.pendingShardLoad = null;
        });

      return this.pendingShardLoad;
    }

    getRandomQuestionIndex() {
      if (!this.manifest || this.manifest.totalQuestions === 0) {
        return Math.floor(Math.random() * this.loadedQuestions.length);
      }

      return Math.floor(Math.random() * this.manifest.totalQuestions);
    }

    getShardForIndex(globalIndex) {
      if (!this.manifest || !this.manifest.shards) return null;

      let cumulative = 0;
      for (const shard of this.manifest.shards) {
        if (globalIndex < cumulative + shard.count) {
          return {
            shard,
            localIndex: globalIndex - cumulative,
          };
        }
        cumulative += shard.count;
      }

      return null;
    }

    async getRandomQuestion() {
      if (!this.manifest || this.manifest.totalQuestions === 0) {
        return this.getRandomLoadedQuestion();
      }

      const globalIndex = this.getRandomQuestionIndex();
      const shardInfo = this.getShardForIndex(globalIndex);

      if (!shardInfo) {
        return this.getRandomLoadedQuestion();
      }

      if (!this.loadedShardFiles.has(shardInfo.shard.file)) {
        await this.loadShardFile(shardInfo.shard.file);
      }

      const shardQuestions = this.loadedQuestions.filter((q) => {
        const shardId = this.stableHash(q.id) % this.manifest.shardCount;
        const shard = this.manifest.shards[shardId];
        return shard && shard.file === shardInfo.shard.file;
      });

      if (shardQuestions.length === 0) {
        return this.getRandomLoadedQuestion();
      }

      const localIndex = shardInfo.localIndex % shardQuestions.length;
      return shardQuestions[localIndex];
    }

    getQuestionsByDate(year, month, day) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      return this.loadedQuestions.filter((q) => q.airdate === dateStr);
    }

    getQuestionsByCategory(category) {
      return this.loadedQuestions.filter((q) => q.category === category);
    }

    getCategoriesForDate(year, month, day) {
      const questions = this.getQuestionsByDate(year, month, day);
      const categories = new Set(questions.map((q) => q.category));
      return Array.from(categories);
    }

    getDailyQuestions(seed, count = 5) {
      const rng = seededRandom(seed);
      const totalQuestions = this.loadedQuestions.length;
      const selectedIndices = new Set();
      
      // Hash-based selection: use seed to deterministically pick indices
      for (let i = 0; i < count && i < totalQuestions; i++) {
        const index = Math.floor(rng() * totalQuestions);
        selectedIndices.add(index);
      }
      
      return Array.from(selectedIndices).map(index => this.loadedQuestions[index]);
    }
  }
