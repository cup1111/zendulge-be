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

### US-D006: Owner Enforces Expired Deal End Date
**As a** business owner  
**I want to** ensure expired deals have a future end date  
**So that** customers are not shown already-ended promotions

**Acceptance Criteria:**
- Login as **owner**
- → Edit any deal and set status to **expired**
- → If end date is today or earlier, **receive validation error**
- → If end date is after today, **save is successful**
- → Deal status shows as **expired**

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
