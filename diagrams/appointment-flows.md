# Appointment Workflow Flows

## Appointment Status System

Appointments have the following possible statuses:
- **`pending`**: Appointment has been created by customer, awaiting business confirmation
- **`confirmed`**: Business has confirmed the appointment
- **`rejected`**: Business has rejected the appointment
- **`cancelled_by_customer`**: Customer cancelled the appointment
- **`cancelled_by_business`**: Business cancelled the appointment
- **`rescheduled_pending`**: Appointment is being rescheduled, awaiting confirmation
- **`completed`**: Appointment has been completed successfully
- **`no_show`**: Customer did not show up for the appointment
- **`expired`**: Appointment expired (past appointment time without completion)

## 1. Customer Booking Flow

This flow covers the initial appointment booking process from customer's perspective.

```mermaid
flowchart TD
    Start[Customer Wants to Book Appointment] --> BrowseDeals[Customer Browses Available Deals]
    
    BrowseDeals --> SelectDeal{Customer Selects Deal}
    
    SelectDeal --> CheckAvailability{Is Deal Available?<br/>Check:<br/>• Deal status = 'active'<br/>• currentBookings less than maxBookings<br/>• Time slot available}
    
    CheckAvailability -->|Not Available| DealUnavailable[Show Error:<br/>• Deal sold out<br/>• Deal expired<br/>• Time slot taken]
    DealUnavailable --> EndError[Customer Can Try Again]
    
    CheckAvailability -->|Available| SelectTimeSlot[Customer Selects:<br/>• Date & Time<br/>• Operating Site<br/>• Service Details]
    
    SelectTimeSlot --> EnterDetails[Customer Enters:<br/>• Contact Information<br/>• Special Requirements<br/>• Payment Information]
    
    EnterDetails --> ValidateBooking{Validate Booking Details}
    
    ValidateBooking -->|Invalid| ValidationErrors[Show Validation Errors:<br/>• Invalid date/time<br/>• Missing required fields<br/>• Payment information invalid]
    ValidationErrors --> EndError
    
    ValidateBooking -->|Valid| ProcessPayment{Process Payment}
    
    ProcessPayment -->|Payment Failed| PaymentFailed[Show Payment Error:<br/>• Insufficient funds<br/>• Card declined<br/>• Payment gateway error]
    PaymentFailed --> EndError
    
    ProcessPayment -->|Payment Successful| CreateAppointment[Create Appointment:<br/>• Set status: 'pending'<br/>• Link to deal<br/>• Link to customer<br/>• Store booking details<br/>• Increment currentBookings]
    
    CreateAppointment --> SendConfirmationEmail[Send Email to Customer:<br/>• Appointment details<br/>• Date & time<br/>• Service information<br/>• Booking reference<br/>• Status: Pending confirmation]
    
    SendConfirmationEmail --> NotifyBusiness[Notify Business:<br/>• New appointment request<br/>• Show in business dashboard<br/>• Send notification email<br/>• Display in appointment queue]
    
    NotifyBusiness --> BookingComplete[Booking Complete<br/>Status: 'pending'<br/>Waiting for Business Response]
    
    %% Styling
    classDef startClass fill:#c8e6c9,stroke:#1b5e20,stroke-width:3px,color:#000000
    classDef errorClass fill:#ffcdd2,stroke:#b71c1c,stroke-width:2px,color:#000000
    classDef successClass fill:#c8e6c9,stroke:#1b5e20,stroke-width:2px,color:#000000
    classDef processClass fill:#bbdefb,stroke:#0d47a1,stroke-width:2px,color:#000000
    classDef decisionClass fill:#ffe0b2,stroke:#e65100,stroke-width:2px,color:#000000
    classDef emailClass fill:#fff9c4,stroke:#f57f17,stroke-width:2px,color:#000000
    
    class Start startClass
    class DealUnavailable,ValidationErrors,PaymentFailed,EndError errorClass
    class CreateAppointment,BookingComplete successClass
    class SelectTimeSlot,EnterDetails,ProcessPayment processClass
    class CheckAvailability,ValidateBooking,ProcessPayment decisionClass
    class SendConfirmationEmail,NotifyBusiness emailClass
```

