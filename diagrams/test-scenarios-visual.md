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

### Owner Scenarios

#### Scenario Card: Owner Creates Deal
```
┌─────────────────────────────────────────────┐
│ SCENARIO: Owner Creates Deal                │
│ User: Owner                                 │
│ Goal: Create deal at any location           │
├─────────────────────────────────────────────┤
│ STEPS:                                      │
│ 1. Login → Business Management              │
│ 2. Click "Add Deal"                         │
│ 3. Location dropdown → Shows ALL locations  │
│ 4. Select any location                      │
│ 5. Fill details → Submit                    │
├─────────────────────────────────────────────┤
│ EXPECTED:                                   │
│ ✅ Sees all locations                       │
│ ✅ Can select any location                  │
│ ✅ Deal created successfully                │
└─────────────────────────────────────────────┘
```

#### Scenario Card: Owner Views Deals
```
┌─────────────────────────────────────────────┐
│ SCENARIO: Owner Views Deals                 │
│ User: Owner                                 │
│ Goal: View all deals across all locations   │
├─────────────────────────────────────────────┤
│ STEPS:                                      │
│ 1. Login → Business Management              │
│ 2. Navigate to Deal Management              │
│ 3. View deal list                           │
├─────────────────────────────────────────────┤
│ EXPECTED:                                   │
│ ✅ Sees all deals from all locations        │
│ ✅ Can view any deal details                │
└─────────────────────────────────────────────┘
```

#### Scenario Card: Owner Edits Deal
```
┌─────────────────────────────────────────────┐
│ SCENARIO: Owner Edits Deal                  │
│ User: Owner                                 │
│ Goal: Edit any deal from any location       │
├─────────────────────────────────────────────┤
│ STEPS:                                      │
│ 1. Login → Deal Management                  │
│ 2. Find any deal                            │
│ 3. Click "Edit" → ✅ Button visible         │
│ 4. Modify details → Save                    │
├─────────────────────────────────────────────┤
│ EXPECTED:                                   │
│ ✅ Can edit any deal                        │
│ ✅ Edit button visible on all deals         │
└─────────────────────────────────────────────┘
```

#### Scenario Card: Owner Deletes Deal
```
┌─────────────────────────────────────────────┐
│ SCENARIO: Owner Deletes Deal                │
│ User: Owner                                 │
│ Goal: Delete any deal from any location     │
├─────────────────────────────────────────────┤
│ STEPS:                                      │
│ 1. Login → Deal Management                  │
│ 2. Find any deal                            │
│ 3. Click "Delete" → ✅ Button visible       │
│ 4. Confirm deletion                         │
├─────────────────────────────────────────────┤
│ EXPECTED:                                   │
│ ✅ Can delete any deal                      │
│ ✅ Delete button visible on all deals       │
└─────────────────────────────────────────────┘
```

#### Scenario Card: Owner Duplicates Deal
```
┌─────────────────────────────────────────────┐
│ SCENARIO: Owner Duplicates Deal             │
│ User: Owner                                 │
│ Goal: Create a copy of an existing deal     │
├─────────────────────────────────────────────┤
│ STEPS:                                      │
│ 1. Login → Deal Management                  │
│ 2. Find deal to duplicate                   │
│ 3. Click "Duplicate" button                 │
│ 4. Dialog opens with pre-filled data        │
│ 5. Modify if needed → Submit                │
├─────────────────────────────────────────────┤
│ EXPECTED:                                   │
│ ✅ Can duplicate any deal                   │
│ ✅ New deal created with "Copy of" prefix   │
│ ✅ Can modify before saving                 │
└─────────────────────────────────────────────┘
```

#### Scenario Card: Owner Views Users
```
┌─────────────────────────────────────────────┐
│ SCENARIO: Owner Views Users                 │
│ User: Owner                                 │
│ Goal: View all users in the company         │
├─────────────────────────────────────────────┤
│ STEPS:                                      │
│ 1. Login → User Management                  │
│ 2. View user list                           │
├─────────────────────────────────────────────┤
│ EXPECTED:                                   │
│ ✅ Sees all users from all locations        │
│ ✅ Can view user details                    │
└─────────────────────────────────────────────┘
```

