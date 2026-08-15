(function initThreeStadiumRuntime(root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.UinverseThreeStadiumRuntime = factory();
}(typeof globalThis !== 'undefined' ? globalThis : this, function threeStadiumRuntimeFactory() {
  'use strict';

  class ThreeStadiumRuntimeError extends Error {
    constructor(message) {
      super(message);
      this.name = 'ThreeStadiumRuntimeError';
    }
  }

  function trackTargetsBone(trackName, boneNames) {
    const name = String(trackName || '');
    return boneNames.some((bone) => name.includes(`bones[${bone}]`) || name.includes(`.${bone}.`) || name.endsWith(`.${bone}`));
  }

  function maskAnimationClip(THREE, clip, boneNames = []) {
    if (!clip || !Array.isArray(clip.tracks)) throw new ThreeStadiumRuntimeError('animation clip with tracks is required');
    if (!boneNames.length) throw new ThreeStadiumRuntimeError('upper-body bone mask requires at least one bone');
    const tracks = clip.tracks.filter((track) => trackTargetsBone(track.name, boneNames));
    if (!tracks.length) throw new ThreeStadiumRuntimeError(`bone mask matched no tracks for clip: ${clip.name || 'unnamed'}`);
    return new THREE.AnimationClip(
      `${clip.name || 'clip'}:upper-body`,
      clip.duration,
      tracks,
      clip.blendMode,
    );
  }

  function defaultClipResolver({ model, action }) {
    return (model.animations || []).find((clip) => clip.name === action) || null;
  }

  class ThreeStadiumRuntime {
    constructor({
      THREE,
      CCDIKSolver,
      clipResolver = defaultClipResolver,
      upperBodyBones,
      ikResolver,
    } = {}) {
      if (!THREE?.AnimationMixer || !THREE?.AnimationClip) {
        throw new ThreeStadiumRuntimeError('THREE AnimationMixer and AnimationClip are required');
      }
      if (typeof CCDIKSolver !== 'function') throw new ThreeStadiumRuntimeError('CCDIKSolver constructor is required');
      if (typeof clipResolver !== 'function') throw new ThreeStadiumRuntimeError('clipResolver must be a function');
      if (typeof ikResolver !== 'function') throw new ThreeStadiumRuntimeError('ikResolver must be a function');
      if (!Array.isArray(upperBodyBones) || !upperBodyBones.length) {
        throw new ThreeStadiumRuntimeError('upperBodyBones must contain at least one bone name');
      }
      this.THREE = THREE;
      this.CCDIKSolver = CCDIKSolver;
      this.clipResolver = clipResolver;
      this.upperBodyBones = [...upperBodyBones];
      this.ikResolver = ikResolver;
      this.mixer = null;
      this.ikSolver = null;
      this.actions = [];
      this.plan = null;
      this.model = null;
    }

    mount({ plan, model } = {}) {
      if (!plan || plan.schema !== 'uinverse.stadium-performer-plan') {
        throw new ThreeStadiumRuntimeError('stadium performer plan is required');
      }
      if (!model) throw new ThreeStadiumRuntimeError('loaded 3D model is required');
      const baseLayer = plan.layers?.find(({ id }) => id === 'base-locomotion');
      const upperLayer = plan.layers?.find(({ id }) => id === 'upper-body-performance');
      if (!baseLayer || !upperLayer) throw new ThreeStadiumRuntimeError('plan requires base and upper-body layers');

      const baseClip = this.clipResolver({ model, action: baseLayer.action, layer: baseLayer, plan });
      const upperSourceClip = this.clipResolver({ model, action: upperLayer.action, layer: upperLayer, plan });
      if (!baseClip) throw new ThreeStadiumRuntimeError(`missing animation clip: ${baseLayer.action}`);
      if (!upperSourceClip) throw new ThreeStadiumRuntimeError(`missing animation clip: ${upperLayer.action}`);
      const upperClip = maskAnimationClip(this.THREE, upperSourceClip, this.upperBodyBones);

      this.model = model;
      this.plan = plan;
      this.mixer = new this.THREE.AnimationMixer(model);
      const baseAction = this.mixer.clipAction(baseClip);
      const upperAction = this.mixer.clipAction(upperClip);

      const loopMode = this.THREE.LoopRepeat;
      if (typeof baseAction.setLoop === 'function') baseAction.setLoop(loopMode, Infinity);
      if (typeof upperAction.setLoop === 'function') upperAction.setLoop(loopMode, Infinity);
      if (typeof baseAction.setEffectiveWeight === 'function') baseAction.setEffectiveWeight(1);
      if (typeof upperAction.setEffectiveWeight === 'function') upperAction.setEffectiveWeight(1);
      if (typeof baseAction.setEffectiveTimeScale === 'function') baseAction.setEffectiveTimeScale(0.5 + baseLayer.modifiers.speed);
      if (typeof upperAction.setEffectiveTimeScale === 'function') upperAction.setEffectiveTimeScale(0.5 + upperLayer.modifiers.speed);
      baseAction.play();
      upperAction.play();
      this.actions = [baseAction, upperAction];

      const ikConfig = this.ikResolver({ model, plan, constraints: plan.constraints });
      if (!ikConfig?.mesh || !Array.isArray(ikConfig.iks) || !ikConfig.iks.length) {
        throw new ThreeStadiumRuntimeError('ikResolver must return { mesh, iks } with at least one IK chain');
      }
      this.ikSolver = new this.CCDIKSolver(ikConfig.mesh, ikConfig.iks);
      return this;
    }

    update(deltaSeconds) {
      if (!this.mixer || !this.ikSolver) throw new ThreeStadiumRuntimeError('runtime must be mounted before update');
      const delta = Math.max(0, Math.min(Number(deltaSeconds) || 0, 0.05));
      this.mixer.update(delta);
      this.ikSolver.update(1);
    }

    dispose() {
      if (this.mixer?.stopAllAction) this.mixer.stopAllAction();
      this.actions = [];
      this.ikSolver = null;
      this.mixer = null;
      this.plan = null;
      this.model = null;
    }
  }

  return {
    ThreeStadiumRuntime,
    ThreeStadiumRuntimeError,
    maskAnimationClip,
    trackTargetsBone,
  };
}));
