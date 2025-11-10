# User Management User Stories

## Owner User Stories

### US-U001: Owner Views Users
**As a** business owner  
**I want to** view all users in my company  
**So that** I have complete visibility of my workforce

**Acceptance Criteria:**
- Given I am logged in as an owner
- When I navigate to User Management
- Then I should see all users from all locations
- And I can view detailed user information

### US-U002: Owner Adds User
**As a** business owner  
**I want to** add new users to any location  
**So that** I can expand my workforce as needed

**Acceptance Criteria:**
- Given I am logged in as an owner
- When I navigate to User Management and click "Add User"
- Then I can fill in user details
- And I can assign them to any location
- And I can assign any role
- And the user is created successfully

### US-U003: Owner Edits User
**As a** business owner  
**I want to** edit any user in my company  
**So that** I can manage user information and roles

**Acceptance Criteria:**
- Given I am logged in as an owner
- When I view any user in User Management
- Then I should see an "Edit" button
- And I can modify user details
- And I can change their role and location assignments
- And the changes are saved successfully

### US-U004: Owner Deletes User
**As a** business owner  
**I want to** delete any user from my company  
**So that** I can remove users who are no longer needed

**Acceptance Criteria:**
- Given I am logged in as an owner
- When I view any user in User Management
- Then I should see a "Delete" button
- And I can confirm deletion
- And the user is removed from the company
- But I cannot delete myself (the owner)

## Manager User Stories

### US-U005: Manager Views Users
**As a** manager  
**I want to** view users from my assigned locations  
**So that** I can manage my team members

**Acceptance Criteria:**
- Given I am logged in as a manager
- When I navigate to User Management
- Then I should see users from my assigned locations only
- And I cannot see users from other locations

### US-U006: Manager Adds User
**As a** manager  
**I want to** add new users to my assigned locations  
**So that** I can build my team

**Acceptance Criteria:**
- Given I am logged in as a manager
- When I navigate to User Management and click "Add User"
- Then I can fill in user details
- And I can assign them to my assigned locations only
- And I cannot assign them to other locations
- And the user is created successfully

### US-U007: Manager Edits User
**As a** manager  
**I want to** edit employees from my assigned locations  
**So that** I can manage my team information

**Acceptance Criteria:**
- Given I am logged in as a manager
- When I view an employee from my assigned location
- Then I should see an "Edit" button
- And I can modify user details and location assignments
- But I cannot edit other managers (same level)
- And I cannot edit owners
- And I cannot edit users from other locations

### US-U008: Manager Deletes User
**As a** manager  
**I want to** delete employees from my assigned locations  
**So that** I can manage my team size

**Acceptance Criteria:**
- Given I am logged in as a manager
- When I view an employee from my assigned location
- Then I should see a "Delete" button
- And I can confirm deletion
- But I cannot delete other managers (same level)
- And I cannot delete owners
- And I cannot delete users from other locations

## Employee User Stories

### US-U009: Employee Views Users
**As an** employee  
**I want to** know that user management is restricted  
**So that** the system maintains proper access controls

**Acceptance Criteria:**
- Given I am logged in as an employee
- When I navigate to the main menu
- Then the "User Management" menu item should be hidden
- And I cannot access the user management page directly