## 2. Business Confirmation Flow

This flow covers how business handles new appointment requests.

```mermaid
flowchart TD
    Start[New Appointment Request Received<br/>Status: 'pending'] --> BusinessViews[Business Views Appointment Details]
    
    BusinessViews --> BusinessDecision{Business Decision}
    
    BusinessDecision -->|Confirm| ConfirmAppointment[Business Confirms Appointment]
    BusinessDecision -->|Reject| RejectAppointment[Business Rejects Appointment]
    BusinessDecision -->|Request Changes| RequestChanges[Business Requests Changes:<br/>• Suggest different time<br/>• Request more information<br/>• Suggest alternative service]
    
    ConfirmAppointment --> UpdateStatusConfirmed[Update Status: 'confirmed']
    UpdateStatusConfirmed --> SendConfirmedEmail[Send Email to Customer:<br/>• Appointment confirmed<br/>• Reminder details<br/>• Contact information<br/>• What to bring/prepare]
    SendConfirmedEmail --> AppointmentConfirmed[Appointment Confirmed<br/>Status: 'confirmed']
    
    RejectAppointment --> UpdateStatusRejected[Update Status: 'rejected']
    UpdateStatusRejected --> ProcessRefund[Process Refund:<br/>• Initiate refund to customer<br/>• Update payment status]
    ProcessRefund --> SendRejectedEmail[Send Email to Customer:<br/>• Appointment rejected<br/>• Reason for rejection<br/>• Refund information<br/>• Alternative suggestions]
    SendRejectedEmail --> AppointmentRejected[Appointment Rejected<br/>Status: 'rejected']
    
    RequestChanges --> UpdateStatusRescheduled[Update Status: 'rescheduled_pending']
    UpdateStatusRescheduled --> SendChangeRequestEmail[Send Email to Customer:<br/>• Request for changes<br/>• Suggested alternatives<br/>• Action required]
    SendChangeRequestEmail --> WaitCustomerResponse[Wait for Customer Response<br/>Status: 'rescheduled_pending']
    
    WaitCustomerResponse --> CustomerResponse{Customer Response}
    CustomerResponse -->|Accepts Changes| UpdateStatusConfirmed
    CustomerResponse -->|Rejects Changes| CustomerCancels[Customer Cancels Appointment]
    CustomerCancels --> AppointmentCancelled[Appointment Cancelled]
    
    %% Styling
    classDef startClass fill:#c8e6c9,stroke:#1b5e20,stroke-width:3px,color:#000000
    classDef successClass fill:#c8e6c9,stroke:#1b5e20,stroke-width:2px,color:#000000
    classDef processClass fill:#bbdefb,stroke:#0d47a1,stroke-width:2px,color:#000000
    classDef decisionClass fill:#ffe0b2,stroke:#e65100,stroke-width:2px,color:#000000
    classDef statusClass fill:#e1bee7,stroke:#4a148c,stroke-width:2px,color:#000000
    classDef emailClass fill:#fff9c4,stroke:#f57f17,stroke-width:2px,color:#000000
    
    class Start startClass
    class ConfirmAppointment,AppointmentConfirmed successClass
    class BusinessViews,ProcessRefund processClass
    class BusinessDecision,CustomerResponse decisionClass
    class UpdateStatusConfirmed,UpdateStatusRejected,UpdateStatusRescheduled statusClass
    class SendConfirmedEmail,SendRejectedEmail,SendChangeRequestEmail emailClass
```

## 3. Customer Cancellation Flow

This flow covers customer-initiated cancellations.

