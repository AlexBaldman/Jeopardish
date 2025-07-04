# Documentation Migration Plan

**Created:** 2025-01-04  
**Updated:** 2025-01-04  
**Author:** The Architect (AI)  
**Status:** In Progress  

## Summary

This plan outlines the consolidation of existing project documentation into the new `docs/` structure.

## Current State

We have two documentation locations:
1. **`project-planning/`** - Contains comprehensive planning documents (00-05)
2. **`docs/`** - New structure with architecture focus
3. **`_____brainstorm&planning/`** - Contains task lists and feature ideas

## Migration Strategy

### Phase 1: Consolidate Planning Documents

1. **Move executive summary** 
   - From: `project-planning/00-executive-summary.md`
   - To: `docs/planning/executive-summary.md`

2. **Merge architecture analysis**
   - Keep: `docs/architecture/current-state.md` (more recent and comprehensive)
   - Archive: `project-planning/01-jeopardish-architecture-analysis.md`
   - Extract any unique insights from the old file

3. **Move roadmap**
   - From: `project-planning/02-jeopardish-development-roadmap.md`
   - To: `docs/planning/roadmap.md`

4. **Move sub-agents spec**
   - From: `project-planning/03-jeopardish-sub-agents.md`
   - To: `docs/ai-interactions/sub-agent-specifications.md`

5. **Move implementation guide**
   - From: `project-planning/04-implementation-guide.md`
   - To: `docs/development/implementation-guide.md`

6. **Move sub-agents creation guide**
   - From: `project-planning/05-creating-sub-agents.md`
   - To: `docs/ai-interactions/creating-sub-agents.md`

### Phase 2: Convert Brainstorming Notes

1. **Extract features from instructions**
   - From: `_____brainstorm&planning/instructions.md`
   - To: `docs/brainstorming/features-wishlist.md`
   - Format as proper feature specifications

### Phase 3: Clean Up

1. **Archive old folders**
   - Create `archive/` folder
   - Move `project-planning/` to `archive/old-project-planning/`
   - Move `_____brainstorm&planning/` to `archive/old-brainstorming/`

2. **Update references**
   - Update any internal links in moved documents
   - Update main README to point to new locations

## File Mapping

| Old Location | New Location | Action |
|--------------|--------------|--------|
| `project-planning/00-executive-summary.md` | `docs/planning/executive-summary.md` | Move |
| `project-planning/01-jeopardish-architecture-analysis.md` | Archive | Merge insights into current-state.md |
| `project-planning/02-jeopardish-development-roadmap.md` | `docs/planning/roadmap.md` | Move |
| `project-planning/03-jeopardish-sub-agents.md` | `docs/ai-interactions/sub-agent-specifications.md` | Move |
| `project-planning/04-implementation-guide.md` | `docs/development/implementation-guide.md` | Move |
| `project-planning/05-creating-sub-agents.md` | `docs/ai-interactions/creating-sub-agents.md` | Move |
| `_____brainstorm&planning/instructions.md` | `docs/brainstorming/features-wishlist.md` | Convert |

## Benefits of Consolidation

1. **Single source of truth** - All docs in one place
2. **Better organization** - Clear categories for different doc types
3. **Easier navigation** - Consistent structure
4. **AI-friendly** - Clear locations for AI interactions
5. **Future-proof** - Room to grow

## Next Steps

1. Execute Phase 1 migrations
2. Convert brainstorming notes to proper specs
3. Archive old folders
4. Update all references
5. Create missing documentation identified in gaps

---

*This migration ensures we maintain all existing work while creating a more organized structure for the future.*
