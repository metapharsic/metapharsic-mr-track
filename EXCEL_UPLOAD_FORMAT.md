This is a guide for formatting your Excel file for upload to Metapharsic CRM.

# 📋 EXCEL UPLOAD FORMAT GUIDE

##  Sheet Names & Column Headers

### Sheet 1: "Doctors"
**Column Headers** (exactly as shown):
```
Name | Specialty | Clinic | Territory | Tier | Contact | Email | Total Visits | Total Orders | Total Value
```

**Example Data:**
```
Dr. Rajesh Kumar | Cardiology | Heart Care Clinic | Habsiguda | A | 9876543210 | rajesh@gmail.com | 15 | 8 | 50000
```

---

### Sheet 2: "Pharmacies"
**Column Headers** (exactly as shown):
```
Name | Owner | Type | City | Contact | Email | Address | Tier | Total Purchases
```

**Example Data:**
```
Sri Vasavi Medical Hall | Ramesh | Independent Medical Hall | Habsiguda | 9849665224 | vasavi@gmail.com | Near Whitus Hospitals, Habsiguda | A | 250000
```

---

### Sheet 3: "Hospitals"
**Column Headers** (exactly as shown):
```
Name | Type | City | Beds | Contact | Email | Address | Tier | Total Purchases
```

**Example Data:**
```
Whitus Hospital | Multi-Speciality | Habsiguda | 150 | 4012345678 | info@whitus.com | Habsiguda Main Road | A | 5000000
```

---

### Sheet 4: "MRs"
**Column Headers** (exactly as shown):
```
Name | Territory | Phone | Email | Base Salary | Daily Allowance | Performance Score | Total Sales | Targets Achieved | Targets Missed
```

**Example Data:**
```
Amit Sharma | Habsiguda | 9876512340 | amit@metapharsic.com | 35000 | 500 | 85 | 1500000 | 12 | 3
```

---

## 🔑 KEY COLUMN MAPPINGS

### For Pharmacies (Your Current Excel):
- "Shop Name" → **Name**
- "Full Address / Landmark" → **Address**
- "Contact Number" → **Contact** (remove +91 and spaces, e.g., "9849665224")
- "Area" → **City**
- "Type" → **Type** (keep as is)
- "Rating ★" → **NOT NEEDED** (removed)
- "Shop Hours" → **NOT NEEDED** (removed)
- "MR Visit Window" → **NOT NEEDED** (removed)
- "Discount / Notes" → **NOT NEEDED** (removed)
- Add **Owner** column (pharmacy owner name)
- Add **Tier** column (A, B, or C)
- Add **Total Purchases** column (monthly purchase value)

---

## 📝 TRANSFORMED PHARMACY EXAMPLE (from your data):

**Original Row:**
```
1 | Sri Vasavi Medical Hall | Near Whitus Hospitals, Habsiguda Main Rd | +91 98496 65224 | 8:30 AM – 11:30 PM | 4.8 | 10 AM–12 PM | Independent Medical Hall | Home Delivery ✓ | Habsiguda
```

**Transformed for Upload:**
```
Name: Sri Vasavi Medical Hall
Owner: (leave blank or add if known)
Type: Independent Medical Hall
City: Habsiguda
Contact: 9849665224
Email: (leave blank)
Address: Near Whitus Hospitals, Habsiguda Main Rd, Nagendra Nagar
Tier: A
Total Purchases: 250000
```

---

## ✅ READY-TO-USE TEMPLATE

Create an Excel file with these 4 sheets:
1. **Doctors** - 10 columns
2. **Pharmacies** - 9 columns  
3. **Hospitals** - 9 columns
4. **MRs** - 10 columns

**IMPORTANT:**
- First row MUST be column headers (exactly as shown above)
- Data starts from row 2
- Remove special characters (★, ✓, emojis)
- Phone numbers: remove "+91", spaces, dashes (use: 9849665224)
- Leave blank cells empty (don't use "—", "NA", etc.)
- Tier values: A, B, or C only

---

## 🚀 UPLOAD STEPS

1. Go to **Data Management** page
2. Click **Upload Excel File**
3. Select your formatted Excel file
4. System will automatically:
   - Classify each sheet
   - Route to correct database tables
   - Show classification summary
5. Data saved to PostgreSQL ✅

---

## 📊 YOUR CURRENT DATA (62 Pharmacies)

Based on your "Metapharsic_MedicalHalls_Directory.xlsx", I can help you transform it!

**Would you like me to:**
1. Create a script to automatically convert your existing Excel to the correct format?
2. Or provide a blank template you can manually fill?

Let me know which option you prefer! 🎯