#### Scenario Card: Owner Adds User
```
┌─────────────────────────────────────────────┐
│ SCENARIO: Owner Adds User                   │
│ User: Owner                                 │
│ Goal: Add new user to any location          │
├─────────────────────────────────────────────┤
│ STEPS:                                      │
│ 1. Login → User Management                  │
│ 2. Click "Add User"                         │
│ 3. Fill user details                        │
│ 4. Select role and location(s)              │
│ 5. Submit                                   │
├─────────────────────────────────────────────┤
│ EXPECTED:                                   │
│ ✅ Can assign to any location               │
│ ✅ Can assign any role                      │
│ ✅ User created successfully                │
└─────────────────────────────────────────────┘
```

#### Scenario Card: Owner Edits User
```
┌─────────────────────────────────────────────┐
│ SCENARIO: Owner Edits User                  │
│ User: Owner                                 │
│ Goal: Edit any user in the company          │
├─────────────────────────────────────────────┤
│ STEPS:                                      │
│ 1. Login → User Management                  │
│ 2. Find any user                            │
│ 3. Click "Edit"                             │
│ 4. Modify details → Save                    │
├─────────────────────────────────────────────┤
│ EXPECTED:                                   │
│ ✅ Can edit any user                        │
│ ✅ Can change role and locations            │
└─────────────────────────────────────────────┘
```

#### Scenario Card: Owner Deletes User
```
┌─────────────────────────────────────────────┐
│ SCENARIO: Owner Deletes User                │
│ User: Owner                                 │
│ Goal: Delete any user from company          │
├─────────────────────────────────────────────┤
│ STEPS:                                      │
│ 1. Login → User Management                  │
│ 2. Find any user                            │
│ 3. Click "Delete"                           │
│ 4. Confirm deletion                         │
├─────────────────────────────────────────────┤
│ EXPECTED:                                   │
│ ✅ Can delete any user                      │
│ ✅ User removed from company                │
└─────────────────────────────────────────────┘
```

#### Scenario Card: Owner Views Customers
```
┌─────────────────────────────────────────────┐
│ SCENARIO: Owner Views Customers             │
│ User: Owner                                 │
│ Goal: View all company customers            │
├─────────────────────────────────────────────┤
│ STEPS:                                      │
│ 1. Login → Business Management              │
│ 2. Navigate to Customer Management          │
│ 3. View customer list                       │
├─────────────────────────────────────────────┤
│ EXPECTED:                                   │
│ ✅ Sees all customers                       │
│ ✅ Can view customer details                │
└─────────────────────────────────────────────┘
```

#### Scenario Card: Owner Adds Service
```
┌─────────────────────────────────────────────┐
│ SCENARIO: Owner Adds Service                │
│ User: Owner                                 │
│ Goal: Create new service                    │
├─────────────────────────────────────────────┤
│ STEPS:                                      │
│ 1. Login → Business Management              │
│ 2. Navigate to Service Management           │
│ 3. Click "Add Service"                      │
│ 4. Fill service details                     │
│ 5. Submit                                   │
├─────────────────────────────────────────────┤
│ EXPECTED:                                   │
│ ✅ Service created successfully             │
│ ✅ Service available for all locations      │
└─────────────────────────────────────────────┘
```

#### Scenario Card: Owner Edits Service
```
┌─────────────────────────────────────────────┐
│ SCENARIO: Owner Edits Service               │
│ User: Owner                                 │
│ Goal: Modify existing service               │
├─────────────────────────────────────────────┤
│ STEPS:                                      │
│ 1. Login → Service Management               │
│ 2. Find service                             │
│ 3. Click "Edit"                             │
│ 4. Modify details → Save                    │
├─────────────────────────────────────────────┤
│ EXPECTED:                                   │
│ ✅ Can edit any service                     │
│ ✅ Changes saved successfully               │
└─────────────────────────────────────────────┘
```

#### Scenario Card: Owner Deletes Service
```
┌─────────────────────────────────────────────┐
│ SCENARIO: Owner Deletes Service             │
│ User: Owner                                 │
│ Goal: Remove service from company           │
├─────────────────────────────────────────────┤
│ STEPS:                                      │
│ 1. Login → Service Management               │
│ 2. Find service                             │
│ 3. Click "Delete"                           │
│ 4. Confirm deletion                         │
├─────────────────────────────────────────────┤
│ EXPECTED:                                   │
│ ✅ Service deleted successfully             │
│ ✅ Service removed from all locations       │
└─────────────────────────────────────────────┘
```

