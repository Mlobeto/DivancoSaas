> ⚠️ **ESTADO DOCUMENTAL:** Histórico / Legacy de migración  
> Riesgos evaluados para una transición específica; no representa necesariamente el riesgo actual del sistema.  
> Referencia principal vigente: [README.md](./README.md) y [ARQUITECTURA.md](./ARQUITECTURA.md).

# 🛡️ Frontend Architecture Migration - Risk Analysis

## Executive Summary

This document analyzes risks associated with migrating to the new modular architecture and provides mitigation strategies.

**Overall Risk Level:** 🟡 **MEDIUM**

The migration is architecturally sound but requires careful execution to avoid breaking production.

---

## 🎯 Risk Categories

### 1. Breaking Changes (HIGH IMPACT)

| Risk                   | Probability | Impact       | Mitigation                              |
| ---------------------- | ----------- | ------------ | --------------------------------------- |
| Routes stop working    | Medium      | **Critical** | Test all URLs before deployment         |
| Navigation breaks      | Medium      | **Critical** | Feature flag rollback capability        |
| Deep links fail        | Low         | High         | Preserve exact route paths              |
| Browser history broken | Low         | Medium       | React Router handles this automatically |

#### Mitigation Strategy:

- ✅ Create **backup branch** before migration
- ✅ Run **exhaustive URL tests** (see migration guide)
- ✅ Keep **old main.tsx** as rollback option
- ✅ Test with **real user sessions** (preserve auth state)

---

### 2. Performance Degradation (MEDIUM IMPACT)

| Risk                     | Probability | Impact | Mitigation                          |
| ------------------------ | ----------- | ------ | ----------------------------------- |
| Slower initial load      | Low         | Medium | Lazy loading modules optimizes this |
| Module registry overhead | Low         | Low    | Registry is in-memory, very fast    |
| Navigation rendering lag | Low         | Low    | Memoize navigation builder results  |
| Bundle size increase     | Low         | Medium | Code splitting via lazy imports     |

#### Mitigation Strategy:

- ✅ Use `React.lazy()` for all page components
- ✅ Implement `React.memo()` for DynamicNavigation
- ✅ Monitor bundle size with Vite build analysis
- ✅ Use Lighthouse to measure before/after

**Expected Performance:**

- Initial load: **Similar or better** (code splitting)
- Navigation: **Same** (cached in memory)
- Module registration: **<100ms** (one-time cost)

---

### 3. TypeScript & Build Issues (MEDIUM IMPACT)

| Risk                        | Probability | Impact   | Mitigation                                      |
| --------------------------- | ----------- | -------- | ----------------------------------------------- |
| Path alias resolution fails | Medium      | Medium   | Verify vite.config.ts and tsconfig.json         |
| Circular dependencies       | Low         | Medium   | Keep layers separated (product → app → modules) |
| Type errors in modules      | Medium      | Low      | Run `tsc --noEmit` before deploy                |
| Vite build fails            | Low         | **High** | Test production build locally first             |

#### Mitigation Strategy:

- ✅ Update both `vite.config.ts` AND `tsconfig.json` (Step 2-3 in guide)
- ✅ Run `npm run type-check` before committing
- ✅ Run `npm run build` locally before deploying
- ✅ Use strict TypeScript (`strict: true`)

**Known Issues:**

- VSCode may show cached errors → Reload window (Ctrl+Shift+P → Reload Window)
- Vite may need cache clear → `rm -rf node_modules/.vite`

---

### 4. Runtime Errors (HIGH IMPACT)

| Risk                      | Probability | Impact       | Mitigation                             |
| ------------------------- | ----------- | ------------ | -------------------------------------- |
| Module registration fails | Low         | **Critical** | Try/catch in loadModules()             |
| Route definition errors   | Medium      | **High**     | Validate modules at registration       |
| Suspense boundary errors  | Medium      | Medium       | Proper fallback components everywhere  |
| Context missing (auth)    | Low         | High         | Check authStore before building routes |

#### Mitigation Strategy:

- ✅ Comprehensive error boundaries in `main.tsx`
- ✅ Validation in `ModuleRegistry.validateModule()`
- ✅ Fallback UI in `AppRouter` for loading states
- ✅ Console logging for debugging

**Critical Code Blocks:**