```mermaid
flowchart TD
    Start[Customer Wants to Cancel Appointment] --> CheckStatus{Current Status?}
    
    CheckStatus -->|pending| CanCancelPending[Customer Can Cancel]
    CheckStatus -->|confirmed| CanCancelConfirmed[Customer Can Cancel]
    CheckStatus -->|rescheduled_pending| CanCancelRescheduled[Customer Can Cancel]
    
    CanCancelPending --> CustomerCancel[Customer Cancels Appointment]
    CanCancelConfirmed --> CustomerCancel
    CanCancelRescheduled --> CustomerCancel
    
    CustomerCancel --> CheckCancellationPolicy{Check Cancellation Policy:<br/>• Within cancellation window?<br/>• Refund eligible?}
    
    CheckCancellationPolicy -->|Eligible for Refund| ProcessCancellationRefund[Process Refund:<br/>• Full or partial refund<br/>• Update payment status]
    CheckCancellationPolicy -->|Past Cancellation Window| NoRefund[No Refund Available]
    
    ProcessCancellationRefund --> UpdateStatusCancelled[Update Status: 'cancelled_by_customer']
    NoRefund --> UpdateStatusCancelled
    
    UpdateStatusCancelled --> DecrementBookings[Decrement currentBookings<br/>on Deal]
    DecrementBookings --> SendCancellationEmail[Send Email to Customer:<br/>• Cancellation confirmed<br/>• Refund status<br/>• Future booking options]
    
    SendCancellationEmail --> NotifyBusiness[Notify Business:<br/>• Appointment cancelled<br/>• Time slot available again]
    NotifyBusiness --> CancellationComplete[Appointment Cancelled<br/>Status: 'cancelled_by_customer']
    
    %% Styling
    classDef startClass fill:#c8e6c9,stroke:#1b5e20,stroke-width:3px,color:#000000
    classDef successClass fill:#c8e6c9,stroke:#1b5e20,stroke-width:2px,color:#000000
    classDef processClass fill:#bbdefb,stroke:#0d47a1,stroke-width:2px,color:#000000
    classDef decisionClass fill:#ffe0b2,stroke:#e65100,stroke-width:2px,color:#000000
    classDef statusClass fill:#e1bee7,stroke:#4a148c,stroke-width:2px,color:#000000
    classDef emailClass fill:#fff9c4,stroke:#f57f17,stroke-width:2px,color:#000000
    
    class Start startClass
    class CustomerCancel,CancellationComplete successClass
    class DecrementBookings,ProcessCancellationRefund processClass
    class CheckStatus,CheckCancellationPolicy decisionClass
    class UpdateStatusCancelled statusClass
    class SendCancellationEmail,NotifyBusiness emailClass
```

## 4. Business Cancellation Flow

This flow covers business-initiated cancellations.

```mermaid
flowchart TD
    Start[Business Wants to Cancel Appointment] --> CheckAppointmentStatus{Appointment Status?}
    
    CheckAppointmentStatus -->|pending| CancelPending[Business Can Cancel Pending Appointment]
    CheckAppointmentStatus -->|confirmed| CancelConfirmed[Business Can Cancel Confirmed Appointment]
    
    CancelPending --> BusinessCancel[Business Cancels Appointment]
    CancelConfirmed --> BusinessCancel
    
    BusinessCancel --> UpdateStatusCancelled[Update Status: 'cancelled_by_business']
    UpdateStatusCancelled --> ProcessRefund[Process Full Refund:<br/>• Initiate refund to customer<br/>• Update payment status]
    
    ProcessRefund --> SendCancellationEmail[Send Email to Customer:<br/>• Cancellation notice<br/>• Apology<br/>• Full refund processed<br/>• Rescheduling options]
    
    SendCancellationEmail --> DecrementBookings[Decrement currentBookings<br/>on Deal]
    DecrementBookings --> NotifyCustomer[Notify Customer:<br/>• Time slot available<br/>• Alternative appointment suggestions]
    
    NotifyCustomer --> CancellationComplete[Appointment Cancelled by Business<br/>Status: 'cancelled_by_business']
    
    %% Styling
    classDef startClass fill:#c8e6c9,stroke:#1b5e20,stroke-width:3px,color:#000000
    classDef successClass fill:#c8e6c9,stroke:#1b5e20,stroke-width:2px,color:#000000
    classDef processClass fill:#bbdefb,stroke:#0d47a1,stroke-width:2px,color:#000000
    classDef decisionClass fill:#ffe0b2,stroke:#e65100,stroke-width:2px,color:#000000
    classDef statusClass fill:#e1bee7,stroke:#4a148c,stroke-width:2px,color:#000000
    classDef emailClass fill:#fff9c4,stroke:#f57f17,stroke-width:2px,color:#000000
    
    class Start startClass
    class BusinessCancel,CancellationComplete successClass
    class ProcessRefund,DecrementBookings processClass
    class CheckAppointmentStatus decisionClass
    class UpdateStatusCancelled statusClass
    class SendCancellationEmail,NotifyCustomer emailClass
```