### Manager Scenarios

#### Scenario Card: Manager Creates Deal
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

#### Scenario Card: Manager Views Deals
```
┌─────────────────────────────────────────────┐
│ SCENARIO: Manager Views Deals               │
│ User: Manager                               │
│ Goal: View deals from assigned locations    │
├─────────────────────────────────────────────┤
│ STEPS:                                      │
│ 1. Login → Business Management              │
│ 2. Navigate to Deal Management              │
│ 3. View deal list                           │
├─────────────────────────────────────────────┤
│ EXPECTED:                                   │
│ ✅ Sees deals from assigned locations only  │
│ ❌ Cannot see deals from other locations    │
└─────────────────────────────────────────────┘
```

#### Scenario Card: Manager Edits Deal
```
┌─────────────────────────────────────────────┐
│ SCENARIO: Manager Edits Deal                │
│ User: Manager                               │
│ Goal: Edit deal from assigned location      │
├─────────────────────────────────────────────┤
│ STEPS:                                      │
│ 1. Login → Deal Management                  │
│ 2. Find deal from assigned location         │
│ 3. Click "Edit" → ✅ Button visible         │
│ 4. Modify details → Save                    │
├─────────────────────────────────────────────┤
│ EXPECTED:                                   │
│ ✅ Can edit deals from assigned locations   │
│ ❌ Cannot edit deals from other locations   │
└─────────────────────────────────────────────┘
```

#### Scenario Card: Manager Deletes Deal
```
┌─────────────────────────────────────────────┐
│ SCENARIO: Manager Deletes Deal              │
│ User: Manager                               │
│ Goal: Delete deal from assigned location    │
├─────────────────────────────────────────────┤
│ STEPS:                                      │
│ 1. Login → Deal Management                  │
│ 2. Find deal from assigned location         │
│ 3. Click "Delete" → ✅ Button visible       │
│ 4. Confirm deletion                         │
├─────────────────────────────────────────────┤
│ EXPECTED:                                   │
│ ✅ Can delete deals from assigned locations │
│ ❌ Cannot delete deals from other locations │
└─────────────────────────────────────────────┘
```

#### Scenario Card: Manager Duplicates Deal
```
┌─────────────────────────────────────────────┐
│ SCENARIO: Manager Duplicates Deal           │
│ User: Manager                               │
│ Goal: Create a copy of an existing deal     │
├─────────────────────────────────────────────┤
│ STEPS:                                      │
│ 1. Login → Deal Management                  │
│ 2. Find deal to duplicate                   │
│ 3. Click "Duplicate" button                 │
│ 4. Dialog opens with pre-filled data        │
│ 5. Modify if needed → Submit                │
├─────────────────────────────────────────────┤
│ EXPECTED:                                   │
│ ✅ Can duplicate deals from assigned locations│
│ ✅ New deal created with "Copy of" prefix   │
│ ✅ Can modify before saving                 │
└─────────────────────────────────────────────┘
```

#### Scenario Card: Manager Views Users
```
┌─────────────────────────────────────────────┐
│ SCENARIO: Manager Views Users               │
│ User: Manager                               │
│ Goal: View users from assigned locations    │
├─────────────────────────────────────────────┤
│ STEPS:                                      │
│ 1. Login → User Management                  │
│ 2. View user list                           │
├─────────────────────────────────────────────┤
│ EXPECTED:                                   │
│ ✅ Sees users from assigned locations only  │
│ ❌ Cannot see users from other locations    │
└─────────────────────────────────────────────┘
```

#### Scenario Card: Manager Adds User
```
┌─────────────────────────────────────────────┐
│ SCENARIO: Manager Adds User                 │
│ User: Manager                               │
│ Goal: Add new user to assigned locations    │
├─────────────────────────────────────────────┤
│ STEPS:                                      │
│ 1. Login → User Management                  │
│ 2. Click "Add User"                         │
│ 3. Fill user details                        │
│ 4. Select role and location(s)              │
│ 5. Submit                                   │
├─────────────────────────────────────────────┤
│ EXPECTED:                                   │
│ ✅ Can assign to assigned locations only    │
│ ✅ Cannot assign to other locations         │
│ ✅ User created successfully                │
└─────────────────────────────────────────────┘
```

