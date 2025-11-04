# Test Scenarios - Visual Format

Alternative visual formats for demonstrating system permissions to business owners.

---

## Format 1: User Journey Flowcharts

### Manager Creating a Deal - Flowchart

```mermaid
flowchart TD
    Start[Manager Logs In] --> Click[Click Business Management]
    Click --> Add[Click Add Deal]
    Add --> Check{Check Location Dropdown}
    Check -->|Sees Assigned Locations| SeeAssigned[✅ Sees: Downtown Store, Uptown Store]
    Check -->|Does NOT See| NotSee[❌ Airport Branch, Mall Location Hidden]
    SeeAssigned --> Select[Select Downtown Store]
    Select --> Fill[Fill Deal Details]
    Fill --> Submit[Click Submit]
    Submit --> Success[✅ Deal Created Successfully]
    
    NotSee -.->|Cannot Proceed| Blocked[❌ Location Not Available]
    
    style Start fill:#e3f2fd
    style Success fill:#c8e6c9,color:#000
    style Blocked fill:#ffcdd2,color:#000
    style SeeAssigned fill:#c8e6c9
    style NotSee fill:#ffcdd2
```

---

### Employee Deal Management - Flowchart

```mermaid
flowchart TD
    Start[Employee Logs In] --> ViewDeals[View Deal List]
    ViewDeals --> CheckDeal{Which Deal?}
    CheckDeal -->|Own Deal| OwnDeal[Deal Created by Employee]
    CheckDeal -->|Other's Deal| OtherDeal[Deal Created by Another]
    
    OwnDeal --> CanEdit[✅ Edit Button Visible]
    OwnDeal --> CanDelete[✅ Delete Button Visible]
    CanEdit --> EditSuccess[Can Edit Successfully]
    CanDelete --> DeleteSuccess[Can Delete Successfully]
    
    OtherDeal --> NoEdit[❌ Edit Button Hidden]
    OtherDeal --> NoDelete[❌ Delete Button Hidden]
    NoEdit --> ViewOnly[View Only - No Actions]
    NoDelete --> ViewOnly
    
    style Start fill:#fff3e0
    style EditSuccess fill:#c8e6c9
    style DeleteSuccess fill:#c8e6c9
    style ViewOnly fill:#ffcdd2
    style CanEdit fill:#c8e6c9
    style CanDelete fill:#c8e6c9
    style NoEdit fill:#ffcdd2
    style NoDelete fill:#ffcdd2
```

---

### Permission Decision Tree

```mermaid
flowchart TD
    Start[User Action Request] --> CheckRole{What is User Role?}
    
    CheckRole -->|Owner| OwnerPath[Owner Path]
    CheckRole -->|Manager| ManagerPath[Manager Path]
    CheckRole -->|Employee| EmployeePath[Employee Path]
    
    OwnerPath --> OwnerCheck{What Action?}
    OwnerCheck -->|Create Deal| OwnerAnyLocation[✅ Can Use Any Location]
    OwnerCheck -->|Edit Deal| OwnerAnyDeal[✅ Can Edit Any Deal]
    OwnerCheck -->|Manage Users| OwnerAllUsers[✅ Can Manage All Users]
    
    ManagerPath --> ManagerCheck{What Action?}
    ManagerCheck -->|Create Deal| ManagerCheckLocation{Location Assigned?}
    ManagerCheckLocation -->|Yes| ManagerAssigned[✅ Can Use Location]
    ManagerCheckLocation -->|No| ManagerBlocked[❌ Location Not Visible]
    ManagerCheck -->|Edit Deal| ManagerCheckLocation2{Location Assigned?}
    ManagerCheckLocation2 -->|Yes| ManagerEditOK[✅ Can Edit Deal]
    ManagerCheckLocation2 -->|No| ManagerEditBlocked[❌ Cannot See Deal]
    
    EmployeePath --> EmployeeCheck{What Action?}
    EmployeeCheck -->|Create Deal| EmpCheckLocation{Location Assigned?}
    EmpCheckLocation -->|Yes| EmpAssigned[✅ Can Use Location]
    EmpCheckLocation -->|No| EmpBlocked[❌ Location Not Visible]
    EmployeeCheck -->|Edit Deal| EmpCheckOwnership{Own Deal?}
    EmpCheckOwnership -->|Yes| EmpEditOK[✅ Can Edit]
    EmpCheckOwnership -->|No| EmpEditBlocked[❌ Cannot Edit]
    
    style OwnerAnyLocation fill:#c8e6c9
    style OwnerAnyDeal fill:#c8e6c9
    style OwnerAllUsers fill:#c8e6c9
    style ManagerAssigned fill:#c8e6c9
    style ManagerBlocked fill:#ffcdd2
    style ManagerEditOK fill:#c8e6c9
    style ManagerEditBlocked fill:#ffcdd2
    style EmpAssigned fill:#c8e6c9
    style EmpBlocked fill:#ffcdd2
    style EmpEditOK fill:#c8e6c9
    style EmpEditBlocked fill:#ffcdd2
```

---

