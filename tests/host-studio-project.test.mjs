import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const {
  HOST_STUDIO_PROJECT_EXPORT_SCHEMA,
  HOST_STUDIO_PROJECT_SCHEMA,
  HostStudioProjectError,
  exportHostStudioProject,
  getPublishReadinessReport,
  migrateHostStudioProject,
  normalizeHostStudioProject,
  serializeHostStudioProject,
} = require('../src/host/host-studio-project.js');

function projectDraft(overrides = {}) {
  return {
    schema: HOST_STUDIO_PROJECT_SCHEMA,
    version: 1,
    metadata: {
      id: 'xander-production',
      title: 'Xander Production Host',
      description: 'A release candidate for the broadcast host.',
      ownerId: 'channel-o-studio',
      createdAt: '2026-08-07T12:00:00.000Z',
      updatedAt: '2026-08-07T12:30:00.000Z',
      revision: 2,
      tags: ['broadcast', 'launch'],
    },
    publish: { status: 'ready', target: 'game-runtime' },
    packs: {
      avatar: { id: 'xander-surf-v1', schema: 'jeoparody.host-avatar', version: 1 },
      animation: { id: 'xander-surf-motion-v1', schema: 'jeoparody.host-animation', version: 1 },
      personality: { id: 'xander-trefleck', schema: 'jeoparody.host-pack', version: 1 },
      voice: { id: 'xander-broadcast-en-pt', schema: 'jeoparody.voice-pack', version: 1 },
    },
    generation: {
      recipes: [{
        id: 'xander-wardrobe-v1',
        capability: 'wardrobe-edit',
        workflowVersion: 'closet-v2',
        promptVersion: 'xander-wardrobe-v1',
        seed: 'episode-zero',
        sourceHashes: ['sha256:source-001'],
        outputHashes: ['sha256:output-001'],
        approvalStatus: 'approved',
        provenance: {
          providerId: 'local-image-adapter',
          modelId: 'image-model',
          checkpointId: 'wardrobe-checkpoint',
          licenseStatus: 'approved',
          licenseNote: 'Reviewed for the intended release.',
          completedAt: '2026-08-07T12:20:00.000Z',
        },
      }],
    },
    rights: {
      assetStatus: 'approved',
      commercialUseStatus: 'approved',
      voiceConsent: {
        required: true,
        status: 'verified',
        releaseId: 'release-xander-001',
        recordedAt: '2026-08-07T12:25:00.000Z',
      },
      notes: 'Rights ledger reviewed.',
    },
    revisions: [
      {
        number: 1,
        recordedAt: '2026-08-07T12:00:00.000Z',
        summary: 'Identity and pack references locked.',
        changeKinds: ['identity'],
        contentHash: 'sha256:revision-001',
      },
      {
        number: 2,
        recordedAt: '2026-08-07T12:30:00.000Z',
        summary: 'Rights review completed.',
        changeKinds: ['rights', 'release'],
        contentHash: 'sha256:revision-002',
      },
    ],
    ...overrides,
  };
}

test('HostStudioProject normalizes immutable pack references, provenance, rights, and revisions', () => {
  const project = normalizeHostStudioProject(projectDraft({
    metadata: { ...projectDraft().metadata, tags: ['launch', 'broadcast', 'launch'] },
  }));

  assert.equal(project.schema, HOST_STUDIO_PROJECT_SCHEMA);
  assert.equal(project.packs.avatar.id, 'xander-surf-v1');
  assert.equal(project.packs.animation.id, 'xander-surf-motion-v1');
  assert.equal(project.packs.personality.id, 'xander-trefleck');
  assert.equal(project.packs.voice.id, 'xander-broadcast-en-pt');
  assert.deepEqual(project.metadata.tags, ['launch', 'broadcast']);
  assert.equal(project.generation.recipes[0].provenance.providerId, 'local-image-adapter');
  assert.equal(project.rights.voiceConsent.status, 'verified');
  assert.equal(project.revisions[1].number, 2);
  assert.equal(Object.isFrozen(project), true);
  assert.equal(Object.isFrozen(project.packs), true);
  assert.equal(Object.isFrozen(project.generation.recipes[0]), true);
});

test('HostStudioProject has deterministic serialization and a versioned migration entry point', () => {
  const first = serializeHostStudioProject(projectDraft());
  const reordered = projectDraft({
    packs: {
      voice: { version: 1, schema: 'jeoparody.voice-pack', id: 'xander-broadcast-en-pt' },
      avatar: { version: 1, id: 'xander-surf-v1', schema: 'jeoparody.host-avatar' },
      animation: { version: 1, id: 'xander-surf-motion-v1', schema: 'jeoparody.host-animation' },
      personality: { schema: 'jeoparody.host-pack', id: 'xander-trefleck', version: 1 },
    },
  });

  assert.equal(first, serializeHostStudioProject(reordered));
  assert.deepEqual(migrateHostStudioProject(projectDraft()), normalizeHostStudioProject(projectDraft()));
  assert.throws(
    () => migrateHostStudioProject(projectDraft({ version: 2 })),
    HostStudioProjectError,
  );
});

test('HostStudioProject rejects secrets, generated blobs, and invalid pack or revision references', () => {
  assert.throws(
    () => normalizeHostStudioProject(projectDraft({
      packs: { ...projectDraft().packs, avatar: { id: 'Bad Id', version: 1 } },
      providerSecret: 'not-allowed',
    })),
    (error) => error instanceof HostStudioProjectError
      && error.issues.some((issue) => issue.includes('providerSecret'))
      && error.issues.some((issue) => issue.includes('packs.avatar.id')),
  );
  assert.throws(
    () => normalizeHostStudioProject(projectDraft({
      generation: { recipes: [], generatedBlob: 'data:application/octet-stream;base64,AAAA' },
    })),
    HostStudioProjectError,
  );
  assert.throws(
    () => normalizeHostStudioProject(projectDraft({
      revisions: [projectDraft().revisions[1], projectDraft().revisions[0]],
    })),
    HostStudioProjectError,
  );
});

test('publish readiness reports blockers and exports a data-only project bundle when ready', () => {
  const blocked = getPublishReadinessReport(projectDraft({
    publish: { status: 'draft' },
    rights: { assetStatus: 'review-required', commercialUseStatus: 'pending', voiceConsent: { required: true, status: 'pending' } },
  }));
  assert.equal(blocked.ready, false);
  assert.ok(blocked.blockers.includes('asset rights must be approved'));
  assert.ok(blocked.blockers.includes('voice consent must be verified'));

  const exported = exportHostStudioProject(projectDraft());
  assert.equal(exported.schema, HOST_STUDIO_PROJECT_EXPORT_SCHEMA);
  assert.equal(exported.packs.voice.id, 'xander-broadcast-en-pt');
  assert.equal('revisions' in exported, false);
  assert.equal(Object.isFrozen(exported), true);
});
