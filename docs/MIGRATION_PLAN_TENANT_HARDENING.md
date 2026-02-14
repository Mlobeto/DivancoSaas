# Multi-Tenant Hardening - Migration Plan

## Overview

This document outlines the practical steps to deploy the multi-tenant hardening changes safely to production.

---

## Pre-Deployment Checklist

### Code Review

- [ ] Review tenant-model-registry.ts (all models correctly categorized)
- [ ] Review prisma-extensions.ts (error handling correct)
- [ ] Review auth.middleware.ts (BU validation logic)
- [ ] Review context.middleware.ts (validateTenantHeader implementation)

### Database Readiness

- [x] All tenant-scoped models have tenantId field
- [x] All tenant-scoped models have @@index([tenantId])
- [x] All tenant-scoped models have FK to Tenant
- [ ] Run index usage analysis (optional optimization)

### Testing

- [ ] Unit tests for Prisma extensions
- [ ] Integration tests for cross-tenant isolation
- [ ] Load tests for performance impact
- [ ] Security tests for attack vectors

---

## Migration Steps

### Phase 1: Staging Deployment

**Duration**: 1 week

**Steps**:

1. **Deploy Code** (15 min)

   ```bash
   cd backend
   git checkout feature/tenant-hardening
   npm run build
   npm run test
   pm2 restart divanco-staging
   ```

2. **Verify Startup** (5 min)
   - Check logs for `validateModelRegistration()` success
   - Verify no startup errors
   - Confirm Prisma extensions loaded

3. **Smoke Tests** (30 min)
   - Login as user in tenant A
   - Create/read/update/delete assets
   - Switch to user in tenant B
   - Verify tenant A data not visible
   - Test background job execution

4. **Monitor Logs** (48 hours)
   - Watch for `TenantContextError` exceptions
   - Identify any background jobs without context
   - Check query performance (should be unchanged)

5. **Fix Issues** (as needed)
   - Add `runWithContext()` to any jobs throwing errors
   - Use `prismaBase` for system operations
   - Document any edge cases

### Phase 2: Production Canary

**Duration**: 3-5 days

**Steps**:

1. **Deploy to Canary** (30 min)

   ```bash
   # Deploy to 10% of production servers
   ansible-playbook deploy-canary.yml --extra-vars "version=tenant-hardening"
   ```

2. **Enable Monitoring** (10 min)
   - Create Datadog/Grafana dashboard
   - Set up alerts:
     - TenantContextError > 10/hour → PagerDuty
     - Cross-tenant attempt → Security team email
     - Query P99 latency > 200ms → Slack alert

3. **Business Validation** (2 hours)
   - Test all major workflows:
     - Asset management (create, rent, return)
     - Quotations (create, approve, convert to contract)
     - Billing (invoices, payments)
     - Reports (filtered to correct tenant)
   - Test with 2-3 different tenants

4. **Review Metrics** (24-48 hours)
   - Error rate: should be unchanged
   - Latency: should be < 5ms increase
   - Database load: should be unchanged
   - Security incidents: should be 0

5. **Decision Point**
   - ✅ All metrics green → Proceed to full deployment
   - ⚠️ Minor issues → Fix and continue monitoring
   - 🚨 Critical issues → Rollback

### Phase 3: Full Production

**Duration**: 1 day

**Steps**:

1. **Deploy to All Servers** (1 hour)

   ```bash
   ansible-playbook deploy-production.yml --extra-vars "version=tenant-hardening"
   ```

2. **Verify Deployment** (15 min)
   - Check all servers healthy
   - Verify version deployed
   - Run health checks

3. **Monitor Closely** (48 hours)
   - Watch error logs
   - Monitor performance
   - Check security logs
   - Review customer reports

4. **Communication**
   - Notify internal team: "Tenant isolation hardening deployed"
   - Update status page: "Security enhancement completed"
   - Document in change log

### Phase 4: Post-Deployment

**Duration**: 1-2 weeks

**Steps**:

1. **Index Optimization** (optional)

   ```sql
   -- Add composite indexes if needed
   CREATE INDEX CONCURRENTLY "client_business_units_tenant_bu_idx"
   ON "client_business_units"("tenantId", "businessUnitId");

   CREATE INDEX CONCURRENTLY "supply_usages_tenant_bu_idx"
   ON "supply_usages"("tenantId", "businessUnitId");
   ```

2. **Security Audit**
   - Review logs for unexpected patterns
   - Check for any cross-tenant attempts
   - Validate all background jobs working

3. **Performance Review**
   - Analyze slow query log
   - Check index usage statistics
   - Optimize queries if needed

4. **Documentation**
   - Update developer onboarding docs
   - Add examples to API documentation
   - Create runbook for troubleshooting

---

## Rollback Plan

### Immediate Rollback (< 5 minutes)

If critical issues detected:

```bash
# Redeploy previous version
ansible-playbook deploy-production.yml --extra-vars "version=previous-stable"

# Or use git revert
git revert <commit-hash>
git push origin main
pm2 restart all
```

### Partial Rollback (< 30 minutes)

If only specific middleware causing issues:

1. Comment out strict enforcement in prisma-extensions.ts:

   ```typescript
   // Temporarily disable strict enforcement
   if (!hasRequestContext()) {
     console.warn("Context missing but allowing...");
     return query(args); // Fallback to old behavior
   }
   ```

2. Redeploy just the backend:
   ```bash
   npm run build
   pm2 restart divanco-api
   ```

### Data Integrity Check

After any rollback:

