# 📋 METAPHARSIC CRM - EXCEL UPLOAD FORMAT (Based on Database Schema)

## 🎯 EXACT COLUMN FORMAT FOR EACH SHEET

**IMPORTANT:** Column names in Excel MUST match these exactly (case-sensitive)!

---

## 📊 Sheet 1: "Pharmacies"

### Required Columns (Row 1 - Headers):
```
Name | Owner | Type | Territory | Contact | Email | Address | Tier | Total Purchases
```

### Database Mapping:
| Excel Column | Database Column | Required | Example |
|--------------|-----------------|----------|---------|
| **Name** | name | ✅ Required | Sri Vasavi Medical Hall |
| **Owner** | owner_name | Optional | Ramesh Kumar |
| **Type** | business_type | Optional | Independent Medical Hall |
| **Territory** | territory | ✅ Required | Habsiguda |
| **Contact** | phone | Optional | 9849665224 |
| **Email** | email | Optional | vasavi@gmail.com |
| **Address** | address | Optional | Near Whitus Hospitals, Habsiguda Main Rd |
| **Tier** | tier | Optional (default: B) | A, B, or C |
| **Total Purchases** | total_purchases | Optional | 250000 |

### Example Row:
```
Sri Vasavi Medical Hall | Ramesh Kumar | Independent Medical Hall | Habsiguda | 9849665224 | vasavi@gmail.com | Near Whitus Hospitals, Habsiguda Main Rd, Nagendra Nagar | A | 250000
```

---

## 👨‍️ Sheet 2: "Doctors"

### Required Columns (Row 1 - Headers):
```
Name | Specialty | Clinic | Territory | Tier | Contact | Email | Address | Total Visits | Total Orders | Total Value
```

### Database Mapping:
| Excel Column | Database Column | Required | Example |
|--------------|-----------------|----------|---------|
| **Name** | name | ✅ Required | Dr. Rajesh Kumar |
| **Specialty** | specialty | Optional | Cardiology |
| **Clinic** | clinic | Optional | Heart Care Clinic |
| **Territory** | territory | ✅ Required | Habsiguda |
| **Tier** | tier | Optional (default: B) | A, B, or C |
| **Contact** | phone | Optional | 9876543210 |
| **Email** | email | Optional | rajesh@gmail.com |
| **Address** | address | Optional | Habsiguda Main Road |
| **Total Visits** | total_visits | Optional (default: 0) | 15 |
| **Total Orders** | total_orders | Optional (default: 0) | 8 |
| **Total Value** | total_value | Optional (default: 0) | 50000 |

### Example Row:
```
Dr. Rajesh Kumar | Cardiology | Heart Care Clinic | Habsiguda | A | 9876543210 | rajesh@gmail.com | Habsiguda Main Road | 15 | 8 | 50000
```

---

## 🏥 Sheet 3: "Hospitals"

### Required Columns (Row 1 - Headers):
```
Name | Type | Territory | Beds | Contact | Email | Address | Tier | Total Purchases
```

### Database Mapping:
| Excel Column | Database Column | Required | Example |
|--------------|-----------------|----------|---------|
| **Name** | name | ✅ Required | Whitus Hospital |
| **Type** | type | Optional | Multi-Speciality |
| **Territory** | territory | ✅ Required | Habsiguda |
| **Beds** | bed_count | Optional | 150 |
| **Contact** | phone | Optional | 4012345678 |
| **Email** | email | Optional | info@whitus.com |
| **Address** | address | Optional | Habsiguda Main Road |
| **Tier** | tier | Optional (default: B) | A, B, or C |
| **Total Purchases** | total_purchases | Optional (default: 0) | 5000000 |

### Example Row:
```
Whitus Hospital | Multi-Speciality | Habsiguda | 150 | 4012345678 | info@whitus.com | Habsiguda Main Road, Nagendra Nagar | A | 5000000
```

---

## 👔 Sheet 4: "MRs"

### Required Columns (Row 1 - Headers):
```
Name | Territory | Phone | Email | Base Salary | Daily Allowance | Performance Score | Total Sales | Targets Achieved | Targets Missed
```

### Database Mapping:
| Excel Column | Database Column | Required | Example |
|--------------|-----------------|----------|---------|
| **Name** | name | ✅ Required | Amit Sharma |
| **Territory** | territory | ✅ Required | Habsiguda |
| **Phone** | phone | Optional | 9876512340 |
| **Email** | email | Optional | amit@metapharsic.com |
| **Base Salary** | base_salary | Optional (default: 0) | 35000 |
| **Daily Allowance** | daily_allowance | Optional (default: 0) | 500 |
| **Performance Score** | performance_score | Optional (default: 75) | 85 |
| **Total Sales** | total_sales | Optional (default: 0) | 1500000 |
| **Targets Achieved** | targets_achieved | Optional (default: 0) | 12 |
| **Targets Missed** | targets_missed | Optional (default: 0) | 3 |

### Example Row:
```
Amit Sharma | Habsiguda | 9876512340 | amit@metapharsic.com | 35000 | 500 | 85 | 1500000 | 12 | 3
```

---

## 🔑 KEY RULES

### 1. **Required Fields**
- **Name** - Required for ALL entity types
- **Territory** - Required for ALL entity types (for data segregation)

### 2. **Territory Values**
Use exactly these values (case-sensitive):
- `Habsiguda`
- `Nacharam`
- `Uppal`
- `Mallapur`

### 3. **Tier Values**
Only use: **A**, **B**, or **C**
- **A** = High priority
- **B** = Medium priority (default)
- **C** = Low priority

### 4. **Phone Number Format**
- Remove "+91", spaces, dashes
- Example: `+91 98496 65224` → `9849665224`

### 5. **Numeric Fields**
- Leave blank or use 0 for unknown values
- Do NOT use "—", "NA", "N/A"

### 6. **Optional Fields**
- If you don't have data, leave the cell **empty**
- System will use default values

---

## ✅ YOUR PHARMACY DATA (60 Records)

From **Metapharsic_Ready_To_Upload.xlsx**, you already have:

| Column | Status |
|--------|--------|
| Name | ✅ Filled (60 pharmacies) |
| Owner | ⚠️ Empty (add manually if needed) |
| Type | ✅ Filled (Independent Medical Hall, Chain Pharmacy, etc.) |
| Territory | ✅ Filled (Habsiguda, Nacharam, Uppal, Mallapur) |
| Contact | ✅ Filled (cleaned phone numbers) |
| Email | ⚠️ Empty (add manually if needed) |
| Address | ✅ Filled (from your Excel) |
| Tier | ✅ Filled (A, B, or C based on rating) |
| Total Purchases | ✅ Filled (estimated based on tier) |

---

## 🚀 UPLOAD READY!

Your **Metapharsic_Ready_To_Upload.xlsx** file is ready to upload with:
- ✅ 60 Pharmacies with all required fields
- ✅ Territory column for data segregation
- ✅ Correct column headers matching database schema
- ✅ Empty sheets for Doctors, Hospitals, MRs (add data later)

**Upload now at: http://localhost:3000/data-management** 🎉
