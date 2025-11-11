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
