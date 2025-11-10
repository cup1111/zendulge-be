# Service Management User Stories

## Owner User Stories

### US-S001: Owner Adds Service
**As a** business owner  
**I want to** create new services  
**So that** I can expand my business offerings

**Acceptance Criteria:**
- Login as **owner**
- → Service Management → "Add Service"
- → Can fill in **service details** (name, category, duration, price, description)
- And the service is created successfully
- And the service is available for all locations

### US-S002: Owner Views Services
**As a** business owner  
**I want to** view all services in my company  
**So that** I can manage my service portfolio

**Acceptance Criteria:**
- Login as **owner**
- → Service Management
- → Should see **all services** offered by the company
- → Can view **detailed service information**
- → Can see service usage statistics across locations

### US-S003: Owner Edits Service
**As a** business owner  
**I want to** modify existing services  
**So that** I can update offerings as business needs change

**Acceptance Criteria:**
- Login as **owner**
- → View a service in Service Management
- → Should see **"Edit" button**
- → Can **modify service details**
- And changes are saved successfully
- And the updated service is available across all locations

### US-S004: Owner Deletes Service
**As a** business owner  
**I want to** remove services from my company  
**So that** I can discontinue outdated offerings

**Acceptance Criteria:**
- Login as **owner**
- → View a service in Service Management
- → Should see **"Delete" button**
- → Can **confirm deletion**
- And the service is removed from all locations
- And existing deals using this service are handled appropriately

## Manager User Stories

### US-S005: Manager Adds Service
**As a** manager  
**I want to** create new services  
**So that** I can respond to local market needs

**Acceptance Criteria:**
- Login as **manager**
- → Service Management → "Add Service"
- → Can fill in **service details**
- And the service is created successfully
- And the service is available for all locations (company-wide)

### US-S006: Manager Views Services
**As a** manager  
**I want to** view all company services  
**So that** I can understand available offerings for my locations

**Acceptance Criteria:**
- Login as **manager**
- → Service Management
- → Should see **all services** offered by the company
- → Can view **detailed service information**
- → Can see how services are performing in my assigned locations

## Employee User Stories

### US-S007: Employee Cannot Add Service
**As an** employee  
**I want to** understand that service creation is restricted  
**So that** service management follows company hierarchy

**Acceptance Criteria:**
- Login as **employee**
- → Service Management
- Then the "Add Service" button should not be visible
- → **Cannot create new services**
- → Can only view existing services for my work