```sql
-- Verify no cross-tenant data corruption
SELECT
  t.name AS tenant_name,
  COUNT(*) AS asset_count
FROM assets a
JOIN tenants t ON a."tenantId" = t.id
GROUP BY t.id, t.name
ORDER BY t.name;

-- Check for orphaned records
SELECT COUNT(*)
FROM assets a
WHERE NOT EXISTS (
  SELECT 1 FROM tenants t WHERE t.id = a."tenantId"
);
```

---

## Troubleshooting Guide

### Issue: TenantContextError in Background Job

**Symptom**: Cron job fails with "Cannot access model without tenant context"

**Solution**:

```typescript
// Wrap job in runWithContext
cron.schedule("0 * * * *", async () => {
  const tenants = await prismaBase.tenant.findMany({
    where: { status: "ACTIVE" },
  });

  for (const tenant of tenants) {
    await runWithContext(
      { tenantId: tenant.id, userId: "system" },
      async () => {
        await processMonthlyReports(); // Now has context
      },
    );
  }
});
```

### Issue: Seed Script Failing

**Symptom**: `npm run seed` throws TenantContextError

**Solution**: Ensure seed uses `prismaBase`:

```typescript
// ❌ Wrong
import prisma from "@config/database";

// ✅ Correct
import { prismaBase } from "@config/database";
const prisma = prismaBase;
```

### Issue: Performance Degradation

**Symptom**: Query latency increased after deployment

**Diagnosis**:

```sql
-- Check missing indexes
SELECT schemaname, tablename, indexname, idx_scan
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
AND idx_scan = 0
AND indexname LIKE '%tenant%';

-- Check slow queries
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
WHERE query LIKE '%tenantId%'
ORDER BY mean_exec_time DESC
LIMIT 20;
```

**Solution**: Add missing indexes as needed.

### Issue: Cross-Tenant Access Attempt

**Symptom**: 403 error logged with "Business unit does not belong to your tenant"

**Action**:

1. Review logs for attacker IP
2. Check if legitimate user error or attack
3. If attack: ban IP, notify security team
4. If error: improve UX to prevent BU selection from wrong tenant

### Issue: Webhook Failing

**Symptom**: Webhook returns 400 "X-Tenant-ID header required"

**Solution**: Update webhook to include tenant header:

```javascript
// In webhook sender
fetch("https://api.divanco.com/webhooks/payment", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-Tenant-ID": payment.tenantId,
    "X-Webhook-Signature": generateSignature(payload),
  },
  body: JSON.stringify(payload),
});
```

And ensure validateTenantHeader is registered:

```typescript
webhookRouter.use(verifySignature);
webhookRouter.use(validateTenantHeader);
webhookRouter.use(optionalContextInjector);
```

---

## Success Criteria

### Technical Metrics

- ✅ Zero TenantContextError exceptions in production after fixes
- ✅ Query performance < 5ms degradation (P99)
- ✅ All background jobs executing successfully
- ✅ Zero cross-tenant data access incidents

### Business Metrics

- ✅ No customer-reported data visibility issues
- ✅ All multi-tenant workflows functioning
- ✅ Audit logs showing proper tenant isolation
- ✅ Security team approval

### Compliance

- ✅ SOC 2 audit evidence: infrastructure-level tenant isolation
- ✅ GDPR compliance: data segregation enforced
- ✅ Penetration test: no cross-tenant access possible
- ✅ Internal security review: approved

---

## Timeline

| Phase                 | Duration     | Key Milestone                     |
| --------------------- | ------------ | --------------------------------- |
| Code Review & Testing | 2 days       | All tests passing                 |
| Staging Deployment    | 1 week       | No errors, performance validated  |
| Canary Deployment     | 3-5 days     | 10% traffic, metrics green        |
| Full Production       | 1 day        | 100% deployed                     |
| Monitoring Period     | 1 week       | Stability confirmed               |
| Index Optimization    | 2-3 days     | Performance optimized             |
| **Total**             | **~3 weeks** | **Production hardening complete** |

---

## Sign-Off

| Role          | Name           | Date           | Signature      |
| ------------- | -------------- | -------------- | -------------- |
| Backend Lead  | ****\_\_\_**** | ****\_\_\_**** | ****\_\_\_**** |
| Security Lead | ****\_\_\_**** | ****\_\_\_**** | ****\_\_\_**** |
| DevOps Lead   | ****\_\_\_**** | ****\_\_\_**** | ****\_\_\_**** |
| CTO           | ****\_\_\_**** | ****\_\_\_**** | ****\_\_\_**** |

---

## Appendix: Quick Commands

### Check Deployment Status

```bash
pm2 status
pm2 logs divanco-api --lines 50
```

### Check Database Health

```sql
-- Active connections by tenant
SELECT
  (SELECT name FROM tenants WHERE id = current_setting('app.current_tenant_id', true)::uuid) as tenant,
  COUNT(*) as connections
FROM pg_stat_activity
WHERE state = 'active'
GROUP BY current_setting('app.current_tenant_id', true);

-- Index usage
SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC
LIMIT 20;
```

### Check Application Health

```bash
curl -s http://localhost:3000/health | jq '.'
```

### Verify Tenant Isolation

```bash
# Test as tenant A
curl -H "Authorization: Bearer $TOKEN_A" \
     -H "X-Tenant-ID: $TENANT_A" \
     http://localhost:3000/api/v1/assets

# Try to access with tenant B header (should fail)
curl -H "Authorization: Bearer $TOKEN_A" \
     -H "X-Tenant-ID: $TENANT_B" \
     http://localhost:3000/api/v1/assets
# Expected: 403 Forbidden
```

---

**Document Version**: 1.0  
**Last Updated**: February 14, 2026  
**Owner**: DevOps Team
