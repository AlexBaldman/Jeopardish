(function initCabinetPresenter(root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.JeoPARODYCabinetPresenter = factory();
  }
}(typeof globalThis !== 'undefined' ? globalThis : this, function cabinetPresenterFactory() {
  'use strict';

  class CabinetPresenter {
    constructor({
      renderer,
      preferenceStore,
      sceneService = null,
      audioController,
      voiceController,
      hostPerformanceDirector,
      copyCatalog,
      dialogueStyles,
      controlSkins,
      documentRef = typeof document !== 'undefined' ? document : null,
    } = {}) {
      if (!renderer || !preferenceStore || !audioController || !voiceController) {
        throw new Error('CabinetPresenter requires renderer, preferences, audio, and voice.');
      }
      if (!hostPerformanceDirector || !copyCatalog || !Array.isArray(dialogueStyles) || !Array.isArray(controlSkins)) {
        throw new Error('CabinetPresenter requires host performance, copy, dialogue styles, and control skins.');
      }
      this.renderer = renderer;
      this.preferenceStore = preferenceStore;
      this.sceneService = sceneService;
      this.audioController = audioController;
      this.voiceController = voiceController;
      this.hostPerformanceDirector = hostPerformanceDirector;
      this.copyCatalog = copyCatalog;
      this.dialogueStyles = dialogueStyles;
      this.controlSkins = controlSkins;
      this.document = documentRef;
      this.sceneActivated = false;
    }

    getCopy() {
      const language = this.preferenceStore.get('language');
      return this.copyCatalog[language] || this.copyCatalog.en;
    }

    applyScenePreferences() {
      const scenePackId = this.preferenceStore.get('scenePackId');
      const activePack = this.sceneService?.setPack(scenePackId, { render: false });
      this.sceneService?.setTheme(this.preferenceStore.get('theme'));
      this.sceneActivated = true;
      if (activePack && activePack.id !== scenePackId) {
        this.preferenceStore.set('scenePackId', activePack.id);
      }
      return activePack;
    }

    applyPreferences() {
      const copy = this.getCopy();
      const theme = this.preferenceStore.get('theme');
      const language = this.preferenceStore.get('language');
      const scenePackId = this.preferenceStore.get('scenePackId');
      const requestedHostPack = this.preferenceStore.get('hostPackId');
      const activeHostPack = this.hostPerformanceDirector.setActivePack(requestedHostPack);
      if (activeHostPack?.id && activeHostPack.id !== requestedHostPack) {
        this.preferenceStore.set('hostPackId', activeHostPack.id);
      }

      this.document?.body?.setAttribute('data-theme', theme);
      this.document?.body?.setAttribute('data-language', language);
      const standalone = this.document?.body?.dataset?.appMode === 'game';
      const activeScenePack = (standalone || this.sceneActivated)
        ? this.applyScenePreferences()
        : this.sceneService?.getPacks().find((pack) => pack.id === scenePackId)
          || this.sceneService?.getActivePack();
      if (activeScenePack) {
        if (activeScenePack.id !== scenePackId) {
          this.preferenceStore.set('scenePackId', activeScenePack.id);
        }
        this.renderScenePicker(activeScenePack);
      }

      this.renderer.setCopy(copy);
      this.renderer.setToggleStates({ theme, language });
      this.renderer.setSoundState(this.preferenceStore.get('muted'));
      this.voiceController.setLanguage(language);
      this.renderer.setVoiceState({
        state: this.voiceController.state,
        enabled: this.voiceController.enabled,
        capabilities: this.voiceController.getCapabilities(),
      });
      this.renderDialogueStyle();
      this.renderControlSkin();
      this.renderHostPackPicker(activeHostPack);
      return Object.freeze({
        copy,
        theme,
        language,
        activeScenePack,
        activeHostPack,
      });
    }

    renderDialogueStyle() {
      const selectedId = this.preferenceStore.get('dialogueStyleId');
      const language = this.preferenceStore.get('language');
      const index = Math.max(
        0,
        this.dialogueStyles.findIndex((style) => style.id === selectedId),
      );
      const style = this.dialogueStyles[index];
      this.renderer.renderDialogueStyle({
        ...style,
        label: style.label[language] || style.label.en,
      }, index, this.dialogueStyles.length);
      return style;
    }

    cycleDialogueStyle(step = 1) {
      const selectedId = this.preferenceStore.get('dialogueStyleId');
      const currentIndex = Math.max(
        0,
        this.dialogueStyles.findIndex((style) => style.id === selectedId),
      );
      const nextIndex = (
        currentIndex + step + this.dialogueStyles.length
      ) % this.dialogueStyles.length;
      this.preferenceStore.set('dialogueStyleId', this.dialogueStyles[nextIndex].id);
      return this.renderDialogueStyle();
    }

    renderControlSkin() {
      const selectedId = this.preferenceStore.get('controlSkinId');
      const language = this.preferenceStore.get('language');
      const index = Math.max(0, this.controlSkins.findIndex((skin) => skin.id === selectedId));
      const skin = this.controlSkins[index];
      const gameContainer = this.document?.getElementById?.('gameContainer');
      gameContainer?.setAttribute?.('data-control-skin', skin.id);
      this.renderer.renderControlSkin({
        ...skin,
        label: skin.label[language] || skin.label.en,
      }, index, this.controlSkins.length);
      return skin;
    }

    cycleControlSkin(step = 1) {
      const selectedId = this.preferenceStore.get('controlSkinId');
      const currentIndex = Math.max(0, this.controlSkins.findIndex((skin) => skin.id === selectedId));
      const nextIndex = (currentIndex + step + this.controlSkins.length) % this.controlSkins.length;
      this.preferenceStore.set('controlSkinId', this.controlSkins[nextIndex].id);
      return this.renderControlSkin();
    }

    renderScenePicker(pack = this.sceneService?.getActivePack()) {
      if (!pack || !this.sceneService) return null;
      const packs = this.sceneService.getPacks();
      const index = Math.max(0, packs.findIndex((candidate) => candidate.id === pack.id));
      this.renderer.renderScenePicker(pack, index, packs.length);
      return pack;
    }

    ensureSceneActive() {
      if (this.sceneActivated) return this.sceneService?.getActivePack() || null;
      return this.renderScenePicker(this.applyScenePreferences());
    }

    cycleScenePack(step = 1) {
      const pack = this.sceneService?.cyclePack(step);
      if (!pack) return null;
      this.sceneActivated = true;
      this.preferenceStore.set('scenePackId', pack.id);
      return this.renderScenePicker(pack);
    }

    toggleSound() {
      const muted = this.audioController.toggleMuted();
      this.preferenceStore.set('muted', muted);
      this.renderer.setSoundState(muted);
      if (!muted) {
        this.audioController.unlock();
        this.audioController.play('clue');
      }
      return muted;
    }

    toggleTheme() {
      const theme = this.preferenceStore.get('theme') === 'dark' ? 'light' : 'dark';
      this.preferenceStore.set('theme', theme);
      this.applyPreferences();
      return theme;
    }

    toggleLanguage() {
      const language = this.preferenceStore.get('language') === 'en' ? 'pt-BR' : 'en';
      this.preferenceStore.set('language', language);
      this.applyPreferences();
      return language;
    }

    renderHostPackPicker(pack = this.hostPerformanceDirector.getActivePack()) {
      if (!pack) return null;
      const packs = this.hostPerformanceDirector.getPacks();
      const index = Math.max(0, packs.findIndex(({ id }) => id === pack.id));
      this.renderer.renderHostPack(pack, index, packs.length);
      return pack;
    }
  }

  return {
    CabinetPresenter,
  };
}));
