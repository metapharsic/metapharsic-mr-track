# 📋 METAPHARSIC CRM - EXCEL UPLOAD TEMPLATE

## 🎯 REQUIRED FORMAT FOR ALL SHEETS

**IMPORTANT:** Every sheet MUST have a **Territory** column for proper data segregation!

---

## 📊 Sheet 1: "Pharmacies"

### Column Headers (Row 1):
```
Name | Owner | Type | Territory | Contact | Email | Address | Tier | Total Purchases
```

### Example Data:
```
Sri Vasavi Medical Hall | Ramesh Kumar | Independent Medical Hall | Habsiguda | 9849665224 | | Near Whitus Hospitals, Habsiguda Main Rd | A | 250000
Apollo Pharmacy - Habsiguda | | Chain Pharmacy (Apollo) | Habsiguda | 7947480017 | | Street No. 8, SS Nagar | A | 500000
Ankur Medicals | Suresh | Independent Medical Hall | Nacharam | 9959742442 | | Bapuji Nagar Main Rd, HMT Nagar | A | 300000
```

### Territory Values (from your data):
- **Habsiguda**
- **Nacharam**
- **Uppal**
- **Mallapur**

---

## 👨‍️ Sheet 2: "Doctors"

### Column Headers (Row 1):
```
Name | Specialty | Clinic | Territory | Tier | Contact | Email | Total Visits | Total Orders | Total Value
```

### Example Data:
```
Dr. Rajesh Kumar | Cardiology | Heart Care Clinic | Habsiguda | A | 9876543210 | rajesh@gmail.com | 15 | 8 | 50000
Dr. Priya Sharma | Orthopedics | Bone & Joint Hospital | Nacharam | A | 9876543211 | priya@gmail.com | 20 | 12 | 75000
Dr. Amit Patel | Pediatrics | Children's Clinic | Uppal | B | 9876543212 | amit@gmail.com | 10 | 5 | 30000
```

### Territory Values:
- **Habsiguda**
- **Nacharam**
- **Uppal**
- **Mallapur**

---

## 🏥 Sheet 3: "Hospitals"

### Column Headers (Row 1):
```
Name | Type | Territory | Beds | Contact | Email | Address | Tier | Total Purchases
```

### Example Data:
```
Whitus Hospital | Multi-Speciality | Habsiguda | 150 | 4012345678 | info@whitus.com | Habsiguda Main Road | A | 5000000
Sri Lakshmi Nursing Home | Nursing Home | Nacharam | 50 | 4012345679 | info@lakshmi.com | MBD Complex, HMT Nagar | B | 2000000
Innova Hospital | Multi-Speciality | Tarnaka | 200 | 4012345680 | info@innova.com | Main Road, Tarnaka | A | 8000000
```

### Territory Values:
- **Habsiguda**
- **Nacharam**
- **Uppal**
- **Mallapur**
- **Tarnaka** (if applicable)

---

## 👔 Sheet 4: "MRs"

### Column Headers (Row 1):
```
Name | Territory | Phone | Email | Base Salary | Daily Allowance | Performance Score | Total Sales | Targets Achieved | Targets Missed
```

### Example Data:
```
Amit Sharma | Habsiguda | 9876512340 | amit@metapharsic.com | 35000 | 500 | 85 | 1500000 | 12 | 3
Rajesh Verma | Nacharam | 9876512341 | rajesh@metapharsic.com | 32000 | 450 | 78 | 1200000 | 10 | 5
Priya Singh | Uppal | 9876512342 | priya@metapharsic.com | 30000 | 400 | 92 | 1800000 | 14 | 2
```

### Territory Values:
- **Habsiguda**
- **Nacharam**
- **Uppal**
- **Mallapur**

---

## 🔑 KEY POINTS FOR TERRITORY-BASED SEGREGATION

### 1. **Consistent Territory Names**
Use EXACTLY these territory names across all sheets:
- `Habsiguda`
- `Nacharam`
- `Uppal`
- `Mallapur`

**DO NOT use variations like:**
- ❌ "Habsiguda Area" (use: `Habsiguda`)
- ❌ "Nacharam Zone" (use: `Nacharam`)
- ❌ "Uppal Territory" (use: `Uppal`)

### 2. **Tier Values**
Only use: **A**, **B**, or **C**
- **A** = High priority (chain stores, high-rated, high volume)
- **B** = Medium priority (good rating, moderate volume)
- **C** = Low priority (small shops, new entities)

### 3. **Phone Number Format**
- Remove "+91", spaces, dashes
- Example: `+91 98496 65224` → `9849665224`

### 4. **Blank Cells**
- Leave empty cells blank
- Do NOT use: `—`, `NA`, `N/A`, `-`

---

## 📝 YOUR PHARMACY DATA MAPPING

From your **Metapharsic_MedicalHalls_Directory.xlsx**, here's how columns map:

| Your Excel Column | CRM Column | Notes |
|-------------------|------------|-------|
| Shop Name | Name | Direct copy |
| Full Address / Landmark | Address | Direct copy |
| Contact Number | Contact | Remove +91 and spaces |
| Area | Territory | **IMPORTANT:** This is your territory! |
| Type | Type | Direct copy |
| Rating ★ | (used for Tier calculation) | Not stored directly |
| Shop Hours | (not needed) | Skip |
| MR Visit Window | (not needed) | Skip |
| Discount / Notes | (not needed) | Skip |
| **Add manually:** Owner | Owner | Pharmacy owner name |
| **Add manually:** Email | Email | If available |
| **Add manually:** Tier | Tier | A, B, or C |
| **Add manually:** Total Purchases | Total Purchases | Monthly purchase value |

---

## ✅ UPLOAD CHECKLIST

Before uploading:
- [ ] All sheets have correct column headers (Row 1)
- [ ] Territory column exists in ALL sheets
- [ ] Territory values are consistent (Habsiguda, Nacharam, Uppal, Mallapur)
- [ ] Phone numbers are clean (no +91, spaces, dashes)
- [ ] Tier values are A, B, or C only
- [ ] No special characters (★, ✓, emojis)
- [ ] Blank cells are empty (not "—", "NA", etc.)
- [ ] File saved as .xlsx format

---

## 🚀 UPLOAD STEPS

1. Open the formatted Excel file
2. Go to **http://localhost:3000/data-management**
3. Click **"Upload Excel File"**
4. Select your file
5. System will:
   - ✅ Read all 4 sheets
   - ✅ Route each entity to correct database table
   - ✅ Use Territory for data segregation
   - ✅ Show classification summary
6. Data saved to PostgreSQL! 🎉

---

## 📊 SAMPLE TERRITORY BREAKDOWN

After upload, your data will be segregated like this:

**Habsiguda Territory:**
- 11 Pharmacies
- X Doctors
- X Hospitals
- X MRs

**Nacharam Territory:**
- 18 Pharmacies
- X Doctors
- X Hospitals
- X MRs

**Uppal Territory:**
- 22 Pharmacies
- X Doctors
- X Hospitals
- X MRs

**Mallapur Territory:**
- 11 Pharmacies
- X Doctors
- X Hospitals
- X MRs

---

**Ready to upload? Let me know if you need any help with the format!** 🚀