```typescript
// main.tsx - MUST have error handling
try {
  await loadModules();
  const router = createAppRouter();
  // render...
} catch (error) {
  // show error UI, don't crash
}
```

---

### 5. User Experience Degradation (MEDIUM IMPACT)

| Risk                        | Probability | Impact   | Mitigation                           |
| --------------------------- | ----------- | -------- | ------------------------------------ |
| Loading spinners everywhere | Medium      | Low      | Optimize lazy loading                |
| Navigation feels slow       | Low         | Low      | Preload modules on login             |
| Bookmarks break             | Low         | Medium   | Preserve all route paths             |
| Session loss on refresh     | Low         | **High** | Zustand persist already handles this |

#### Mitigation Strategy:

- ✅ Show meaningful loading states (not just spinners)
- ✅ Preserve exact URL structure (no route changes)
- ✅ Test deep linking extensively
- ✅ Verify auth persistence works

---

### 6. Feature Flag Misconfiguration (MEDIUM IMPACT)

| Risk                         | Probability | Impact   | Mitigation                    |
| ---------------------------- | ----------- | -------- | ----------------------------- |
| Module accidentally disabled | Low         | **High** | Default all flags to `true`   |
| Wrong flag checks            | Low         | Medium   | Type-safe flag names          |
| Backend sync issues          | Medium      | Medium   | Graceful fallback to defaults |
| Testing flag leaks to prod   | Medium      | High     | Separate prod/dev configs     |

#### Mitigation Strategy:

- ✅ All modules enabled by default (safe baseline)
- ✅ Feature flags loaded from backend (future-ready)
- ✅ Admin UI to manage flags per tenant
- ✅ Audit log for flag changes

**Current State:**

- All modules enabled (`defaultFeatureFlags`)
- Backend API **not yet implemented** (safe)
- Manual override possible for testing

---

### 7. Team Adoption & Maintenance (LOW IMPACT)

| Risk                              | Probability | Impact | Mitigation                    |
| --------------------------------- | ----------- | ------ | ----------------------------- |
| Team doesn't understand new arch  | Medium      | Medium | Documentation + training      |
| Inconsistent module patterns      | Medium      | Low    | Module template + code review |
| Forgotten to register new modules | Medium      | Low    | Linting rule + checklist      |
| Technical debt accumulates        | Low         | Medium | Periodic architecture reviews |

#### Mitigation Strategy:

- ✅ This migration guide (comprehensive docs)
- ✅ Example module (rental) for reference
- ✅ PR template with module checklist
- ✅ Architecture diagrams (FRONTEND_ARCHITECTURE.md)

**Best Practices:**

1. Copy `rental/module.ts` when creating new modules
2. Always export `*Module` from module `index.ts`
3. Register in `app/module-loader/loadModules.ts`
4. Test with feature flag disabled

---

## 🔥 Critical Path Issues

### Issue 1: Module Import Cycle

**Scenario:** Module A imports from Module B, which imports from Module A.

**Impact:** App startup fails completely.

**Prevention:**

- Modules should NEVER import from other modules directly
- Use shared types in `@/shared/types/` if needed
- Communication via events/stores only

**Detection:**

```bash
# Check for circular deps
npx madge --circular --extensions ts,tsx web/src
```

---

### Issue 2: Auth Context Missing

**Scenario:** User not logged in when building routes.

**Impact:** Modules don't register properly, navigation broken.

**Solution:**

```typescript
// AppRouter.tsx
function getModuleContext() {
  const { user, businessUnit } = useAuthStore.getState();

  // Fallback to empty permissions if not logged in
  return createModuleContext(
    user?.tenantId || "",
    businessUnit?.id || "",
    user?.permissions || [], // Safe default
  );
}
```

---

### Issue 3: React Router Version Conflict

**Scenario:** Using React Router v6 syntax with v7.

**Impact:** Routes don't work, errors about `createBrowserRouter`.

**Solution:**

```bash
# Verify version
npm list react-router-dom

# Should be: react-router-dom@7.x.x
# If not, update:
npm install react-router-dom@^7.0.0
```

---

### Issue 4: Lazy Import Failures

**Scenario:** Lazy import path incorrect, module not found.

**Impact:** Page shows loading spinner forever, console error.

**Solution:**

