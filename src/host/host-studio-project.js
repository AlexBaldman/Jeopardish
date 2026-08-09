(function initHostStudioProject(root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.JeoPARODYHostStudioProject = factory();
  }
}(typeof globalThis !== 'undefined' ? globalThis : this, function hostStudioProjectFactory() {
  'use strict';

  const HOST_STUDIO_PROJECT_SCHEMA = 'jeoparody.host-studio-project';
  const HOST_STUDIO_PROJECT_VERSION = 1;
  const HOST_STUDIO_PROJECT_EXPORT_SCHEMA = 'jeoparody.host-studio-project-export';
  const HOST_STUDIO_PROJECT_EXPORT_VERSION = 1;

  const PACK_SCHEMAS = Object.freeze({
    avatar: 'jeoparody.host-avatar',
    animation: 'jeoparody.host-animation',
    personality: 'jeoparody.host-pack',
    voice: 'jeoparody.voice-pack',
  });
  const RIGHTS_STATUSES = Object.freeze([
    'pending',
    'review-required',
    'approved',
    'rejected',
    'not-applicable',
  ]);
  const CONSENT_STATUSES = Object.freeze(['not-required', 'pending', 'verified', 'denied']);
  const PUBLISH_STATUSES = Object.freeze(['draft', 'ready', 'published']);
  const RECIPE_CAPABILITIES = Object.freeze([
    'authored',
    'character-generation',
    'wardrobe-edit',
    'layer-extraction',
    'motion-draft',
    'voice-design',
    'voice-clone',
  ]);

  class HostStudioProjectError extends Error {
    constructor(issues) {
      super(`Invalid HostStudioProject: ${issues.join('; ')}`);
      this.name = 'HostStudioProjectError';
      this.issues = Object.freeze([...issues]);
    }
  }

  function cleanText(value, maxLength = 500) {
    return String(value || '').replace(/\s+/g, ' ').trim().slice(0, maxLength);
  }

  function cleanId(value, path, issues) {
    const id = cleanText(value, 100);
    if (!id || !/^[a-z0-9-]+$/.test(id)) issues.push(`${path} must be a stable kebab-case value`);
    return id;
  }

  function deepFreeze(value) {
    if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
    Object.values(value).forEach(deepFreeze);
    return Object.freeze(value);
  }

  function uniqueTextList(value, maxLength = 160) {
    if (!Array.isArray(value)) return [];
    return [...new Set(value.map((item) => cleanText(item, maxLength)).filter(Boolean))];
  }

  function normalizeTimestamp(value, path, issues) {
    const timestamp = cleanText(value, 40);
    if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(timestamp)) {
      issues.push(`${path} must be an ISO-8601 UTC timestamp`);
      return '';
    }
    const parsed = new Date(timestamp);
    if (!Number.isFinite(parsed.getTime())) {
      issues.push(`${path} must be a valid timestamp`);
      return '';
    }
    return parsed.toISOString();
  }

  function normalizeStatus(value, allowed, fallback) {
    return allowed.includes(value) ? value : fallback;
  }

  function normalizePackReference(input, name, issues) {
    const path = `packs.${name}`;
    const expectedSchema = PACK_SCHEMAS[name];
    const source = input && typeof input === 'object' && !Array.isArray(input) ? input : {};
    const id = cleanId(source.id, `${path}.id`, issues);
    const schema = cleanText(source.schema, 100) || expectedSchema;
    if (schema !== expectedSchema) issues.push(`${path}.schema must be ${expectedSchema}`);
    const version = Math.round(Number(source.version));
    if (!Number.isInteger(version) || version < 1) issues.push(`${path}.version must be a positive integer`);
    return {
      id,
      schema,
      version: Number.isInteger(version) && version > 0 ? version : 1,
    };
  }

  function normalizeHashList(value, path, issues) {
    if (!Array.isArray(value)) return [];
    const hashes = value.map((item, index) => {
      const hash = cleanText(item, 180);
      if (!hash || !/^[a-z0-9][a-z0-9:._-]*$/i.test(hash)) {
        issues.push(`${path}[${index}] must be a named content hash`);
      }
      return hash;
    }).filter(Boolean);
    return [...new Set(hashes)];
  }

  function normalizeGeneration(input, issues) {
    const source = input && typeof input === 'object' && !Array.isArray(input) ? input : {};
    const recipes = Array.isArray(source.recipes) ? source.recipes.map((recipe, index) => {
      const path = `generation.recipes[${index}]`;
      const record = recipe && typeof recipe === 'object' && !Array.isArray(recipe) ? recipe : {};
      const id = cleanId(record.id, `${path}.id`, issues);
      const capability = normalizeStatus(record.capability, RECIPE_CAPABILITIES, 'authored');
      if (!RECIPE_CAPABILITIES.includes(record.capability)) {
        issues.push(`${path}.capability must be a supported generation capability`);
      }
      const approvalStatus = normalizeStatus(record.approvalStatus, RIGHTS_STATUSES, 'pending');
      const provenance = record.provenance && typeof record.provenance === 'object'
        && !Array.isArray(record.provenance) ? record.provenance : {};
      const completedAt = provenance.completedAt
        ? normalizeTimestamp(provenance.completedAt, `${path}.provenance.completedAt`, issues)
        : '';
      return {
        id,
        capability,
        workflowVersion: cleanText(record.workflowVersion, 100),
        promptVersion: cleanText(record.promptVersion, 100),
        seed: cleanText(record.seed, 120),
        sourceHashes: normalizeHashList(record.sourceHashes, `${path}.sourceHashes`, issues),
        outputHashes: normalizeHashList(record.outputHashes, `${path}.outputHashes`, issues),
        approvalStatus,
        provenance: {
          providerId: cleanId(provenance.providerId, `${path}.provenance.providerId`, issues),
          modelId: cleanText(provenance.modelId, 120),
          checkpointId: cleanText(provenance.checkpointId, 120),
          licenseStatus: normalizeStatus(provenance.licenseStatus, RIGHTS_STATUSES, 'pending'),
          licenseNote: cleanText(provenance.licenseNote, 300),
          completedAt,
        },
      };
    }) : [];
    if (new Set(recipes.map(({ id }) => id)).size !== recipes.length) {
      issues.push('generation.recipes ids must be unique');
    }
    return { recipes };
  }

  function normalizeRights(input, issues) {
    const source = input && typeof input === 'object' && !Array.isArray(input) ? input : {};
    const voiceConsent = source.voiceConsent && typeof source.voiceConsent === 'object'
      && !Array.isArray(source.voiceConsent) ? source.voiceConsent : {};
    const voiceRequired = voiceConsent.required !== false;
    const voiceStatus = normalizeStatus(
      voiceConsent.status,
      CONSENT_STATUSES,
      voiceRequired ? 'pending' : 'not-required',
    );
    if (!voiceRequired && voiceStatus !== 'not-required') {
      issues.push('rights.voiceConsent.status must be not-required when consent is not required');
    }
    return {
      assetStatus: normalizeStatus(source.assetStatus, RIGHTS_STATUSES, 'pending'),
      commercialUseStatus: normalizeStatus(source.commercialUseStatus, RIGHTS_STATUSES, 'pending'),
      voiceConsent: {
        required: voiceRequired,
        status: voiceStatus,
        releaseId: cleanText(voiceConsent.releaseId, 100),
        recordedAt: voiceConsent.recordedAt
          ? normalizeTimestamp(voiceConsent.recordedAt, 'rights.voiceConsent.recordedAt', issues)
          : '',
      },
      notes: cleanText(source.notes, 500),
    };
  }

  function normalizeRevisions(input, metadataRevision, issues) {
    const revisions = Array.isArray(input) ? input.map((revision, index) => {
      const path = `revisions[${index}]`;
      const source = revision && typeof revision === 'object' && !Array.isArray(revision) ? revision : {};
      const number = Math.round(Number(source.number));
      if (!Number.isInteger(number) || number < 1) issues.push(`${path}.number must be a positive integer`);
      const summary = cleanText(source.summary, 300);
      if (!summary) issues.push(`${path}.summary is required`);
      return {
        number: Number.isInteger(number) && number > 0 ? number : 1,
        recordedAt: normalizeTimestamp(source.recordedAt, `${path}.recordedAt`, issues),
        summary,
        changeKinds: uniqueTextList(source.changeKinds, 80),
        contentHash: cleanText(source.contentHash, 180),
      };
    }) : [];
    if (revisions.length === 0) issues.push('revisions requires at least one revision record');
    if (new Set(revisions.map(({ number }) => number)).size !== revisions.length) {
      issues.push('revisions numbers must be unique');
    }
    for (let index = 1; index < revisions.length; index += 1) {
      if (revisions[index - 1].number >= revisions[index].number) {
        issues.push('revisions must be ordered by increasing number');
        break;
      }
    }
    if (revisions.length && revisions[revisions.length - 1].number !== metadataRevision) {
      issues.push('metadata.revision must match the latest revision record');
    }
    return revisions;
  }

  function assertNoRestrictedData(value, path = 'project', issues = [], seen = new WeakSet()) {
    if (!value || typeof value !== 'object') {
      if (typeof value === 'string') {
        const compact = value.replace(/\s+/g, '');
        if (/^(?:data:|-----BEGIN)/i.test(compact) || (compact.length > 512 && /^[A-Za-z0-9+/=]+$/.test(compact))) {
          issues.push(`${path} must not contain generated blobs or private key material`);
        }
      }
      return;
    }
    if (seen.has(value)) return;
    seen.add(value);
    Object.entries(value).forEach(([key, child]) => {
      const compactKey = key.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (/(apikey|accesskey|secret|password|credential|authorization|privatekey|authtoken|providertoken|blob|rawrecording|audiodata|imagedata|base64|dataurl)/.test(compactKey)) {
        issues.push(`${path}.${key} must not contain provider secrets or generated blobs`);
      }
      assertNoRestrictedData(child, `${path}.${key}`, issues, seen);
    });
  }

  function normalizeHostStudioProject(input = {}) {
    const issues = [];
    if (!input || typeof input !== 'object' || Array.isArray(input)) {
      throw new HostStudioProjectError(['project must be an object']);
    }
    assertNoRestrictedData(input, 'project', issues);

    const schema = cleanText(input.schema, 100) || HOST_STUDIO_PROJECT_SCHEMA;
    const version = Math.round(Number(input.version || HOST_STUDIO_PROJECT_VERSION));
    if (schema !== HOST_STUDIO_PROJECT_SCHEMA) issues.push(`schema must be ${HOST_STUDIO_PROJECT_SCHEMA}`);
    if (version !== HOST_STUDIO_PROJECT_VERSION) issues.push(`version must be ${HOST_STUDIO_PROJECT_VERSION}; migrate first`);

    const metadataSource = input.metadata && typeof input.metadata === 'object' && !Array.isArray(input.metadata)
      ? input.metadata : {};
    const revision = Math.round(Number(metadataSource.revision));
    if (!Number.isInteger(revision) || revision < 1) issues.push('metadata.revision must be a positive integer');
    const metadata = {
      id: cleanId(metadataSource.id, 'metadata.id', issues),
      title: cleanText(metadataSource.title, 160),
      description: cleanText(metadataSource.description, 500),
      ownerId: cleanId(metadataSource.ownerId, 'metadata.ownerId', issues),
      createdAt: normalizeTimestamp(metadataSource.createdAt, 'metadata.createdAt', issues),
      updatedAt: normalizeTimestamp(metadataSource.updatedAt, 'metadata.updatedAt', issues),
      revision: Number.isInteger(revision) && revision > 0 ? revision : 1,
      tags: uniqueTextList(metadataSource.tags, 60),
    };
    if (!metadata.title) issues.push('metadata.title is required');
    if (metadata.createdAt && metadata.updatedAt && metadata.updatedAt < metadata.createdAt) {
      issues.push('metadata.updatedAt must not precede metadata.createdAt');
    }

    const publishSource = input.publish && typeof input.publish === 'object' && !Array.isArray(input.publish)
      ? input.publish : {};
    const publish = {
      status: normalizeStatus(publishSource.status, PUBLISH_STATUSES, 'draft'),
      target: cleanText(publishSource.target, 100) || 'game-runtime',
    };
    if (publishSource.status && !PUBLISH_STATUSES.includes(publishSource.status)) {
      issues.push('publish.status must be draft, ready, or published');
    }

    const project = {
      schema,
      version: Number.isInteger(version) ? version : HOST_STUDIO_PROJECT_VERSION,
      metadata,
      publish,
      packs: {
        avatar: normalizePackReference(input.packs?.avatar, 'avatar', issues),
        animation: normalizePackReference(input.packs?.animation, 'animation', issues),
        personality: normalizePackReference(input.packs?.personality, 'personality', issues),
        voice: normalizePackReference(input.packs?.voice, 'voice', issues),
      },
      generation: normalizeGeneration(input.generation, issues),
      rights: normalizeRights(input.rights, issues),
      revisions: normalizeRevisions(input.revisions, metadata.revision, issues),
    };

    if (issues.length) throw new HostStudioProjectError(issues);
    return deepFreeze(project);
  }

  function migrateHostStudioProject(input = {}) {
    if (!input || typeof input !== 'object' || Array.isArray(input)) {
      throw new HostStudioProjectError(['project must be an object']);
    }
    const schema = cleanText(input.schema, 100) || HOST_STUDIO_PROJECT_SCHEMA;
    const sourceVersion = input.version === undefined ? HOST_STUDIO_PROJECT_VERSION : Number(input.version);
    if (schema !== HOST_STUDIO_PROJECT_SCHEMA) {
      throw new HostStudioProjectError([`schema must be ${HOST_STUDIO_PROJECT_SCHEMA}`]);
    }
    if (sourceVersion > HOST_STUDIO_PROJECT_VERSION || sourceVersion < 1 || !Number.isInteger(sourceVersion)) {
      throw new HostStudioProjectError([`cannot migrate HostStudioProject version ${input.version}`]);
    }
    return normalizeHostStudioProject({ ...input, schema: HOST_STUDIO_PROJECT_SCHEMA, version: HOST_STUDIO_PROJECT_VERSION });
  }

  function stableValue(value) {
    if (Array.isArray(value)) return value.map(stableValue);
    if (!value || typeof value !== 'object') return value;
    return Object.keys(value).sort().reduce((result, key) => {
      result[key] = stableValue(value[key]);
      return result;
    }, {});
  }

  function serializeHostStudioProject(input) {
    return JSON.stringify(stableValue(migrateHostStudioProject(input)));
  }

  function getPublishReadinessReport(input) {
    let project;
    try {
      project = migrateHostStudioProject(input);
    } catch (error) {
      const blockers = error instanceof HostStudioProjectError ? error.issues : [error.message];
      return deepFreeze({ ready: false, blockers, warnings: [], projectId: '' });
    }

    const blockers = [];
    const warnings = [];
    if (!['ready', 'published'].includes(project.publish.status)) {
      blockers.push('publish.status must be ready or published');
    }
    if (project.rights.assetStatus !== 'approved') blockers.push('asset rights must be approved');
    if (project.rights.commercialUseStatus !== 'approved') blockers.push('commercial use rights must be approved');
    if (project.rights.voiceConsent.required && project.rights.voiceConsent.status !== 'verified') {
      blockers.push('voice consent must be verified');
    }
    project.generation.recipes.forEach((recipe) => {
      if (recipe.approvalStatus !== 'approved') blockers.push(`generation recipe ${recipe.id} is not approved`);
      if (recipe.provenance.licenseStatus !== 'approved') {
        blockers.push(`generation recipe ${recipe.id} does not have an approved license`);
      }
      if (!recipe.outputHashes.length) warnings.push(`generation recipe ${recipe.id} has no output hashes`);
    });
    return deepFreeze({
      ready: blockers.length === 0,
      blockers,
      warnings,
      projectId: project.metadata.id,
      revision: project.metadata.revision,
      publishStatus: project.publish.status,
    });
  }

  function exportHostStudioProject(input) {
    const project = migrateHostStudioProject(input);
    const report = getPublishReadinessReport(project);
    if (!report.ready) throw new HostStudioProjectError(report.blockers);
    return deepFreeze({
      schema: HOST_STUDIO_PROJECT_EXPORT_SCHEMA,
      version: HOST_STUDIO_PROJECT_EXPORT_VERSION,
      project: {
        id: project.metadata.id,
        title: project.metadata.title,
        revision: project.metadata.revision,
        updatedAt: project.metadata.updatedAt,
      },
      packs: project.packs,
      generation: project.generation,
      rights: project.rights,
    });
  }

  return {
    CONSENT_STATUSES,
    HOST_STUDIO_PROJECT_EXPORT_SCHEMA,
    HOST_STUDIO_PROJECT_EXPORT_VERSION,
    HOST_STUDIO_PROJECT_SCHEMA,
    HOST_STUDIO_PROJECT_VERSION,
    HostStudioProjectError,
    PACK_SCHEMAS,
    PUBLISH_STATUSES,
    RECIPE_CAPABILITIES,
    RIGHTS_STATUSES,
    exportHostStudioProject,
    getPublishReadinessReport,
    migrateHostStudioProject,
    normalizeHostStudioProject,
    serializeHostStudioProject,
  };
}));
