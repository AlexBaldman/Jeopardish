(function initVoicePack(root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.JeoPARODYVoicePack = factory();
  }
}(typeof globalThis !== 'undefined' ? globalThis : this, function voicePackFactory() {
  'use strict';

  const VOICE_PACK_SCHEMA = 'jeoparody.voice-pack';
  const VOICE_PACK_VERSION = 1;
  const SUPPORTED_VOICE_LOCALES = Object.freeze(['en-US', 'pt-BR']);
  const VoiceProviderKinds = Object.freeze({
    BROWSER: 'browser',
    LOCAL: 'local',
    NEURAL: 'neural',
  });
  const VoiceCapabilities = Object.freeze({
    NARRATION: 'narration',
    RECOGNITION: 'recognition',
    DYNAMIC_SYNTHESIS: 'dynamic-synthesis',
    PRE_RENDERED_AUDIO: 'pre-rendered-audio',
  });

  const PROVIDER_KINDS = new Set(Object.values(VoiceProviderKinds));
  const CAPABILITIES = new Set(Object.values(VoiceCapabilities));
  const SECRET_KEY_PATTERN = /(?:api[-_]?key|secret|token|password|authorization|credential|bearer)/i;
  const SECRET_VALUE_PATTERN = /(?:\b(?:sk|pk|rk)_[a-z0-9_-]{12,}\b|\bAKIA[0-9A-Z]{16}\b|-----BEGIN(?: [A-Z]+)? PRIVATE KEY-----|\bbearer\s+[a-z0-9._~+/-]{12,})/i;
  const URL_PATTERN = /(?:https?|wss?):\/\/[^\s]+/i;

  class VoicePackError extends Error {
    constructor(issues) {
      super(`Invalid VoicePack: ${issues.join('; ')}`);
      this.name = 'VoicePackError';
      this.issues = Object.freeze([...issues]);
    }
  }

  function cleanText(value) {
    return String(value || '').replace(/\s+/g, ' ').trim();
  }

  function uniqueTextList(value) {
    if (!Array.isArray(value)) return [];
    return [...new Set(value.map(cleanText).filter(Boolean))];
  }

  function deepFreeze(value) {
    if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
    Object.values(value).forEach(deepFreeze);
    return Object.freeze(value);
  }

  function isSafeRelativePath(value) {
    const path = cleanText(value);
    return Boolean(path)
      && !path.startsWith('/')
      && !path.includes('\\')
      && !path.includes('://')
      && !path.split('/').some((part) => part === '..' || part === '.');
  }

  function isSafeMetadataUrl(value) {
    try {
      const url = new URL(value);
      const hostname = url.hostname.toLowerCase();
      return url.protocol === 'https:'
        && !url.username
        && !url.password
        && !url.search
        && !url.hash
        && hostname !== 'localhost'
        && !hostname.endsWith('.localhost')
        && !/^\d{1,3}(?:\.\d{1,3}){3}$/.test(hostname);
    } catch {
      return false;
    }
  }

  function inspectUnsafeValues(value, path, issues) {
    if (Array.isArray(value)) {
      value.forEach((item, index) => inspectUnsafeValues(item, `${path}[${index}]`, issues));
      return;
    }
    if (value && typeof value === 'object') {
      Object.entries(value).forEach(([key, item]) => {
        const childPath = path ? `${path}.${key}` : key;
        if (SECRET_KEY_PATTERN.test(key)) issues.push(`${childPath} must not contain secrets`);
        inspectUnsafeValues(item, childPath, issues);
      });
      return;
    }
    if (typeof value !== 'string') return;
    if (SECRET_VALUE_PATTERN.test(value)) issues.push(`${path} must not contain secret-like values`);
    if (URL_PATTERN.test(value) && !/(?:sourceUrl|licenseUrl)$/.test(path)) {
      issues.push(`${path} must not contain runtime URLs`);
    }
    if (/(?:sourceUrl|licenseUrl)$/.test(path) && value && !isSafeMetadataUrl(value)) {
      issues.push(`${path} must be a safe HTTPS metadata URL`);
    }
  }

  function normalizeConsent(value, path, issues) {
    const status = cleanText(value?.status);
    const scope = uniqueTextList(value?.scope).sort();
    const normalized = {
      status,
      releaseId: cleanText(value?.releaseId),
      releaseVersion: cleanText(value?.releaseVersion),
      grantedAt: cleanText(value?.grantedAt),
      scope,
      legalBasis: cleanText(value?.legalBasis),
    };

    if (status === 'granted') {
      if (!normalized.releaseId) issues.push(`${path}.releaseId is required when consent is granted`);
      if (!normalized.releaseVersion) issues.push(`${path}.releaseVersion is required when consent is granted`);
      if (!normalized.grantedAt) issues.push(`${path}.grantedAt is required when consent is granted`);
      if (scope.length === 0) issues.push(`${path}.scope is required when consent is granted`);
    } else if (status === 'not-applicable') {
      if (!normalized.legalBasis) issues.push(`${path}.legalBasis is required when consent is not-applicable`);
    } else {
      issues.push(`${path}.status must be granted or not-applicable`);
    }
    return normalized;
  }

  function normalizeRights(value, path, issues) {
    const rightToUse = cleanText(value?.rightToUse);
    const usage = uniqueTextList(value?.usage).sort();
    if (!rightToUse) issues.push(`${path}.rightToUse is required`);
    if (usage.length === 0) issues.push(`${path}.usage requires at least one permitted use`);
    return {
      rightToUse,
      usage,
      attribution: cleanText(value?.attribution),
      expiresAt: cleanText(value?.expiresAt),
    };
  }

  function normalizeProvenance(value, path, issues) {
    const source = cleanText(value?.source);
    const sourceHash = cleanText(value?.sourceHash);
    const modelId = cleanText(value?.modelId);
    const modelVersion = cleanText(value?.modelVersion);
    const modelHash = cleanText(value?.modelHash);
    if (!source) issues.push(`${path}.source is required`);
    if (!sourceHash) issues.push(`${path}.sourceHash is required`);
    if (!modelId) issues.push(`${path}.modelId is required`);
    if (!modelVersion) issues.push(`${path}.modelVersion is required`);
    if (!modelHash) issues.push(`${path}.modelHash is required`);
    return {
      source,
      sourceHash,
      modelId,
      modelVersion,
      modelHash,
      sourceUrl: cleanText(value?.sourceUrl),
      licenseUrl: cleanText(value?.licenseUrl),
    };
  }

  function normalizeStyles(value, locale, issues) {
    if (!Array.isArray(value) || value.length === 0) {
      issues.push(`variants.${locale}.styles requires at least one style`);
      return [];
    }
    const seen = new Set();
    return value.map((style, index) => {
      const id = cleanText(style?.id);
      if (!/^[a-z0-9-]+$/.test(id) || !id) issues.push(`variants.${locale}.styles[${index}].id must be kebab-case`);
      if (seen.has(id)) issues.push(`variants.${locale}.styles contains duplicate id ${id}`);
      seen.add(id);
      const rate = Number(style?.rate);
      const pitch = Number(style?.pitch);
      if (!Number.isFinite(rate) || rate < 0.5 || rate > 2) {
        issues.push(`variants.${locale}.styles[${index}].rate must be between 0.5 and 2`);
      }
      if (!Number.isFinite(pitch) || pitch < 0.5 || pitch > 2) {
        issues.push(`variants.${locale}.styles[${index}].pitch must be between 0.5 and 2`);
      }
      return {
        id,
        label: cleanText(style?.label) || id,
        rate: Number.isFinite(rate) ? rate : 1,
        pitch: Number.isFinite(pitch) ? pitch : 1,
      };
    }).sort((left, right) => left.id.localeCompare(right.id));
  }

  function normalizeVariants(value, issues) {
    const variants = {};
    SUPPORTED_VOICE_LOCALES.forEach((locale) => {
      const variant = value?.[locale];
      if (!variant || typeof variant !== 'object' || Array.isArray(variant)) {
        issues.push(`variants.${locale} is required`);
        variants[locale] = { defaultStyleId: '', styles: [] };
        return;
      }
      const styles = normalizeStyles(variant.styles, locale, issues);
      const defaultStyleId = cleanText(variant.defaultStyleId);
      if (!styles.some((style) => style.id === defaultStyleId)) {
        issues.push(`variants.${locale}.defaultStyleId must reference a style`);
      }
      variants[locale] = { defaultStyleId, styles };
    });
    return variants;
  }

  function normalizeProvider(value, index, issues) {
    const path = `providers[${index}]`;
    const id = cleanText(value?.id);
    const kind = cleanText(value?.kind);
    const locales = uniqueTextList(value?.locales).sort();
    const capabilities = uniqueTextList(value?.capabilities).sort();
    if (!/^[a-z0-9-]+$/.test(id) || !id) issues.push(`${path}.id must be kebab-case`);
    if (!PROVIDER_KINDS.has(kind)) issues.push(`${path}.kind must be browser, local, or neural`);
    if (locales.length === 0 || locales.some((locale) => !SUPPORTED_VOICE_LOCALES.includes(locale))) {
      issues.push(`${path}.locales must contain supported locales`);
    }
    if (capabilities.length === 0 || capabilities.some((capability) => !CAPABILITIES.has(capability))) {
      issues.push(`${path}.capabilities must contain supported capabilities`);
    }
    if (value?.offline !== true) issues.push(`${path}.offline must be true`);
    const assetPath = cleanText(value?.assetPath);
    if ((kind === VoiceProviderKinds.LOCAL || kind === VoiceProviderKinds.NEURAL) && !isSafeRelativePath(assetPath)) {
      issues.push(`${path}.assetPath must be a safe relative path for local providers`);
    }
    if (kind === VoiceProviderKinds.BROWSER && assetPath) {
      issues.push(`${path}.assetPath is not allowed for browser providers`);
    }
    return {
      id,
      kind,
      enabled: value?.enabled !== false,
      offline: true,
      locales,
      capabilities,
      assetPath,
      consent: normalizeConsent(value?.consent, `${path}.consent`, issues),
      provenance: normalizeProvenance(value?.provenance, `${path}.provenance`, issues),
      rights: normalizeRights(value?.rights, `${path}.rights`, issues),
    };
  }

  function normalizeProviders(value, issues) {
    if (!Array.isArray(value) || value.length === 0) {
      issues.push('providers requires at least one provider');
      return [];
    }
    const providers = value.map((provider, index) => normalizeProvider(provider, index, issues));
    const seen = new Set();
    providers.forEach((provider) => {
      if (seen.has(provider.id)) issues.push(`providers contains duplicate id ${provider.id}`);
      seen.add(provider.id);
    });
    return providers;
  }

  function normalizeFallbackOrder(value, providers, issues) {
    const order = uniqueTextList(value);
    const providerIds = providers.map(({ id }) => id);
    if (order.length !== providerIds.length || providerIds.some((id) => !order.includes(id))) {
      issues.push('fallbackOrder must list every provider exactly once');
    }
    SUPPORTED_VOICE_LOCALES.forEach((locale) => {
      const safeFallback = order
        .map((id) => providers.find((provider) => provider.id === id))
        .find((provider) => provider
          && provider.kind !== VoiceProviderKinds.NEURAL
          && provider.locales.includes(locale)
          && provider.capabilities.includes(VoiceCapabilities.NARRATION));
      if (!safeFallback) {
        issues.push(`fallbackOrder requires a non-neural narration fallback for ${locale}`);
      }
    });
    return order;
  }

  function normalizeVoicePack(input = {}) {
    const issues = [];
    inspectUnsafeValues(input, '', issues);
    const schema = cleanText(input.schema || VOICE_PACK_SCHEMA);
    const version = input.version === undefined ? VOICE_PACK_VERSION : Number(input.version);
    const id = cleanText(input.id);
    const displayName = cleanText(input.displayName);
    if (schema !== VOICE_PACK_SCHEMA) issues.push(`schema must be ${VOICE_PACK_SCHEMA}`);
    if (version !== VOICE_PACK_VERSION) issues.push(`version must be ${VOICE_PACK_VERSION}`);
    if (!/^[a-z0-9-]+$/.test(id) || !id) issues.push('id must be a stable kebab-case value');
    if (!displayName) issues.push('displayName is required');

    const variants = normalizeVariants(input.variants, issues);
    const providers = normalizeProviders(input.providers, issues);
    const fallbackOrder = normalizeFallbackOrder(input.fallbackOrder, providers, issues);
    const consent = normalizeConsent(input.consent, 'consent', issues);
    const provenance = normalizeProvenance(input.provenance, 'provenance', issues);
    const rights = normalizeRights(input.rights, 'rights', issues);

    if (issues.length) throw new VoicePackError([...new Set(issues)]);
    return deepFreeze({
      schema: VOICE_PACK_SCHEMA,
      version: VOICE_PACK_VERSION,
      id,
      displayName,
      variants,
      providers,
      fallbackOrder,
      consent,
      provenance,
      rights,
    });
  }

  function resolveVoiceVariant(pack, locale = 'en-US') {
    const normalized = String(locale || '').toLowerCase() === 'pt-br' ? 'pt-BR' : 'en-US';
    return pack?.variants?.[normalized] || pack?.variants?.['en-US'] || null;
  }

  function stableHash(value) {
    let hash = 2166136261;
    for (let index = 0; index < value.length; index += 1) {
      hash ^= value.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  }

  function selectVoiceStyle(pack, { locale = 'en-US', styleId = '', seed = '' } = {}) {
    const variant = resolveVoiceVariant(pack, locale);
    if (!variant || variant.styles.length === 0) return null;
    const requested = cleanText(styleId);
    if (requested) return variant.styles.find((style) => style.id === requested) || null;
    const defaultStyle = variant.styles.find((style) => style.id === variant.defaultStyleId);
    if (!cleanText(seed)) return defaultStyle || variant.styles[0];
    return variant.styles[stableHash(`${pack.id}|${locale}|${seed}`) % variant.styles.length];
  }

  function resolveVoiceProviders(pack, {
    locale = 'en-US',
    capability = VoiceCapabilities.NARRATION,
    allowNeural = false,
  } = {}) {
    const normalizedLocale = String(locale || '').toLowerCase() === 'pt-br' ? 'pt-BR' : 'en-US';
    return Object.freeze((pack?.fallbackOrder || [])
      .map((id) => pack?.providers?.find((provider) => provider.id === id))
      .filter((provider) => provider
        && provider.enabled
        && provider.offline
        && provider.locales.includes(normalizedLocale)
        && provider.capabilities.includes(capability)
        && (allowNeural || provider.kind !== VoiceProviderKinds.NEURAL)));
  }

  const DefaultVoicePack = normalizeVoicePack({
    id: 'offline-voice-foundation',
    displayName: 'Offline Voice Foundation',
    variants: {
      'en-US': {
        defaultStyleId: 'clear',
        styles: [
          { id: 'clear', label: 'Clear', rate: 0.94, pitch: 0.96 },
          { id: 'warm', label: 'Warm', rate: 0.98, pitch: 1.02 },
        ],
      },
      'pt-BR': {
        defaultStyleId: 'clear',
        styles: [
          { id: 'clear', label: 'Clara', rate: 0.94, pitch: 0.96 },
          { id: 'warm', label: 'Acolhedora', rate: 0.98, pitch: 1.02 },
        ],
      },
    },
    providers: [
      {
        id: 'neural-local',
        kind: 'neural',
        enabled: false,
        offline: true,
        locales: ['en-US', 'pt-BR'],
        capabilities: ['narration', 'dynamic-synthesis'],
        assetPath: 'voice-models/neural/',
        consent: {
          status: 'not-applicable',
          legalBasis: 'No reference voice is included in this disabled neutral voice-design descriptor.',
        },
        provenance: {
          source: 'neutral-voice-design',
          sourceHash: 'sha256:neutral-voice-design-v1',
          modelId: 'local-neural-placeholder',
          modelVersion: '1',
          modelHash: 'sha256:local-neural-placeholder-v1',
        },
        rights: { rightToUse: 'review-required', usage: ['local-synthesis'] },
      },
      {
        id: 'local-generic',
        kind: 'local',
        offline: true,
        locales: ['en-US', 'pt-BR'],
        capabilities: ['narration'],
        assetPath: 'voice-models/generic/',
        consent: {
          status: 'not-applicable',
          legalBasis: 'Generic local fallback without a character or reference voice.',
        },
        provenance: {
          source: 'generic-local-model',
          sourceHash: 'sha256:generic-local-model-v1',
          modelId: 'generic-local-placeholder',
          modelVersion: '1',
          modelHash: 'sha256:generic-local-placeholder-v1',
        },
        rights: { rightToUse: 'review-required', usage: ['local-playback'] },
      },
      {
        id: 'browser-system',
        kind: 'browser',
        offline: true,
        locales: ['en-US', 'pt-BR'],
        capabilities: ['narration'],
        consent: {
          status: 'not-applicable',
          legalBasis: 'System-provided generic browser voice selected at playback time.',
        },
        provenance: {
          source: 'browser-system-voice',
          sourceHash: 'sha256:browser-system-voice-v1',
          modelId: 'browser-speech-synthesis',
          modelVersion: 'runtime-selected',
          modelHash: 'sha256:runtime-selected',
        },
        rights: { rightToUse: 'platform-terms', usage: ['local-playback'] },
      },
    ],
    fallbackOrder: ['neural-local', 'local-generic', 'browser-system'],
    consent: {
      status: 'not-applicable',
      legalBasis: 'The foundation pack contains only generic fallback descriptors and no identifiable performance.',
    },
    provenance: {
      source: 'offline-contract-default',
      sourceHash: 'sha256:offline-contract-default-v1',
      modelId: 'provider-neutral',
      modelVersion: '1',
      modelHash: 'sha256:provider-neutral-v1',
    },
    rights: { rightToUse: 'prototype-review-required', usage: ['local-playback', 'local-synthesis'] },
  });

  return {
    DefaultVoicePack,
    SUPPORTED_VOICE_LOCALES,
    VOICE_PACK_SCHEMA,
    VOICE_PACK_VERSION,
    VoiceCapabilities,
    VoicePackError,
    VoiceProviderKinds,
    normalizeVoicePack,
    resolveVoiceProviders,
    resolveVoiceVariant,
    selectVoiceStyle,
  };
}));
