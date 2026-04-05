# 🎤 Voice Commands for Adding Expenses

## How to Add an Expense with Voice

### Step-by-Step Guide

```
1. Click the 🎤 microphone button
2. Say one of these commands:
   • "Go to expenses"
   • "Navigate to expense manager"

3. Say: "Click add expense"
   (This opens the form modal)

4. Fill the form with voice:
   • "Fill description with sample delivery"
   • "Fill category with travel"  
   • "Fill amount with 5000"
   • "Fill date with today"    (or specific date)
   • "Fill mr with Ahmed Khan"  (select MR)

5. Say: "Submit"
   (This saves the expense)
```

## Real Examples You Can Try

### Quick Expense (Travel)
```
🎤 "Go to expenses"
🎤 "Click add expense"
🎤 "Fill description with taxi to clinic"
🎤 "Fill amount with 500"
🎤 "Fill category with travel"
🎤 "Submit"
```

### Sample Distribution Expense
```
🎤 "Navigate to expense manager"
🎤 "Click add expense button"
🎤 "Fill description with sample distribution at Apollo"
🎤 "Fill amount with 8500"
🎤 "Fill category with samples"
🎤 "Read forms"  (to verify all fields)
🎤 "Submit"
```

### Meal Expense
```
🎤 "Take me to expenses"
🎤 "Click add"
🎤 "Fill description with lunch with doctor rajesh"
🎤 "Set amount to 2000"
🎤 "Set category to meals"
🎤 "Submit"
```

## Form Fields & Voice Syntax

| Field | Voice Command Example |
|-------|----------------------|
| Description | "Fill description with sample delivery" |
| Category | "Fill category with travel" |
| Amount | "Fill amount with 5000" |
| Date | "Fill date with 2026-04-02" |
| MR | "Fill mr with Ahmed Khan" |

## Available Categories

When filling category, you can say:
- **Travel**
- **Meals**
- **Samples**
- **Accommodation**
- **Other**

## Helpful Voice Commands for Forms

| Command | Action |
|---------|--------|
| "Read forms" | Hear all form fields and current values |
| "Read page" | Get page summary |
| "Click add expense" | Open the add expense form |
| "Submit" | Submit the form |
| "Clear form" | Reset all fields |
| "Fill [field] with [value]" | Fill any form field |

## Troubleshooting Form Commands

### If "Fill description with..." doesn't work:
1. First say: "Read forms"
2. Listen to the field names available
3. Try exact spelling: "Fill description..." or "Fill expense description..."

### If form doesn't open with "Click add expense":
1. You must be on the Expenses page first
2. Say "Go to expenses" first
3. Then say "Click add expense"

### If amount isn't recognized:
- Say the number clearly: "Fill amount with five thousand"
- Or use exact format: "Fill amount with 5000"

### If date field fails:
- Use format YYYY-MM-DD: "Fill date with 2026-04-02"
- Or say: "Fill date with today"

## Complete Workflow Example

```
User: "Go to expenses"
→ Navigates to expense manager page

User: "Read page"
→ App speaks: "Expense Manager page. Key metrics: Total Pending: ₹42,500. Approved: ₹1,28,400"

User: "Click add expense"
→ Form modal opens

User: "Read forms"
→ App speaks: "Found form with 5 fields: Description, Category, Amount, Date, MR"

User: "Fill description with clinic visit sample"
→ Sets description field ✓

User: "Fill category with samples"
→ Sets category dropdown ✓

User: "Fill amount with 7500"
→ Sets amount field ✓

User: "Fill date with today"
→ Sets date to today ✓

User: "Read forms"
→ App reads back all entered values for verification

User: "Submit"
→ Form saves, modal closes, new expense appears in list!
```

## Form Fields Visible When Modal Opens

1. **Description** - Text input (required)
2. **Category** - Dropdown (required)
3. **Amount** - Number input (required)
4. **Date** - Date picker (required)
5. **MR** - Staff member dropdown (required)

## Voice Tips for Forms

1. **Speak clearly**: "Fill amount..." works better than "amount"
2. **Use natural language**: "set it to" or "put in" both work
3. **Verify before submitting**: Always say "Read forms" before "Submit"
4. **Wait for confirmation**: Voice should say "Set field = value" before continuing

## Auto-Detection Features

The voice system now:
- ✅ Detects form fields by name, label, and placeholder
- ✅ Handles multiple input types (text, number, dropdown, date)
- ✅ Triggers React state updates properly
- ✅ Provides feedback on success/failure
- ✅ Suggests available fields if not found

## Testing Checklist

- [ ] Navigate to expenses page via voice
- [ ] Click "Add Expense" button via voice
- [ ] Fill description field via voice
- [ ] Fill category dropdown via voice
- [ ] Fill amount via voice
- [ ] Read forms to verify values
- [ ] Submit form via voice
- [ ] See new expense appear in list

---

**Start with: "Go to expenses" → "Click add expense" → "Fill description with..." → "Submit"**