## 5. Deal Cancellation Impact Flow

This flow covers what happens when a business cancels a deal that has pending appointments.

```mermaid
flowchart TD
    Start[Business Cancels Deal] --> FindPendingAppointments[Find All Pending Appointments<br/>for This Deal]
    
    FindPendingAppointments --> CheckAppointments{Any Pending Appointments?}
    
    CheckAppointments -->|No| NoImpact[No Impact on Appointments]
    CheckAppointments -->|Yes| UpdateAllPendingStatus[Update All Pending Appointments:<br/>• Status: 'cancelled_by_business'<br/>• Reason: Deal Cancelled]
    
    UpdateAllPendingStatus --> ProcessRefunds[Process Refunds for All Affected Customers:<br/>• Initiate refund to each customer<br/>• Update payment status]
    
    ProcessRefunds --> NotifyAllCustomers[Notify All Affected Customers:<br/>• Deal cancellation notice<br/>• Appointment cancellation<br/>• Refund information<br/>• Alternative suggestions]
    
    NotifyAllCustomers --> DecrementAllBookings[Decrement currentBookings<br/>for All Affected Appointments]
    
    DecrementAllBookings --> ImpactComplete[Deal Cancellation Complete<br/>All Affected Appointments Cancelled]
    
    NoImpact --> ImpactComplete
    
    %% Styling
    classDef startClass fill:#c8e6c9,stroke:#1b5e20,stroke-width:3px,color:#000000
    classDef successClass fill:#c8e6c9,stroke:#1b5e20,stroke-width:2px,color:#000000
    classDef processClass fill:#bbdefb,stroke:#0d47a1,stroke-width:2px,color:#000000
    classDef decisionClass fill:#ffe0b2,stroke:#e65100,stroke-width:2px,color:#000000
    classDef statusClass fill:#e1bee7,stroke:#4a148c,stroke-width:2px,color:#000000
    classDef emailClass fill:#fff9c4,stroke:#f57f17,stroke-width:2px,color:#000000
    
    class Start startClass
    class ImpactComplete successClass
    class FindPendingAppointments,UpdateAllPendingStatus,ProcessRefunds,DecrementAllBookings processClass
    class CheckAppointments decisionClass
    class NotifyAllCustomers emailClass
```

## 6. Reschedule Flow

This flow covers both customer-initiated and business-initiated rescheduling.