```typescript
// ❌ WRONG - default import from non-default export
const AssetsListPage = lazy(() => import('./pages/AssetsListPage'));

// ✅ CORRECT - named export handling
const AssetsListPage = lazy(() => import('./pages/AssetsListPage').then(m => ({ default: m.AssetsListPage })));

// ✅ OR - make pages export default
export default function AssetsListPage() { ... }
```

---

## 🧪 Testing Strategy

### Pre-Deployment Checklist

- [ ] **Unit tests pass:** `npm run test`
- [ ] **Type check passes:** `npm run type-check`
- [ ] **Build succeeds:** `npm run build`
- [ ] **All routes accessible:** Manual URL tests
- [ ] **Navigation renders:** Visual inspection
- [ ] **Deep links work:** Share URL, open in new tab
- [ ] **Auth flow works:** Login → Select BU → Dashboard
- [ ] **Feature flags work:** Disable module, verify hidden
- [ ] **Console clean:** No errors or warnings
- [ ] **Performance OK:** Lighthouse score >90

### Smoke Tests (Production)

After deploying:

1. **Login test** - Can users log in?
2. **Navigation test** - Does sidebar load?
3. **Module test** - Does each module load?
4. **Search test** - Does global search work? (future)
5. **Performance test** - Page load < 3s

**Rollback trigger:**

- Critical feature broken (login, navigation)
- Performance degraded >50%
- Wide-spread user reports

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

- 🟢 Low Risk: 12 items
- 🟡 Medium Risk: 8 items
- 🔴 High Risk: 4 items

**High-Risk Items (Require Extra Attention):**

1. Routes breaking (deployment testing required)
2. Navigation not rendering (test auth context)
3. Module registration failing (error boundaries critical)
4. Vite build failing (test locally first)

---

## 🚀 Deployment Strategy

### Recommended Approach: **Feature Flag Rollout**

**Phase 1: Internal Testing (1-2 days)**

- Deploy to dev environment
- Enable new architecture via flag
- Internal team tests all modules
- Fix any issues found

**Phase 2: Canary Release (1 day)**

- Deploy to production
- Enable for 10% of users (if possible)
- Monitor error rates and performance
- Rollback if issues detected

**Phase 3: Full Rollout (gradual)**

- Increase to 50% of users
- Monitor for 24 hours
- Increase to 100% if stable

**Rollback Plan:**

- Keep old main.tsx as `main.legacy.tsx`
- Quick switch via environment variable
- < 5 minutes to rollback

---

## 🎓 Lessons Learned (Preventive)

Based on common pitfalls in similar migrations:

### Don't:

- ❌ Change route paths (breaks bookmarks)
- ❌ Skip TypeScript errors (runtime bombs)
- ❌ Test only in dev (prod bundling differs)
- ❌ Deploy Friday afternoon (worst time for issues)
- ❌ Skip documentation (team confusion)

### Do:

- ✅ Test every URL manually
- ✅ Verify production build locally
- ✅ Deploy during low-traffic hours
- ✅ Have rollback plan ready
- ✅ Monitor errors actively post-deploy

---

## 📞 Emergency Contacts

**If deployment goes wrong:**

1. **Check logs:** Browser console + Network tab
2. **Rollback:** Revert main.tsx to old version
3. **Notify:** Alert team in Slack/Discord
4. **Document:** Write incident report for learning

**Common Emergency Fixes:**

```bash
# Quick rollback
git revert HEAD
git push origin main

# Clear user cache (if needed)
# Add ?v=2 to deployment URL

# Force refresh
# Ctrl+Shift+R in browser
```

---

## ✅ Success Metrics

Migration is successful when:

- **Zero** critical bugs reported (week 1)
- **<5%** minor issues reported (week 1)
- **Same or better** performance metrics
- **100%** feature parity maintained
- **Positive** developer feedback on new architecture

---

## 📚 Additional Resources

- **Migration Guide:** `docs/FRONTEND_MIGRATION_GUIDE.md`
- **Architecture Docs:** `docs/FRONTEND_ARCHITECTURE.md`
- **Module Example:** `web/src/modules/rental/module.ts`
- **Type Definitions:** `web/src/product/types/module.types.ts`

---

**Last Updated:** February 14, 2026  
**Risk Assessment Version:** 1.0  
**Reviewed By:** Senior Frontend Architect
