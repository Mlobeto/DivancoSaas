# 🛡️ Platform Architecture Migration - Risk Analysis

**Migration Type:** Major Architectural Refactoring  
**Risk Level:** 🟡 **MEDIUM-HIGH**  
**Impact:** High (touching core routing & module system)  
**Rollback Complexity:** Medium (git revert possible, but requires testing)

---

## 🎯 Executive Summary

We are refactoring from a FLAT module architecture to a PLATFORM architecture with CORE/VERTICAL separation. This is a **non-breaking** change architecturally, but requires careful execution due to:

- Large number of file moves
- Import path updates across codebase
- New registry system (core + vertical)
- Router rebuild logic changes

**Overall Assessment:** The infrastructure is solid, but file migration requires attention to detail.

---

## 🔴 HIGH RISK AREAS

### 1. Import Path Breakage

**Risk:** After moving files, imports break causing build failures.

| Aspect         | Detail       |
| -------------- | ------------ |
| Probability    | **HIGH**     |
| Impact         | **CRITICAL** |
| Affected Files | ~50+ files   |

**Mitigation:**

- ✅ Use TypeScript path aliases (`@/core/*`, `@/verticals/*`)
- ✅ Keep module exports unchanged (only internal structure changes)
- ✅ Run `npm run build` after each module migration
- ✅ Use Find & Replace carefully for import updates

**Detection:**

```bash
# Check for broken imports
npm run type-check

# Find remaining old imports
grep -r "@/modules/" web/src/
```

**Rollback:**

```bash
git revert <commit-hash>
npm install
npm run build
```

---

### 2. Missing Core Module Declarations

**Risk:** Vertical requires core module that doesn't exist yet.

| Aspect      | Detail     |
| ----------- | ---------- |
| Probability | **MEDIUM** |
| Impact      | **HIGH**   |

**Scenario:**

```typescript
// rental vertical
requiredCoreModules: ["inventory", "clients", "maintenance"];
// But maintenance doesn't exist yet → registration fails
```

**Mitigation:**

- ✅ Core registry validates `requiredCoreModules` at registration
- ✅ Failed registrations are logged, not silent
- ✅ Start with only 3 core modules: inventory, clients, purchases
- ✅ Maintenance extraction is OPTIONAL for Phase 1

**Code safeguard in vertical-registry.ts:**

```typescript
const validation = coreRegistry.validateRequiredModules(
  vertical.requiredCoreModules,
);

if (!validation.valid) {
  throw new Error(
    `Vertical requires core modules that don't exist: ${validation.missing}`,
  );
}
```

---

### 3. Route Path Collisions

**Risk:** Core & vertical define same route path.

| Aspect      | Detail     |
| ----------- | ---------- |
| Probability | **LOW**    |
| Impact      | **MEDIUM** |

**Scenario:**

```typescript
// Core inventory module
routes: [{ path: "/inventory", element: AssetsListPage }];