#### Scenario Card: Manager Edits User
```
┌─────────────────────────────────────────────┐
│ SCENARIO: Manager Edits User                │
│ User: Manager                               │
│ Goal: Edit user from assigned locations     │
├─────────────────────────────────────────────┤
│ STEPS:                                      │
│ 1. Login → User Management                  │
│ 2. Find user from assigned location         │
│ 3. Click "Edit"                             │
│ 4. Modify details → Save                    │
├─────────────────────────────────────────────┤
│ EXPECTED:                                   │
│ ✅ Can edit users from assigned locations   │
│ ✅ Can modify location assignments          │
│ ❌ Cannot edit users from other locations   │
└─────────────────────────────────────────────┘
```

#### Scenario Card: Manager Deletes User
```
┌─────────────────────────────────────────────┐
│ SCENARIO: Manager Deletes User              │
│ User: Manager                               │
│ Goal: Delete user from assigned locations   │
├─────────────────────────────────────────────┤
│ STEPS:                                      │
│ 1. Login → User Management                  │
│ 2. Find user from assigned location         │
│ 3. Click "Delete"                           │
│ 4. Confirm deletion                         │
├─────────────────────────────────────────────┤
│ EXPECTED:                                   │
│ ✅ Can delete users from assigned locations │
│ ❌ Cannot delete users from other locations │
└─────────────────────────────────────────────┘
```

#### Scenario Card: Manager Views Customers
```
┌─────────────────────────────────────────────┐
│ SCENARIO: Manager Views Customers           │
│ User: Manager                               │
│ Goal: View all company customers            │
├─────────────────────────────────────────────┤
│ STEPS:                                      │
│ 1. Login → Business Management              │
│ 2. Navigate to Customer Management          │
│ 3. View customer list                       │
├─────────────────────────────────────────────┤
│ EXPECTED:                                   │
│ ✅ Sees all customers                       │
│ ✅ Can view customer details                │
└─────────────────────────────────────────────┘
```

#### Scenario Card: Manager Adds Service
```
┌─────────────────────────────────────────────┐
│ SCENARIO: Manager Adds Service              │
│ User: Manager                               │
│ Goal: Create new service                    │
├─────────────────────────────────────────────┤
│ STEPS:                                      │
│ 1. Login → Business Management              │
│ 2. Navigate to Service Management           │
│ 3. Click "Add Service"                      │
│ 4. Fill service details                     │
│ 5. Submit                                   │
├─────────────────────────────────────────────┤
│ EXPECTED:                                   │
│ ✅ Service created successfully             │
│ ✅ Service available for all locations      │
└─────────────────────────────────────────────┘
```

#### Scenario Card: Manager Edits Service
```
┌─────────────────────────────────────────────┐
│ SCENARIO: Manager Edits Service             │
│ User: Manager                               │
│ Goal: Modify existing service               │
├─────────────────────────────────────────────┤
│ STEPS:                                      │
│ 1. Login → Service Management               │
│ 2. Find service                             │
│ 3. Click "Edit"                             │
│ 4. Modify details → Save                    │
├─────────────────────────────────────────────┤
│ EXPECTED:                                   │
│ ✅ Can edit any service                     │
│ ✅ Changes saved successfully               │
└─────────────────────────────────────────────┘
```

#### Scenario Card: Manager Deletes Service
```
┌─────────────────────────────────────────────┐
│ SCENARIO: Manager Deletes Service           │
│ User: Manager                               │
│ Goal: Remove service from company           │
├─────────────────────────────────────────────┤
│ STEPS:                                      │
│ 1. Login → Service Management               │
│ 2. Find service                             │
│ 3. Click "Delete"                           │
│ 4. Confirm deletion                         │
├─────────────────────────────────────────────┤
│ EXPECTED:                                   │
│ ✅ Service deleted successfully             │
│ ✅ Service removed from all locations       │
└─────────────────────────────────────────────┘
```

### Employee Scenarios

#### Scenario Card: Employee Creates Deal
```
┌─────────────────────────────────────────────┐
│ SCENARIO: Employee Creates Deal             │
│ User: Employee                              │
│ Goal: Create deal at assigned location      │
├─────────────────────────────────────────────┤
│ STEPS:                                      │
│ 1. Login → Business Management              │
│ 2. Click "Add Deal"                         │
│ 3. Location dropdown → Shows ONLY assigned  │
│ 4. Select assigned location                 │
│ 5. Fill details → Submit                    │
├─────────────────────────────────────────────┤
│ EXPECTED:                                   │
│ ✅ Sees assigned locations only             │
│ ✅ Deal created successfully                │
└─────────────────────────────────────────────┘
```