```mermaid
flowchart TD
    Start[Reschedule Request] --> CheckInitiator{Who Initiated Reschedule?}
    
    CheckInitiator -->|Customer| CustomerReschedule[Customer Requests Reschedule]
    CheckInitiator -->|Business| BusinessReschedule[Business Requests Changes]
    
    CustomerReschedule --> CheckNewTimeAvailability{Check New Time Availability}
    
    CheckNewTimeAvailability -->|Available| UpdateToRescheduled[Update Status: 'rescheduled_pending'<br/>Propose new time]
    CheckNewTimeAvailability -->|Not Available| SuggestAlternatives[Suggest Alternative Times]
    
    UpdateToRescheduled --> SendRescheduleProposal[Send Email to Business:<br/>• Reschedule request<br/>• Proposed new time<br/>• Awaiting confirmation]
    
    SuggestAlternatives --> CustomerSelectsTime{Customer Selects Alternative}
    CustomerSelectsTime -->|Valid Time| UpdateToRescheduled
    CustomerSelectsTime -->|No Suitable Time| CustomerCancel[Customer Cancels Appointment]
    CustomerCancel --> RescheduleCancelled[Reschedule Cancelled]
    
    BusinessReschedule --> UpdateStatusRescheduled[Update Status: 'rescheduled_pending']
    UpdateStatusRescheduled --> SendChangeRequestEmail[Send Email to Customer:<br/>• Request for changes<br/>• Suggested alternatives<br/>• Action required]
    
    SendChangeRequestEmail --> WaitCustomerResponse[Wait for Customer Response]
    WaitCustomerResponse --> CustomerResponse{Customer Response}
    
    CustomerResponse -->|Accepts| AcceptChanges[Customer Accepts Changes]
    CustomerResponse -->|Rejects| CustomerRejectsChanges[Customer Rejects Changes]
    
    SendRescheduleProposal --> BusinessRescheduleAction{Business Action on Reschedule}
    BusinessRescheduleAction -->|Confirm| AcceptChanges
    BusinessRescheduleAction -->|Reject| BusinessRejectsReschedule[Business Rejects Reschedule]
    BusinessRejectsReschedule --> RescheduleRejected[Reschedule Rejected]
    
    AcceptChanges --> UpdateStatusConfirmed[Update Status: 'confirmed']
    UpdateStatusConfirmed --> SendRescheduleConfirmed[Send Confirmation Email:<br/>• New date and time<br/>• Updated appointment details]
    SendRescheduleConfirmed --> RescheduleComplete[Reschedule Complete<br/>Status: 'confirmed']
    
    CustomerRejectsChanges --> CustomerCancel
    
    %% Styling
    classDef startClass fill:#c8e6c9,stroke:#1b5e20,stroke-width:3px,color:#000000
    classDef successClass fill:#c8e6c9,stroke:#1b5e20,stroke-width:2px,color:#000000
    classDef processClass fill:#bbdefb,stroke:#0d47a1,stroke-width:2px,color:#000000
    classDef decisionClass fill:#ffe0b2,stroke:#e65100,stroke-width:2px,color:#000000
    classDef statusClass fill:#e1bee7,stroke:#4a148c,stroke-width:2px,color:#000000
    classDef emailClass fill:#fff9c4,stroke:#f57f17,stroke-width:2px,color:#000000
    
    class Start startClass
    class AcceptChanges,RescheduleComplete successClass
    class UpdateToRescheduled,UpdateStatusRescheduled,UpdateStatusConfirmed processClass
    class CheckInitiator,CheckNewTimeAvailability,CustomerSelectsTime,CustomerResponse,BusinessRescheduleAction decisionClass
    class SendRescheduleProposal,SendChangeRequestEmail,SendRescheduleConfirmed emailClass
```

## 7. Appointment Execution Flow

This flow covers what happens when the appointment date/time arrives.

