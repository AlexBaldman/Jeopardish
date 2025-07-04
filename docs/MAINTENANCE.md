# Documentation Maintenance Guide

**Created:** 2025-01-04  
**Updated:** 2025-01-04  
**Author:** The Architect (AI)  

## Quick Reference

This guide helps maintain consistency across all project documentation.

## When to Update Documentation

### Always Update When:
- ✅ Making architectural decisions
- ✅ Changing APIs or interfaces
- ✅ Adding/removing features
- ✅ Modifying build processes
- ✅ Changing deployment procedures
- ✅ After AI collaboration sessions

### Documentation Checklist

Before committing code changes, ask yourself:

- [ ] Does this change affect the architecture?
  - → Update `architecture/current-state.md`
- [ ] Is this a significant decision?
  - → Create new ADR in `architecture/decisions/`
- [ ] Does this add a new feature?
  - → Update `planning/backlog.md` and create feature spec
- [ ] Does this change the setup process?
  - → Update `development/setup.md`
- [ ] Did an AI agent help with this?
  - → Log session in `ai-interactions/sessions/`

## File Naming Conventions

### Date-based Files
```
YYYY-MM-DD-description.md
2025-01-04-architecture-review.md
```

### Feature Files
```
feature-name.md
ai-trebek-enhancement.md
```

### ADR Files
```
adr-XXX-short-title.md
adr-001-modular-architecture.md
```

## Standard Document Header

```markdown
# Document Title

**Created:** YYYY-MM-DD  
**Updated:** YYYY-MM-DD  
**Author:** [Your Name/AI Agent Name]  
**Status:** Draft/Review/Approved  

## Summary
One paragraph summary of what this document covers.
```

## AI Session Documentation

When working with AI agents, create a session log:

```markdown
# AI Session: [Purpose]

**Date:** YYYY-MM-DD  
**AI Agent:** [Tool Name and Model]  
**Purpose:** [What you're trying to accomplish]  
**Session Duration:** [Approximate time]  

## Session Summary
[Brief overview of what was accomplished]

## Key Decisions
- [Decision 1]
- [Decision 2]

## Code/Changes Generated
[List files created or modified]

## Action Items
- [ ] [Next step 1]
- [ ] [Next step 2]
```

## Documentation Review Schedule

### Daily
- Update any changed documentation
- Log AI interactions

### Weekly
- Review and update sprint documentation
- Update roadmap progress
- Clean up session logs

### Monthly
- Architecture review
- Update all "Last Updated" dates
- Archive old session logs
- Review and close completed items

## Common Documentation Tasks

### Adding a New Feature Spec
```bash
cd docs/planning/features/
cp feature-template.md new-feature-name.md
# Edit the new file
```

### Creating an ADR
```bash
cd docs/architecture/decisions/
cp adr-template.md adr-002-your-decision.md
# Edit with your decision details
```

### Logging an AI Session
```bash
cd docs/ai-interactions/sessions/
echo "# AI Session: Purpose" > YYYY-MM-DD-session-purpose.md
# Add session details
```

## Documentation Dependencies

When updating one document, check if these related documents need updates:

| If you update... | Also check... |
|-----------------|---------------|
| Architecture | ADRs, Roadmap |
| Features | Backlog, Roadmap |
| Setup Guide | README, Testing |
| API Docs | Architecture, Features |
| AI Sessions | Learnings, Related features |

## Tips for Good Documentation

1. **Be Specific**: Include version numbers, exact commands
2. **Add Examples**: Show, don't just tell
3. **Link Liberally**: Connect related documents
4. **Update Dates**: Always update the "Updated" field
5. **Think Future**: Write for someone joining in 6 months

## Getting Help

- Check existing documentation first
- Look for similar examples in the docs
- Create an AI session for complex documentation needs
- Use templates for consistency

---

*Remember: Good documentation is a gift to your future self and your team!*
