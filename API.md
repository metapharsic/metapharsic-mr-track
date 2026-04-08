# Metapharsic Life Sciences CRM - REST API Reference

**Base URL**: `http://localhost:3000/api`  
**Authentication**: None (demo mode) or session-based (OAuth)  
**Content-Type**: `application/json`  
**Response Format**: JSON

---

## Table of Contents

1. [Authentication](#authentication)
2. [Medical Representatives (MRs)](#medical-representatives-mrs)
3. [Products](#products)
4. [Doctors](#doctors)
5. [Pharmacies](#pharmacies)
6. [Hospitals](#hospitals)
7. [Targets](#targets)
8. [Expenses](#expenses)
9. [Sales](#sales)
10. [Visit Schedules](#visit-schedules)
11. [Visits & Doctor Visits](#visits--doctor-visits)
12. [Leads](#leads)
13. [Attendance](#attendance)
14. [Activities](#activities)
15. [Visit Recordings](#visit-recordings)
16. [Visit Records](#visit-records)
17. [Approval Workflow](#approval-workflow)
18. [Entity Credits](#entity-credits)
19. [MR Locations](#mr-locations)
20. [Notifications](#notifications)
21. [Missed Visits](#missed-visits)
22. [Daily Summaries](#daily-summaries)
23. [Daily Call Plan](#daily-call-plan)

---

## Authentication

### Verify Google Token
```http
POST /auth/google
Content-Type: application/json

{
  "credential": "Google OAuth JWT token"
}

Response:
{
  "email": "user@example.com",
  "name": "John Doe",
  "picture": "https://...",
  "email_verified": true,
  "sub": "google-user-id"
}
```

**Note**: Demo mode bypasses this. See `AuthContext` for local auth.

---

## Medical Representatives (MRs)

### List All MRs
```http
GET /mrs
```

**Response**:
```json
[
  {
    "id": 1,
    "name": "Rajesh Kumar",
    "territory": "Hyderabad West (Kukatpally, Gachibowli, Miyapur)",
    "base_salary": 35000,
    "daily_allowance": 12000,
    "joining_date": "2023-01-15",
    "phone": "+91 98765 43210",
    "email": "rajesh.kumar@metapharsic.com",
    "status": "active",
    "performance_score": 85,
    "total_sales": 1250000,
    "targets_achieved": 8,
    "targets_missed": 2,
    "avatar_url": "https://...",
    "user_id": 2,
    "role": "mr"
  }
]
```

### Create MR
```http
POST /mrs
Content-Type: application/json

{
  "name": "New MR",
  "territory": "Area Name",
  "base_salary": 30000,
  "daily_allowance": 10000,
  "joining_date": "2024-01-01",
  "phone": "+91 9876543210",
  "email": "mr@example.com",
  "status": "active",
  "performance_score": 80
}
```

### Update MR (Partial)
```http
PATCH /mrs/:id
Content-Type: application/json

{
  "performance_score": 90,
  "status": "active"
}
```

---

## Products

### List All Products
```http
GET /products
```

**Response**:
```json
[
  {
    "id": 1,
    "name": "CardiCare Plus 10mg (Atorvastatin)",
    "type": "Third-Party",
    "cogs": 450,
    "mrp": 750,
    "pts": 680,
    "category": "Statins",
    "stock": 500,
    "department": "Cardiology",
    "reorder_level": 100,
    "composition": "Atorvastatin Calcium 10mg",
    "indication": "Hyperlipidemia, Dyslipidemia"
  }
]
```

---

## Doctors

### List All Doctors
```http
GET /doctors
```

**Response**:
```json
[
  {
    "id": 1,
    "name": "Dr. Ramesh Sharma",
    "clinic": "Sharma Clinic",
    "specialty": "Cardiologist",
    "territory": "Hyderabad West",
    "tier": "A",
    "potential": "high",
    "total_visits": 45,
    "total_orders": 12,
    "total_value": 156000,
    "status": "active",
    "phone": "+91 98765 43210",
    "email": "doctor@example.com",
    "address": "123 Main St",
    "area": "Kukatpally",
    "rating": 4.8,
    "timings": "9:00 AM - 2:00 PM",
    "qualification": "MD, DM",
    "dept_opd": "Cardiology",
    "mr_visit_window": "10:00-13:00",
    "notes": "Prefers samples before bulk orders",
    "hospital_id": null,
    "entity_type": "doctor"
  }
]
```

---

## Pharmacies

### List All Pharmacies
```http
GET /pharmacies
```

**Response**:
```json
[
  {
    "id": 1,
    "name": " Wellness Pharmacy",
    "owner_name": "Suresh Patel",
    "phone": "+91 98765 43210",
    "email": "pharmacy@example.com",
    "address": "456 Oak Ave",
    "territory": "Hyderabad West",
    "tier": "A",
    "credit_limit": 50000,
    "credit_days": 30,
    "total_purchases": 156,
    "total_value": 450000,
    "status": "active",
    "area": "Kukatpally",
    "rating": 4.5,
    "notes": "Pays on time",
    "shop_hours": "8:00 AM - 10:00 PM",
    "mr_visit_window": "11:00-13:00",
    "type": "Retail",
    "discount_notes": "5% discount on bulk orders"
  }
]
```

---

## Hospitals

### List All Hospitals
```http
GET /hospitals
```

**Response**:
```json
[
  {
    "id": 1,
    "name": "City General Hospital",
    "type": "Multi-Specialty",
    "contact_person": "Dr. Admin",
    "phone": "+91 98765 43210",
    "email": "hospital@example.com",
    "address": "789 Hospital Rd",
    "territory": "Hyderabad Central",
    "tier": "A",
    "bed_count": 250,
    "credit_limit": 200000,
    "credit_days": 60,
    "total_purchases": 89,
    "total_value": 1250000,
    "status": "active",
    "area": "Banjara Hills",
    "rating": 4.7,
    "notes": "Tendering process ongoing"
  }
]
```

---

## Targets

### List All Targets
```http
GET /targets
```

**Query Params**:
- `mr_id` (optional) - Filter by MR

**Response**:
```json
[
  {
    "id": 1,
    "mr_id": 1,
    "mr_name": "Rajesh Kumar",
    "month": "2025-04",
    "target_value": 500000,
    "product_type": "All",
    "status": "in_progress",
    "achieved_value": 325000
  }
]
```

---

## Expenses

### List All Expenses
```http
GET /expenses
```

**Query Params**:
- `mr_id` (optional) - Filter by MR
- `date` (optional) - Filter by date

**Response**:
```json
[
  {
    "id": 1,
    "category": "Travel",
    "amount": 2500,
    "date": "2025-04-08",
    "description": "Cab to client meeting",
    "mr_id": 1,
    "status": "pending"
  }
]
```

### Create Expense
```http
POST /expenses
Content-Type: application/json

{
  "category": "Meals",
  "amount": 1200,
  "date": "2025-04-08",
  "description": "Client lunch",
  "mr_id": 1
}
```

---

## Sales

### List All Sales
```http
GET /sales
```

**Query Params**:
- `mr_id` (optional)
- `doctor_id` (optional)
- `date_from`, `date_to` (optional)

**Response**:
```json
[
  {
    "id": 1,
    "mr_id": 1,
    "mr_name": "Rajesh Kumar",
    "product_id": 1,
    "product_name": "CardiCare Plus 10mg",
    "quantity": 100,
    "amount": 75000,
    "date": "2025-04-08",
    "doctor_name": "Dr. Ramesh Sharma",
    "clinic": "Sharma Clinic",
    "sale_type": "Direct",
    "customer_name": "Dr. Ramesh Sharma"
  }
]
```

### Create Sale
```http
POST /sales
Content-Type: application/json

{
  "mr_id": 1,
  "product_id": 1,
  "quantity": 100,
  "amount": 75000,
  "date": "2025-04-08",
  "doctor_name": "Dr. Ramesh Sharma",
  "clinic": "Sharma Clinic",
  "sale_type": "Direct",
  "customer_name": "Dr. Ramesh Sharma"
}
```

### Get Sales Forecast
```http
GET /sales-forecast
```

**Response**:
```json
[
  {
    "month": "2025-05",
    "predicted_sales": 1500000,
    "confidence_high": 1650000,
    "confidence_low": 1350000
  },
  {
    "month": "2025-06",
    "predicted_sales": 1600000,
    "confidence_high": 1800000,
    "confidence_low": 1400000
  }
]
```

---

## Visit Schedules

### List All Schedules
```http
GET /visit-schedules
```

**Query Params**:
- `mr_id` (optional) - Filter by MR
- `scheduled_date` (optional) - Filter by date

**Response**:
```json
[
  {
    "id": 1,
    "mr_id": 1,
    "doctor_name": "Dr. Ramesh Sharma",
    "clinic": "Sharma Clinic",
    "scheduled_date": "2025-04-08",
    "scheduled_time": "10:00",
    "purpose": "Product demo - CardiCare Plus",
    "priority": "high",
    "status": "pending",
    "assigned_by": null,
    "created_at": "2025-04-07T10:30:00.000Z"
  }
]
```

### Get Schedules by MR
```http
GET /visit-schedules?mr_id=1
```

### Create Schedule
```http
POST /visit-schedules
Content-Type: application/json

{
  "mr_id": 1,
  "doctor_name": "Dr. Ramesh Sharma",
  "clinic": "Sharma Clinic",
  "scheduled_date": "2025-04-08",
  "scheduled_time": "10:00",
  "purpose": "Product demo",
  "priority": "high"
}
```

### Start Visit (Mark In-Progress)
```http
PATCH /visit-schedules/:id/start
```

**Response**:
```json
{
  "id": 1,
  "status": "in_progress"
}
```

### Delete/Cancel Schedule
```http
DELETE /visit-schedules/:id
```

---

## Visits & Doctor Visits

### List All Visits (Doctor Visits)
```http
GET /doctor-visits
```

**Query Params**:
- `mr_id` (optional)
- `date` (optional)

**Response**:
```json
[
  {
    "id": 1,
    "mr_id": 1,
    "doctor_id": 1,
    "doctor_name": "Dr. Ramesh Sharma",
    "entity_type": "doctor",
    "entity_name": "Dr. Ramesh Sharma",
    "clinic": "Sharma Clinic",
    "visit_date": "2025-04-08",
    "visit_time": "10:15",
    "status": "completed",
    "purpose": "Product demonstration",
    "notes": "Doctor interested in cardiology products",
    "conversation_summary": "Discussed new statin options...",
    "order_value": 75000
  }
]
```

---

## Leads

### List All Leads
```http
GET /leads
```

**Query Params**:
- `status` (optional) - `new`, `assigned`, `contacted`, `converted`, `lost`
- `assigned_mr_id` (optional)

**Response**:
```json
[
  {
    "id": 1,
    "doctor_name": "Dr. New Doctor",
    "specialty": "Cardiologist",
    "territory": "Hyderabad West",
    "comments": "Met at conference - interested in products",
    "status": "new",
    "priority": "high",
    "assigned_mr_id": 1,
    "assigned_mr_name": "Rajesh Kumar",
    "created_at": "2025-04-08T12:00:00.000Z"
  }
]
```

### Create Lead
```http
POST /leads
Content-Type: application/json

{
  "doctor_name": "Dr. New Doctor",
  "specialty": "Cardiologist",
  "territory": "Hyderabad West",
  "comments": "Met at conference",
  "status": "new",
  "priority": "high",
  "assigned_mr_id": 1
}
```

### Update Lead (Partial)
```http
PATCH /leads/:id
Content-Type: application/json

{
  "status": "contacted",
  "comments": "First follow-up call made"
}
```

---

## Attendance

### Get Attendance Records
```http
GET /attendance
```

**Query Params**:
- `mr_id` (optional) - Filter by MR
- `date` (optional) - Filter by date

**Response**:
```json
[
  {
    "id": 1,
    "mr_id": 1,
    "date": "2025-04-08",
    "check_in": "09:15",
    "check_out": "18:30",
    "status": "present",
    "total_working_hours": 8.5,
    "total_travel_time": 1.5,
    "total_visit_hours": 6,
    "visit_counts": {
      "doctor": 4,
      "clinic": 0,
      "hospital": 1,
      "chemist": 2
    },
    "total_order_value": 125000
  }
]
```

### Check In
```http
POST /attendance/check-in
Content-Type: application/json

{
  "mr_id": 1,
  "mr_name": "Rajesh Kumar",
  "lat": 17.3850,
  "lng": 78.4867
}
```

**Response**:
```json
{
  "id": 1,
  "mr_id": 1,
  "date": "2025-04-08",
  "check_in": "09:15",
  "status": "present"
}
```

---

## Activities

### List Activities
```http
GET /activities
```

**Query Params**:
- `mr_id` (required if date specified)
- `date` (optional) - Format: YYYY-MM-DD

**Response**:
```json
[
  {
    "id": 1,
    "mr_id": 1,
    "date": "2025-04-08",
    "time": "09:15",
    "type": "visit",
    "location_type": "clinic",
    "location_name": "Sharma Clinic",
    "duration": 45,
    "description": "CardiCare Plus demo"
  }
]
```

---

## Visit Recordings

### List All Recordings
```http
GET /visit-recordings
```

**Query Params**:
- `mr_id` (optional)

**Response**:
```json
[
  {
    "id": 1,
    "mr_id": 1,
    "entity_type": "doctor",
    "entity_name": "Dr. Ramesh Sharma",
    "transcript": "Doctor: Tell me about the new formulation...",
    "language": "en",
    "detected_lead": true,
    "detected_sale": true,
    "lead_details": {
      "doctor_name": "Dr. Ramesh Sharma",
      "interest_topic": "CardiCare Plus",
      "follow_up_needed": true
    },
    "sale_details": {
      "product": "CardiCare Plus",
      "amount": 75000
    },
    "timestamp": "2025-04-08T10:30:00.000Z",
    "status": "approved"
  }
]
```

### Get Recordings by Entity
```http
GET /visit-recordings?entity=Dr.%20Ramesh%20Sharma
```

### Create Recording
```http
POST /visit-recordings
Content-Type: application/json

{
  "mr_id": 1,
  "entity_type": "doctor",
  "entity_name": "Dr. Ramesh Sharma",
  "transcript": "Full speech-to-text transcript...",
  "language": "en",
  "detected_lead": true,
  "detected_sale": false,
  "lead_details": {
    "interest_topic": "New product line",
    "follow_up_needed": true
  }
}
```

---

## Visit Records

### List Visit Records
```http
GET /visit-records
```

**Query Params**:
- `mr_id` (optional)

**Response**:
```json
[
  {
    "id": 1,
    "mr_id": 1,
    "mr_name": "Rajesh Kumar",
    "entity_type": "doctor",
    "entity_id": 1,
    "entity_name": "Dr. Ramesh Sharma",
    "clinic": "Sharma Clinic",
    "scheduled_time": "10:00",
    "scheduled_visit_id": 1,
    "check_in_gps": {
      "lat": 17.3850,
      "lng": 78.4867,
      "timestamp": "2025-04-08T10:12:00.000Z"
    },
    "check_out_gps": {
      "lat": 17.3860,
      "lng": 78.4870,
      "timestamp": "2025-04-08T10:45:00.000Z"
    },
    "photo_url": "https://...",
    "photo_captured": true,
    "photo_timestamp": "2025-04-08T10:13:00.000Z",
    "arrival_time": "10:12",
    "waiting_time": 3,
    "speaking_time": 30,
    "check_in_timestamp": "2025-04-08T10:12:00.000Z",
    "check_out_timestamp": "2025-04-08T10:45:00.000Z",
    "conversation_summary": "Discussed product benefits...",
    "conversation_sentences_count": 12,
    "audio_recording_url": "https://...",
    "sale_done": true,
    "sale_amount": 75000,
    "sale_product": "CardiCare Plus",
    "credit_received": false,
    "bill_printed": true,
    "bill_number": "INV001",
    "status": "completed",
    "created_at": "2025-04-08T10:45:00.000Z",
    "notes": "Very productive visit"
  }
]
```

### Create Visit Record
```http
POST /visit-records
Content-Type: application/json

{
  "mr_id": 1,
  "entity_type": "doctor",
  "entity_id": 1,
  "entity_name": "Dr. Ramesh Sharma",
  "clinic": "Sharma Clinic",
  "scheduled_time": "10:00",
  "scheduled_visit_id": 1,
  "check_in_gps": { "lat": 17.3850, "lng": 78.4867, "timestamp": "2025-04-08T10:12:00.000Z" },
  "photo_url": "https://...",
  "photo_captured": true,
  "arrival_time": "10:12",
  "waiting_time": 3,
  "speaking_time": 30,
  "check_in_timestamp": "2025-04-08T10:12:00.000Z",
  "conversation_summary": "Detailed notes...",
  "conversation_sentences_count": 12,
  "sale_done": true,
  "sale_amount": 75000,
  "status": "completed"
}
```

### Update Visit Record
```http
PATCH /visit-records/:id
Content-Type: application/json

{
  "check_out_gps": { "lat": 17.3860, "lng": 78.4870, "timestamp": "2025-04-08T10:45:00.000Z" },
  "status": "completed"
}
```

---

## Approval Workflow

### List All Approvals
```http
GET /approval-requests
```

**Response**:
```json
[
  {
    "id": 1,
    "mr_id": 1,
    "mr_name": "Rajesh Kumar",
    "type": "reschedule",
    "description": "Request to reschedule visit to tomorrow",
    "details": {
      "visit_id": 1,
      "original_time": "2025-04-08T10:00:00.000Z",
      "requested_time": "2025-04-09T14:00:00.000Z",
      "reason": "Client unavailable today"
    },
    "status": "pending",
    "created_at": "2025-04-08T12:00:00.000Z",
    "approved_at": null,
    "approved_by": null
  }
]
```

### Create Approval Request
```http
POST /approval-requests
Content-Type: application/json

{
  "mr_id": 1,
  "type": "reschedule",
  "description": "Request to reschedule visit",
  "details": {
    "visit_id": 1,
    "original_time": "2025-04-08T10:00:00.000Z",
    "requested_time": "2025-04-09T14:00:00.000Z",
    "reason": "Client unavailable today"
  }
}
```

### Update Approval Status
```http
PATCH /approval-requests/:id
Content-Type: application/json

{
  "status": "approved",
  "approved_by": "admin@metapharsic.com"
}
```

---

## Entity Credits

### List All Entity Credits
```http
GET /entity-credits
```

**Response**:
```json
[
  {
    "id": 1,
    "entity_type": "doctor",
    "entity_name": "Dr. Ramesh Sharma",
    "mr_id": 1,
    "mr_name": "Rajesh Kumar",
    "credit_limit": 100000,
    "outstanding": 25000,
    "last_payment_date": "2025-04-01",
    "payment_terms": "Net 30",
    "status": "current"
  }
]
```

### Update Entity Credit
```http
PATCH /entity-credits/:id
Content-Type: application/json

{
  "credit_limit": 150000,
  "status": "overdue"
}
```

---

## MR Locations

### List All Locations
```http
GET /mr-locations
```

**Query Params**:
- `mr_id` (optional)
- `date` (optional)

**Response**:
```json
[
  {
    "mr_id": 1,
    "mr_name": "Rajesh Kumar",
    "lat": 17.3850,
    "lng": 78.4867,
    "timestamp": "2025-04-08T10:12:00.000Z",
    "activity_type": "visit",
    "speed": 0,
    "address": "Sharma Clinic, Kukatpally"
  }
]
```

### Update/Add Location
```http
POST /mr-locations
Content-Type: application/json

{
  "mr_id": 1,
  "lat": 17.3850,
  "lng": 78.4867,
  "activity_type": "visit",
  "speed": 0
}
```

---

## Notifications

### List Notifications
```http
GET /notifications
```

**Query Params**:
- `mr_id` (optional)

**Response**:
```json
[
  {
    "id": 1,
    "mr_id": 1,
    "title": "Missed Visit",
    "message": "You missed your scheduled visit at Sharma Clinic",
    "type": "alert",
    "read": false,
    "created_at": "2025-04-08T11:00:00.000Z"
  }
]
```

### Send Email
```http
POST /send-email
Content-Type: application/json

{
  "to": "manager@metapharsic.com",
  "subject": "Approval Required",
  "body": "Please review the expense approval request...",
  "mr_id": 1
}
```

---

## Missed Visits

### List Missed Visits
```http
GET /missed-visits
```

**Response**:
```json
[
  {
    "id": 1,
    "mr_id": 1,
    "mr_name": "Rajesh Kumar",
    "entity_name": "Dr. Ramesh Sharma",
    "scheduled_time": "2025-04-08T10:00:00.000Z",
    "alert_severity": "high",
    "alert_message": "MR did not check in at scheduled visit location",
    "sent_at": "2025-04-08T11:00:00.000Z",
    "delivery_status": "delivered",
    "miss_reason": "Not provided"
  }
]
```

---

## Daily Summaries

### Get Daily Summary
```http
GET /daily-summaries?mr_id=1
```

**Query Params**:
- `mr_id` (required)
- `date` (optional, defaults to today)

**Response**:
```json
{
  "mr_id": 1,
  "mr_name": "Rajesh Kumar",
  "date": "2025-04-08",
  "total_visits": 6,
  "completed_visits": 4,
  "pending_visits": 2,
  "total_working_hours": 8.5,
  "total_travel_km": 45,
  "total_order_value": 125000,
  "attendance_status": "present"
}
```

---

## Daily Call Plan

### List Daily Call Plan
```http
GET /daily-call-plan
```

**Query Params**:
- `mr_id` (optional)
- `date` (optional)

**Response**:
```json
[
  {
    "id": 1,
    "mr_id": 1,
    "schedule_id": 1,
    "doctor_id": 1,
    "entity_type": "doctor",
    "entity_name": "Dr. Ramesh Sharma",
    "clinic": "Sharma Clinic",
    "tier": "A",
    "area": "Kukatpally",
    "phone": "+91 9876543210",
    "planned_time": "10:00",
    "purpose": "Product demo - CardiCare Plus",
    "priority": "high",
    "status": "planned",
    "days_since_last_visit": 5,
    "last_visit_date": "2025-04-03",
    "recommended_frequency": "weekly",
    "visit_outcome": null,
    "notes": ""
  }
]
```

### Create/Update Daily Call Plan
```http
POST /daily-call-plan
Content-Type: application/json

{
  "mr_id": 1,
  "schedule_id": 1,
  "entity_type": "doctor",
  "entity_name": "Dr. Ramesh Sharma",
  "planned_time": "10:00",
  "purpose": "Product demo",
  "priority": "high",
  "status": "planned"
}
```

### Complete Call Plan Item
```http
POST /daily-call-plan/:id/complete
Content-Type: application/json

{
  "outcome": {
    "check_in_time": "10:12",
    "check_out_time": "10:45",
    "speaking_time": 30,
    "products_detailed": "CardiCare Plus",
    "doctor_feedback": "Excellent product",
    "samples_given": "Yes",
    "order_value": 75000,
    "order_product": "CardiCare Plus",
    "next_followup": "2025-04-15",
    "conversation_summary": "Discussed benefits..."
  }
}
```

---

## Error Responses

All endpoints return standard HTTP status codes:

```json
{
  "error": "Error message",
  "details": { "field": "validation error" }
}
```

Common Status Codes:
- `200` - Success
- `201` - Created
- `204` - No Content (DELETE success)
- `400` - Bad Request (validation error)
- `404` - Not Found
- `500` - Server Error

---

## Rate Limiting

None in demo mode. Production should implement:
- 100 requests/minute per IP
- Exponential backoff on failures

---

## Data Validation

All POST/PATCH endpoints validate required fields server-side in `server.ts`. Missing required fields return `400 Bad Request`.

---

**End of API.md**