```mermaid
flowchart TD
    Start[Appointment Date/Time Arrives<br/>Status: 'confirmed'] --> CheckCustomerArrival{Did Customer Arrive?}
    
    CheckCustomerArrival -->|Customer Arrived| AppointmentInProgress[Appointment In Progress]
    CheckCustomerArrival -->|Customer No Show| WaitGracePeriod[Wait for Grace Period]
    
    WaitGracePeriod --> UpdateStatusNoShow[Update Status: 'no_show'<br/>Mark after grace period]
    UpdateStatusNoShow --> SendNoShowEmail[Send Email to Customer:<br/>• No show notification<br/>• Impact on future bookings<br/>• Rescheduling options]
    SendNoShowEmail --> NotifyBusinessNoShow[Notify Business:<br/>• No show recorded<br/>• Update customer records]
    NotifyBusinessNoShow --> NoShowComplete[No Show Recorded<br/>Status: 'no_show']
    
    AppointmentInProgress --> AppointmentComplete[Appointment Completed]
    AppointmentComplete --> BusinessMarksComplete{Business Marks as Complete}
    
    BusinessMarksComplete --> UpdateStatusCompleted[Update Status: 'completed']
    UpdateStatusCompleted --> SendCompletionEmail[Send Email to Customer:<br/>• Thank you message<br/>• Feedback request<br/>• Receipt/invoice<br/>• Future booking incentives]
    
    SendCompletionEmail --> RequestFeedback[Request Customer Feedback]
    RequestFeedback --> CustomerFeedback{Customer Provides Feedback?}
    
    CustomerFeedback -->|Provides Feedback| StoreFeedback[Store Feedback & Rating]
    CustomerFeedback -->|No Feedback| EndCompleted[Appointment Flow Complete<br/>Status: 'completed']
    
    StoreFeedback --> UpdateBusinessMetrics[Update Business Metrics:<br/>• Rating<br/>• Review count<br/>• Customer satisfaction]
    UpdateBusinessMetrics --> EndCompleted
    
    %% Styling
    classDef startClass fill:#c8e6c9,stroke:#1b5e20,stroke-width:3px,color:#000000
    classDef successClass fill:#c8e6c9,stroke:#1b5e20,stroke-width:2px,color:#000000
    classDef processClass fill:#bbdefb,stroke:#0d47a1,stroke-width:2px,color:#000000
    classDef decisionClass fill:#ffe0b2,stroke:#e65100,stroke-width:2px,color:#000000
    classDef statusClass fill:#e1bee7,stroke:#4a148c,stroke-width:2px,color:#000000
    classDef emailClass fill:#fff9c4,stroke:#f57f17,stroke-width:2px,color:#000000
    
    class Start startClass
    class AppointmentComplete,UpdateStatusCompleted,EndCompleted successClass
    class AppointmentInProgress,WaitGracePeriod,UpdateStatusNoShow,UpdateStatusCompleted,StoreFeedback,UpdateBusinessMetrics processClass
    class CheckCustomerArrival,BusinessMarksComplete,CustomerFeedback decisionClass
    class SendNoShowEmail,SendCompletionEmail emailClass
```

## 8. Appointment Expiration Flow

This flow covers what happens when an appointment expires without completion or cancellation.

```mermaid
flowchart TD
    Start[Check Appointment Status<br/>Status: 'confirmed'] --> CheckExpiration{Is Appointment Time Past?<br/>Without completion or cancellation}
    
    CheckExpiration -->|Not Expired| StillValid[Appointment Still Valid]
    CheckExpiration -->|Expired| UpdateStatusExpired[Update Status: 'expired']
    
    UpdateStatusExpired --> HandleExpiredAppointment[Handle Expired Appointment:<br/>• Mark as expired<br/>• Archive appointment<br/>• No refund unless special case]
    
    HandleExpiredAppointment --> NotifyBusinessExpired[Notify Business:<br/>• Appointment expired<br/>• Time slot was unused]
    
    NotifyBusinessExpired --> CheckSpecialCase{Special Case?<br/>Customer had valid reason}
    
    CheckSpecialCase -->|Yes, Process Refund| ProcessSpecialRefund[Process Refund:<br/>• Refund amount based on policy<br/>• Update payment status]
    CheckSpecialCase -->|No, No Refund| NoRefund[No Refund]
    
    ProcessSpecialRefund --> SendExpiredEmail[Send Email to Customer:<br/>• Appointment expired<br/>• Refund information if applicable]
    NoRefund --> SendExpiredEmail
    
    SendExpiredEmail --> ExpirationComplete[Appointment Expired<br/>Status: 'expired']
    StillValid --> ExpirationComplete
    
    %% Styling
    classDef startClass fill:#c8e6c9,stroke:#1b5e20,stroke-width:3px,color:#000000
    classDef successClass fill:#c8e6c9,stroke:#1b5e20,stroke-width:2px,color:#000000
    classDef processClass fill:#bbdefb,stroke:#0d47a1,stroke-width:2px,color:#000000
    classDef decisionClass fill:#ffe0b2,stroke:#e65100,stroke-width:2px,color:#000000
    classDef statusClass fill:#e1bee7,stroke:#4a148c,stroke-width:2px,color:#000000
    classDef emailClass fill:#fff9c4,stroke:#f57f17,stroke-width:2px,color:#000000
    
    class Start startClass
    class ExpirationComplete successClass
    class HandleExpiredAppointment,NotifyBusinessExpired,ProcessSpecialRefund processClass
    class CheckExpiration,CheckSpecialCase decisionClass
    class UpdateStatusExpired statusClass
    class SendExpiredEmail emailClass
```

