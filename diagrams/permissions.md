# Business User Permissions Guide

This guide explains what each type of user (Owner, Manager, Employee) can see and do in your business management system.

## Detailed Permissions by User Type

### 🟢 Business Owner (You - The Person Paying for This System)

**As a Business Owner, you have full control:**

#### Deal Management
- ✅ **View all deals** across your entire business
- ✅ **Create deals** for any location in your company
- ✅ **Select any location(s)** when creating a deal - you see all locations
- ✅ **Edit any deal** in your business
- ✅ **Delete any deal** in your business
- ✅ **See all locations** in the location dropdown when creating deals

#### User Management
- ✅ **View all team members** in your company
- ✅ **Add new users** (Managers and Employees)
- ✅ **Edit any user's** information and assign them to locations
- ✅ **Remove users** from your company
- ✅ **Assign users to specific locations** (this controls which locations they can manage)

#### Customer Management
- ✅ **View all customers** who have interacted with your business
- ✅ **Add customers** to your company
- ✅ **Remove customers** from your company

#### Service Management
- ✅ **View all services** your business offers
- ✅ **Create new services**
- ✅ **Edit any service**
- ✅ **Delete services**

#### Location Management (Operating Sites)
- ✅ **View all business locations**
- ✅ **Create new locations**
- ✅ **Edit any location**
- ✅ **Delete locations**
- ✅ **Assign team members to locations**

---

### 🔵 Manager

**Managers can manage specific locations they are assigned to:**

#### Deal Management
- ✅ **View deals** only at locations they are assigned to
- ✅ **Create deals** but only for locations they are assigned to
- ✅ **See only their assigned locations** in the location dropdown (they cannot see or select other locations)
- ✅ **Edit deals** at their assigned locations (any deal, not just ones they created)
- ✅ **Delete deals** at their assigned locations

**Important:** Before a Manager can create deals, you (the Owner) must first assign them to specific locations. Once assigned, they will only see those locations when creating deals.

#### User Management
- ✅ **View team members** who work at the same locations they manage
- ✅ **Add new Employees** (but cannot create Managers or Owners)
- ✅ **Edit employees** at their locations
- ✅ **Remove employees** from their locations

#### Customer Management
- ✅ **View all customers** who have interacted with your business
- ✅ **Add customers** to your company
- ✅ **Remove customers** from your company

#### Service Management
- ✅ **View all services** your business offers
- ✅ **Create new services**
- ✅ **Edit any service**
- ✅ **Delete services**

#### Location Management
- ❌ **Cannot create or delete locations** (only Owner can do this)
- ✅ **Can view locations** they are assigned to

---

### 🟠 Employee

**Employees have the most limited access - they can work with deals at their assigned locations:**

#### Deal Management
- ✅ **View deals** only at locations they are assigned to
- ✅ **Create deals** but only for locations they are assigned to
- ✅ **See only their assigned locations** in the location dropdown (they cannot see or select other locations)
- ✅ **Edit deals** they created themselves (cannot edit deals created by others)
- ✅ **Delete deals** they created themselves (cannot delete deals created by others)

**Important:** Before an Employee can create deals, you (the Owner) or a Manager must first assign them to specific locations. Once assigned, they will only see those locations when creating deals.

#### User Management
- ❌ **Cannot view or manage other users**

#### Customer Management
- ❌ **Cannot view or manage customers** (only Owners and Managers can)

#### Service Management
- ✅ **View all services** your business offers
- ❌ **Cannot create, edit, or delete services** (only Owners and Managers can)

#### Location Management
- ❌ **Cannot view, create, or manage locations**

---

## Permission Comparison Table

| Feature | Owner | Manager | Employee |
|---------|-------|---------|----------|
| **View All Deals** | ✅ | ❌ (Only assigned locations) | ❌ (Only assigned locations) |
| **Create Deals** | ✅ (Any location) | ✅ (Assigned locations only) | ✅ (Assigned locations only) |
| **Edit Deals** | ✅ (All deals) | ✅ (Deals at assigned locations) | ✅ (Only own deals) |
| **Delete Deals** | ✅ (All deals) | ✅ (Deals at assigned locations) | ✅ (Only own deals) |
| **View/Manage Users** | ✅ | ✅ (At assigned locations) | ❌ |
| **View/Manage Customers** | ✅ | ✅ | ❌ |
| **View Services** | ✅ | ✅ | ✅ |
| **Create/Edit Services** | ✅ | ✅ | ❌ |
| **View/Manage Locations** | ✅ | ❌ (View only) | ❌ |