## Format 2: Quick Reference Matrix

### Action vs Role Matrix

| Action | Owner | Manager | Employee |
|--------|:-----:|:-------:|:--------:|
| **Create Deal - Any Location** | ✅ | ❌ | ❌ |
| **Create Deal - Assigned Location** | ✅ | ✅ | ✅ |
| **Edit Own Deal** | ✅ | ✅ | ✅ |
| **Edit Other's Deal (Same Location)** | ✅ | ✅ | ❌ |
| **Edit Deal (Different Location)** | ✅ | ❌ | ❌ |
| **Delete Own Deal** | ✅ | ✅ | ✅ |
| **Delete Other's Deal** | ✅ | ✅ | ❌ |
| **View All Deals** | ✅ | ❌ (Only assigned) | ❌ (Only assigned) |
| **Manage Users** | ✅ | ✅ (Assigned locations) | ❌ |
| **View Customers** | ✅ | ✅ | ❌ |
| **Manage Services** | ✅ | ✅ | ❌ |
| **Manage Locations** | ✅ | ❌ | ❌ |

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

---

## Format 4: Side-by-Side Comparison

### Creating a Deal - All Roles Compared

| Step | Owner | Manager | Employee |
|------|-------|---------|----------|
| **1. Login** | ✅ | ✅ | ✅ |
| **2. Navigate to Deal Management** | ✅ | ✅ | ✅ |
| **3. Click "Add Deal"** | ✅ | ✅ | ✅ |
| **4. Location Dropdown Shows** | All locations | Only assigned | Only assigned |
| **5. Can Select** | Any location | Assigned only | Assigned only |
| **6. Submit Deal** | ✅ Success | ✅ Success | ✅ Success |

### Editing a Deal - All Roles Compared

| Deal Type | Owner | Manager | Employee |
|-----------|-------|---------|----------|
| **Own Deal** | ✅ Edit | ✅ Edit | ✅ Edit |
| **Other's Deal (Same Location)** | ✅ Edit | ✅ Edit | ❌ Cannot |
| **Other's Deal (Different Location)** | ✅ Edit | ❌ Cannot | ❌ Cannot |

---

## Format 5: Before/After Scenarios

### Before Assignment vs After Assignment

**Manager - Before Location Assignment:**
- ❌ Cannot create deals
- ❌ No locations visible in dropdown
- ❌ See message: "You have no access to any store"

**Manager - After Owner Assigns to Downtown Store:**
- ✅ Can create deals
- ✅ "Downtown Store" appears in dropdown
- ✅ Can select and create deals for Downtown Store only
- ❌ Still cannot see "Airport Branch" or other locations

---

## Format 6: User Story Format

### User Story 1: Manager
**As a** Manager  
**I want to** create deals for my assigned locations  
**So that** I can manage promotions for stores I'm responsible for  

**Acceptance Criteria:**
- ✅ I can see only locations I'm assigned to in the dropdown
- ✅ I can create deals for any of my assigned locations
- ✅ I cannot see or select locations I'm not assigned to
- ✅ Deals I create are visible to other managers at the same location

### User Story 2: Employee
**As an** Employee  
**I want to** create and edit my own deals  
**So that** I can manage deals I create without affecting others' work  

**Acceptance Criteria:**
- ✅ I can create deals for locations I'm assigned to
- ✅ I can edit deals I created myself
- ✅ I cannot edit deals created by other employees
- ✅ I can view deals created by others at my location (read-only)

---

## Format 7: Step-by-Step with Screenshots Placeholders

### Scenario: Manager Creates Deal
1. **Screen 1:** Login page
   - Manager enters credentials
   - Clicks "Login"

2. **Screen 2:** Business Management page
   - [Screenshot placeholder] Shows Deal Management section
   - Click "Add Deal" button

3. **Screen 3:** Deal Creation Form - Location Dropdown
   - [Screenshot placeholder] Dropdown shows: "Downtown Store", "Uptown Store"
   - Notice: "Airport Branch" is NOT in the list

4. **Screen 4:** Deal Created Successfully
   - [Screenshot placeholder] Success message
   - Deal appears in list

---

## Recommended Format for Business Owners

**For Live Demo:**
- Use **Format 1 (Flowcharts)** for visual explanation
- Use **Format 2 (Quick Reference Matrix)** for quick lookups
- Use **Format 4 (Side-by-Side Comparison)** to show differences

**For Documentation:**
- Use **Format 3 (Scenario Cards)** - easy to print/share
- Use **Format 6 (User Story Format)** - business-friendly language

**For Testing:**
- Use detailed step-by-step from main test-scenarios.md
- Use **Format 5 (Before/After)** to show setup impact

---

## Quick Demo Script (Using Visual Formats)

1. **Start with Format 2 (Matrix)** - "Here's what each role can do"
2. **Show Format 1 (Flowchart)** - "Let me walk through how this works"
3. **Demo live** - Follow the flowchart steps
4. **Show Format 4 (Side-by-Side)** - "Notice the differences"
5. **Use Format 5 (Before/After)** - "Here's what happens after assignment"
