# ADR-001: No Framework (Initially)

**Date**: January 13, 2025  
**Status**: Accepted  
**Context**: Refactoring Jeopardish frontend architecture  

## Decision

We will build the component system using vanilla JavaScript rather than adopting React, Vue, or another framework immediately.

## Rationale

1. **Understanding Requirements**
   - We don't yet know what we actually need
   - Frameworks bring assumptions that may not fit
   - Better to discover patterns organically

2. **Learning Opportunity**
   - Building from scratch teaches fundamentals
   - Understanding how frameworks work under the hood
   - Carmack: "You should be able to build your tools"

3. **Performance**
   - No framework overhead
   - Complete control over optimizations
   - Ship only code we actually use

4. **Flexibility**
   - Can adopt framework later if needed
   - Architecture will be framework-agnostic
   - Easy to migrate when we understand needs

## Consequences

### Positive
- Minimal bundle size
- Maximum performance
- Deep understanding of our needs
- No framework lock-in

### Negative
- More initial development time
- Need to solve solved problems
- Less ecosystem support
- May reinvent some wheels

## Implementation

1. Build thin component base class
2. Implement efficient DOM diffing
3. Create component lifecycle
4. Add event handling
5. Evaluate and potentially migrate later

## Alternatives Considered

1. **React** - Too heavy for our needs, JSX compilation overhead
2. **Vue** - Good option, but want to understand our patterns first  
3. **Svelte** - Compile-time optimization good, but new ecosystem
4. **Web Components** - Limited browser support, awkward API

## Review

Will revisit after Phase 4 completion. If we find ourselves rebuilding React patterns, we'll adopt React. If our needs are simpler, we'll keep our solution.

---

*"Don't use a framework until you understand what problem it's solving for you." - Carmack*