## Appointment Status Transitions

```mermaid
stateDiagram-v2
    [*] --> pending: Customer Books Appointment
    
    pending --> confirmed: Business Confirms
    pending --> rejected: Business Rejects
    pending --> cancelled_by_customer: Customer Cancels
    pending --> cancelled_by_business: Business Cancels Deal
    pending --> rescheduled_pending: Reschedule Requested
    
    confirmed --> cancelled_by_customer: Customer Cancels
    confirmed --> cancelled_by_business: Business Cancels
    confirmed --> rescheduled_pending: Reschedule Requested
    confirmed --> completed: Appointment Completed
    confirmed --> no_show: Customer No Show
    confirmed --> expired: Past Time Without Action
    
    rescheduled_pending --> confirmed: Reschedule Confirmed
    rescheduled_pending --> cancelled_by_customer: Customer Cancels
    rescheduled_pending --> cancelled_by_business: Business Rejects Reschedule
    rescheduled_pending --> rejected: Business Rejects
    
    completed --> [*]: End State
    rejected --> [*]: End State
    cancelled_by_customer --> [*]: End State
    cancelled_by_business --> [*]: End State
    no_show --> [*]: End State
    expired --> [*]: End State
```

## Customer Actions Matrix

| Appointment Status | Customer Can | Customer Cannot |
|-------------------|--------------|-----------------|
| `pending` | Cancel, Request Reschedule, Request Changes | Confirm, Mark Complete |
| `confirmed` | Cancel, Request Reschedule, Request Changes | Reject, Mark Complete |
| `rescheduled_pending` | Accept Reschedule, Reject Reschedule, Cancel | Confirm, Reject |
| `completed` | Provide Feedback, Book Again | Cancel, Reschedule |
| `rejected` | Book Alternative Appointment | Cancel, Confirm |
| `cancelled_by_customer` | Book New Appointment | Any Actions on This Appointment |
| `cancelled_by_business` | Request Refund, Book Alternative | Confirm, Cancel |
| `no_show` | Book New Appointment, Pay No-Show Fee | Reschedule This Appointment |
| `expired` | Book New Appointment | Any Actions on This Appointment |

## Business Actions Matrix

| Appointment Status | Business Can | Business Cannot |
|-------------------|--------------|-----------------|
| `pending` | Confirm, Reject, Request Changes, Cancel | Mark Complete |
| `confirmed` | Cancel, Reschedule, Mark Complete | Reject |
| `rescheduled_pending` | Confirm Reschedule, Reject Reschedule | Mark Complete |
| `completed` | View Feedback, Contact Customer | Cancel, Reschedule |
| `rejected` | Contact Customer | Confirm, Cancel |
| `cancelled_by_customer` | View Details, Contact Customer | Confirm, Cancel |
| `cancelled_by_business` | View Details, Contact Customer | Confirm, Cancel |
| `no_show` | Charge No-Show Fee, Contact Customer | Reschedule, Cancel |
| `expired` | View Details, Archive | Any Actions |

