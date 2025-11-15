# Business Status Flows

## Business Status System

Businesses have three possible statuses:
- **`active`**: Business is verified and fully operational. Deals are visible to customers.
- **`pending`**: Business is awaiting verification. Deals are hidden from customers.
- **`disabled`**: Business has been disabled. All business pages are blocked from access.

## Status Transitions

```mermaid
stateDiagram-v2
    [*] --> pending: New Business Registration
    pending --> active: Verification Complete
    active --> pending: ABN Changed
    active --> disabled: Manual Disable
    pending --> disabled: Manual Disable
    disabled --> pending: Re-activation (Manual)
    pending --> [*]: Account Deletion
    active --> [*]: Account Deletion
    disabled --> [*]: Account Deletion
```

## ABN Change Flow

When a business owner updates their ABN:

```mermaid
sequenceDiagram
    participant Owner
    participant Frontend
    participant Backend
    participant Database
    participant DealService

    Owner->>Frontend: Update ABN
    Frontend->>Owner: Show Warning Dialog
    Note over Frontend,Owner: "⚠️ Warning: Changing your ABN will:<br/>• Set status to 'pending'<br/>• Disable all active deals<br/>• Hide deals from customers"
    Owner->>Frontend: Confirm
    Frontend->>Backend: PATCH /business/:id
    Backend->>Database: Get existing business
    Backend->>Backend: Compare ABN values
    alt ABN Changed
        Backend->>Database: Update business status to 'pending'
        Backend->>DealService: Disable all active deals
        DealService->>Database: Update deals status to 'inactive'
        Backend->>Frontend: Return response with warning
    end
    Frontend->>Owner: Show success message + warning
```

## Status-Based Access Control

### Pending Status
- **Access**: All business pages accessible
- **Deals**: Hidden from customers (not displayed in customer-facing views)
- **Message**: "Verification in Progress" alert shown to business owner
- **Features**: Business can still manage services, users, etc.

### Disabled Status
- **Access**: All business pages blocked (dashboard, management, user management)
- **Message**: "Business Disabled" page shown instead of business content
- **Features**: All business functionality unavailable until reactivated

### Active Status
- **Access**: Full access to all features
- **Deals**: Visible to customers
- **Features**: All business functionality available

## Registration Flow

```mermaid
flowchart TD
    Start[User Registers Business] --> Create[Create Business Account]
    Create --> SetStatus[Set Status: 'pending']
    SetStatus --> Save[Save to Database]
    Save --> Email[Send Verification Email]
    Email --> PendingState[Business Status: 'pending']
    PendingState --> Verify{Admin Verifies}
    Verify -->|Verified| ActiveState[Status: 'active']
    Verify -->|Rejected| DisabledState[Status: 'disabled']
    ActiveState --> ShowDeals[Deals Visible to Customers]
    DisabledState --> BlockAccess[All Pages Blocked]
    PendingState --> HideDeals[Deals Hidden from Customers]
```

## Seed Data

The seed file creates three businesses with different statuses:
1. **Active Business**: `status: 'active'` - Full functionality
2. **Pending Business**: `status: 'pending'` - Awaiting verification
3. **Disabled Business**: `status: 'disabled'` - Blocked access

