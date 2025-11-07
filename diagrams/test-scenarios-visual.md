# Test Scenarios - Visual Format

Alternative visual formats for demonstrating system permissions to business owners.

---

## Format 2: Quick Reference Matrix

### Action vs Role Matrix

| Action | Owner | Manager | Employee |
|--------|-------|---------|----------|
| **Create Deal** | All | All | All |
| **View Deal** | All | Only access locations | Only own deals |
| **Edit Deal** | All | Only access locations | Only own deals |
| **Delete Deal** | All | Only access locations | Only own deals |
| **Duplicate Deal** | All | All | All |
| **View Users** | All | Assigned locations | No |
| **Add User** | All | Assigned locations | No |
| **Edit User** | All | Assigned locations | No |
| **Delete User** | All | Assigned locations | No |
| **View Customers** | All | All | No |
| **Add Customer** | No | No | No |
| **Edit Customer** | No | No | No |
| **Delete Customer** | No | No | No |
| **Add Service** | All | All | No |
| **Edit Service** | All | All | No |
| **Delete Service** | All | All | No |

---

## Format 3: Scenario Cards (One-Page Format)

### Scenario Card: Manager Creates Deal
```
┌─────────────────────────────────────────────┐
│ SCENARIO: Manager Creates Deal              │
│ User: Manager                               │
│ Goal: Create deal at assigned location      │
├─────────────────────────────────────────────┤
│ STEPS:                                      │
│ 1. Login → Business Management              │
│ 2. Click "Add Deal"                         │
│ 3. Location dropdown → Shows ONLY assigned  │
│ 4. Select "Downtown Store"                  │
│ 5. Fill details → Submit                    │
├─────────────────────────────────────────────┤
│ EXPECTED:                                   │
│ ✅ Sees assigned locations only             │
│ ✅ Cannot see unassigned locations          │
│ ✅ Deal created successfully                │
└─────────────────────────────────────────────┘
```

### Scenario Card: Employee Edits Deal
```
┌─────────────────────────────────────────────┐
│ SCENARIO: Employee Edits Deal               │
│ User: Employee                              │
│ Goal: Edit own deal (allowed)               │
├─────────────────────────────────────────────┤
│ STEPS:                                      │
│ 1. Login → View Deal List                   │
│ 2. Find own deal                            │
│ 3. Click "Edit" → ✅ Button visible         │
│ 4. Modify details → Save                    │
├─────────────────────────────────────────────┤
│ EXPECTED:                                   │
│ ✅ Can edit own deals                       │
│ ❌ Cannot edit other employees' deals       │
└─────────────────────────────────────────────┘
```
