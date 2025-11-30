## Admin (NOT DONE , DUMB AI)

- View only access

=================================

## Employee (premission)

- create users (cannot create owner)
- delete users
- modify users (cannot set owner)
- view users

## Delete self (close account)

- If there is only one owner cannot do that until transfer owner, do we just send a email ??? because dangerious invite the wrong person, also they want to transfer internal

- Business with same name , is this possible ?
- Can a business use personal gmail ?
- So how about if he was a customer now want to become a business owner ?
- But what is the pupose of showing customer just send prop emails ?

- if empoyee is assign to no stores should we display we currently haven't to assign to anything please contact your admin

- Add select all button

=================================

## Duty Schedule Management

### Business Use Cases

**Owner/Manager sets employee work schedule:**
- Owner or Manager can set when an employee is on duty
- Employee works Monday-Friday, 9 AM - 5 PM → Owner creates 5 schedules (one per weekday)
- Employee works weekends only → Manager sets Saturday and Sunday schedules
- Employee works split shifts (morning and evening) → Owner sets multiple schedules for same day

**Temporary schedule changes:**
- Employee goes on vacation → Owner sets all schedules to inactive (keeps data but makes unavailable)
- Employee returns from vacation → Owner reactivates schedules
- Employee changes availability → Manager updates schedules

**Appointment booking integration:**
- System checks if employee is on duty before allowing appointment bookings
- Customers can only book appointments during employee's active duty hours
- Shows who is available when booking appointments

### Business Rules

**Who can manage duty schedules:**
- Owner: Can edit schedules for all users in business
- Manager: Can edit schedules for employees in their assigned stores only
- Manager: Cannot edit schedules for other managers or owner
- Employee: Cannot edit own schedule, must ask manager/owner

**Schedule rules:**
- One user can have multiple schedules (e.g., split shifts on same day)
- User can have no schedules (not on duty)
- Schedule can be active or inactive (inactive = temporarily disabled but kept)
- Multiple schedules per day allowed (for split shifts or break times)