## Email Notification Flow

```mermaid
sequenceDiagram
    participant Customer
    participant System
    participant EmailService
    participant Business
    
    Customer->>System: Book Appointment
    System->>System: Create Appointment (pending)
    System->>EmailService: Send Confirmation Email
    EmailService->>Customer: Appointment Booking Confirmation<br/>(Status: Pending)
    System->>Business: Notify New Appointment Request
    
    alt Business Confirms
        Business->>System: Confirm Appointment
        System->>System: Update Status (confirmed)
        System->>EmailService: Send Confirmation Email
        EmailService->>Customer: Appointment Confirmed<br/>+ Reminder Details
    else Business Rejects
        Business->>System: Reject Appointment
        System->>System: Update Status (rejected)
        System->>System: Process Refund
        System->>EmailService: Send Rejection Email
        EmailService->>Customer: Appointment Rejected<br/>+ Refund Information
    end
    
    Note over Customer,Business: Appointment Time Approaches
    
    alt Customer Cancels
        Customer->>System: Cancel Appointment
        System->>System: Update Status (cancelled_by_customer)
        System->>System: Process Refund (if eligible)
        System->>EmailService: Send Cancellation Email
        EmailService->>Customer: Cancellation Confirmed<br/>+ Refund Status
        System->>Business: Notify Cancellation
    else Appointment Occurs
        System->>System: Check Customer Arrival
        alt Customer Shows Up
            System->>Business: Appointment In Progress
            Business->>System: Mark as Complete
            System->>System: Update Status (completed)
            System->>EmailService: Send Completion Email
            EmailService->>Customer: Thank You + Feedback Request
        else Customer No Show
            System->>System: Update Status (no_show)
            System->>EmailService: Send No-Show Email
            EmailService->>Customer: No-Show Notification
        end
    end
```

## Key Paths to Verify

### ✅ Covered Paths:

1. **Booking Flow**
   - Customer selects deal → Selects time → Enters details → Payment → Appointment created → Email sent → Business notified

2. **Business Confirmation Flow**
   - Business receives notification → Reviews → Confirms/Rejects → Email sent to customer

3. **Cancellation Flows**
   - Customer cancels (with refund policy check)
   - Business cancels (with refund processing)
   - Deal cancellation (affects all pending appointments)

4. **Reschedule Flows**
   - Customer requests reschedule → Business confirms/rejects
   - Business requests changes → Customer accepts/rejects

5. **Appointment Execution**
   - Customer shows up → Appointment completed → Feedback requested
   - Customer no-show → Marked as no-show → Notifications sent

6. **Edge Cases**
   - Payment failure
   - Deal unavailable/sold out
   - Appointment expiration
   - Invalid time slots

### ⚠️ Potential Missing Paths to Consider:

1. **Partial Payments/Deposits**: What if business requires deposit only?
2. **Waitlist System**: What if deal is full - should there be a waitlist?
3. **Auto-Confirm**: Should some appointments auto-confirm without business action?
4. **Recurring Appointments**: What if customer wants to book multiple sessions?
5. **Group Bookings**: Can multiple customers book same time slot?
6. **Reminder System**: Should there be automated reminders (24h before, 1h before)?
7. **Late Arrival**: What if customer arrives late but within grace period?
8. **Emergency Cancellation**: Special handling for emergency cancellations?
9. **Dispute Resolution**: What if customer disputes appointment quality/service?
10. **Refund Disputes**: What if refund fails or is contested?
11. **Business Holiday Closures**: How are appointments handled during business closure?
12. **Service Unavailability**: What if service becomes unavailable after booking?
13. **Customer Account Deletion**: What happens to appointments if customer deletes account?
14. **Business Account Disabled**: What happens to appointments if business is disabled?
15. **Time Zone Handling**: What if customer books across time zones?
16. **Recurring Deal Bookings**: Can same customer book multiple instances of recurring deal?

