# Customer Management User Stories

## Owner User Stories

### US-C001: Owner Views Customers
**As a** business owner  
**I want to** view all customers in my business  
**So that** I have complete visibility of my customer base

**Acceptance Criteria:**
- Login as **owner**
- → Customer Management
- → Should see **all customers from all locations**
- → Can view **detailed customer information**
- → Can see customer interaction history

### US-C002: Owner Cannot Add Customer
**As a** business owner  
**I want to** understand that customers are added through deals/services  
**So that** customer creation follows business processes

**Acceptance Criteria:**
- Login as **owner**
- → Customer Management
- → Should **not see** an **"Add Customer" button**
- → **Customers are created automatically** when deals are made
- → Can view existing customer information only

### US-C003: Owner Cannot Edit Customer
**As a** business owner  
**I want to** ensure customer data integrity  
**So that** customer information remains accurate

**Acceptance Criteria:**
- Login as **owner**
- → View customer details
- → Should **not see** an **"Edit Customer" button**
- And customer information can only be updated through authorized processes
- → Can view customer data in read-only mode

### US-C004: Owner Cannot Delete Customer
**As a** business owner  
**I want to** preserve customer data for business continuity  
**So that** customer history is maintained

**Acceptance Criteria:**
- Login as **owner**
- → View customer details
- → Should not see a "Delete Customer" button
- And customer records are preserved for audit and history purposes
- → Customers can only be deactivated, not deleted

## Manager User Stories

### US-C005: Manager Views Customers
**As a** manager  
**I want to** view all customers in the business  
**So that** I can understand the customer base for business planning

**Acceptance Criteria:**
- Login as **manager**
- → Customer Management
- → Should see **all customers from all locations**
- → Can view customer details and history
- → Can see customer interaction patterns

## Employee User Stories

### US-C006: Employee Cannot Access Customers
**As an** employee  
**I want to** understand that customer management is restricted  
**So that** customer privacy is protected

**Acceptance Criteria:**
- Login as **employee**
- → Business Management
- → The "Customer Management" section should not be visible
- → Cannot access customer information directly
- → Can only interact with customers through my assigned deals/services
