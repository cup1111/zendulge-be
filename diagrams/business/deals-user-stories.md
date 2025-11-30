# Deal Management User Stories

## Owner User Stories

### US-D001: Owner Creates Deal
**As a** business owner  
**I want to** create deals at any location  
**So that** I can manage promotions across my entire business

**Acceptance Criteria:**
- Login as **owner**
- → Business Management → "Add Deal"
- → Should see **all locations** in dropdown
- → Can select **any location**
- → **Deal created successfully**

### US-D002: Owner Views Deals
**As a** business owner  
**I want to** view all deals across all locations  
**So that** I have complete visibility of all promotions

**Acceptance Criteria:**
- Login as **owner**
- → Deal Management
- → Should see **all deals from all locations**
- → Can view details of **any deal**

### US-D003: Owner Edits Deal
**As a** business owner  
**I want to** edit any deal from any location  
**So that** I can maintain control over all promotions

**Acceptance Criteria:**
- Login as **owner**
- → View any deal in Deal Management
- → Should see **"Edit" button**
- → Can **modify deal details**
- → Can **save changes successfully**

### US-D004: Owner Deletes Deal
**As a** business owner  
**I want to** delete any deal from any location  
**So that** I can remove promotions when needed

**Acceptance Criteria:**
- Login as **owner**
- → View any deal in Deal Management
- → Should see **"Delete" button**
- → Can **confirm deletion**
- And the deal is removed from the system

### US-D005: Owner Duplicates Deal
**As a** business owner  
**I want to** create a copy of an existing deal  
**So that** I can quickly create similar promotions

**Acceptance Criteria:**
- Login as **owner**
- When I find a deal to duplicate
- → Should see **"Duplicate" button**
- And a dialog opens with pre-filled data
- → Can **modify details before saving**
- And a new deal is created with "Copy of" prefix

### US-D006: Owner Validates Deal Availability Dates
**As a** business owner  
**I want to** prevent deals being saved with invalid availability windows  
**So that** customers only see promotions that are currently or soon available

**Acceptance Criteria:**
- Login as **owner**
- → Create or edit a deal
- → For new deals, start date must be **today or later**
- → When updating existing deals, historical start dates are allowed
- → End date must be **after the start date**
- → If a new deal uses a start date before today, show validation error **"Start date cannot be before today"**
- → If end date is before today, show validation error **"End date cannot be before today"**
- → If end date is on or before start date, show validation error **"End date must be after start date"**

## Manager User Stories

### US-D006: Manager Creates Deal
**As a** manager  
**I want to** create deals at my assigned locations  
**So that** I can manage promotions for my areas of responsibility

**Acceptance Criteria:**
- Login as **manager**
- → Business Management → "Add Deal"
- → Should see only **my assigned locations** in the dropdown
- → **Cannot see unassigned locations**
- → **Deal created successfully**

### US-D007: Manager Views Deals
**As a** manager  
**I want to** view deals from my assigned locations only  
**So that** I can focus on my areas of responsibility

**Acceptance Criteria:**
- Login as **manager**
- → Deal Management
- → Should see deals from **assigned locations only**
- → **Cannot see deals from other locations**

### US-D008: Manager Validates Deal Availability Dates
**As a** manager  
**I want to** be blocked from entering invalid availability dates  
**So that** I only publish offers that are upcoming and well-defined

**Acceptance Criteria:**
- Login as **manager**
- → Create or edit a deal within my assigned locations
- → For new deals, start date must be **today or later**
- → When updating existing deals, historical start dates are allowed
- → End date must be **after the start date**
- → Past start dates are allowed for existing deals; past end dates still trigger validation errors
- → End dates on or before the start date trigger validation error **"End date must be after start date"**

=================================

## Deal Appointment Availability Logic

### Overview

When displaying available appointment times on the deal details page, the system must match:
1. **Deal availability** - Times when the deal is available (based on recurrence pattern, operating site hours, deal configuration)
2. **Employee availability** - Times when employees are on duty (based on their duty schedules)

**Both conditions must be met** for an appointment time slot to be displayed to customers.

### Business Rules

#### Time Slot Calculation Process

1. **Calculate Deal Time Slots**:
   - Generate all possible time slots based on deal's recurrence pattern (daily, weekly, etc.)
   - Filter by operating site hours
   - Generate slots for next 1 weeks (or configured period)

2. **Get Employee Duty Schedules**:
   - Find all employees assigned to the operating site(s) for this deal
   - Get their active duty schedules (day of week, start time, end time)

3. **Match and Filter**:
   - Only display time slots where:
     - Deal is available at that day and time
     - AND at least one employee is on duty at that day and time
   - Hide time slots that don't match both conditions

### Availability Matching Scenarios

**Scenario 1: Deal Available + Employee Available → DISPLAY**
- Deal is available on Tuesday at 10:00 AM
- Employee has duty schedule: Tuesday, 9:00 AM - 5:00 PM
- Result: **Display the 10:00 AM appointment slot**

**Scenario 2: Deal Available + Employee Available but NOT that time → HIDE**
- Deal is available on Tuesday at 10:00 AM
- Employee has duty schedule: Tuesday, 2:00 PM - 5:00 PM (starts after 10 AM)
- Result: **Do NOT display the 10:00 AM appointment slot**

**Scenario 3: Deal Available + No Employee Available → HIDE**
- Deal is available on Tuesday at 10:00 AM
- No employees assigned to this deal's operating site have duty schedules for Tuesday
- Result: **Do NOT display any Tuesday appointment slots**

**Scenario 4: Deal NOT Available + Employee Available → HIDE**
- Deal is NOT available on Tuesday (not in recurrence pattern or outside deal dates)
- Employee has duty schedule: Tuesday, 9:00 AM - 5:00 PM
- Result: **Do NOT display Tuesday appointment slots** (deal not available)

**Scenario 5: Deal NOT Available + Employee NOT Available → HIDE**
- Deal is NOT available on Tuesday at 10:00 AM
- Employee is NOT on duty Tuesday at 10:00 AM
- Result: **Do NOT display the appointment slot**

### Multiple Employees

When multiple employees are assigned to an operating site:
- If **any employee** is on duty at a specific time, that time slot is available
- Example: Deal available Tuesday 10 AM
  - Employee A: Tuesday 9 AM - 12 PM → On duty
  - Employee B: Tuesday 2 PM - 5 PM → Not on duty
  - Result: **Display 10 AM slot** (Employee A is available)

### Edge Cases

**Split Shifts:**
- Employee works Tuesday 9 AM - 12 PM and 2 PM - 5 PM
- Deal available Tuesday 1 PM - 3 PM
- Result: **Display only 2 PM - 3 PM slot** (matches employee's afternoon shift)

**No Employees Assigned:**
- Deal is available but no employees assigned to operating site
- Result: **No appointment slots displayed** (cannot book without staff)

**Multiple Operating Sites:**
- Deal available at multiple sites
- Each site's availability calculated separately based on employees at that site
- Customer can choose site with available time slots