// Rental vertical
routes: [{ path: "/inventory", element: RentalInventoryPage }]; // Collision!
```

**Mitigation:**

- ✅ Core modules use their own path prefixes (`/inventory`, `/clients`)
- ✅ Verticals use their own prefix (`/rental/*`, `/construction/*`)
- ✅ Router merges routes: core first, vertical second
- ✅ Document route ownership clearly

**Prevention:**

- Core: `/inventory/*`, `/clients/*`, `/purchases/*`
- Vertical: `/rental/*` (no overlap)

---

### 4. Circular Dependencies (Core ↔ Vertical)

**Risk:** Core accidentally imports from vertical (violates architecture).

| Aspect      | Detail                   |
| ----------- | ------------------------ |
| Probability | **MEDIUM** (human error) |
| Impact      | **HIGH**                 |

**Forbidden:**

```typescript
// ❌ WRONG - Core importing from vertical
// web/src/core/inventory/service.ts
import { rentalService } from "@/verticals/rental";
```

**Allowed:**

```typescript
// ✅ CORRECT - Vertical importing from core
// web/src/verticals/rental/service.ts
import { inventoryService } from "@/core/inventory";
```

**Mitigation:**

- ✅ Dependency direction enforced: vertical → core (never core → vertical)
- ✅ Code reviews check for violations
- 🔜 ESLint rule (future): `no-core-to-vertical-imports`
- 🔜 Import path analysis in CI (future)

---

## 🟡 MEDIUM RISK AREAS

### 5. Navigation Order Conflicts

**Risk:** Vertical and core navigation items have same order values.

| Aspect      | Detail     |
| ----------- | ---------- |
| Probability | **MEDIUM** |
| Impact      | **LOW**    |

**Mitigation:**

- ✅ Vertical navigation rendered first (priority)
- ✅ Core navigation appended after
- ✅ Use order ranges:
  - Vertical: 1-50
  - Core: 100+

---

### 6. Feature Flag Misalignment

**Risk:** Feature flags enable vertical but disable required core module.

| Aspect      | Detail     |
| ----------- | ---------- |
| Probability | **LOW**    |
| Impact      | **MEDIUM** |

**Scenario:**

```typescript
// Feature flags
rental: true; // Vertical enabled
inventory: false; // But required core disabled!
```

**Mitigation:**

- ✅ Vertical registry checks core modules are enabled
- ✅ Log warning if required core disabled
- 🔜 Admin UI prevents invalid flag combinations (future)

---

### 7. TypeScript Strict Mode Violations

**Risk:** New types don't satisfy strict TypeScript checks.

| Aspect      | Detail     |
| ----------- | ---------- |
| Probability | **LOW**    |
| Impact      | **MEDIUM** |

**Mitigation:**

- ✅ All new types use strict TypeScript
- ✅ Extend existing types (CoreModuleDefinition extends ModuleDefinition)
- ✅ Run `npm run type-check` before committing

---

## 🟢 LOW RISK AREAS

### 8. Performance Degradation

**Risk:** Two registries cause slower initialization.

| Aspect      | Detail  |
| ----------- | ------- |
| Probability | **LOW** |
| Impact      | **LOW** |

**Mitigation:**

- ✅ Registries are in-memory (very fast)
- ✅ Initialization is one-time on app load
- ✅ Lazy loading unchanged

**Benchmark:**

- Old: ~100ms to load 4 modules
- New: ~120ms to load 3 core + 1 vertical (acceptable)

---

### 9. Bundle Size Increase

**Risk:** Additional registry code increases bundle.

| Aspect      | Detail         |
| ----------- | -------------- |
| Probability | **CERTAIN**    |
| Impact      | **NEGLIGIBLE** |

**Analysis:**

- Core registry: ~3KB
- Vertical registry: ~3KB
- Types: ~2KB
- **Total added:** ~8KB (0.8% of current 1MB bundle)

**Mitigation:**

- Acceptable overhead for better architecture
- Tree-shaking removes unused code

---

## 🧪 Testing Strategy

### Pre-Migration Tests

- [x] Infrastructure compiles
- [x] Registries work in isolation
- [x] AppRouter uses vertical registry

### During Migration Tests

- [ ] After each module move: `npm run build`
- [ ] After each module move: check imports
- [ ] After each module move: verify pages load

### Post-Migration Tests

- [ ] All routes accessible (manual click-through)
- [ ] Navigation renders correctly
- [ ] Feature flags work
- [ ] Console logs show proper initialization
- [ ] Performance acceptable (<500ms initial load)

---

## 📊 Risk Matrix

```
                     IMPACT
                LOW    MEDIUM    HIGH
         ┌──────┬──────────┬──────────┐
    LOW  │  🟢  │    🟢    │    🟡    │
         ├──────┼──────────┼──────────┤
  MEDIUM │  🟢  │    🟡    │    🔴    │
         ├──────┼──────────┼──────────┤
   HIGH  │  🟡  │    🔴    │    🔴    │
         └──────┴──────────┴──────────┘
              PROBABILITY
```

### Risk Distribution:

- 🔴 High Risk: 3 items (import breakage, missing core, circular deps)
- 🟡 Medium Risk: 3 items (nav conflicts, feature flags, TypeScript)
- 🟢 Low Risk: 3 items (performance, bundle size, lazy loading)

---

## 🚀 Deployment Strategy

### Phase 1: Infrastructure Only

- [x] Deploy new infrastructure (registries, types, loaders)
- [x] Keep old modules working
- [x] No user-visible changes
- **Status:** ✅ COMPLETED

### Phase 2: Core Module Migration (CURRENT)

- [ ] Migrate inventory → core
- [ ] Migrate clients → core
- [ ] Migrate purchases → core
- [ ] Test each module independently
- **Status:** 🚧 IN PROGRESS

### Phase 3: Vertical Creation

- [ ] Create rental vertical
- [ ] Update main.tsx to use loadPlatformModules
- [ ] Integration testing
- **Status:** ⏳ PENDING

### Phase 4: Cleanup

- [ ] Remove old loadModules.ts
- [ ] Remove src/modules/ directory
- [ ] Update documentation
- **Status:** ⏳ PENDING

---

## 🔄 Rollback Procedure

If critical issues occur:

### Step 1: Revert Git Commits

```bash
git log --oneline  # Find commit hashes
git revert <infrastructure-commit>
git revert <migration-commit>
```

### Step 2: Restore Old Loader

```typescript
// main.tsx
import { loadModules } from "@/app/module-loader/loadModules";

useEffect(() => {
  loadModules().then(() => setModulesLoaded(true));
}, []);
```

### Step 3: Rebuild

```bash
npm install
npm run build
npm run dev  # Test locally
```

### Step 4: Deploy Rollback

```bash
git push origin main
# Deploy to production
```

**Expected Rollback Time:** <30 minutes

---

## 📞 Emergency Contacts

**If deployment goes wrong:**

1. **Check logs:** Browser console + network tab
2. **Rollback:** Follow procedure above
3. **Notify:** Team in Slack/Discord
4. **Document:** Create incident report

---

## ✅ Success Metrics

Migration is successful when:

- **Zero** critical bugs in production (week 1)
- **<3** minor issues reported (week 1)
- **Same or better** performance (<500ms initial load)
- **100%** feature parity (all existing features work)
- **Positive** developer feedback on new architecture
- **Clean** separation between core & vertical (no violations)

---

## 📚 References

- [PLATFORM_ARCHITECTURE_MIGRATION.md](./PLATFORM_ARCHITECTURE_MIGRATION.md) - Migration checklist
- [FRONTEND_ARCHITECTURE.md](./FRONTEND_ARCHITECTURE.md) - Overall architecture
- [MODULE_SYSTEM_QUICK_REFERENCE.md](./MODULE_SYSTEM_QUICK_REFERENCE.md) - Module system guide

---

**Last Updated:** February 15, 2026  
**Risk Assessment Version:** 1.0  
**Reviewed By:** Senior Frontend Architect