#### Scenario Card: Employee Views Deals
```
┌─────────────────────────────────────────────┐
│ SCENARIO: Employee Views Deals              │
│ User: Employee                              │
│ Goal: View own deals only                   │
├─────────────────────────────────────────────┤
│ STEPS:                                      │
│ 1. Login → Business Management              │
│ 2. Navigate to Deal Management              │
│ 3. View deal list                           │
├─────────────────────────────────────────────┤
│ EXPECTED:                                   │
│ ✅ Sees own deals only                      │
│ ❌ Cannot see other employees' deals        │
└─────────────────────────────────────────────┘
```

#### Scenario Card: Employee Edits Deal
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
│ ❌ Edit button hidden on others' deals      │
└─────────────────────────────────────────────┘
```

#### Scenario Card: Employee Deletes Deal
```
┌─────────────────────────────────────────────┐
│ SCENARIO: Employee Deletes Deal             │
│ User: Employee                              │
│ Goal: Delete own deal (allowed)             │
├─────────────────────────────────────────────┤
│ STEPS:                                      │
│ 1. Login → View Deal List                   │
│ 2. Find own deal                            │
│ 3. Click "Delete" → ✅ Button visible       │
│ 4. Confirm deletion                         │
├─────────────────────────────────────────────┤
│ EXPECTED:                                   │
│ ✅ Can delete own deals                     │
│ ❌ Cannot delete other employees' deals     │
│ ❌ Delete button hidden on others' deals    │
└─────────────────────────────────────────────┘
```

#### Scenario Card: Employee Duplicates Deal
```
┌─────────────────────────────────────────────┐
│ SCENARIO: Employee Duplicates Deal          │
│ User: Employee                              │
│ Goal: Create a copy of an existing deal     │
├─────────────────────────────────────────────┤
│ STEPS:                                      │
│ 1. Login → Deal Management                  │
│ 2. Find own deal to duplicate               │
│ 3. Click "Duplicate" button                 │
│ 4. Dialog opens with pre-filled data        │
│ 5. Modify if needed → Submit                │
├─────────────────────────────────────────────┤
│ EXPECTED:                                   │
│ ✅ Can duplicate own deals                  │
│ ✅ New deal created with "Copy of" prefix   │
│ ✅ Can modify before saving                 │
└─────────────────────────────────────────────┘
```

#### Scenario Card: Employee Views Users
```
┌─────────────────────────────────────────────┐
│ SCENARIO: Employee Views Users              │
│ User: Employee                              │
│ Goal: Access user management                │
├─────────────────────────────────────────────┤
│ STEPS:                                      │
│ 1. Login → Navigate to menu                 │
│ 2. Check for "User Management" option       │
├─────────────────────────────────────────────┤
│ EXPECTED:                                   │
│ ❌ "User Management" menu item hidden       │
│ ❌ Cannot access user management page       │
└─────────────────────────────────────────────┘
```

#### Scenario Card: Employee Views Customers
```
┌─────────────────────────────────────────────┐
│ SCENARIO: Employee Views Customers          │
│ User: Employee                              │
│ Goal: Access customer management            │
├─────────────────────────────────────────────┤
│ STEPS:                                      │
│ 1. Login → Business Management              │
│ 2. Navigate to Customer Management          │
│ 3. View customer list                       │
├─────────────────────────────────────────────┤
│ EXPECTED:                                   │
│ ❌ Customer Management section not visible  │
│ ❌ Cannot view customers                    │
└─────────────────────────────────────────────┘
```

#### Scenario Card: Employee Adds Service
```
┌─────────────────────────────────────────────┐
│ SCENARIO: Employee Adds Service             │
│ User: Employee                              │
│ Goal: Create new service                    │
├─────────────────────────────────────────────┤
│ STEPS:                                      │
│ 1. Login → Business Management              │
│ 2. Navigate to Service Management           │
│ 3. Look for "Add Service" button            │
├─────────────────────────────────────────────┤
│ EXPECTED:                                   │
│ ❌ "Add Service" button not visible         │
│ ❌ Cannot create services                   │
└─────────────────────────────────────────────┘
```
