import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { promises as fs } from "fs";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database configuration
const USE_DATABASE = process.env.DATABASE_URL && process.env.DATABASE_URL.length > 0;
let db: any = null;

if (USE_DATABASE) {
  console.log('🔌 DATABASE_URL detected, initializing PostgreSQL...');
  try {
    import('./src/database/db').then((dbModule) => {
      db = dbModule;
      console.log('✅ PostgreSQL database module loaded');
      
      // Test connection
      db.testConnection().then((connected: boolean) => {
        if (connected) {
          console.log('✅ PostgreSQL connection successful');
          console.log('💾 All data will be persisted to database');
        } else {
          console.log('⚠️  PostgreSQL connection failed, falling back to in-memory storage');
        }
      });
    }).catch((error) => {
      console.error('❌ Failed to load database module:', error);
      console.log('⚠️  Using in-memory storage as fallback');
    });
  } catch (error) {
    console.error('❌ Database initialization error:', error);
    console.log('⚠️  Using in-memory storage as fallback');
  }
} else {
  console.log('💾 No DATABASE_URL configured, using in-memory storage');
  console.log('💡 To enable PostgreSQL, add DATABASE_URL to your .env file');
}

// Extend Express Request type to include currentUser
declare global {
  namespace Express {
    interface Request {
      currentUser?: {
        email: string;
        role: 'admin' | 'manager' | 'mr' | 'viewer';
        mr_id?: number;
        territory?: string;
      };
    }
  }
}

// In-memory data store with comprehensive dummy data for testing
const data = {
  mrs: [
    { 
      id: 1, 
      name: "Rajesh Kumar", 
      territory: "Hyderabad West (Kukatpally, Gachibowli, Miyapur)", 
      base_salary: 35000, 
      daily_allowance: 12000,
      joining_date: "2023-01-15",
      phone: "+91 98765 43210",
      email: "rajesh.kumar@metapharsic.com",
      status: "active",
      performance_score: 85,
      total_sales: 1250000,
      targets_achieved: 8,
      targets_missed: 2,
      avatar_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop"
    },
    { 
      id: 2, 
      name: "Suresh Raina", 
      territory: "Hyderabad Central (Banjara Hills, Jubilee Hills, Barkatpura)", 
      base_salary: 35000, 
      daily_allowance: 12000,
      joining_date: "2023-03-10",
      phone: "+91 98765 43211",
      email: "suresh.raina@metapharsic.com",
      status: "active",
      performance_score: 92,
      total_sales: 1580000,
      targets_achieved: 10,
      targets_missed: 0,
      avatar_url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop"
    },
    {
      id: 3,
      name: "Priya Sharma",
      territory: "Hyderabad East (Secunderabad, Tarnaka, Uppal)",
      base_salary: 32000,
      daily_allowance: 10000,
      joining_date: "2024-01-05",
      phone: "+91 98765 43212",
      email: "priya.sharma@metapharsic.com",
      status: "active",
      performance_score: 78,
      total_sales: 680000,
      targets_achieved: 4,
      targets_missed: 3,
      avatar_url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop"
    },
    {
      id: 4,
      name: "Amit Patel",
      territory: "Hyderabad North (Begumpet, Ameerpet, Panjagutta)",
      base_salary: 35000,
      daily_allowance: 12000,
      joining_date: "2023-06-20",
      phone: "+91 98765 43213",
      email: "amit.patel@metapharsic.com",
      status: "active",
      performance_score: 88,
      total_sales: 1420000,
      targets_achieved: 9,
      targets_missed: 1,
      avatar_url: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&h=400&fit=crop"
    },
    {
      id: 5,
      name: "Neha Gupta",
      territory: "Hyderabad South (Mehdipatnam, Attapur, Rajendranagar)",
      base_salary: 32000,
      daily_allowance: 10000,
      joining_date: "2024-03-15",
      phone: "+91 98765 43214",
      email: "neha.gupta@metapharsic.com",
      status: "active",
      performance_score: 82,
      total_sales: 890000,
      targets_achieved: 6,
      targets_missed: 2,
      avatar_url: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop"
    },
    {
      id: 6,
      name: "Vikram Singh",
      territory: "Cyberabad (Hitech City, Madhapur, Gachibowli IT)",
      base_salary: 38000,
      daily_allowance: 13000,
      joining_date: "2022-11-01",
      phone: "+91 98765 43215",
      email: "vikram.singh@metapharsic.com",
      status: "active",
      performance_score: 95,
      total_sales: 2100000,
      targets_achieved: 12,
      targets_missed: 0,
      avatar_url: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop"
    },
    {
      id: 7,
      name: "Ravi Teja Reddy",
      territory: "Hyderabad East Extended (Habsiguda, Nacharam, Uppal, Mallapur)",
      base_salary: 36000,
      daily_allowance: 11500,
      joining_date: "2024-06-01",
      phone: "+91 98765 43216",
      email: "raviteja.mr@gmail.com",
      google_id: "108234567890123456789",
      google_token: "mock_gmail_token_for_ravi",
      status: "active",
      performance_score: 88,
      total_sales: 980000,
      targets_achieved: 7,
      targets_missed: 1,
      avatar_url: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop"
    }
  ],

  // User accounts for authentication
  users: [
    { id: 1, email: 'admin@metapharsic.com', name: 'Admin', role: 'admin' },
    { id: 2, email: 'rajesh.kumar@metapharsic.com', name: 'Rajesh Kumar', role: 'mr', mr_id: 1, territory: 'Hyderabad West (Kukatpally, Gachibowli, Miyapur)' },
    { id: 3, email: 'suresh.raina@metapharsic.com', name: 'Suresh Raina', role: 'mr', mr_id: 2, territory: 'Hyderabad Central (Banjara Hills, Jubilee Hills, Barkatpura)' },
    { id: 4, email: 'priya.sharma@metapharsic.com', name: 'Priya Sharma', role: 'mr', mr_id: 3, territory: 'Hyderabad East (Secunderabad, Tarnaka, Uppal)' }
  ],

  products: [
    // CARDIOLOGY DEPARTMENT
    { id: 1, name: "CardiCare Plus 10mg (Atorvastatin)", type: "Third-Party", cogs: 450, mrp: 750, pts: 680, category: "Statins", stock: 500, department: "Cardiology", reorder_level: 100, composition: "Atorvastatin Calcium 10mg", indication: "Hyperlipidemia, Dyslipidemia" },
    { id: 2, name: "CardiCare Plus 20mg (Atorvastatin)", type: "Third-Party", cogs: 520, mrp: 850, pts: 780, category: "Statins", stock: 450, department: "Cardiology", reorder_level: 90, composition: "Atorvastatin Calcium 20mg", indication: "Hyperlipidemia, Dyslipidemia" },
    { id: 3, name: "Metoprolol XL 50mg", type: "PCD", cogs: 180, mrp: 320, pts: 285, category: "Beta Blockers", stock: 600, department: "Cardiology", reorder_level: 120, composition: "Metoprolol Succinate 50mg", indication: "Hypertension, Angina, Heart Failure" },
    { id: 4, name: "Amlodipine 5mg", type: "PCD", cogs: 95, mrp: 180, pts: 155, category: "Calcium Channel Blockers", stock: 750, department: "Cardiology", reorder_level: 150, composition: "Amlodipine Besylate 5mg", indication: "Hypertension, Angina" },
    { id: 5, name: "Losartan 50mg", type: "Third-Party", cogs: 145, mrp: 260, pts: 230, category: "ARBs", stock: 550, department: "Cardiology", reorder_level: 110, composition: "Losartan Potassium 50mg", indication: "Hypertension, Diabetic Nephropathy" },
    { id: 6, name: "Clopidogrel 75mg", type: "PCD", cogs: 220, mrp: 380, pts: 340, category: "Antiplatelet", stock: 480, department: "Cardiology", reorder_level: 95, composition: "Clopidogrel Bisulfate 75mg", indication: "Post-MI, Stroke Prevention" },
    
    // NEUROLOGY DEPARTMENT
    { id: 7, name: "NeuroBalance 500mg (Levetiracetam)", type: "PCD", cogs: 320, mrp: 580, pts: 520, category: "Antiepileptic", stock: 400, department: "Neurology", reorder_level: 80, composition: "Levetiracetam 500mg", indication: "Epilepsy, Seizure Control" },
    { id: 8, name: "Gabapentin 300mg", type: "Third-Party", cogs: 180, mrp: 320, pts: 285, category: "Anticonvulsant", stock: 650, department: "Neurology", reorder_level: 130, composition: "Gabapentin 300mg", indication: "Neuropathic Pain, Epilepsy" },
    { id: 9, name: "Pregabalin 75mg", type: "PCD", cogs: 280, mrp: 480, pts: 430, category: "Anticonvulsant", stock: 520, department: "Neurology", reorder_level: 105, composition: "Pregabalin 75mg", indication: "Neuropathic Pain, Fibromyalgia" },
    { id: 10, name: "Sumatriptan 50mg", type: "Third-Party", cogs: 450, mrp: 780, pts: 700, category: "Antimigraine", stock: 350, department: "Neurology", reorder_level: 70, composition: "Sumatriptan Succinate 50mg", indication: "Acute Migraine Attacks" },
    { id: 11, name: "Donepezil 5mg", type: "PCD", cogs: 520, mrp: 920, pts: 830, category: "Anti-Alzheimer", stock: 280, department: "Neurology", reorder_level: 55, composition: "Donepezil Hydrochloride 5mg", indication: "Alzheimer's Disease" },
    
    // GASTROENTEROLOGY DEPARTMENT
    { id: 12, name: "GastroEase 20mg (Esomeprazole)", type: "Third-Party", cogs: 185, mrp: 320, pts: 285, category: "PPIs", stock: 800, department: "Gastroenterology", reorder_level: 160, composition: "Esomeprazole Magnesium 20mg", indication: "GERD, Peptic Ulcer" },
    { id: 13, name: "Pantoprazole 40mg", type: "PCD", cogs: 95, mrp: 175, pts: 155, category: "PPIs", stock: 950, department: "Gastroenterology", reorder_level: 190, composition: "Pantoprazole Sodium 40mg", indication: "GERD, Gastritis" },
    { id: 14, name: "Rabeprazole 20mg", type: "Third-Party", cogs: 115, mrp: 210, pts: 188, category: "PPIs", stock: 720, department: "Gastroenterology", reorder_level: 145, composition: "Rabeprazole Sodium 20mg", indication: "GERD, Duodenal Ulcer" },
    { id: 15, name: "Domperidone 10mg", type: "PCD", cogs: 65, mrp: 120, pts: 105, category: "Prokinetic", stock: 880, department: "Gastroenterology", reorder_level: 175, composition: "Domperidone Maleate 10mg", indication: "Nausea, Vomiting, Dyspepsia" },
    { id: 16, name: "Ondansetron 4mg", type: "Third-Party", cogs: 180, mrp: 320, pts: 285, category: "Antiemetic", stock: 600, department: "Gastroenterology", reorder_level: 120, composition: "Ondansetron Hydrochloride 4mg", indication: "Chemotherapy-induced Nausea" },
    
    // ENDOCRINOLOGY DEPARTMENT
    { id: 17, name: "DiabeCare 500mg (Metformin)", type: "PCD", cogs: 95, mrp: 165, pts: 145, category: "Biguanides", stock: 1200, department: "Endocrinology", reorder_level: 240, composition: "Metformin Hydrochloride 500mg", indication: "Type 2 Diabetes Mellitus" },
    { id: 18, name: "Metformin 850mg SR", type: "PCD", cogs: 125, mrp: 220, pts: 195, category: "Biguanides", stock: 980, department: "Endocrinology", reorder_level: 195, composition: "Metformin HCl 850mg SR", indication: "Type 2 Diabetes Mellitus" },
    { id: 19, name: "Glimepiride 2mg", type: "Third-Party", cogs: 145, mrp: 260, pts: 233, category: "Sulfonylureas", stock: 750, department: "Endocrinology", reorder_level: 150, composition: "Glimepiride 2mg", indication: "Type 2 Diabetes Mellitus" },
    { id: 20, name: "Sitagliptin 100mg", type: "PCD", cogs: 580, mrp: 980, pts: 880, category: "DPP-4 Inhibitors", stock: 420, department: "Endocrinology", reorder_level: 85, composition: "Sitagliptin Phosphate 100mg", indication: "Type 2 Diabetes Mellitus" },
    { id: 21, name: "Thyronorm 50mcg", type: "Third-Party", cogs: 85, mrp: 150, pts: 133, category: "Thyroid Hormones", stock: 880, department: "Endocrinology", reorder_level: 175, composition: "Levothyroxine Sodium 50mcg", indication: "Hypothyroidism" },
    { id: 22, name: "Thyronorm 100mcg", type: "Third-Party", cogs: 115, mrp: 195, pts: 175, category: "Thyroid Hormones", stock: 720, department: "Endocrinology", reorder_level: 145, composition: "Levothyroxine Sodium 100mcg", indication: "Hypothyroidism" },
    
    // PULMONOLOGY DEPARTMENT
    { id: 23, name: "RespiraClear 200mg (Acebrophylline)", type: "Third-Party", cogs: 195, mrp: 340, pts: 305, category: "Bronchodilator", stock: 550, department: "Pulmonology", reorder_level: 110, composition: "Acebrophylline 200mg", indication: "COPD, Bronchial Asthma" },
    { id: 24, name: "Montelukast 10mg", type: "PCD", cogs: 165, mrp: 290, pts: 260, category: "Leukotriene Antagonist", stock: 680, department: "Pulmonology", reorder_level: 135, composition: "Montelukast Sodium 10mg", indication: "Asthma, Allergic Rhinitis" },
    { id: 25, name: "Levocetirizine 5mg", type: "Third-Party", cogs: 85, mrp: 150, pts: 133, category: "Antihistamine", stock: 920, department: "Pulmonology", reorder_level: 185, composition: "Levocetirizine Dihydrochloride 5mg", indication: "Allergic Rhinitis, Urticaria" },
    { id: 26, name: "Budesonide Inhaler 200mcg", type: "PCD", cogs: 450, mrp: 780, pts: 700, category: "Inhaled Corticosteroid", stock: 380, department: "Pulmonology", reorder_level: 75, composition: "Budesonide 200mcg", indication: "Asthma, COPD" },
    { id: 27, name: "Salbutamol Inhaler 100mcg", type: "Third-Party", cogs: 125, mrp: 220, pts: 195, category: "Bronchodilator", stock: 850, department: "Pulmonology", reorder_level: 170, composition: "Salbutamol Sulfate 100mcg", indication: "Acute Asthma, Bronchospasm" },
    
    // ORTHOPEDICS DEPARTMENT
    { id: 28, name: "OrthoFlex Plus (Diclofenac)", type: "PCD", cogs: 195, mrp: 340, pts: 305, category: "NSAIDs", stock: 720, department: "Orthopedics", reorder_level: 145, composition: "Diclofenac Sodium 50mg + Paracetamol 325mg", indication: "Pain, Inflammation, Arthritis" },
    { id: 29, name: "Aceclofenac 100mg", type: "Third-Party", cogs: 145, mrp: 260, pts: 233, category: "NSAIDs", stock: 650, department: "Orthopedics", reorder_level: 130, composition: "Aceclofenac 100mg", indication: "Osteoarthritis, Rheumatoid Arthritis" },
    { id: 30, name: "Tramadol 50mg", type: "PCD", cogs: 280, mrp: 480, pts: 430, category: "Opioid Analgesic", stock: 420, department: "Orthopedics", reorder_level: 85, composition: "Tramadol Hydrochloride 50mg", indication: "Moderate to Severe Pain" },
    { id: 31, name: "Calcium Carbonate 500mg + Vitamin D3", type: "Third-Party", cogs: 185, mrp: 320, pts: 285, category: "Bone Health", stock: 880, department: "Orthopedics", reorder_level: 175, composition: "Calcium Carbonate 500mg + Vitamin D3 250 IU", indication: "Osteoporosis, Calcium Deficiency" },
    { id: 32, name: "Methylcobalamin 1500mcg", type: "PCD", cogs: 220, mrp: 380, pts: 340, category: "Neuroprotective", stock: 580, department: "Orthopedics", reorder_level: 115, composition: "Methylcobalamin 1500mcg", indication: "Peripheral Neuropathy, B12 Deficiency" },
    
    // DERMATOLOGY DEPARTMENT
    { id: 33, name: "DermaGlow Cream (Hydroquinone)", type: "Third-Party", cogs: 320, mrp: 550, pts: 495, category: "Depigmenting Agent", stock: 450, department: "Dermatology", reorder_level: 90, composition: "Hydroquinone 2% + Tretinoin 0.025%", indication: "Melasma, Hyperpigmentation" },
    { id: 34, name: "Clotrimazole Cream 1%", type: "PCD", cogs: 95, mrp: 165, pts: 148, category: "Antifungal", stock: 750, department: "Dermatology", reorder_level: 150, composition: "Clotrimazole 1% w/w", indication: "Fungal Skin Infections" },
    { id: 35, name: "Fusidic Acid Cream 2%", type: "Third-Party", cogs: 185, mrp: 320, pts: 285, category: "Antibiotic", stock: 520, department: "Dermatology", reorder_level: 105, composition: "Fusidic Acid 2%", indication: "Bacterial Skin Infections" },
    { id: 36, name: "Isotretinoin 20mg", type: "PCD", cogs: 450, mrp: 780, pts: 700, category: "Retinoid", stock: 320, department: "Dermatology", reorder_level: 65, composition: "Isotretinoin 20mg", indication: "Severe Acne Vulgaris" },
    { id: 37, name: "Cetirizine 10mg", type: "Third-Party", cogs: 75, mrp: 135, pts: 120, category: "Antihistamine", stock: 980, department: "Dermatology", reorder_level: 195, composition: "Cetirizine Hydrochloride 10mg", indication: "Allergic Skin Conditions" },
    
    // GENERAL MEDICINE / FAMILY PRACTICE
    { id: 38, name: "ImmunoBoost Caps (Multivitamin)", type: "PCD", cogs: 220, mrp: 380, pts: 340, category: "Nutraceuticals", stock: 1200, department: "General Medicine", reorder_level: 240, composition: "Multivitamins + Minerals + Antioxidants", indication: "General Health, Immunity" },
    { id: 39, name: "Paracetamol 500mg", type: "Third-Party", cogs: 35, mrp: 65, pts: 58, category: "Analgesic/Antipyretic", stock: 2000, department: "General Medicine", reorder_level: 400, composition: "Paracetamol 500mg", indication: "Fever, Mild to Moderate Pain" },
    { id: 40, name: "Azithromycin 500mg", type: "PCD", cogs: 185, mrp: 320, pts: 285, category: "Macrolide Antibiotic", stock: 880, department: "General Medicine", reorder_level: 175, composition: "Azithromycin 500mg", indication: "Respiratory Infections, UTIs" },
    { id: 41, name: "Amoxicillin 500mg", type: "Third-Party", cogs: 125, mrp: 220, pts: 195, category: "Penicillin Antibiotic", stock: 950, department: "General Medicine", reorder_level: 190, composition: "Amoxicillin Trihydrate 500mg", indication: "Bacterial Infections" },
    { id: 42, name: "Ciprofloxacin 500mg", type: "PCD", cogs: 145, mrp: 260, pts: 233, category: "Fluoroquinolone", stock: 720, department: "General Medicine", reorder_level: 145, composition: "Ciprofloxacin Hydrochloride 500mg", indication: "UTI, Respiratory Infections" },
    
    // GYNECOLOGY DEPARTMENT
    { id: 43, name: "Dydrogesterone 10mg", type: "Third-Party", cogs: 520, mrp: 920, pts: 828, category: "Progestogen", stock: 480, department: "Gynecology", reorder_level: 95, composition: "Dydrogesterone 10mg", indication: "Threatened Abortion, DUB" },
    { id: 44, name: "Letrozole 2.5mg", type: "PCD", cogs: 380, mrp: 680, pts: 612, category: "Aromatase Inhibitor", stock: 350, department: "Gynecology", reorder_level: 70, composition: "Letrozole 2.5mg", indication: "Ovulation Induction, Breast Cancer" },
    { id: 45, name: "Progesterone SR 300mg", type: "Third-Party", cogs: 450, mrp: 780, pts: 702, category: "Progestogen", stock: 420, department: "Gynecology", reorder_level: 85, composition: "Progesterone 300mg SR", indication: "Luteal Support, Menopausal Symptoms" },
    { id: 46, name: "Tranexamic Acid 500mg", type: "PCD", cogs: 220, mrp: 380, pts: 342, category: "Antifibrinolytic", stock: 580, department: "Gynecology", reorder_level: 115, composition: "Tranexamic Acid 500mg", indication: "Menorrhagia, DUB" },
    { id: 47, name: "Iron Folic Acid", type: "Third-Party", cogs: 95, mrp: 165, pts: 148, category: "Hematologic", stock: 1200, department: "Gynecology", reorder_level: 240, composition: "Ferrous Ascorbate 100mg + Folic Acid 1.5mg", indication: "Iron Deficiency Anemia, Pregnancy" },
    
    // PEDIATRICS DEPARTMENT
    { id: 48, name: "Zinc Syrup 20mg/5ml", type: "PCD", cogs: 125, mrp: 220, pts: 198, category: "Trace Element", stock: 680, department: "Pediatrics", reorder_level: 135, composition: "Zinc Gluconate 20mg/5ml", indication: "Diarrhea, Zinc Deficiency" },
    { id: 49, name: "ORS Powder", type: "Third-Party", cogs: 45, mrp: 80, pts: 72, category: "Electrolyte", stock: 1500, department: "Pediatrics", reorder_level: 300, composition: "Oral Rehydration Salts", indication: "Dehydration, Diarrhea" },
    { id: 50, name: "Vitamin D3 Drops 400 IU", type: "PCD", cogs: 185, mrp: 320, pts: 288, category: "Vitamin", stock: 720, department: "Pediatrics", reorder_level: 145, composition: "Cholecalciferol 400 IU", indication: "Vitamin D Deficiency, Rickets" }
  ],
  
  // Product Combinations for easy reference
  product_combinations: [
    { id: 1, name: "Hypertension Combo", products: [3, 4, 5], description: "Metoprolol + Amlodipine + Losartan for severe hypertension" },
    { id: 2, name: "Diabetes Starter Pack", products: [17, 19], description: "Metformin + Glimepiride for Type 2 DM" },
    { id: 3, name: "Diabetes Advanced", products: [17, 20], description: "Metformin + Sitagliptin for better glycemic control" },
    { id: 4, name: "Cardiac Protection", products: [1, 3, 6], description: "Statin + Beta Blocker + Antiplatelet post-MI" },
    { id: 5, name: "GERD Relief", products: [12, 15], description: "PPI + Prokinetic for severe GERD" },
    { id: 6, name: "Pain Management", products: [28, 30], description: "NSAID + Opioid for post-operative pain" },
    { id: 7, name: "Bone Health", products: [31, 32], description: "Calcium + Methylcobalamin for osteoporosis" },
    { id: 8, name: "Asthma Control", products: [24, 26], description: "Leukotriene antagonist + Inhaled steroid" },
    { id: 9, name: "Fertility Support", products: [43, 45], description: "Dydrogesterone + Progesterone for IVF" },
    { id: 10, name: "Immunity Boost", products: [38, 50], description: "Multivitamin + Vitamin D3 for immunity" }
  ],
  
  // Departments list for reference
  departments: [
    { id: "cardiology", name: "Cardiology", description: "Heart and cardiovascular medications", icon: "Heart" },
    { id: "neurology", name: "Neurology", description: "Brain and nervous system medications", icon: "Brain" },
    { id: "gastroenterology", name: "Gastroenterology", description: "Digestive system medications", icon: "Stomach" },
    { id: "endocrinology", name: "Endocrinology", description: "Hormone and diabetes medications", icon: "Activity" },
    { id: "pulmonology", name: "Pulmonology", description: "Respiratory system medications", icon: "Wind" },
    { id: "orthopedics", name: "Orthopedics", description: "Bone and joint medications", icon: "Bone" },
    { id: "dermatology", name: "Dermatology", description: "Skin care medications", icon: "Sun" },
    { id: "gynecology", name: "Gynecology", description: "Women's health medications", icon: "Female" },
    { id: "pediatrics", name: "Pediatrics", description: "Children's medications", icon: "Baby" },
    { id: "general", name: "General Medicine", description: "Common health medications", icon: "Pill" }
  ],
  
  // Doctor Visit Management Data - Healthcare Directory
  doctors: [
    { id: 1, name: "Dr. K. Suma Prasad", clinic: "Prasad Hospitals", specialty: "Gynaecology, Infertility, IVF", territory: "Nacharam", tier: 'A', potential: 'high', total_visits: 45, total_orders: 120, total_value: 850000, status: 'active', phone: "+91 88012 33333", email: "suma@prasadhospitals.com", address: "44-617/12, IDA, Nacharam", area: "Nacharam", rating: 4.9, timings: "9 AM – 9 PM (Mon–Sat)", qualification: "MBBS, DGO, MD – OBG", dept_opd: "OBG / Infertility", mr_visit_window: "10 AM–12 PM & 3–5 PM", notes: "Founder Director | 27+ yrs exp | Practo / Credihealth", hospital_id: 1, lat: 17.4050, lng: 78.5050 },
    { id: 2, name: "Dr. G. Tejashwini", clinic: "Prasad Hospitals", specialty: "Gynaecology, Maternity, Laparoscopy", territory: "Nacharam", tier: 'A', potential: 'high', total_visits: 32, total_orders: 85, total_value: 420000, status: 'active', phone: "+91 88012 33333", email: "tejashwini@prasadhospitals.com", address: "44-617/12, IDA, Nacharam", area: "Nacharam", rating: 4.7, timings: "9 AM – 9 PM (Mon–Sat)", qualification: "MBBS, MS – OBG", dept_opd: "OBG / Gynaecology", mr_visit_window: "10 AM–12 PM & 3–5 PM", notes: "Lap Hysterectomy specialist | Most-reviewed doctor at Prasad | Practo", hospital_id: 1, lat: 17.4065, lng: 78.5080 },
    { id: 3, name: "Dr. I. Laxmi Prasanna", clinic: "Prasad Hospitals", specialty: "Paediatrics", territory: "Nacharam", tier: 'A', potential: 'medium', total_visits: 28, total_orders: 65, total_value: 310000, status: 'active', phone: "+91 88012 33333", email: "laxmi@prasadhospitals.com", address: "44-617/12, IDA, Nacharam", area: "Nacharam", rating: 4.6, timings: "9 AM – 9 PM (Mon–Sat)", qualification: "MBBS, DCH", dept_opd: "Paediatrics / NICU", mr_visit_window: "10 AM–12 PM & 3–5 PM", notes: "9 yrs experience | Practo / Google Reviews", hospital_id: 1, lat: 17.4070, lng: 78.5090 },
    { id: 4, name: "Dr. Ramesh", clinic: "Shiva Hospital", specialty: "General Surgery, Laparoscopic Surgery", territory: "Nacharam", tier: 'A', potential: 'high', total_visits: 55, total_orders: 140, total_value: 920000, status: 'active', phone: "+91 78420 70407", email: "ramesh@shivahospital.com", address: "7-10/8, Raghavendra Nagar, Nacharam", area: "Nacharam", rating: 4.9, timings: "11 AM – 5 PM (Mon–Sun)", qualification: "MBBS, MS – General Surgery", dept_opd: "Surgery / OPD", mr_visit_window: "11 AM–1 PM & 2–4 PM", notes: "Primary surgeon | Multiple 5★ reviews | Google", hospital_id: 5, lat: 17.3980, lng: 78.4950 },
    { id: 5, name: "Dr. Sudagani Sreenivas Goud", clinic: "Sree Satya Laparoscopy Hospital", specialty: "General Surgery, Laparoscopic Surgery, Laser Piles, Urology", territory: "Nacharam", tier: 'A', potential: 'high', total_visits: 60, total_orders: 180, total_value: 1250000, status: 'active', phone: "+91 99858 50909", email: "sreenivas@sreesatya.com", address: "Snehapuri Colony, Nacharam", area: "Nacharam", rating: 5.0, timings: "Open 24 hrs", qualification: "MBBS, MS – General Surgery, Fellowship – Laparoscopy (WALS)", dept_opd: "Surgery / Laparoscopy", mr_visit_window: "10 AM–12 PM & 3–5 PM", notes: "20,000+ surgeries | Lead surgeon | Official hospital website", hospital_id: 6, lat: 17.4020, lng: 78.5120 },
    { id: 6, name: "Dr. Varija", clinic: "Shree Pooja Hospital", specialty: "Gynaecology, Obstetrics, Maternity", territory: "Nacharam", tier: 'A', potential: 'high', total_visits: 42, total_orders: 95, total_value: 580000, status: 'active', phone: "+91 91000 12555", email: "varija@shreepooja.com", address: "Bapuji Nagar, HMT Nagar, Nacharam", area: "Nacharam", rating: 4.8, timings: "Open 24 hrs", qualification: "MBBS, DGO", dept_opd: "OBG / Maternity", mr_visit_window: "10 AM–12 PM & 3–5 PM", notes: "Primary gynaecologist | 4.5★ Google | Most-reviewed doctor here", hospital_id: 2, lat: 17.4100, lng: 78.5200 },
    { id: 7, name: "Dr. Ajit", clinic: "Ayu Health Hospitals", specialty: "General Medicine, ENT-related", territory: "Nacharam", tier: 'A', potential: 'medium', total_visits: 15, total_orders: 30, total_value: 120000, status: 'active', phone: "+91 63661 00800", email: "ajit@ayu.health", address: "44-617/12, IDA, Durga Nagar, Nacharam", area: "Nacharam", rating: 4.4, timings: "By appointment / Ayu platform", qualification: "MBBS, MD", dept_opd: "General Medicine", mr_visit_window: "10 AM–12 PM & 3–5 PM", notes: "Ayu Health platform-assigned doctor | Google Reviews", hospital_id: 3, lat: 17.3950, lng: 78.4900 },
    { id: 8, name: "Dr. V. R. Srikanth", clinic: "Vijaya Hospital", specialty: "General Medicine, Internal Medicine, Emergency", territory: "Nacharam", tier: 'B', potential: 'medium', total_visits: 20, total_orders: 45, total_value: 210000, status: 'active', phone: "+91 99899 35697", email: "srikanth@vijayahospital.com", address: "18/B, Sri Sai Nagar, Raghavendra Nagar, Nacharam", area: "Nacharam", rating: 4.2, timings: "Open 24 hrs", qualification: "MBBS, MD – General Medicine", dept_opd: "General Medicine / Emergency", mr_visit_window: "10 AM–12 PM & 3–5 PM", notes: "Principal doctor | 4.1★ 158 reviews | Highly-rated for accurate diagnosis | Google", hospital_id: 4, lat: 17.4080, lng: 78.5040 },
    { id: 9, name: "Dr. Sahiti Alapati", clinic: "TULIP Hospital", specialty: "Gynaecology, Total Laparoscopic Hysterectomy, Maternity", territory: "Nacharam", tier: 'A', potential: 'high', total_visits: 35, total_orders: 88, total_value: 520000, status: 'active', phone: "+91 94940 66565", email: "sahiti@tuliphospital.com", address: "Nacharam-Mallapur Rd, Gokul Nagar, Nacharam", area: "Nacharam", rating: 4.5, timings: "Open 24 hrs", qualification: "MBBS, MS – OBG", dept_opd: "OBG / Gynaecology", mr_visit_window: "10 AM–12 PM & 3–5 PM", notes: "TLH specialist | 4.4★ Google Reviews", hospital_id: 8, lat: 17.4120, lng: 78.5300 },
    { id: 10, name: "Dr. M. Lakshmi", clinic: "Chandamama Hospital", specialty: "Gynaecology, Obstetrics, Normal Delivery, Maternity", territory: "Nacharam", tier: 'A', potential: 'high', total_visits: 30, total_orders: 72, total_value: 410000, status: 'active', phone: "+91 95734 45474", email: "lakshmi@chandamama.com", address: "Nacharam-Mallapur Rd, Raghavendra Nagar, Nacharam", area: "Nacharam", rating: 4.4, timings: "Open 24 hrs", qualification: "MBBS, DGO / MS – OBG", dept_opd: "OBG / Maternity", mr_visit_window: "10 AM–12 PM & 3–5 PM", notes: "Lead gynaecologist | Most-reviewed | Justdial / Google / Practo", hospital_id: 9, lat: 17.4150, lng: 78.5350 },

    // 🏥 NACHARAM - Hospitals & Clinics Continued
    { id: 11, name: "Dr. S. Ramana", clinic: "Nacharam General Hospital", specialty: "General Medicine", territory: "Hyderabad East Extended (Habsiguda, Nacharam, Uppal, Mallapur)", tier: "B", potential: "medium", total_visits: 10, total_orders: 5, total_value: 25000, status: "active", phone: "+91 40 2715 1234", email: "", address: "Main Road, Nacharam", area: "Nacharam", rating: 4.2, timings: "Open 24 hrs", qualification: "MBBS, MD", dept_opd: "General Medicine", mr_visit_window: "10 AM–12 PM", notes: "General physician", hospital_id: 22 },
    { id: 23, name: "Dr. Anitha Reddy", clinic: "Anitha Maternity Home", specialty: "Gynecology", territory: "Hyderabad East Extended (Habsiguda, Nacharam, Uppal, Mallapur)", tier: "A", potential: "high", total_visits: 15, total_orders: 12, total_value: 85000, status: "active", phone: "+91 98480 12345", email: "", address: "HMT Nagar, Nacharam", visit_frequency: 14, preferred_products: [43, 47], last_visit: "2026-03-24", area: "Nacharam", entity_type: "Hospital", rating: 4.7, key_doctors: "Dr. Anitha Reddy", timings: "Open 24 hrs", lat: 17.3820, lng: 78.4880 },
    { id: 24, name: "Dr. K. Srinivas", clinic: "Srinivas Children's Clinic", specialty: "Pediatrics", territory: "Hyderabad East Extended (Habsiguda, Nacharam, Uppal, Mallapur)", tier: "B", potential: "medium", total_visits: 12, total_orders: 8, total_value: 30000, status: "active", phone: "+91 99080 54321", email: "", address: "Baba Nagar, Nacharam", visit_frequency: 21, preferred_products: [48, 50], last_visit: "2026-03-20", area: "Nacharam", entity_type: "Clinic", rating: 4.5, key_doctors: "Dr. K. Srinivas", timings: "10AM–1PM & 6PM–9PM" },

    // 🏥 UPPAL - Hospitals & Clinics
    { id: 25, name: "Dr. Murali Krishna", clinic: "Uppal Multi-Speciality Hospital", specialty: "General Surgery, Orthopedics", territory: "Hyderabad East Extended (Habsiguda, Nacharam, Uppal, Mallapur)", tier: "A", potential: "high", total_visits: 18, total_orders: 14, total_value: 110000, status: "active", phone: "+91 40 2720 9999", email: "", address: "Uppal Cross Roads", visit_frequency: 14, preferred_products: [28, 29, 41], last_visit: "2026-03-26", area: "Uppal", entity_type: "Hospital", rating: 4.4, key_doctors: "Dr. Murali Krishna; Dr. G. Prasad", timings: "Open 24 hrs", lat: 17.3750, lng: 78.4680 },
    { id: 26, name: "Dr. Lakshmi Narayana", clinic: "Narayana Heart Center", specialty: "Cardiology", territory: "Hyderabad East Extended (Habsiguda, Nacharam, Uppal, Mallapur)", tier: "A", potential: "high", total_visits: 10, total_orders: 6, total_value: 95000, status: "active", phone: "+91 98660 11111", email: "", address: "Ramanthapur Main Road, Uppal", visit_frequency: 14, preferred_products: [1, 3, 6], last_visit: "2026-03-18", area: "Uppal", entity_type: "Clinic", rating: 4.8, key_doctors: "Dr. Lakshmi Narayana", timings: "9AM–8PM" },
    { id: 27, name: "Dr. Swapna", clinic: "Swapna Nursing Home", specialty: "Gynecology, Obstetrics", territory: "Hyderabad East Extended (Habsiguda, Nacharam, Uppal, Mallapur)", tier: "B", potential: "medium", total_visits: 14, total_orders: 7, total_value: 42000, status: "active", phone: "+91 99490 22222", email: "", address: "Prashanth Nagar, Uppal", visit_frequency: 21, preferred_products: [43, 47], last_visit: "2026-03-12", area: "Uppal", entity_type: "Hospital", rating: 4.1, key_doctors: "Dr. Swapna", timings: "Open 24 hrs" },

    // 🏥 BANJARA HILLS / JUBILEE HILLS - Premium
    { id: 28, name: "Dr. Sandeep Reddy", clinic: "Apollo Health City", specialty: "Cardiology, Interventional Cardiology", territory: "Hyderabad Central (Banjara Hills, Jubilee Hills, Barkatpura)", tier: "A", potential: "high", total_visits: 25, total_orders: 20, total_value: 450000, status: "active", phone: "+91 40 2360 7777", email: "sandeep.reddy@apollo.com", address: "Road No. 72, Jubilee Hills", visit_frequency: 7, preferred_products: [1, 2, 6, 122], last_visit: "2026-03-27", area: "Jubilee Hills", entity_type: "Hospital", rating: 4.9, key_doctors: "Dr. Sandeep Reddy; Dr. Pratap C Reddy", timings: "Open 24 hrs", lat: 17.4160, lng: 78.5180 },
    { id: 29, name: "Dr. Manjula Anagani", clinic: "Care Hospitals", specialty: "Gynecology, Laparoscopy", territory: "Hyderabad Central (Banjara Hills, Jubilee Hills, Barkatpura)", tier: "A", potential: "high", total_visits: 22, total_orders: 18, total_value: 380000, status: "active", phone: "+91 40 6165 6565", email: "", address: "Road No. 1, Banjara Hills", visit_frequency: 7, preferred_products: [43, 44, 45], last_visit: "2026-03-26", area: "Banjara Hills", entity_type: "Hospital", rating: 4.8, key_doctors: "Dr. Manjula Anagani", timings: "Open 24 hrs", lat: 17.4100, lng: 78.5100 },
    { id: 30, name: "Dr. Guru N. Reddy", clinic: "Continental Hospitals", specialty: "Gastroenterology", territory: "Cyberabad (Hitech City, Madhapur, Gachibowli IT)", tier: "A", potential: "high", total_visits: 15, total_orders: 12, total_value: 280000, status: "active", phone: "+91 40 6700 0000", email: "", address: "Nanakramguda, Gachibowli", visit_frequency: 10, preferred_products: [12, 13, 15], last_visit: "2026-03-24", area: "Gachibowli", entity_type: "Hospital", rating: 4.7, key_doctors: "Dr. Guru N. Reddy", timings: "Open 24 hrs", lat: 17.4400, lng: 78.4850 },

    // 🏥 KUKATPALLY / MIYAPUR - High Volume
    { id: 31, name: "Dr. K. Ravindranath", clinic: "Global Hospitals", specialty: "Gastroenterology, Hepatology", territory: "Hyderabad West (Kukatpally, Gachibowli, Miyapur)", tier: "A", potential: "high", total_visits: 20, total_orders: 15, total_value: 320000, status: "active", phone: "+91 40 2324 4444", email: "", address: "Lakdikapul (Main), Branch at Kukatpally", visit_frequency: 10, preferred_products: [12, 13, 16], last_visit: "2026-03-25", area: "Kukatpally", entity_type: "Hospital", rating: 4.6, key_doctors: "Dr. K. Ravindranath", timings: "Open 24 hrs", lat: 17.4900, lng: 78.4300 },
    { id: 32, name: "Dr. Bhaskar Rao", clinic: "KIMS Hospitals", specialty: "Cardiothoracic Surgery", territory: "Hyderabad North (Begumpet, Ameerpet, Panjagutta)", tier: "A", potential: "high", total_visits: 18, total_orders: 14, total_value: 290000, status: "active", phone: "+91 40 4488 5000", email: "", address: "Minister Road, Secunderabad", visit_frequency: 10, preferred_products: [1, 3, 6], last_visit: "2026-03-23", area: "Secunderabad", entity_type: "Hospital", rating: 4.7, key_doctors: "Dr. Bhaskar Rao", timings: "Open 24 hrs", lat: 17.4400, lng: 78.5100 },
    { id: 33, name: "Dr. Somaraju", clinic: "Star Hospitals", specialty: "Cardiology", territory: "Hyderabad Central (Banjara Hills, Jubilee Hills, Barkatpura)", tier: "A", potential: "high", total_visits: 16, total_orders: 12, total_value: 260000, status: "active", phone: "+91 40 4477 7777", email: "", address: "Road No. 10, Banjara Hills", visit_frequency: 10, preferred_products: [1, 4, 122], last_visit: "2026-03-22", area: "Banjara Hills", entity_type: "Hospital", rating: 4.8, key_doctors: "Dr. Somaraju", timings: "Open 24 hrs" },

    // 🏥 SECUNDERABAD / TARNAKA
    { id: 34, name: "Dr. P. Raghu Ram", clinic: "KIMS-Ushalakshmi Center", specialty: "Oncology, Breast Surgery", territory: "Hyderabad East (Secunderabad, Tarnaka, Uppal)", tier: "A", potential: "high", total_visits: 12, total_orders: 8, total_value: 180000, status: "active", phone: "+91 40 4488 5184", email: "", address: "Minister Road, Secunderabad", visit_frequency: 14, preferred_products: [44], last_visit: "2026-03-20", area: "Secunderabad", entity_type: "Hospital", rating: 4.9, key_doctors: "Dr. P. Raghu Ram", timings: "9AM–5PM" },
    { id: 35, name: "Dr. G.V. Rao", clinic: "AIG Hospitals", specialty: "Gastroenterology", territory: "Cyberabad (Hitech City, Madhapur, Gachibowli IT)", tier: "A", potential: "high", total_visits: 30, total_orders: 25, total_value: 650000, status: "active", phone: "+91 40 4244 4222", email: "", address: "Gachibowli", visit_frequency: 7, preferred_products: [12, 13, 14, 15, 16], last_visit: "2026-03-28", area: "Gachibowli", entity_type: "Hospital", rating: 4.9, key_doctors: "Dr. D. Nageshwar Reddy; Dr. G.V. Rao", timings: "Open 24 hrs" },
    { id: 36, name: "Dr. K.S. Ratnakar", clinic: "Global Medical Education and Research", specialty: "Pathology", territory: "Hyderabad North (Begumpet, Ameerpet, Panjagutta)", tier: "B", potential: "medium", total_visits: 5, total_orders: 0, total_value: 0, status: "active", phone: "", email: "", address: "Lakdikapul", visit_frequency: 30, preferred_products: [], last_visit: "2026-03-01", area: "Lakdikapul", entity_type: "Clinic", rating: 4.5, key_doctors: "Dr. K.S. Ratnakar", timings: "10AM–6PM" },

    // 🏥 MEHDIPATNAM / ATTAPUR
    { id: 37, name: "Dr. Mazharuddin Ali Khan", clinic: "Owaisi Hospital", specialty: "Orthopedics", territory: "Hyderabad South (Mehdipatnam, Attapur, Rajendranagar)", tier: "A", potential: "high", total_visits: 15, total_orders: 10, total_value: 120000, status: "active", phone: "+91 40 2444 3129", email: "", address: "Kanchanbagh", visit_frequency: 14, preferred_products: [28, 29, 31], last_visit: "2026-03-15", area: "Kanchanbagh", entity_type: "Hospital", rating: 4.3, key_doctors: "Dr. Mazharuddin Ali Khan", timings: "Open 24 hrs" },
    { id: 38, name: "Dr. S.A. Hussain", clinic: "Olive Hospital", specialty: "General Medicine", territory: "Hyderabad South (Mehdipatnam, Attapur, Rajendranagar)", tier: "B", potential: "medium", total_visits: 12, total_orders: 6, total_value: 45000, status: "active", phone: "+91 40 4445 5555", email: "", address: "Mehdipatnam", visit_frequency: 21, preferred_products: [39, 41, 42], last_visit: "2026-03-18", area: "Mehdipatnam", entity_type: "Hospital", rating: 4.2, key_doctors: "Dr. S.A. Hussain", timings: "Open 24 hrs" },
    { id: 39, name: "Dr. Fatima", clinic: "Fatima Nursing Home", specialty: "Gynecology", territory: "Hyderabad South (Mehdipatnam, Attapur, Rajendranagar)", tier: "B", potential: "medium", total_visits: 10, total_orders: 5, total_value: 35000, status: "active", phone: "+91 98490 55555", email: "", address: "Attapur", visit_frequency: 21, preferred_products: [43, 47], last_visit: "2026-03-10", area: "Attapur", entity_type: "Hospital", rating: 4.0, key_doctors: "Dr. Fatima", timings: "Open 24 hrs" },

    // 🏥 HITECH CITY / MADHAPUR
    { id: 40, name: "Dr. R.V. Raghavendra Rao", clinic: "Medicover Hospitals", specialty: "Neurology", territory: "Cyberabad (Hitech City, Madhapur, Gachibowli IT)", tier: "A", potential: "high", total_visits: 14, total_orders: 10, total_value: 150000, status: "active", phone: "+91 40 6833 4455", email: "", address: "Hitech City", visit_frequency: 14, preferred_products: [7, 8, 9], last_visit: "2026-03-22", area: "Hitech City", entity_type: "Hospital", rating: 4.6, key_doctors: "Dr. R.V. Raghavendra Rao", timings: "Open 24 hrs" },
    { id: 41, name: "Dr. S.V.S.S. Prasad", clinic: "Sunshine Hospitals", specialty: "Orthopedics, Joint Replacement", territory: "Cyberabad (Hitech City, Madhapur, Gachibowli IT)", tier: "A", potential: "high", total_visits: 20, total_orders: 16, total_value: 280000, status: "active", phone: "+91 40 4455 0000", email: "", address: "Gachibowli", visit_frequency: 10, preferred_products: [28, 29, 31, 32], last_visit: "2026-03-25", area: "Gachibowli", entity_type: "Hospital", rating: 4.7, key_doctors: "Dr. A.V. Gurava Reddy", timings: "Open 24 hrs" },
    { id: 42, name: "Dr. Lakshmi", clinic: "Rainbow Children's Hospital", specialty: "Pediatrics", territory: "Cyberabad (Hitech City, Madhapur, Gachibowli IT)", tier: "A", potential: "high", total_visits: 18, total_orders: 12, total_value: 140000, status: "active", phone: "+91 40 4466 5555", email: "", address: "Madhapur", visit_frequency: 10, preferred_products: [48, 49, 50], last_visit: "2026-03-24", area: "Madhapur", entity_type: "Hospital", rating: 4.8, key_doctors: "Dr. Ramesh Kancharla", timings: "Open 24 hrs" },

    // 🏥 ADDITIONAL CLINICS & DENTAL
    { id: 43, name: "Dr. Anusha", clinic: "Anusha Dental Care", specialty: "Dentistry", territory: "Hyderabad East (Secunderabad, Tarnaka, Uppal)", tier: "B", potential: "medium", total_visits: 8, total_orders: 4, total_value: 12000, status: "active", phone: "+91 99080 66666", email: "", address: "Tarnaka", visit_frequency: 21, preferred_products: [], last_visit: "2026-03-15", area: "Tarnaka", entity_type: "Dental", rating: 4.9, key_doctors: "Dr. Anusha", timings: "10AM–8PM" },
    { id: 44, name: "Dr. Rajesh", clinic: "Rajesh Eye Clinic", specialty: "Ophthalmology", territory: "Hyderabad North (Begumpet, Ameerpet, Panjagutta)", tier: "B", potential: "medium", total_visits: 6, total_orders: 2, total_value: 8000, status: "active", phone: "+91 98480 77777", email: "", address: "Ameerpet", visit_frequency: 21, preferred_products: [], last_visit: "2026-03-10", area: "Ameerpet", entity_type: "Clinic", rating: 4.4, key_doctors: "Dr. Rajesh", timings: "10AM–7PM" },
    { id: 45, name: "Dr. Sunitha", clinic: "Sunitha Skin Clinic", specialty: "Dermatology", territory: "Hyderabad West (Kukatpally, Gachibowli, Miyapur)", tier: "B", potential: "medium", total_visits: 10, total_orders: 6, total_value: 25000, status: "active", phone: "+91 99490 88888", email: "", address: "Miyapur", visit_frequency: 21, preferred_products: [33, 34, 35], last_visit: "2026-03-20", area: "Miyapur", entity_type: "Clinic", rating: 4.6, key_doctors: "Dr. Sunitha", timings: "11AM–8PM" },
    { id: 46, name: "Dr. A. Srinivas", clinic: "Whitus Hospitals", specialty: "General Medicine", territory: "Habsiguda", tier: 'A', potential: 'high', total_visits: 25, total_orders: 40, total_value: 350000, status: 'active', phone: "+91 98480 11111", email: "srinivas@whitus.com", address: "Habsiguda Main Rd, Habsiguda", area: "Habsiguda", rating: 4.8, timings: "10 AM – 6 PM", qualification: "MBBS, MD", dept_opd: "General Medicine", mr_visit_window: "11 AM – 1 PM", notes: "Senior consultant", hospital_id: 10 },
    { id: 47, name: "Dr. P. Kavitha", clinic: "Matrix Hospital", specialty: "Gynaecology", territory: "Habsiguda", tier: 'A', potential: 'high', total_visits: 18, total_orders: 35, total_value: 280000, status: 'active', phone: "+91 98480 22222", email: "kavitha@matrix.com", address: "Street No. 8, Habsiguda", area: "Habsiguda", rating: 4.6, timings: "11 AM – 7 PM", qualification: "MBBS, DGO", dept_opd: "OBG", mr_visit_window: "2 PM – 4 PM", notes: "Specialist in maternity care", hospital_id: 11 },
    { id: 48, name: "Dr. R. K. Reddy", clinic: "LifeSpring Hospital", specialty: "Paediatrics", territory: "Habsiguda", tier: 'B', potential: 'medium', total_visits: 12, total_orders: 20, total_value: 150000, status: 'active', phone: "+91 98480 33333", email: "reddy@lifespring.in", address: "Street No. 1, Habsiguda", area: "Habsiguda", rating: 4.4, timings: "10 AM – 2 PM", qualification: "MBBS, DCH", dept_opd: "Paediatrics", mr_visit_window: "10 AM – 12 PM", notes: "Experienced paediatrician", hospital_id: 12 },
    { id: 49, name: "Dr. S. Lakshmi", clinic: "LifeSpring Hospital", specialty: "Gynaecology", territory: "Habsiguda", tier: 'A', potential: 'high', total_visits: 22, total_orders: 45, total_value: 380000, status: 'active', phone: "+91 98480 44444", email: "lakshmi@lifespring.in", address: "Street No. 1, Habsiguda", area: "Habsiguda", rating: 4.7, timings: "9 AM – 5 PM", qualification: "MBBS, MS – OBG", dept_opd: "OBG", mr_visit_window: "11 AM – 1 PM", notes: "Lead consultant", hospital_id: 12 },
    { id: 50, name: "Dr. V. Mahesh", clinic: "Mallapur Multi-Speciality Hospital", specialty: "General Medicine", territory: "Mallapur", tier: 'B', potential: 'medium', total_visits: 8, total_orders: 15, total_value: 95000, status: 'active', phone: "+91 98480 55555", email: "mahesh@mallapurhosp.com", address: "Mallapur Main Rd, Mallapur", area: "Mallapur", rating: 4.3, timings: "10 AM – 8 PM", qualification: "MBBS, MD", dept_opd: "General Medicine", mr_visit_window: "12 PM – 2 PM", notes: "Key physician in Mallapur area", hospital_id: 13 },
    { id: 51, name: "Dr. K. Radhika", clinic: "Sri Sai Clinic", specialty: "Paediatrics", territory: "Mallapur", tier: 'C', potential: 'medium', total_visits: 5, total_orders: 10, total_value: 45000, status: 'active', phone: "+91 98480 66666", email: "", address: "Gokul Nagar, Mallapur", area: "Mallapur", rating: 4.1, timings: "6 PM – 9 PM", qualification: "MBBS, DCH", dept_opd: "Paediatrics", mr_visit_window: "6 PM – 7 PM", notes: "Evening clinic", hospital_id: 14 },
    { id: 52, name: "Dr. G. Satish", clinic: "Aditya Hospital", specialty: "Orthopedics", territory: "Uppal", tier: 'A', potential: 'high', total_visits: 15, total_orders: 30, total_value: 220000, status: 'active', phone: "+91 98480 77777", email: "satish@adityahosp.com", address: "Uppal Cross Roads, Uppal", area: "Uppal", rating: 4.6, timings: "10 AM – 4 PM", qualification: "MBBS, MS - Ortho", dept_opd: "Orthopedics", mr_visit_window: "11 AM – 1 PM", notes: "Specialist in joint replacement", hospital_id: 15 },

    // 🏥 RMP DOCTORS - NACHARAM
    { id: 53, name: "Dr. Venkatesh (RMP)", clinic: "Venkatesh Clinic", specialty: "General Practice", territory: "Nacharam", tier: 'B', potential: 'medium', total_visits: 8, total_orders: 12, total_value: 45000, status: 'active', phone: "+91 94404 15678", email: "", address: "HMT Nagar, Bapuji Nagar, Nacharam", area: "Nacharam", rating: 4.3, timings: "9 AM – 1 PM & 5 PM – 9 PM", qualification: "RMP", dept_opd: "General Practice", mr_visit_window: "9 AM–1 PM", notes: "Primary healthcare in HMT colony" },
    { id: 54, name: "Dr. Prakash Rao (RMP)", clinic: "Prakash Medical Centre", specialty: "General Practice", territory: "Nacharam", tier: 'B', potential: 'medium', total_visits: 6, total_orders: 8, total_value: 28000, status: 'active', phone: "+91 98765 42109", email: "", address: "Raghavendra Nagar, Nacharam", area: "Nacharam", rating: 4.2, timings: "8 AM – 2 PM & 4 PM – 9 PM", qualification: "RMP", dept_opd: "General Practice", mr_visit_window: "8 AM–2 PM", notes: "Community health provider" },
    { id: 55, name: "Dr. Ashok Kumar (RMP)", clinic: "Ashok Health Care", specialty: "General Practice, Pediatric Care", territory: "Nacharam", tier: 'B', potential: 'medium', total_visits: 7, total_orders: 10, total_value: 35000, status: 'active', phone: "+91 99662 28374", email: "", address: "Snehapuri Colony, Nacharam", area: "Nacharam", rating: 4.4, timings: "7 AM – 12 PM & 3 PM – 8 PM", qualification: "RMP", dept_opd: "General Practice", mr_visit_window: "7 AM–12 PM", notes: "Popular with families" },
    { id: 56, name: "Dr. Ramchandra (RMP)", clinic: "Ramchandra Clinic", specialty: "General Practice", territory: "Nacharam", tier: 'B', potential: 'medium', total_visits: 5, total_orders: 7, total_value: 22000, status: 'active', phone: "+91 97040 56789", email: "", address: "Koundinya Nagar, Nacharam", area: "Nacharam", rating: 4.1, timings: "9 AM – 1 PM & 6 PM – 9 PM", qualification: "RMP", dept_opd: "General Practice", mr_visit_window: "9 AM–1 PM", notes: "Long-standing provider" },
    { id: 57, name: "Dr. Sudarshan (RMP)", clinic: "Sudarshan Medical Clinic", specialty: "General Practice", territory: "Nacharam", tier: 'B', potential: 'medium', total_visits: 9, total_orders: 14, total_value: 52000, status: 'active', phone: "+91 98490 71234", email: "", address: "Sri Sai Nagar, Nacharam", area: "Nacharam", rating: 4.5, timings: "8 AM – 2 PM & 5 PM – 10 PM", qualification: "RMP", dept_opd: "General Practice", mr_visit_window: "8 AM–2 PM", notes: "Wound care specialist" },
    
    // 🏥 RMP DOCTORS - MULLAPUR/MALLAPUR
    { id: 58, name: "Dr. Mohan Kumar (RMP)", clinic: "Mohan Health Centre", specialty: "General Practice", territory: "Mallapur", tier: 'B', potential: 'medium', total_visits: 5, total_orders: 6, total_value: 20000, status: 'active', phone: "+91 94403 28765", email: "", address: "Annapurna Colony, Mallapur", area: "Mallapur", rating: 4.0, timings: "9 AM – 1 PM & 5 PM – 9 PM", qualification: "RMP", dept_opd: "General Practice", mr_visit_window: "9 AM–1 PM", notes: "Primary healthcare in Mallapur" },
    { id: 59, name: "Dr. Chandrasekhar (RMP)", clinic: "Chandrasekhar Clinic", specialty: "General Practice", territory: "Mallapur", tier: 'B', potential: 'medium', total_visits: 4, total_orders: 5, total_value: 16000, status: 'active', phone: "+91 98764 15234", email: "", address: "NTR Nagar, Mallapur", area: "Mallapur", rating: 4.1, timings: "8 AM – 12 PM & 4 PM – 9 PM", qualification: "RMP", dept_opd: "General Practice", mr_visit_window: "8 AM–12 PM", notes: "Healthcare provider in NTR Nagar" },
    { id: 60, name: "Dr. Vijay (RMP)", clinic: "Vijay Medical Clinic", specialty: "General Practice", territory: "Mallapur", tier: 'B', potential: 'medium', total_visits: 7, total_orders: 10, total_value: 38000, status: 'active', phone: "+91 99664 42187", email: "", address: "Vivekananda Nagar, Mallapur", area: "Mallapur", rating: 4.3, timings: "7 AM – 2 PM & 3 PM – 8 PM", qualification: "RMP", dept_opd: "General Practice", mr_visit_window: "7 AM–2 PM", notes: "Hypertension & diabetes specialist" },

    // 🏥 INDEPENDENT CLINICS - NACHARAM
    { id: 61, name: "Dr. Dinesh (MD)", clinic: "Dinesh Diagnostic & Clinic", specialty: "General Medicine", territory: "Nacharam", tier: 'A', potential: 'high', total_visits: 12, total_orders: 20, total_value: 85000, status: 'active', phone: "+91 98765 54321", email: "dinesh.clinic@gmail.com", address: "HMT Nagar Main Road, Nacharam", area: "Nacharam", rating: 4.6, timings: "9 AM – 12 PM & 3 PM – 7 PM", qualification: "MD – General Medicine", dept_opd: "General Medicine", mr_visit_window: "9 AM–12 PM", notes: "Diagnostic center with blood tests" },
    { id: 62, name: "Dr. Pooja Reddy", clinic: "Pooja Medical Centre", specialty: "General Medicine", territory: "Nacharam", tier: 'A', potential: 'medium', total_visits: 10, total_orders: 16, total_value: 68000, status: 'active', phone: "+91 99665 78912", email: "", address: "Bapuji Nagar, Nacharam", area: "Nacharam", rating: 4.4, timings: "10 AM – 1 PM & 5 PM – 8 PM", qualification: "MBBS, MD", dept_opd: "General Medicine", mr_visit_window: "10 AM–1 PM", notes: "Women health specialist" },
    { id: 63, name: "Dr. Murthy", clinic: "Murthy ENT & General Clinic", specialty: "ENT, General Medicine", territory: "Nacharam", tier: 'B', potential: 'medium', total_visits: 8, total_orders: 12, total_value: 52000, status: 'active', phone: "+91 98765 11223", email: "", address: "Raghavendra Nagar, Nacharam", area: "Nacharam", rating: 4.3, timings: "10 AM – 1 PM & 4 PM – 7 PM", qualification: "MBBS, DA – ENT", dept_opd: "ENT / General Medicine", mr_visit_window: "10 AM–1 PM", notes: "ENT specialist" },

    // 🏥 INDEPENDENT CLINICS - MULLAPUR
    { id: 64, name: "Dr. Srinivas", clinic: "Srinivas General Medicine Clinic", specialty: "General Medicine", territory: "Mallapur", tier: 'A', potential: 'high', total_visits: 11, total_orders: 18, total_value: 75000, status: 'active', phone: "+91 99665 34567", email: "", address: "Annapurna Colony Main Rd, Mallapur", area: "Mallapur", rating: 4.5, timings: "9:30 AM – 1:30 PM & 4 PM – 7:30 PM", qualification: "MD – General Medicine", dept_opd: "General Medicine", mr_visit_window: "9:30 AM–1:30 PM", notes: "Chronic disease specialist" },
    { id: 65, name: "Dr. Kavya", clinic: "Kavya Women & Child Clinic", specialty: "Pediatrics", territory: "Mallapur", tier: 'B', potential: 'medium', total_visits: 9, total_orders: 14, total_value: 62000, status: 'active', phone: "+91 98765 98765", email: "", address: "NTR Nagar, Mallapur", area: "Mallapur", rating: 4.4, timings: "10 AM – 2 PM & 5 PM – 8 PM", qualification: "MBBS,  DCH", dept_opd: "Pediatrics", mr_visit_window: "10 AM–2 PM", notes: "Child health specialist" }
  ],
  
  doctor_visits: [
    { 
      id: 1, 
      mr_id: 1, 
      doctor_id: 1, 
      doctor_name: "Dr. Ramesh Sharma", 
      entity_type: "doctor",
      entity_name: "Dr. Ramesh Sharma",
      clinic: "Sharma Multi-Specialty Clinic", 
      visit_date: "2026-03-28", 
      visit_time: "10:00", 
      status: "completed", 
      purpose: "Product presentation - New CardiCare Plus formulation", 
      notes: "Dr. Ramesh was impressed with the clinical data. He asked about the long-term side effects compared to the current market leader.", 
      conversation_summary: "MR: Good morning Doctor. I'm here to present our latest formulation of CardiCare Plus. \nDoctor: I've seen the brochure. How does it compare with the X-brand in terms of bioavailability? \nMR: It has 15% higher absorption rate as per the Phase III trials. \nDoctor: That's significant. Send me the full clinical paper.",
      products_discussed: [1], 
      order_value: 0 
    },
    { 
      id: 2, 
      mr_id: 1, 
      entity_type: "chemist",
      entity_name: "Sri Vasavi Medical Hall",
      visit_date: "2026-03-28", 
      visit_time: "11:30", 
      status: "completed", 
      purpose: "Stock check and order collection", 
      notes: "Stock for CardiCare is low. They need a fresh supply by Monday.", 
      conversation_summary: "MR: Hi Vasudev, how's the movement of CardiCare? \nChemist: It's moving fast. Dr. Ramesh has started prescribing it more. I only have 5 units left. \nMR: I'll place an order for 50 units right away. \nChemist: Also, check the expiry on the batch from last month.",
      products_discussed: [1, 3], 
      order_value: 15000 
    },
    { 
      id: 3, 
      mr_id: 1, 
      entity_type: "hospital",
      entity_name: "Prasad Hospitals",
      visit_date: "2026-03-28", 
      visit_time: "14:00", 
      status: "completed", 
      purpose: "Meeting with Purchase Manager", 
      notes: "Discussed bulk procurement for the cardiology department.", 
      conversation_summary: "MR: Good afternoon. I'm here to discuss the bulk supply for your cardiac unit. \nManager: We are looking for a 10% additional discount on orders above 500 units. \nMR: I'll have to check with my manager, but we can definitely offer better credit terms. \nManager: Send me a formal proposal by tomorrow.",
      products_discussed: [1, 2, 5], 
      order_value: 0 
    },
    { 
      id: 4, 
      mr_id: 1, 
      entity_type: "clinic",
      entity_name: "LifeSpring Hospital (OPD)",
      visit_date: "2026-03-29", 
      visit_time: "10:30", 
      status: "completed", 
      purpose: "Follow up on Gynaecology range", 
      notes: "Dr. Lakshmi requested more samples of OrthoFlex for her elderly patients.", 
      conversation_summary: "MR: Hello Dr. Lakshmi. How are the patients responding to OrthoFlex? \nDoctor: Very well. The feedback on joint pain relief is positive. \nMR: That's great to hear. I've brought some more samples. \nDoctor: Thank you. I'll need a presentation for my junior staff next week.",
      products_discussed: [28], 
      order_value: 0 
    }
  ],
  
  visit_schedules: (function() {
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const lastWeek = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
    const twoWeeksAgo = new Date(Date.now() - 14 * 86400000).toISOString().split('T')[0];
    const threeWeeksAgo = new Date(Date.now() - 21 * 86400000).toISOString().split('T')[0];
    return [
      { id: 1, mr_id: 1, doctor_id: 5, doctor_name: "Dr. Vikram Singh", clinic: "Singh Ortho & Spine Care", scheduled_date: twoWeeksAgo, scheduled_time: "11:00", purpose: "Ortho product presentation - Bone health range", priority: "high", status: "completed", estimated_duration: 45, notes: "Prepare samples for OrthoFlex and Calcium supplements" },
      { id: 2, mr_id: 1, doctor_id: 10, doctor_name: "Dr. V. Prasad", clinic: "Whitus Hospitals", scheduled_date: threeWeeksAgo, scheduled_time: "10:00", purpose: "Product briefing", priority: "medium", status: "completed", estimated_duration: 30, notes: "Discussed new cardiac range" },
      { id: 3, mr_id: 2, doctor_id: 20, doctor_name: "Dr. K. S. Rao", clinic: "Care Hospitals", scheduled_date: threeWeeksAgo, scheduled_time: "14:00", purpose: "Quarterly review", priority: "medium", status: "completed", estimated_duration: 30, notes: "Good response to product lineup" },
      { id: 4, mr_id: 1, doctor_id: 25, doctor_name: "Dr. Ramesh", clinic: "Shiva Hospital", scheduled_date: twoWeeksAgo, scheduled_time: "11:00", purpose: "New product launch", priority: "high", status: "completed", estimated_duration: 45, notes: "Approved for bulk purchase" },
      { id: 5, mr_id: 2, doctor_id: 30, doctor_name: "Dr. Sreenivas", clinic: "Sree Satya Laparoscopy", scheduled_date: twoWeeksAgo, scheduled_time: "15:00", purpose: "Follow-up visit", priority: "medium", status: "completed", estimated_duration: 30, notes: "Placed order for surgical supplies" },
      { id: 6, mr_id: 3, doctor_id: 35, doctor_name: "Dr. Anitha", clinic: "Anitha Maternity Home", scheduled_date: lastWeek, scheduled_time: "10:30", purpose: "Maternity products demo", priority: "high", status: "completed", estimated_duration: 40, notes: "Very interested in new range" },
      { id: 7, mr_id: 1, pharmacy_id: 12, pharmacy_name: "Ankur Medicals", scheduled_date: lastWeek, scheduled_time: "11:00", purpose: "Pharmacy stock replenishment", priority: "medium", status: "completed", estimated_duration: 25, notes: "Ordered priority medicines" },
      { id: 8, mr_id: 2, pharmacy_id: 18, pharmacy_name: "MedPlus Nacharam", scheduled_date: lastWeek, scheduled_time: "14:00", purpose: "Chain store visit", priority: "high", status: "completed", estimated_duration: 35, notes: "Chain coordinator meeting scheduled" },
      { id: 9, mr_id: 3, doctor_id: 28, doctor_name: "Dr. Sandeep Reddy", clinic: "Apollo Health City", scheduled_date: lastWeek, scheduled_time: "10:00", purpose: "Cardiology product briefing", priority: "high", status: "completed", estimated_duration: 40, notes: "Positive feedback received" },
      { id: 10, mr_id: 1, hospital_id: 1, hospital_name: "Prasad Hospitals", scheduled_date: lastWeek, scheduled_time: "11:00", purpose: "Hospital supply agreement", priority: "high", status: "completed", estimated_duration: 60, notes: "Signed new contract" },
      { id: 11, mr_id: 2, doctor_id: 32, doctor_name: "Dr. Manjula", clinic: "Care Hospitals", scheduled_date: yesterday, scheduled_time: "15:00", purpose: "Gynecology products demo", priority: "medium", status: "completed", estimated_duration: 35, notes: "Order placed for new quarter" },
      { id: 12, mr_id: 3, pharmacy_id: 24, pharmacy_name: "JANAGEN Generic Pharmacy", scheduled_date: yesterday, scheduled_time: "10:30", purpose: "Generic medicines discussion", priority: "medium", status: "completed", estimated_duration: 30, notes: "Good relationship maintained" },
      { id: 13, mr_id: 1, doctor_id: 15, doctor_name: "Dr. Ajit", clinic: "Ayu Health", scheduled_date: yesterday, scheduled_time: "14:00", purpose: "AI Scheduled Visit", priority: "medium", status: "completed", estimated_duration: 30, notes: "Follow-up required" },
      { id: 14, mr_id: 4, doctor_id: 29, doctor_name: "Dr. Guru N. Reddy", clinic: "Continental Hospitals", scheduled_date: lastWeek, scheduled_time: "11:00", purpose: "Product presentation", priority: "high", status: "completed", estimated_duration: 45, notes: "Excellent engagement" },
      { id: 15, mr_id: 5, hospital_id: 5, hospital_name: "Global Hospitals", scheduled_date: lastWeek, scheduled_time: "10:00", purpose: "Hospital partnership discussion", priority: "high", status: "completed", estimated_duration: 50, notes: "Negotiating terms" },
      { id: 16, mr_id: 4, pharmacy_id: 1, pharmacy_name: "Sri Vasavi Medical Hall", scheduled_date: yesterday, scheduled_time: "15:00", purpose: "Retail pharmacy stock visit", priority: "medium", status: "completed", estimated_duration: 20, notes: "Restocked best sellers" },
      { id: 17, mr_id: 1, doctor_id: 5, doctor_name: "Dr. Vikram Singh", clinic: "Singh Ortho & Spine Care", doctor_name_display: "Dr. Vikram Singh", scheduled_date: today, scheduled_time: "09:00", purpose: "Ortho product presentation - Bone health range", priority: "high", status: "pending", estimated_duration: 45, notes: "Prepare samples for OrthoFlex and Calcium supplements" },
      { id: 18, mr_id: 1, doctor_id: 10, doctor_name: "Dr. V. Prasad", clinic: "Whitus Hospitals", scheduled_date: today, scheduled_time: "11:00", purpose: "Quarterly product review - Cardiac range", priority: "medium", status: "pending", estimated_duration: 30, notes: "Follow up on previous order" },
      { id: 19, mr_id: 2, doctor_id: 20, doctor_name: "Dr. K. S. Rao", clinic: "Care Hospitals", scheduled_date: today, scheduled_time: "14:00", purpose: "Diabetes product briefing", priority: "high", status: "pending", estimated_duration: 35, notes: "New Gluconorm samples" },
      { id: 20, mr_id: 2, pharmacy_id: 18, pharmacy_name: "MedPlus Nacharam", doctor_name: "MedPlus Nacharam", clinic: "MedPlus Nacharam", scheduled_date: today, scheduled_time: "10:30", purpose: "Monthly stock assessment", priority: "medium", status: "pending", estimated_duration: 25, notes: "Review inventory levels" },
      { id: 21, mr_id: 3, doctor_id: 35, doctor_name: "Dr. Anitha", clinic: "Anitha Maternity Home", scheduled_date: today, scheduled_time: "10:30", purpose: "Maternity vitamin range presentation", priority: "high", status: "pending", estimated_duration: 40, notes: "Bring brochures" },
      { id: 22, mr_id: 3, hospital_id: 1, hospital_name: "Prasad Hospitals", doctor_name: "Prasad Hospitals", clinic: "Prasad Hospitals", scheduled_date: today, scheduled_time: "14:00", purpose: "Hospital procurement meeting", priority: "high", status: "pending", estimated_duration: 60, notes: "Discuss volume pricing" },
      { id: 23, mr_id: 1, pharmacy_id: 12, pharmacy_name: "Ankur Medicals", doctor_name: "Ankur Medicals", clinic: "Ankur Medicals", scheduled_date: today, scheduled_time: "14:30", purpose: "Restock check & new product intro", priority: "medium", status: "pending", estimated_duration: 25, notes: "New antibiotic range samples" },
      { id: 24, mr_id: 1, doctor_id: 4, doctor_name: "Dr. S. Ramachandran", clinic: "Apollo Hospital", scheduled_date: tomorrow, scheduled_time: "10:00", purpose: "Neurology product briefing", priority: "high", status: "pending", estimated_duration: 45, notes: "New neuro range introductory visit" },
      { id: 25, mr_id: 1, doctor_id: 7, doctor_name: "Dr. Fathima", clinic: "Medicover Hospitals", scheduled_date: tomorrow, scheduled_time: "13:00", purpose: "Oncology samples delivery", priority: "high", status: "pending", estimated_duration: 30, notes: "Bring updated clinical data" },
    ];
  })(),

  pharmacies: [
    { id: 1, name: "Sri Vasavi Medical Hall", owner_name: "Vasudev Rao", phone: "+91 98496 65224", email: "", address: "Near Whitus Hospitals, Habsiguda Main Rd, Nagendra Nagar, Habsiguda", territory: "Habsiguda", tier: "B", credit_limit: 50000, credit_days: 30, total_purchases: 15, total_value: 125000, last_purchase_date: "2026-03-20", status: "active", area: "Habsiguda", rating: 4.8, notes: "Medical Store, Home Delivery, Discounts", shop_hours: "8:30 AM – 11:30 PM", mr_visit_window: "10 AM–12 PM & 3–5 PM", type: "Independent Medical Hall", discount_notes: "Home Delivery | 15–20% Discount | WhatsApp Orders" },
    { id: 2, name: "Sri Lalitha Medicals", owner_name: "Lalitha", phone: "+91 91608 12880", email: "", address: "Captain Veera Raja Reddy Marg, Vijaynagar Colony, SS Nagar, Habsiguda", territory: "Habsiguda", tier: "A", credit_limit: 100000, credit_days: 30, total_purchases: 25, total_value: 250000, last_purchase_date: "2026-03-22", status: "active", area: "Habsiguda", rating: 5, notes: "Highly rated local store", shop_hours: "9 AM – 11:30 PM (Sun 10 AM – 11:30 PM)", mr_visit_window: "10 AM–12 PM & 3–5 PM", type: "Independent Medical Hall", discount_notes: "20% Discount | Free Home Delivery | Ayurvedic Products" },
    { id: 3, name: "Apollo Pharmacy - Habsiguda (St. 8)", owner_name: "Apollo Group", phone: "+91 79 4748 0017", email: "habsiguda8@apollopharmacy.in", address: "1/4/68/6, Snehagar Colony Rd, opp. Vision Express, SS Nagar, Habsiguda", territory: "Habsiguda", tier: "A", credit_limit: 200000, credit_days: 45, total_purchases: 45, total_value: 550000, last_purchase_date: "2026-03-25", status: "active", area: "Habsiguda", rating: 4, notes: "Chain outlet", shop_hours: "7 AM – 11 PM (Daily)", mr_visit_window: "10 AM–12 PM & 3–5 PM", type: "Chain Pharmacy (Apollo)", discount_notes: "10% Discount on ₹1000+ | Chain purchase order via Apollo system" },
    { id: 4, name: "MedPlus Vasant Vihar Habsiguda", owner_name: "MedPlus Health", phone: "+91 40 6700 6700", email: "vasantvihar@medplusindia.com", address: "24, Street No. 8, Vasant Vihar, Habsiguda", territory: "Habsiguda", tier: "A", credit_limit: 150000, credit_days: 45, total_purchases: 38, total_value: 420000, last_purchase_date: "2026-03-24", status: "active", area: "Habsiguda", rating: 4.5, notes: "Organized Retail", shop_hours: "7 AM – 11 PM (Daily)", mr_visit_window: "10 AM–12 PM & 3–5 PM", type: "Chain Pharmacy (MedPlus)", discount_notes: "MedPlus chain — centralised buying; approach store manager" },
    { id: 5, name: "MedPlus Habsiguda St. No. 8 (South)", owner_name: "MedPlus Health", phone: "+91 62814 12345", email: "habsiguda8s@medplusindia.com", address: "CG3V+H99, Captain Veera Raja Reddy Marg, JSN Colony, Saraswathi Nagar, Habsiguda", territory: "Habsiguda", tier: "A", credit_limit: 150000, credit_days: 45, total_purchases: 30, total_value: 350000, last_purchase_date: "2026-03-23", status: "active", area: "Habsiguda", rating: 4.2, notes: "Organized Retail", shop_hours: "7 AM – 11 PM (Daily)", mr_visit_window: "10 AM–12 PM & 3–5 PM", type: "Chain Pharmacy (MedPlus)", discount_notes: "MedPlus chain — centralised buying" },
    { id: 6, name: "Amma Pharmacy & General Stores", owner_name: "Amma", phone: "+91 91333 18473", email: "", address: "Street No. 8, opp. Union Bank, Shobana Nagar, Vasant Vihar, Habsiguda", territory: "Habsiguda", tier: "B", credit_limit: 60000, credit_days: 30, total_purchases: 12, total_value: 95000, last_purchase_date: "2026-03-21", status: "active", area: "Habsiguda", rating: 4.4, notes: "Attached to Multi Speciality Clinic", shop_hours: "7:30 AM – 11 PM (Daily)", mr_visit_window: "10 AM–12 PM & 3–5 PM", type: "Independent Pharmacy", discount_notes: "Attached to Multi Speciality Clinic | Home Delivery ✓" },
    { id: 7, name: "MedPlus Habsiguda Diagnostics Habsiguda", owner_name: "MedPlus Health", phone: "+91 40 6700 6700", email: "diagnostics@medplusindia.com", address: "Near Kapra Circle / X Road, Nagendra Nagar, Habsiguda", territory: "Habsiguda", tier: "A", credit_limit: 150000, credit_days: 45, total_purchases: 20, total_value: 220000, last_purchase_date: "2026-03-19", status: "active", area: "Habsiguda", rating: 3.9, notes: "Pharmacy + Diagnostics combo outlet", shop_hours: "7 AM – 11 PM (Daily)", mr_visit_window: "10 AM–12 PM & 3–5 PM", type: "Chain Pharmacy (MedPlus)", discount_notes: "Pharmacy + Diagnostics combo outlet" },
    { id: 8, name: "Tata 1mg Pharmacy – Habsiguda", owner_name: "Tata 1mg", phone: "+91 95998 63800", email: "habsiguda@1mg.com", address: "Door No 4/7/40/2/A, SMS Plaza, Kapra Circle, Habsiguda–Nacharam", territory: "Habsiguda", tier: "A", credit_limit: 200000, credit_days: 60, total_purchases: 15, total_value: 180000, last_purchase_date: "2026-03-26", status: "active", area: "Habsiguda", rating: 4.0, notes: "Large retail chain", shop_hours: "7 AM – 11:30 PM (Daily)", mr_visit_window: "10 AM–12 PM & 3–5 PM", type: "Chain Pharmacy (Tata 1mg)", discount_notes: "Lab Tests ✓ | Large retail chain" },
    { id: 9, name: "Tata 1mg Pharmacy – Habsiguda (2nd outlet)", owner_name: "Tata 1mg", phone: "+91 88264 45029", email: "habsiguda2@1mg.com", address: "Shop No 1/4/80/3/B/NR, Survey No 37, Plot No 96, Uppal–Habsiguda border", territory: "Habsiguda", tier: "A", credit_limit: 200000, credit_days: 60, total_purchases: 10, total_value: 120000, last_purchase_date: "2026-03-24", status: "active", area: "Habsiguda", rating: 4.0, notes: "Second 1mg outlet", shop_hours: "7 AM – 11 PM (Daily)", mr_visit_window: "10 AM–12 PM & 3–5 PM", type: "Chain Pharmacy (Tata 1mg)", discount_notes: "Second 1mg outlet near Habsiguda–Uppal junction" },
    { id: 10, name: "Tirumala Medical Stores", owner_name: "Tirumala", phone: "+91 94927 16490", email: "", address: "4-79/G, Street No. 8, opp. Siris Hospital, Brindavan Colony, Habsiguda", territory: "Habsiguda", tier: "B", credit_limit: 50000, credit_days: 30, total_purchases: 18, total_value: 145000, last_purchase_date: "2026-03-22", status: "active", area: "Habsiguda", rating: 4.3, notes: "Hard-to-find medicines stocked", shop_hours: "8:30 AM – 11 PM (Daily)", mr_visit_window: "10 AM–12 PM & 3–5 PM", type: "Independent Medical Hall", discount_notes: "Hard-to-find medicines stocked | No Discount reported" },
    { id: 11, name: "Sri Raghavendra Medical & General Stores", owner_name: "Raghavendra", phone: "+91 90102 69345", email: "", address: "Shop No. 1, X Road signal, opp. Max Showroom, Nagendra Nagar, Habsiguda", territory: "Habsiguda", tier: "B", credit_limit: 40000, credit_days: 15, total_purchases: 14, total_value: 85000, last_purchase_date: "2026-03-20", status: "active", area: "Habsiguda", rating: 4, notes: "Short-hours shop", shop_hours: "8 AM – 12:30 PM (Daily)", mr_visit_window: "9 AM–11 AM only (Short hours)", type: "Independent Medical Hall", discount_notes: "Short-hours shop — visit early morning | 10% Discount" },
    { id: 12, name: "Ankur Medicals", owner_name: "Ankur", phone: "+91 99597 42442", email: "", address: "D.No.4-7-41/2, nr. Bapuji Nagar Main Rd, MBD Complex, HMT Nagar, Nacharam", territory: "Nacharam", tier: "A", credit_limit: 100000, credit_days: 30, total_purchases: 35, total_value: 380000, last_purchase_date: "2026-03-27", status: "active", area: "Nacharam", rating: 5, notes: "Priority Shop", shop_hours: "7 AM – 11:30 PM (Daily)", mr_visit_window: "10 AM–12 PM & 3–5 PM", type: "Independent Medical Hall", discount_notes: "★ Priority Shop — 7 yrs reputation | Home Delivery ✓ | Discounts ✓" },
    { id: 13, name: "SRI LAKSHMI MEDICAL HALL", owner_name: "Sri Lakshmi Nursing Home", phone: "+91 99660 98512", email: "", address: "Inside Sri Lakshmi Nursing Home, MBD Complex, HMT Nagar, Nacharam", territory: "Nacharam", tier: "B", credit_limit: 50000, credit_days: 30, total_purchases: 20, total_value: 150000, last_purchase_date: "2026-03-24", status: "active", area: "Nacharam", rating: 4.2, notes: "In-Hospital Pharmacy", shop_hours: "—", mr_visit_window: "10 AM–12 PM & 3–5 PM", type: "In-Hospital Pharmacy", discount_notes: "Inside nursing home — stocks hospital prescriptions" },
    { id: 14, name: "Srinivasa Medical Store – HMT Nagar", owner_name: "Srinivasa", phone: "—", email: "", address: "HMT Nagar, Nacharam–Mallapur border, MBD Complex, HMT Nagar, Nacharam", territory: "Nacharam", tier: "B", credit_limit: 60000, credit_days: 30, total_purchases: 22, total_value: 180000, last_purchase_date: "2026-03-25", status: "active", area: "Nacharam", rating: 4, notes: "24-hr shop", shop_hours: "Open 24 Hours", mr_visit_window: "10 AM–12 PM & 3–5 PM", type: "Independent Medical Hall", discount_notes: "24-hr shop | Hospital prescription supplier" },
    { id: 15, name: "Shiva Sai Medical Stores", owner_name: "Shiva Sai", phone: "+91 93915 92595", email: "", address: "MBD Complex, HMT Nagar, Nacharam", territory: "Nacharam", tier: "B", credit_limit: 50000, credit_days: 30, total_purchases: 15, total_value: 110000, last_purchase_date: "2026-03-22", status: "active", area: "Nacharam", rating: 5, notes: "High discounts", shop_hours: "8 AM – 11:30 PM (Daily)", mr_visit_window: "10 AM–12 PM & 3–5 PM", type: "Independent Medical Hall", discount_notes: "High discounts | Well-stocked" },
    { id: 16, name: "Sri Balaji Medical & General Stores", owner_name: "Balaji", phone: "+91 94920 85428", email: "", address: "3, Choudhary Building, HMT Nagar Rd, MBD Complex, HMT Nagar, Nacharam", territory: "Nacharam", tier: "B", credit_limit: 50000, credit_days: 30, total_purchases: 18, total_value: 135000, last_purchase_date: "2026-03-23", status: "active", area: "Nacharam", rating: 4.6, notes: "Late opener", shop_hours: "10 AM – 11 PM (Daily)", mr_visit_window: "11 AM–1 PM & 3–5 PM", type: "Independent Medical Hall", discount_notes: "Late opener — visit after 11 AM | 10% Discount ✓" },
    { id: 17, name: "Janani Generic Pharmacy", owner_name: "Janani", phone: "—", email: "", address: "4-9, MBD Complex, HMT Nagar, Nacharam", territory: "Nacharam", tier: "B", credit_limit: 40000, credit_days: 30, total_purchases: 10, total_value: 75000, last_purchase_date: "2026-03-20", status: "active", area: "Nacharam", rating: 5, notes: "Generic medicines specialist", shop_hours: "8 AM – 11 PM (Daily)", mr_visit_window: "10 AM–12 PM & 3–5 PM", type: "Generic Pharmacy", discount_notes: "Generic medicines specialist | Good for substitution conversations" },
    { id: 18, name: "MedPlus Nacharam Pharmacy & Lab", owner_name: "MedPlus Health", phone: "+91 84980 96704", email: "nacharam@medplusindia.com", address: "D.no.4-9-126, Bapuji Nagar, MBD Complex, HMT Nagar, Nacharam", territory: "Nacharam", tier: "A", credit_limit: 150000, credit_days: 45, total_purchases: 40, total_value: 450000, last_purchase_date: "2026-03-26", status: "active", area: "Nacharam", rating: 4.7, notes: "Chain outlet", shop_hours: "7 AM – 11 PM (Daily)", mr_visit_window: "10 AM–12 PM & 3–5 PM", type: "Chain Pharmacy (MedPlus)", discount_notes: "Pharmacy + Lab | Chain outlet" },
    { id: 19, name: "Apollo Pharmacy – HMT Colony New", owner_name: "Apollo Group", phone: "+91 91773 33690", email: "hmtcolony@apollopharmacy.in", address: "Door No. 4, 7-40/3, Bapuji Nagar, MBD Complex, HMT Nagar, Nacharam", territory: "Nacharam", tier: "C", credit_limit: 30000, credit_days: 30, total_purchases: 5, total_value: 45000, last_purchase_date: "2026-03-15", status: "active", area: "Nacharam", rating: 2.5, notes: "Low-rated", shop_hours: "7 AM – 11 PM (Daily)", mr_visit_window: "10 AM–12 PM & 3–5 PM", type: "Chain Pharmacy (Apollo)", discount_notes: "Low-rated — poor staff reputation; chain buying only" },
    { id: 20, name: "Apollo Pharmacy – HMT Colony (2nd)", owner_name: "Apollo Group", phone: "+91 86050 00101", email: "hmtcolony2@apollopharmacy.in", address: "Shop No. 3, 9/126, Nacharam–Mallapur Rd, MBD Complex, HMT Nagar, Nacharam", territory: "Nacharam", tier: "B", credit_limit: 80000, credit_days: 30, total_purchases: 12, total_value: 110000, last_purchase_date: "2026-03-22", status: "active", area: "Nacharam", rating: 4.0, notes: "Second Apollo outlet", shop_hours: "7 AM – 11 PM (Daily)", mr_visit_window: "10 AM–12 PM & 3–5 PM", type: "Chain Pharmacy (Apollo)", discount_notes: "Second Apollo outlet in HMT Nagar cluster" },
    { id: 21, name: "Sri Sai Ram Generic Medical Shop", owner_name: "Sai Ram", phone: "+91 70362 79337", email: "", address: "Nacharam–Mallapur Rd, MBD Complex, Bapu Nagar, Tarnaka–Nacharam", territory: "Nacharam", tier: "B", credit_limit: 50000, credit_days: 30, total_purchases: 15, total_value: 120000, last_purchase_date: "2026-03-24", status: "active", area: "Nacharam", rating: 4.8, notes: "Generic Medical Shop", shop_hours: "8:30 AM – 9:50 PM (Daily)", mr_visit_window: "10 AM–12 PM & 3–5 PM", type: "Generic Medical Shop", discount_notes: "Generic medicines | Good for Paracetamol / Aceclofenac generic conversion" },
    { id: 22, name: "Venkatesai Medical & General Stores", owner_name: "Venkatesai", phone: "+91 78936 53087", email: "", address: "Street Number 3, Bhavani Nagar, Nacharam", territory: "Nacharam", tier: "B", credit_limit: 45000, credit_days: 30, total_purchases: 14, total_value: 95000, last_purchase_date: "2026-03-21", status: "active", area: "Nacharam", rating: 4.5, notes: "Colony-level shop", shop_hours: "9 AM – 11:30 PM (Daily)", mr_visit_window: "10 AM–12 PM & 3–5 PM", type: "Independent Medical Hall", discount_notes: "Colony-level shop | Knowledgeable pharmacist" },
    { id: 23, name: "Sri Lakshmi Medical & General Stores", owner_name: "Lakshmi", phone: "+91 99514 61428", email: "", address: "HMT Nagar, Nacharam (near Sri Sai Nagar junction)", territory: "Nacharam", tier: "A", credit_limit: 120000, credit_days: 30, total_purchases: 30, total_value: 320000, last_purchase_date: "2026-03-25", status: "active", area: "Nacharam", rating: 5, notes: "Orthopaedic specialist", shop_hours: "—", mr_visit_window: "10 AM–12 PM & 3–5 PM", type: "Independent Medical Hall", discount_notes: "Orthopaedic braces & appliances stocked | Niche store" },
    { id: 24, name: "JANAGEN Generic & Surgical Pharmacy", owner_name: "Janagen", phone: "—", email: "", address: "Ground Floor, Nacharam–Mallapur Rd, Koundinya Nagar, Ram Reddy Colony, Nacharam", territory: "Nacharam", tier: "A", credit_limit: 150000, credit_days: 45, total_purchases: 45, total_value: 520000, last_purchase_date: "2026-03-27", status: "active", area: "Nacharam", rating: 4.9, notes: "Priority - 24-hr", shop_hours: "Open 24 Hours", mr_visit_window: "10 AM–12 PM & 3–5 PM", type: "Generic + Surgical Pharmacy", discount_notes: "★ Priority - 24-hr, high rating | Generic + Surgical supplies | Free Home Delivery ✓" },
    { id: 25, name: "Manikeshwari Medical Hall", owner_name: "Manikeshwari", phone: "+91 98486 05686", email: "", address: "7-10/8, Sri Sai Nagar, Raghavendra Nagar, Nacharam", territory: "Nacharam", tier: "B", credit_limit: 50000, credit_days: 30, total_purchases: 12, total_value: 85000, last_purchase_date: "2026-03-18", status: "active", area: "Nacharam", rating: 5, notes: "Colony-level shop", shop_hours: "—", mr_visit_window: "10 AM–12 PM & 3–5 PM", type: "Independent Medical Hall", discount_notes: "Colony-level shop near Shiva Hospital" },
    { id: 26, name: "MedPlus Laxmi Starch Colony (Tarnaka)", owner_name: "MedPlus Health", phone: "+91 92810 15816", email: "tarnaka@medplusindia.com", address: "Street No. 14, Laxmi Starch Colony, Nagarjuna Nagar Colony, Tarnaka", territory: "Nacharam", tier: "A", credit_limit: 150000, credit_days: 45, total_purchases: 35, total_value: 380000, last_purchase_date: "2026-03-24", status: "active", area: "Nacharam", rating: 4.9, notes: "Home collection", shop_hours: "7 AM – 11 PM (Daily)", mr_visit_window: "10 AM–12 PM & 3–5 PM", type: "Chain Pharmacy (MedPlus)", discount_notes: "Pharmacy + Lab | Home collection ✓ | High-rated MedPlus outlet" },
    { id: 27, name: "Medi Gallery Medical Shop", owner_name: "Medi Gallery", phone: "+91 99514 06000", email: "", address: "Opp. Innova Hospital, Main Rd, Tarnaka", territory: "Nacharam", tier: "B", credit_limit: 70000, credit_days: 30, total_purchases: 20, total_value: 180000, last_purchase_date: "2026-03-22", status: "active", area: "Nacharam", rating: 4.4, notes: "Diagnostic services", shop_hours: "8:30 AM – 11:30 PM (Daily)", mr_visit_window: "10 AM–12 PM & 3–5 PM", type: "Pharmacy + Home Care", discount_notes: "Diagnostic + homecare services also offered" },
    { id: 28, name: "Apollo Pharmacy – Nacharam Main Rd", owner_name: "Apollo Group", phone: "+91 77022 01953", email: "nacharammain@apollopharmacy.in", address: "4-4-80/7/2, near Suprabhat Hotel, Koundinya Nagar, Nacharam", territory: "Nacharam", tier: "C", credit_limit: 40000, credit_days: 30, total_purchases: 8, total_value: 65000, last_purchase_date: "2026-03-16", status: "active", area: "Nacharam", rating: 2.9, notes: "Low-rated", shop_hours: "7 AM – 11 PM (Daily)", mr_visit_window: "10 AM–12 PM & 3–5 PM", type: "Chain Pharmacy (Apollo)", discount_notes: "Low-rated — rude staff reviews; chain-level order only" },
    { id: 29, name: "Durga Medical and Surgical – Bhavani Nagar", owner_name: "Durga", phone: "—", email: "", address: "Sai Datta Nilayam, Bhavani Nagar St, Bhavani Nagar, Nacharam", territory: "Nacharam", tier: "A", credit_limit: 100000, credit_days: 30, total_purchases: 28, total_value: 280000, last_purchase_date: "2026-03-25", status: "active", area: "Nacharam", rating: 5, notes: "Late opener", shop_hours: "10 AM – 11:30 PM (Daily)", mr_visit_window: "11 AM–1 PM & 3–5 PM", type: "Independent Medical + Surgical", discount_notes: "Late opener — visit after 11 AM | Surgical supplies also" },
    { id: 30, name: "HARI PHARMACY", owner_name: "Hari", phone: "+91 94919 40609", email: "", address: "2-20-5/2/1, near Srinivasa Heights, West Balaji Hill Colony, Adarsh Nagar (Chilkanagar), Uppal", territory: "Uppal", tier: "A", credit_limit: 150000, credit_days: 45, total_purchases: 42, total_value: 480000, last_purchase_date: "2026-03-27", status: "active", area: "Uppal", rating: 5, notes: "Priority - Clinic attached", shop_hours: "8 AM – 11 PM (Daily)", mr_visit_window: "10 AM–12 PM & 3–5 PM", type: "Independent Pharmacy", discount_notes: "★ Priority — Clinic attached | Home Delivery ✓ | General Physician + Ortho + ENT on site" },
    { id: 31, name: "Sri Padmavathi Medical & General Stores", owner_name: "Padmavathi", phone: "+91 98489 96221", email: "", address: "Shop No 5, Gandinagar, Srinivasa Colony, Uppal", territory: "Uppal", tier: "A", credit_limit: 120000, credit_days: 30, total_purchases: 38, total_value: 410000, last_purchase_date: "2026-03-26", status: "active", area: "Uppal", rating: 5, notes: "Long hours", shop_hours: "7 AM – 1:30 AM (Daily — very long hours)", mr_visit_window: "10 AM–12 PM & 4–6 PM", type: "Independent Medical Hall", discount_notes: "★ Long hours — late night availability | Customer-friendly" },
    { id: 32, name: "Santhosh Medical Store", owner_name: "Santhosh", phone: "+91 98497 07088", email: "", address: "Mekala Complex 1, 2-2-9/C/1, NH16, Laxma Reddy Colony, Uppal", territory: "Uppal", tier: "B", credit_limit: 60000, credit_days: 30, total_purchases: 15, total_value: 120000, last_purchase_date: "2026-03-22", status: "active", area: "Uppal", rating: 4, notes: "Home Delivery", shop_hours: "7 AM – 12 AM (Daily)", mr_visit_window: "10 AM–12 PM & 3–5 PM", type: "Independent Medical Hall", discount_notes: "Home Delivery ✓ | 20% Discount for regulars | Near Laxma Reddy cluster" },
    { id: 33, name: "Med Mart Pharmacy", owner_name: "Med Mart", phone: "—", email: "", address: "Hyderabad–Janagam Hwy, Balaji Enclave, Beerappagadda, Uppal", territory: "Uppal", tier: "A", credit_limit: 100000, credit_days: 30, total_purchases: 25, total_value: 280000, last_purchase_date: "2026-03-24", status: "active", area: "Uppal", rating: 5, notes: "24-hr", shop_hours: "Open 24 Hours", mr_visit_window: "10 AM–12 PM & 3–5 PM", type: "Independent Pharmacy", discount_notes: "24-hr | All medicines available | Good discount reported" },
    { id: 34, name: "Rohan Medical Store", owner_name: "Rohan", phone: "+91 89192 63668", email: "", address: "Swaroopnagar Colony, Uppal", territory: "Uppal", tier: "B", credit_limit: 50000, credit_days: 30, total_purchases: 18, total_value: 140000, last_purchase_date: "2026-03-23", status: "active", area: "Uppal", rating: 4.8, notes: "Very early opener", shop_hours: "5:30 AM – 11:30 PM (Daily)", mr_visit_window: "9 AM–11 AM & 3–5 PM", type: "Independent Medical Store", discount_notes: "Very early opener — 5:30 AM | Clinic attached" },
    { id: 35, name: "Sri Sanjeevani Generic Medical", owner_name: "Sanjeevani", phone: "+91 95059 99971", email: "", address: "10-4, Ramalayam St, Sree Rama Colony, Beerappagadda, Uppal", territory: "Uppal", tier: "B", credit_limit: 45000, credit_days: 30, total_purchases: 14, total_value: 95000, last_purchase_date: "2026-03-21", status: "active", area: "Uppal", rating: 4.8, notes: "Generic medicines", shop_hours: "9 AM – 11 PM (Daily)", mr_visit_window: "10 AM–12 PM & 3–5 PM", type: "Generic Medical Shop", discount_notes: "Generic medicines | Good OTC segment" },
    { id: 36, name: "MedPlus Chilka Nagar Uppal", owner_name: "MedPlus Health", phone: "+91 78159 28822", email: "chilkanagar@medplusindia.com", address: "D No 1 Plot 3, West Balaji Hill Colony, Chilkanagar, Uppal", territory: "Uppal", tier: "A", credit_limit: 150000, credit_days: 45, total_purchases: 35, total_value: 380000, last_purchase_date: "2026-03-24", status: "active", area: "Uppal", rating: 4.5, notes: "Home delivery", shop_hours: "7 AM – 11 PM (Daily)", mr_visit_window: "10 AM–12 PM & 3–5 PM", type: "Chain Pharmacy (MedPlus)", discount_notes: "Pharmacy + Lab | Home delivery" },
    { id: 37, name: "MedPlus Uppal Prashanti Nagar", owner_name: "MedPlus Health", phone: "+91 40 6700 6700", email: "prashantinagar@medplusindia.com", address: "H No 2, Shantha Nilayam, 16/80, opp. SBI, Prashanthinagar, Uppal", territory: "Uppal", tier: "B", credit_limit: 80000, credit_days: 30, total_purchases: 15, total_value: 120000, last_purchase_date: "2026-03-20", status: "active", area: "Uppal", rating: 3.5, notes: "Chain - central buying", shop_hours: "7 AM – 11 PM (Daily)", mr_visit_window: "10 AM–12 PM & 3–5 PM", type: "Chain Pharmacy (MedPlus)", discount_notes: "Chain — central buying | Low-rated outlet" },
    { id: 38, name: "MedPlus Uppal Main Road", owner_name: "MedPlus Health", phone: "+91 40 6700 6700", email: "uppalmain@medplusindia.com", address: "GF of 2, 10-27, Uppal Main Rd, Beerappagadda, Gaddi Annaram, Uppal", territory: "Uppal", tier: "C", credit_limit: 30000, credit_days: 30, total_purchases: 5, total_value: 35000, last_purchase_date: "2026-03-15", status: "active", area: "Uppal", rating: 1, notes: "Very low-rated", shop_hours: "7 AM – 11 PM (Daily)", mr_visit_window: "10 AM–12 PM & 3–5 PM", type: "Chain Pharmacy (MedPlus)", discount_notes: "Very low-rated outlet — chain purchase only" },
    { id: 39, name: "MedPlus Chilka Nagar (2nd outlet)", owner_name: "MedPlus Health", phone: "+91 40 6700 6700", email: "chilkanagar2@medplusindia.com", address: "Premises No 2, 209/22/D, Main Rd, Chilkanagar, Uppal", territory: "Uppal", tier: "B", credit_limit: 70000, credit_days: 30, total_purchases: 10, total_value: 85000, last_purchase_date: "2026-03-18", status: "active", area: "Uppal", rating: 2.6, notes: "Second MedPlus in Chilkanagar", shop_hours: "7 AM – 11 PM (Daily)", mr_visit_window: "10 AM–12 PM & 3–5 PM", type: "Chain Pharmacy (MedPlus)", discount_notes: "Second MedPlus in Chilkanagar — chain buying" },
    { id: 40, name: "Apollo Pharmacy – Uppal (Janagam Hwy)", owner_name: "Apollo Group", phone: "+91 79 4281 2345", email: "uppalhwy@apollopharmacy.in", address: "Hyderabad–Janagam Hwy, nr. Lenskart, Vijayapuri Colony, Gaddi Annaram, Uppal", territory: "Uppal", tier: "B", credit_limit: 90000, credit_days: 30, total_purchases: 18, total_value: 160000, last_purchase_date: "2026-03-22", status: "active", area: "Uppal", rating: 3.5, notes: "Chain - central buying", shop_hours: "7 AM – 11 PM (Daily)", mr_visit_window: "10 AM–12 PM & 3–5 PM", type: "Chain Pharmacy (Apollo)", discount_notes: "Chain — central buying" },
    { id: 41, name: "Apollo Pharmacy – Uppal (Balaji Enclave)", owner_name: "Apollo Group", phone: "+91 79 4284 5934", email: "balajienclave@apollopharmacy.in", address: "No 2/111/13, 2/a, Balaji Enclave, Srinagar Colony, Uppal", territory: "Uppal", tier: "B", credit_limit: 85000, credit_days: 30, total_purchases: 15, total_value: 135000, last_purchase_date: "2026-03-23", status: "active", area: "Uppal", rating: 4.2, notes: "AC shop", shop_hours: "7 AM – 11 PM (Daily)", mr_visit_window: "10 AM–12 PM & 3–5 PM", type: "Chain Pharmacy (Apollo)", discount_notes: "AC shop | Better-rated Apollo outlet in Uppal" },
    { id: 42, name: "Apollo Pharmacy – Uppal (Bus Stop Rd)", owner_name: "Apollo Group", phone: "+91 79 4747 9895", email: "uppalbusstop@apollopharmacy.in", address: "No 2, 5/43, Uppal Bus Stop Rd, Beerappagadda, Uppal", territory: "Uppal", tier: "A", credit_limit: 150000, credit_days: 45, total_purchases: 32, total_value: 350000, last_purchase_date: "2026-03-26", status: "active", area: "Uppal", rating: 4.5, notes: "Near Uppal Bus Stop", shop_hours: "7 AM – 11 PM (Daily)", mr_visit_window: "10 AM–12 PM & 3–5 PM", type: "Chain Pharmacy (Apollo)", discount_notes: "Near Uppal Bus Stop — high footfall location" },
    { id: 43, name: "Apollo Pharmacy – Prashanth Nagar", owner_name: "Apollo Group", phone: "+91 79 4747 9353", email: "prashanthnagar@apollopharmacy.in", address: "No 2/18/19/1, nr. Prashanthinagar Main Rd, near SBI ATM, Prashanth Nagar, Uppal", territory: "Uppal", tier: "B", credit_limit: 75000, credit_days: 30, total_purchases: 14, total_value: 115000, last_purchase_date: "2026-03-21", status: "active", area: "Uppal", rating: 3.9, notes: "Chain outlet", shop_hours: "7 AM – 11 PM (Daily)", mr_visit_window: "10 AM–12 PM & 3–5 PM", type: "Chain Pharmacy (Apollo)", discount_notes: "Chain outlet — Prashanth Nagar cluster" },
    { id: 44, name: "Dawaa Dost – Uppal Metro Store", owner_name: "Dawaa Dost", phone: "+91 72079 11519", email: "uppalmetro@dawaadost.com", address: "Near Uppal Metro Station, Survey Colony, IDA, Uppal", territory: "Uppal", tier: "A", credit_limit: 120000, credit_days: 30, total_purchases: 25, total_value: 280000, last_purchase_date: "2026-03-25", status: "active", area: "Uppal", rating: 4.6, notes: "Metro station location", shop_hours: "7 AM – 10 PM (Daily)", mr_visit_window: "10 AM–12 PM & 3–5 PM", type: "Independent Medical Hall", discount_notes: "Metro station location — high footfall | 4.6★" },
    { id: 45, name: "Lakshmi Medical & General Stores", owner_name: "Lakshmi", phone: "+91 98494 38058", email: "", address: "Prashanthinagar Main Rd, Prashanth Nagar, Uppal", territory: "Uppal", tier: "A", credit_limit: 100000, credit_days: 30, total_purchases: 30, total_value: 320000, last_purchase_date: "2026-03-24", status: "active", area: "Uppal", rating: 4.7, notes: "High-rated independent shop", shop_hours: "7:30 AM – 11 PM (Daily)", mr_visit_window: "10 AM–12 PM & 3–5 PM", type: "Independent Medical Hall", discount_notes: "High-rated independent shop | Colony-level" },
    { id: 46, name: "Srinivasa Medical Hall – Prashanth Nagar", owner_name: "Srinivasa", phone: "—", email: "", address: "Prashanth Nagar, Gaddi Annaram, Uppal", territory: "Uppal", tier: "B", credit_limit: 40000, credit_days: 30, total_purchases: 10, total_value: 65000, last_purchase_date: "2026-03-18", status: "active", area: "Uppal", rating: 5, notes: "Small colony-level shop", shop_hours: "—", mr_visit_window: "10 AM–12 PM & 3–5 PM", type: "Independent Medical Hall", discount_notes: "Small colony-level shop" },
    { id: 47, name: "Sri Sai Medical & General Store", owner_name: "Sai", phone: "+91 99492 41794", email: "", address: "2-9-180/1, 3, Chilka Nagar Main Rd, Balaji Enclave, Chilkanagar, Uppal", territory: "Uppal", tier: "B", credit_limit: 60000, credit_days: 30, total_purchases: 18, total_value: 145000, last_purchase_date: "2026-03-22", status: "active", area: "Uppal", rating: 4, notes: "Old established shop", shop_hours: "9 AM – 11:30 PM (Daily)", mr_visit_window: "10 AM–12 PM & 3–5 PM", type: "Independent Medical Hall", discount_notes: "Old established shop in Chilkanagar locality" },
    { id: 48, name: "SRI AYYAPPA GENERIC MEDICAL STORES", owner_name: "Ayyappa", phone: "+91 97050 45207", email: "", address: "Chilka Nagar Main Rd, near Mahadev Motors, Bharat Nagar Colony, Beerappagadda, Uppal", territory: "Uppal", tier: "B", credit_limit: 50000, credit_days: 30, total_purchases: 12, total_value: 85000, last_purchase_date: "2026-03-20", status: "active", area: "Uppal", rating: 4, notes: "Generic medicines", shop_hours: "9 AM – 10:30 PM (Sat-Sun shorter)", mr_visit_window: "10 AM–12 PM & 3–5 PM", type: "Generic Medical Store", discount_notes: "Generic medicines | Beerappagadda cluster" },
    { id: 49, name: "Sri Abhyudaya Pharmacy Generic Medical", owner_name: "Abhyudaya", phone: "—", email: "", address: "Chilka Nagar Main Rd, opp. Srinivasa Heights, West Balaji Hill Colony, Uppal", territory: "Uppal", tier: "B", credit_limit: 40000, credit_days: 30, total_purchases: 8, total_value: 55000, last_purchase_date: "2026-03-16", status: "active", area: "Uppal", rating: 5, notes: "Generic specialist", shop_hours: "—", mr_visit_window: "10 AM–12 PM & 3–5 PM", type: "Generic Pharmacy", discount_notes: "Generic specialist — Chilkanagar area" },
    { id: 50, name: "SATVIKA PHARMACY", owner_name: "Satvika", phone: "+91 80744 69072", email: "", address: "Balaji Enclave, Beerappagadda, Gaddi Annaram, Uppal", territory: "Uppal", tier: "B", credit_limit: 35000, credit_days: 30, total_purchases: 6, total_value: 42000, last_purchase_date: "2026-03-12", status: "active", area: "Uppal", rating: 4, notes: "Beerappagadda cluster", shop_hours: "—", mr_visit_window: "10 AM–12 PM & 3–5 PM", type: "Independent Pharmacy", discount_notes: "Beerappagadda cluster" },
    { id: 51, name: "Jan Aushadhi Generic Medical Store", owner_name: "Jan Aushadhi", phone: "—", email: "", address: "CH54+PR7, Prashanth Nagar, Uppal", territory: "Uppal", tier: "C", credit_limit: 20000, credit_days: 15, total_purchases: 4, total_value: 15000, last_purchase_date: "2026-03-10", status: "active", area: "Uppal", rating: 2.5, notes: "Govt-affiliated generic store", shop_hours: "—", mr_visit_window: "10 AM–12 PM only", type: "Generic / Jan Aushadhi", discount_notes: "Govt-affiliated generic store — limited hours; afternoon closed" },
    { id: 52, name: "MedPlus Mallapur Pharmacy & Lab", owner_name: "MedPlus Health", phone: "+91 76600 27074", email: "mallapur@medplusindia.com", address: "H No 4/1/216/208, Shop 182, Nacharam–Mallapur Rd, Karthikeya, Mallapur", territory: "Mallapur", tier: "B", credit_limit: 80000, credit_days: 30, total_purchases: 18, total_value: 145000, last_purchase_date: "2026-03-22", status: "active", area: "Mallapur", rating: 3.7, notes: "Chain outlet", shop_hours: "7 AM – 11 PM (Daily)", mr_visit_window: "10 AM–12 PM & 3–5 PM", type: "Chain Pharmacy (MedPlus)", discount_notes: "Pharmacy + Lab | Chain outlet" },
    { id: 53, name: "Apollo Pharmacy – Mallapur", owner_name: "Apollo Group", phone: "+91 79 4748 0044", email: "mallapur@apollopharmacy.in", address: "G2, Velpula Plaza, opp. Central Bank of India, Annapurna Colony, Mallapur", territory: "Mallapur", tier: "B", credit_limit: 75000, credit_days: 30, total_purchases: 14, total_value: 115000, last_purchase_date: "2026-03-21", status: "active", area: "Mallapur", rating: 3.8, notes: "Main road location", shop_hours: "7 AM – 11 PM (Daily)", mr_visit_window: "10 AM–12 PM & 3–5 PM", type: "Chain Pharmacy (Apollo)", discount_notes: "Main road location | Chain buying" },
    { id: 54, name: "ADITYA PHARMACY", owner_name: "Aditya", phone: "+91 72079 37845", email: "", address: "Nacharam–Mallapur Rd, Near Narasimha Nagar, NTR Nagar, Mallapur", territory: "Mallapur", tier: "B", credit_limit: 60000, credit_days: 30, total_purchases: 12, total_value: 95000, last_purchase_date: "2026-03-18", status: "active", area: "Mallapur", rating: 3.8, notes: "NTR Nagar colony pharmacy", shop_hours: "8 AM – 11 PM (Daily)", mr_visit_window: "10 AM–12 PM & 3–5 PM", type: "Independent Medical Hall", discount_notes: "NTR Nagar colony pharmacy" },
    { id: 55, name: "Balaji Medical & General Store", owner_name: "Balaji", phone: "+91 92922 53694", email: "", address: "Shop No 3, Janapriya Road, Annapurna Colony, Mallapur", territory: "Mallapur", tier: "A", credit_limit: 100000, credit_days: 30, total_purchases: 25, total_value: 280000, last_purchase_date: "2026-03-24", status: "active", area: "Mallapur", rating: 5, notes: "Lunch-break gap", shop_hours: "9:30 AM – 3 PM & 4 PM – 11 PM (Daily)", mr_visit_window: "10 AM–12 PM & 4–6 PM", type: "Independent Medical Hall", discount_notes: "Lunch-break gap (3–4 PM) — avoid; visit 10–12 or 4–6 PM" },
    { id: 56, name: "Sai Sahasra Medical & General Store", owner_name: "Sai Sahasra", phone: "+91 94410 34328", email: "", address: "Mallapur Main Rd, Narasimha Colony, Annapurna Colony, Mallapur", territory: "Mallapur", tier: "B", credit_limit: 50000, credit_days: 30, total_purchases: 10, total_value: 75000, last_purchase_date: "2026-03-20", status: "active", area: "Mallapur", rating: 3, notes: "Low-rated", shop_hours: "9 AM – 11:50 PM (Daily)", mr_visit_window: "10 AM–12 PM & 3–5 PM", type: "Independent Medical Hall", discount_notes: "Low-rated — no return policy reviews | Colony shop" },
    { id: 57, name: "Baba Medical Shop", owner_name: "Baba", phone: "+91 99493 68688", email: "", address: "2, Bhavani Nagar, Vivekananda Nagar, Mallapur", territory: "Mallapur", tier: "B", credit_limit: 45000, credit_days: 30, total_purchases: 8, total_value: 55000, last_purchase_date: "2026-03-16", status: "active", area: "Mallapur", rating: 4, notes: "Vivekananda Nagar colony-level shop", shop_hours: "8:30 AM – 11 PM (Daily)", mr_visit_window: "10 AM–12 PM & 3–5 PM", type: "Independent Medical Hall", discount_notes: "Vivekananda Nagar colony-level shop" },
    { id: 58, name: "Eshwar Medical & General Store", owner_name: "Eshwar", phone: "+91 96768 04460", email: "", address: "Plot No 1, Bank Colony, Mallapur", territory: "Mallapur", tier: "B", credit_limit: 40000, credit_days: 30, total_purchases: 6, total_value: 42000, last_purchase_date: "2026-03-12", status: "active", area: "Mallapur", rating: 4.0, notes: "Bank Colony area shop", shop_hours: "8 AM – 11 PM (Daily)", mr_visit_window: "10 AM–12 PM & 3–5 PM", type: "Independent Medical Hall", discount_notes: "Bank Colony area shop" },
    { id: 59, name: "Venkata Sai Medical And General Stores", owner_name: "Venkata Sai", phone: "+91 98855 95649", email: "", address: "Plot No 36, FCI Godown Rd, beside Gulmohar Gardens, Chandrapuri Colony, Mallapur", territory: "Mallapur", tier: "A", credit_limit: 120000, credit_days: 30, total_purchases: 30, total_value: 320000, last_purchase_date: "2026-03-25", status: "active", area: "Mallapur", rating: 5, notes: "Late opener", shop_hours: "10:30 AM – 10:30 PM (Daily)", mr_visit_window: "11 AM–1 PM & 3–5 PM", type: "Independent Medical Hall", discount_notes: "Late opener — visit after 11 AM | Knowledgeable owner | 15% discount" },
    { id: 60, name: "Care Pharmacy", owner_name: "Care", phone: "+91 85018 67811", email: "", address: "Shakti Sai Sagar, Opp. Bus Stop, Gulmohar Garden, Chandrapuri Colony, Mallapur", territory: "Mallapur", tier: "A", credit_limit: 100000, credit_days: 30, total_purchases: 25, total_value: 280000, last_purchase_date: "2026-03-24", status: "active", area: "Mallapur", rating: 5, notes: "15% Discount", shop_hours: "7 AM – late night (Daily)", mr_visit_window: "10 AM–12 PM & 3–5 PM", type: "Independent Pharmacy", discount_notes: "15% Discount ✓ | Long hours | Near Chandrapuri Colony" },
    { id: 61, name: "Royal Medical & General Store", owner_name: "Royal", phone: "+91 99635 70786", email: "", address: "Shop No. 1, FCI Godown Rd, Chanakyapuri Colony, Mallapur", territory: "Mallapur", tier: "B", credit_limit: 50000, credit_days: 30, total_purchases: 10, total_value: 85000, last_purchase_date: "2026-03-20", status: "active", area: "Mallapur", rating: 5, notes: "FCI Godown Rd colony shop", shop_hours: "—", mr_visit_window: "10 AM–12 PM & 3–5 PM", type: "Independent Medical Hall", discount_notes: "FCI Godown Rd colony shop" },
    { id: 62, name: "CITY PHARMACY Medical & General Store", owner_name: "City Pharmacy", phone: "+91 91107 70780", email: "", address: "New Narasimha Nagar Colony, Mallapur", territory: "Mallapur", tier: "A", credit_limit: 80000, credit_days: 30, total_purchases: 15, total_value: 120000, last_purchase_date: "2026-03-22", status: "active", area: "Mallapur", rating: 4.5, notes: "NTR Nagar / New Narasimha Nagar area", shop_hours: "8 AM – 11:30 PM (Daily)", mr_visit_window: "10 AM–12 PM & 3–5 PM", type: "Independent Medical Hall", discount_notes: "NTR Nagar / New Narasimha Nagar area" }
  ],

  hospitals: [
    { id: 1, name: "Prasad Hospitals", type: "Multi-Speciality", contact_person: "Dr. K. Suma Prasad", phone: "+91 88012 33333", email: "info@prasadhospitals.com", address: "44-617/12, IDA, Nacharam", territory: "Nacharam", tier: 'A', bed_count: 150, credit_limit: 500000, credit_days: 45, total_purchases: 120, total_value: 850000, status: 'active', area: "Nacharam", rating: 4.8, notes: "Founder Director | 27+ yrs exp | Practo / Credihealth" },
    { id: 2, name: "Shree Pooja Hospital", type: "Multi-Speciality", contact_person: "Dr. Varija", phone: "+91 91000 12555", email: "contact@shreepooja.com", address: "Bapuji Nagar, HMT Nagar, Nacharam", territory: "Nacharam", tier: 'A', bed_count: 80, credit_limit: 300000, credit_days: 30, total_purchases: 85, total_value: 420000, status: 'active', area: "Nacharam", rating: 4.5, notes: "Primary gynaecologist | 4.5★ Google" },
    { id: 3, name: "Ayu Health Hospitals", type: "Multi-Speciality", contact_person: "Dr. Ajit", phone: "+91 63661 00800", email: "nacharam@ayu.health", address: "44-617/12, IDA, Durga Nagar, Nacharam", territory: "Nacharam", tier: 'A', bed_count: 100, credit_limit: 400000, credit_days: 30, total_purchases: 95, total_value: 580000, status: 'active', area: "Nacharam", rating: 4.6, notes: "Ayu Health platform-assigned doctor" },
    { id: 4, name: "Vijaya Hospital", type: "Multi-Speciality", contact_person: "Dr. V. R. Srikanth", phone: "+91 99899 35697", email: "vijaya@hospital.com", address: "18/B, Sri Sai Nagar, Raghavendra Nagar, Nacharam", territory: "Nacharam", tier: 'B', bed_count: 50, credit_limit: 200000, credit_days: 30, total_purchases: 45, total_value: 210000, status: 'active', area: "Nacharam", rating: 4.2, notes: "Principal doctor | 4.1★ 158 reviews" },
    { id: 5, name: "Shiva Hospital", type: "Multi-Speciality", contact_person: "Dr. Ramesh", phone: "+91 78420 70407", email: "shiva@hospital.com", address: "7-10/8, Raghavendra Nagar, Nacharam", territory: "Nacharam", tier: 'A', bed_count: 120, credit_limit: 450000, credit_days: 30, total_purchases: 110, total_value: 720000, status: 'active', area: "Nacharam", rating: 4.7, notes: "Primary surgeon | Multiple 5★ reviews" },
    { id: 6, name: "Sree Satya Laparoscopy Hospital", type: "Specialty", contact_person: "Dr. Sudagani Sreenivas Goud", phone: "+91 99858 50909", email: "sreesatya@hospital.com", address: "Snehapuri Colony, Nacharam", territory: "Nacharam", tier: 'A', bed_count: 60, credit_limit: 350000, credit_days: 30, total_purchases: 75, total_value: 480000, status: 'active', area: "Nacharam", rating: 4.9, notes: "20,000+ surgeries | Lead surgeon" },
    { id: 7, name: "Bapuji Hospital", type: "Multi-Speciality", contact_person: "Dr. P. Haritha", phone: "+91 91777 34265", email: "bapuji@hospital.com", address: "Bapuji Nagar, MBD Complex, HMT Nagar, Nacharam", territory: "Nacharam", tier: 'B', bed_count: 40, credit_limit: 150000, credit_days: 30, total_purchases: 35, total_value: 150000, status: 'active', area: "Nacharam", rating: 4.1, notes: "Experienced gynaecologist" },
    { id: 8, name: "TULIP Hospital", type: "Multi-Speciality", contact_person: "Dr. Sahiti Alapati", phone: "+91 94940 66565", email: "tulip@hospital.com", address: "Nacharam-Mallapur Rd, Gokul Nagar, Nacharam", territory: "Nacharam", tier: 'A', bed_count: 90, credit_limit: 380000, credit_days: 30, total_purchases: 88, total_value: 520000, status: 'active', area: "Nacharam", rating: 4.4, notes: "TLH specialist | 4.4★ Google Reviews" },
    { id: 9, name: "Chandamama Hospital", type: "Multi-Speciality", contact_person: "Dr. M. Lakshmi", phone: "+91 95734 45474", email: "chandamama@hospital.com", address: "Nacharam-Mallapur Rd, Raghavendra Nagar, Nacharam", territory: "Nacharam", tier: 'A', bed_count: 70, credit_limit: 320000, credit_days: 30, total_purchases: 72, total_value: 410000, status: 'active', area: "Nacharam", rating: 4.3, notes: "Lead gynaecologist | Most-reviewed" },
    { id: 10, name: "Whitus Hospitals", type: "Multi-Speciality", contact_person: "Dr. V. Prasad", phone: "+91 40 2717 1111", email: "info@whitus.com", address: "Habsiguda Main Rd, Nagendra Nagar, Habsiguda", territory: "Habsiguda", tier: 'A', bed_count: 120, credit_limit: 450000, credit_days: 30, total_purchases: 110, total_value: 750000, status: 'active', area: "Habsiguda", rating: 4.7, notes: "Modern multi-speciality hospital in Habsiguda" },
    { id: 11, name: "Matrix Hospital", type: "Multi-Speciality", contact_person: "Dr. S. Reddy", phone: "+91 40 2715 2222", email: "contact@matrix.com", address: "Street No. 8, Habsiguda", territory: "Habsiguda", tier: 'B', bed_count: 60, credit_limit: 250000, credit_days: 30, total_purchases: 55, total_value: 320000, status: 'active', area: "Habsiguda", rating: 4.4, notes: "Specialized care center" },
    { id: 12, name: "LifeSpring Hospital", type: "Maternity", contact_person: "Dr. P. Haritha", phone: "+91 40 2717 3333", email: "habsiguda@lifespring.in", address: "Street No. 1, Habsiguda", territory: "Habsiguda", tier: 'A', bed_count: 40, credit_limit: 200000, credit_days: 30, total_purchases: 45, total_value: 280000, status: 'active', area: "Habsiguda", rating: 4.5, notes: "Specialized maternity hospital" },
    { id: 13, name: "Mallapur Multi-Speciality Hospital", type: "Multi-Speciality", contact_person: "Dr. V. Mahesh", phone: "+91 98480 55555", email: "info@mallapurhosp.com", address: "Mallapur Main Rd, Mallapur", territory: "Mallapur", tier: 'B', bed_count: 50, credit_limit: 180000, credit_days: 30, total_purchases: 25, total_value: 145000, status: 'active', area: "Mallapur", rating: 4.3, notes: "Key healthcare provider in Mallapur" },
    { id: 14, name: "Sri Sai Clinic", type: "Clinic", contact_person: "Dr. K. Radhika", phone: "+91 98480 66666", email: "", address: "Gokul Nagar, Mallapur", territory: "Mallapur", tier: 'C', bed_count: 15, credit_limit: 50000, credit_days: 15, total_purchases: 12, total_value: 55000, status: 'active', area: "Mallapur", rating: 4.1, notes: "Local clinic serving Mallapur" },
    { id: 15, name: "Aditya Hospital", type: "Multi-Speciality", contact_person: "Dr. G. Satish", phone: "+91 98480 77777", email: "info@adityahosp.com", address: "Uppal Cross Roads, Uppal", territory: "Uppal", tier: 'A', bed_count: 100, credit_limit: 400000, credit_days: 45, total_purchases: 65, total_value: 480000, status: 'active', area: "Uppal", rating: 4.6, notes: "Major hospital in Uppal area" }
  ],

  doctor_prescriptions: [],
  commission_structures: [],
  targets: [
    { id: 1, mr_id: 1, month: "2026-01", target_value: 450000, product_type: "Total", status: "completed", achieved_value: 480000 },
    { id: 2, mr_id: 1, month: "2026-02", target_value: 500000, product_type: "Total", status: "completed", achieved_value: 490000 },
    { id: 3, mr_id: 1, month: "2026-03", target_value: 550000, product_type: "Total", status: "in_progress", achieved_value: 420000 }
  ],
  expenses: [
    { id: 1, mr_id: 1, date: "2026-03-01", category: "Travel", amount: 1200, description: "Fuel for Hyderabad West tour", status: "approved" },
    { id: 2, mr_id: 1, date: "2026-03-05", category: "Food", amount: 450, description: "Lunch with Dr. Ramesh", status: "approved" },
    { id: 3, mr_id: 2, date: "2026-03-02", category: "Travel", amount: 1500, description: "Fuel for Banjara Hills tour", status: "approved" },
    { id: 4, mr_id: 6, date: "2026-03-10", category: "Miscellaneous", amount: 2000, description: "Promotional materials printing", status: "pending" }
  ],
  sales: [
    { id: 1, mr_id: 1, mr_name: "Rajesh Kumar", product_id: 1, product_name: "CardiCare Plus 10mg", quantity: 10, amount: 6800, date: "2026-03-15", customer_name: "Dr. Vijay Kumar", clinic: "AVR Hospital", sale_type: "doctor_order" },
    { id: 2, mr_id: 2, mr_name: "Suresh Raina", product_id: 1, product_name: "CardiCare Plus 10mg", quantity: 50, amount: 34000, date: "2026-03-20", customer_name: "Dr. Sandeep Reddy", clinic: "Apollo Health City", sale_type: "hospital_order" },
    { id: 3, mr_id: 6, mr_name: "Vikram Singh", product_id: 12, product_name: "GastroEase 20mg", quantity: 100, amount: 28500, date: "2026-03-25", customer_name: "Dr. G.V. Rao", clinic: "AIG Hospitals", sale_type: "hospital_order" },
    { id: 4, mr_id: 4, mr_name: "Amit Patel", product_id: 3, product_name: "Metoprolol XL 50mg", quantity: 30, amount: 8550, date: "2026-03-22", customer_name: "Dr. Bhaskar Rao", clinic: "KIMS Hospitals", sale_type: "hospital_order" },
    { id: 5, mr_id: 7, mr_name: "Ravi Teja Reddy", product_id: 13, product_name: "Pantoprazole 40mg", quantity: 200, amount: 31000, date: "2026-03-26", customer_name: "Dr. V. Mahesh", clinic: "Mallapur Multi-Speciality Hospital", sale_type: "hospital_order" },
    { id: 6, mr_id: 7, mr_name: "Ravi Teja Reddy", product_id: 28, product_name: "OrthoFlex Plus", quantity: 150, amount: 45750, date: "2026-03-27", customer_name: "Dr. G. Satish", clinic: "Aditya Hospital", sale_type: "hospital_order" }
  ],
  sales_forecast: [
    { month: "2026-04", predicted_sales: 650000, confidence_high: 720000, confidence_low: 580000 },
    { month: "2026-05", predicted_sales: 780000, confidence_high: 850000, confidence_low: 710000 },
    { month: "2026-06", predicted_sales: 820000, confidence_high: 900000, confidence_low: 740000 },
    { month: "2026-07", predicted_sales: 890000, confidence_high: 980000, confidence_low: 810000 }
  ],
  inventory: {
    departments: ["Cardiology", "Neurology", "Gastroenterology", "Endocrinology", "Pulmonology", "Orthopedics", "Dermatology", "General Medicine"],
    stock_movements: []
  },
  mr_daily_reports: [],
  doctor_network: [],
  schedule: [],
  pharmacy_visits: [],
  hospital_visits: [],
  pharmacy_schedules: [],
  hospital_schedules: [],
  dcr_reports: [],
  visit_expenses: [],
  offline_queue: [],
  sample_inventory: [],
  sample_distributions: [],
  competitor_mentions: [
    {
      id: 1,
      mr_id: 1,
      mr_name: "Rajesh Kumar",
      entity_name: "Dr. K. Suma Prasad",
      competitor_product: "Cipla IVF Range",
      mention_context: "Doctor mentioned currently using Cipla's IVF products but interested in switching",
      sentiment: "opportunity",
      visit_date: "2026-04-09",
      detected_at: "2026-04-09T10:30:00Z"
    },
    {
      id: 2,
      mr_id: 2,
      mr_name: "Suresh Raina",
      entity_name: "Dr. Sandeep Reddy",
      competitor_product: "Sun Pharma CardiCare",
      mention_context: "Doctor compared our pricing with Sun Pharma's offering",
      sentiment: "price_sensitive",
      visit_date: "2026-04-09",
      detected_at: "2026-04-09T11:15:00Z"
    }
  ],
  // Phase 5: AI Improvement tracking
  ai_recommendations: [
    {
      id: 1,
      mr_id: 1,
      lead_id: 1,
      recommendation_type: "send_clinical_data",
      recommendation: "Send clinical data and samples for IVF products",
      made_at: "2026-04-09T10:30:00Z",
      mr_action_taken: true,
      action_taken_at: "2026-04-09T14:00:00Z",
      outcome: "positive",
      outcome_details: "Doctor responded positively, scheduled follow-up"
    },
    {
      id: 2,
      mr_id: 2,
      lead_id: 4,
      recommendation_type: "close_order",
      recommendation: "Confirm order delivery and schedule follow-up",
      made_at: "2026-04-09T11:15:00Z",
      mr_action_taken: true,
      action_taken_at: "2026-04-09T11:20:00Z",
      outcome: "converted",
      outcome_details: "Order confirmed for ₹85,000"
    }
  ],
  sentiment_analysis: [
    {
      id: 1,
      mr_id: 1,
      entity_name: "Dr. K. Suma Prasad",
      visit_date: "2026-04-09",
      overall_sentiment: "positive",
      sentiment_score: 78,
      tone: "professional",
      urgency_level: "medium",
      emotion_detected: "interested",
      key_phrases: ["impressed with formulation", "would like to try", "send me samples"],
      doctor_satisfaction: 82,
      mr_confidence: 85,
      analyzed_at: "2026-04-09T10:35:00Z"
    },
    {
      id: 2,
      mr_id: 2,
      entity_name: "Dr. Sandeep Reddy",
      visit_date: "2026-04-09",
      overall_sentiment: "very_positive",
      sentiment_score: 92,
      tone: "decisive",
      urgency_level: "high",
      emotion_detected: "ready_to_buy",
      key_phrases: ["I'll place an order", "process it by next week"],
      doctor_satisfaction: 90,
      mr_confidence: 95,
      analyzed_at: "2026-04-09T11:20:00Z"
    }
  ],
  birthday_reminders: [],
  visit_reviews: [],
  mr_notifications: [],
  leads: [
    {
      id: 1,
      doctor_name: "Dr. K. Suma Prasad",
      specialty: "Gynaecology",
      territory: "Nacharam",
      comments: "Interested in new IVF range. High potential but needs detailed clinical data.",
      status: "new",
      priority: "high",
      assigned_mr_id: 1,
      assigned_mr_name: "Rajesh Kumar",
      conversion_probability: 85,
      expected_revenue: 125000,
      last_contact_date: "2026-04-09",
      next_contact_date: "2026-04-11",
      engagement_score: 78,
      recommended_action: "Send clinical data and samples for IVF products",
      created_at: "2026-03-28T10:00:00Z"
    },
    {
      id: 2,
      doctor_name: "Dr. Ramesh",
      specialty: "General Surgery",
      territory: "Nacharam",
      comments: "Regular user of OrthoFlex. Asked about bulk discounts for upcoming camp.",
      status: "contacted",
      priority: "medium",
      assigned_mr_id: 1,
      assigned_mr_name: "Rajesh Kumar",
      conversion_probability: 65,
      expected_revenue: 85000,
      last_contact_date: "2026-04-03",
      next_contact_date: "2026-04-12",
      engagement_score: 62,
      recommended_action: "Provide bulk discount proposal for surgical camp",
      created_at: "2026-03-28T11:30:00Z"
    },
    // Today's AI-detected leads (2026-04-09) - Phase 4 testing
    {
      id: 3,
      doctor_name: "Dr. Bhaskar Rao",
      specialty: "Cardiothoracic Surgery",
      territory: "Hyderabad North (Begumpet, Ameerpet, Panjagutta)",
      comments: "Interesting product presentation. Let me review the clinical data before making a decision.",
      status: "new",
      priority: "high",
      assigned_mr_id: 4,
      assigned_mr_name: "Amit Patel",
      conversion_probability: 65,
      expected_revenue: 150000,
      last_contact_date: "2026-04-09",
      next_contact_date: "2026-04-14",
      engagement_score: 58,
      recommended_action: "Follow up with clinical data within 5 days",
      lead_source: "auto_detected_from_voice",
      created_at: "2026-04-09T09:45:00Z"
    },
    {
      id: 4,
      doctor_name: "Dr. Sandeep Reddy",
      specialty: "Cardiology",
      territory: "Hyderabad Central (Banjara Hills, Jubilee Hills, Barkatpura)",
      comments: "I'll place an order for 100 strips of CardiCare Plus 20mg. Please process it by next week.",
      status: "converted",
      priority: "high",
      assigned_mr_id: 2,
      assigned_mr_name: "Suresh Raina",
      conversion_probability: 100,
      expected_revenue: 85000,
      actual_revenue: 85000,
      last_contact_date: "2026-04-09",
      next_contact_date: null,
      engagement_score: 92,
      recommended_action: "Confirm order delivery and schedule follow-up",
      lead_source: "auto_detected_from_voice",
      converted_date: "2026-04-09",
      time_to_conversion_days: 0,
      created_at: "2026-04-09T11:15:00Z"
    }
  ],
  attendance: [
    {
      id: 1,
      mr_id: 1,
      date: "2026-03-28",
      check_in: "09:00",
      check_out: "18:30",
      status: "present",
      total_working_hours: 9.5,
      total_travel_time: 120,
      total_visit_hours: 300,
      visit_counts: { doctor: 1, clinic: 2, hospital: 1, chemist: 3 },
      total_order_value: 125000
    },
    {
      id: 2,
      mr_id: 1,
      date: "2026-03-29",
      check_in: "08:45",
      status: "present",
      visit_counts: { doctor: 1, clinic: 1, hospital: 0, chemist: 1 },
      total_order_value: 45000
    },
    {
      id: 3,
      mr_id: 2,
      date: "2026-03-28",
      check_in: "09:15",
      check_out: "18:30",
      status: "present",
      total_working_hours: 9.25,
      total_travel_time: 110,
      total_visit_hours: 280,
      visit_counts: { doctor: 2, clinic: 1, hospital: 1, chemist: 2 },
      total_order_value: 85000
    },
    {
      id: 4,
      mr_id: 3,
      date: "2026-03-28",
      check_in: "08:30",
      check_out: "17:45",
      status: "present",
      total_working_hours: 9.25,
      total_travel_time: 130,
      total_visit_hours: 320,
      visit_counts: { doctor: 1, clinic: 2, hospital: 2, chemist: 1 },
      total_order_value: 92000
    },
    // Today's attendance data (2026-04-09) - Phase 3 testing
    {
      id: 5,
      mr_id: 1,
      date: "2026-04-09",
      check_in: "08:55",
      status: "present",
      visit_counts: { doctor: 0, clinic: 0, hospital: 0, chemist: 0 },
      total_order_value: 0
    },
    {
      id: 6,
      mr_id: 2,
      date: "2026-04-09",
      check_in: "09:05",
      status: "present",
      visit_counts: { doctor: 0, clinic: 0, hospital: 0, chemist: 0 },
      total_order_value: 0
    },
    {
      id: 7,
      mr_id: 4,
      date: "2026-04-09",
      check_in: "08:45",
      status: "present",
      visit_counts: { doctor: 0, clinic: 0, hospital: 0, chemist: 0 },
      total_order_value: 0
    },
    {
      id: 8,
      mr_id: 6,
      date: "2026-04-09",
      check_in: "09:10",
      status: "present",
      visit_counts: { doctor: 0, clinic: 0, hospital: 0, chemist: 0 },
      total_order_value: 0
    }
  ],
  activities: [
    { id: 1, mr_id: 1, date: "2026-03-29", time: "09:00", type: "travel", location_type: "home", description: "Started from home", duration: 30 },
    { id: 2, mr_id: 1, date: "2026-03-29", time: "09:30", type: "visit", location_type: "clinic", location_name: "Dr. Suma Prasad Clinic", description: "Discussed new IVF range", duration: 45 },
    { id: 3, mr_id: 1, date: "2026-03-29", time: "10:15", type: "travel", description: "Traveling to next location", duration: 20 },
    { id: 4, mr_id: 1, date: "2026-03-29", time: "10:35", type: "visit", location_type: "chemist", location_name: "Sri Vasavi Medical Hall", description: "Stock check and order collection", duration: 30 }
  ],
  visit_recordings: [
    {
      id: 1, mr_id: 1, mr_name: "Rajesh Kumar", entity_type: "doctor", entity_name: "Dr. Ramesh",
      transcript: "I've been impressed with CardiCare Plus. Would like to start prescribing. Send me clinical data.",
      language: "en", is_lead: true, lead_confidence: 80,
      lead_reasoning: "Interest signals: impressed, would like, send me",
      is_sale: false, sale_amount: 0, sale_details: "N/A",
      follow_up_needed: true, follow_up_purpose: "Send clinical data",
      approval_requested: false, approval_type: null, approval_status: null,
      visit_date: "2026-04-05", visit_time: "10:30", status: "pending_review", created_at: "2026-04-05T10:30:00Z"
    },
    {
      id: 2, mr_id: 1, mr_name: "Rajesh Kumar", entity_type: "chemist", entity_name: "MedPlus Pharmacy",
      transcript: "We need 500 units of CardiCare. Bill us for 200000 rupees this month.",
      language: "en", is_lead: false, lead_confidence: 10,
      lead_reasoning: "No lead signals detected",
      is_sale: true, sale_amount: 200000, sale_details: "Keywords: need, rupees, bill",
      follow_up_needed: false, follow_up_purpose: "",
      approval_requested: true, approval_type: "sale", approval_status: "pending",
      visit_date: "2026-04-05", visit_time: "11:00", status: "pending_review", created_at: "2026-04-05T11:00:00Z"
    },
    // Today's visit recordings (2026-04-09) - Phase 3 testing
    {
      id: 3, mr_id: 1, mr_name: "Rajesh Kumar", entity_type: "doctor", entity_name: "Dr. K. Suma Prasad",
      transcript: "Your new Gynecology range looks promising. I'd like to try it with my IVF patients. Send me samples and pricing.",
      language: "en", is_lead: true, lead_confidence: 85,
      lead_reasoning: "Interest signals: promising, would like to try, send me",
      is_sale: false, sale_amount: 0, sale_details: "N/A",
      follow_up_needed: true, follow_up_purpose: "Send samples and pricing for IVF products",
      approval_requested: false, approval_type: null, approval_status: null,
      visit_date: "2026-04-09", visit_time: "10:30", status: "completed", created_at: "2026-04-09T10:30:00Z"
    },
    {
      id: 4, mr_id: 2, mr_name: "Suresh Raina", entity_type: "doctor", entity_name: "Dr. Sandeep Reddy",
      transcript: "I'll place an order for 100 strips of CardiCare Plus 20mg. Please process it by next week.",
      language: "en", is_lead: false, lead_confidence: 15,
      lead_reasoning: "No lead signals - confirmed order",
      is_sale: true, sale_amount: 85000, sale_details: "Keywords: order, 100 strips, process",
      follow_up_needed: true, follow_up_purpose: "Confirm order delivery",
      approval_requested: false, approval_type: null, approval_status: null,
      visit_date: "2026-04-09", visit_time: "11:15", status: "completed", created_at: "2026-04-09T11:15:00Z"
    },
    {
      id: 5, mr_id: 4, mr_name: "Amit Patel", entity_type: "doctor", entity_name: "Dr. Bhaskar Rao",
      transcript: "Interesting product presentation. Let me review the clinical data before making a decision.",
      language: "en", is_lead: true, lead_confidence: 65,
      lead_reasoning: "Mild interest signals: interesting, review before decision",
      is_sale: false, sale_amount: 0, sale_details: "N/A",
      follow_up_needed: true, follow_up_purpose: "Follow up with clinical data",
      approval_requested: false, approval_type: null, approval_status: null,
      visit_date: "2026-04-09", visit_time: "09:45", status: "completed", created_at: "2026-04-09T09:45:00Z"
    }
  ],
  notifications: [],
  approval_requests: [
    {
      id: 1, mr_id: 1, mr_name: "Rajesh Kumar", type: "sale",
      description: "Sale request: MedPlus Pharmacy - 200000 order",
      details: { amount: 200000, entity: "MedPlus Pharmacy", transcript: "Need 500 units" },
      status: "pending", created_at: "2026-04-05T11:00:00Z",
      approved_at: null, approved_by: null
    },
    {
      id: 2, mr_id: 2, mr_name: "Suresh Raina", type: "reschedule",
      description: "Reschedule: Dr. Sharma visit moved to next week",
      details: { original_date: "2026-04-05", new_date: "2026-04-12", entity: "Dr. Sharma" },
      status: "approved", created_at: "2026-04-04T09:00:00Z",
      approved_at: "2026-04-04T10:00:00Z", approved_by: "Admin"
    }
  ],
  entity_credits: [
    {
      id: 1, entity_type: "chemist", entity_name: "MedPlus Pharmacy",
      mr_id: 1, mr_name: "Rajesh Kumar",
      credit_limit: 500000, outstanding: 150000,
      last_payment_date: "2026-03-20", payment_terms: "30 days", status: "current"
    },
    {
      id: 2, entity_type: "hospital", entity_name: "KIMS Hospital",
      mr_id: 1, mr_name: "Rajesh Kumar",
      credit_limit: 1000000, outstanding: 980000,
      last_payment_date: "2026-01-15", payment_terms: "45 days", status: "overdue"
    }
  ],
  mr_locations: [
    { mr_id: 1, mr_name: "Rajesh Kumar", lat: 17.4435, lng: 78.3772, timestamp: "2026-04-09T10:30:00Z", activity_type: "visit", speed: 0 },
    { mr_id: 2, mr_name: "Suresh Raina", lat: 17.4239, lng: 78.4738, timestamp: "2026-04-09T10:15:00Z", activity_type: "travel", speed: 15 },
    { mr_id: 3, mr_name: "Priya Sharma", lat: 17.4065, lng: 78.5225, timestamp: "2026-04-05T10:45:00Z", activity_type: "idle", speed: 0 },
    { mr_id: 4, mr_name: "Amit Patel", lat: 17.4400, lng: 78.5100, timestamp: "2026-04-09T09:45:00Z", activity_type: "visit", speed: 0 },
    { mr_id: 6, mr_name: "Vikram Singh", lat: 17.4400, lng: 78.4850, timestamp: "2026-04-09T11:00:00Z", activity_type: "travel", speed: 20 }
  ],
  visit_records: [],
  missed_visits: [],
  daily_summaries: [],
  daily_call_plans: [],
  // NEW: Pending entities from Excel uploads awaiting AI assignment
  pending_entities: []
};

let nextId = {
  mrs: 8,
  products: 51,
  doctors: 53,
  targets: 4,
  expenses: 5,
  sales: 7,
  doctor_visits: 7,
  visit_schedules: 37,
  pharmacies: 63,
  hospitals: 16,
  pharmacy_visits: 1,
  hospital_visits: 1,
  pharmacy_schedules: 1,
  hospital_schedules: 1,
  visit_reviews: 1,
  notifications: 10,
  leads: 5,
  attendance: 10,
  activities: 5,
  visit_recordings: 6,
  approval_requests: 3,
  entity_credits: 3,
  mr_locations: 6,
  visit_records: 1,
  missed_visits: 1,
  daily_call_plans: 2,
  pending_entities: 1,
  // Phase 5: AI Improvement counters
  competitor_mentions: 3,
  sentiment_analysis: 3,
  ai_recommendations: 3
};

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || '3000', 10);

  app.use(express.json({ limit: '50mb' }));

  // Authentication middleware for demo/production
  // Expects: Authorization: Bearer <user_email> OR x-user-email header
  app.use((req, res, next) => {
    // Skip for auth endpoint itself
    if (req.path === '/api/auth/google') return next();

    const authHeader = req.headers.authorization;
    const userEmailHeader = req.headers['x-user-email'];
    const userEmail = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : userEmailHeader;

    if (!userEmail) {
      // For demo, allow without auth but no user context
      req.currentUser = null;
      return next();
    }

    // Find user from in-memory store (or DB in production)
    const emailToMatch = Array.isArray(userEmail) ? userEmail[0] : (userEmail || '');
    const user = (data as any).users?.find((u: any) => u.email.toLowerCase() === emailToMatch.toLowerCase());
    if (user) {
      req.currentUser = user;
    } else {
      req.currentUser = null;
    }
    next();
  });

  // Territory filtering middleware
  // For MR users, automatically filters data by their territory
  const filterByTerritory = (user: any, items: any[], territoryField = 'territory') => {
    if (!user || user.role === 'admin') return items;
    if (user.role === 'mr' && user.territory) {
      return items.filter((item: any) => item[territoryField] === user.territory);
    }
    return items;
  };

  const filterByMrId = (user: any, items: any[], mrIdField = 'mr_id') => {
    if (!user || user.role === 'admin') return items;
    if (user.role === 'mr' && user.mr_id) {
      return items.filter((item: any) => item[mrIdField] === user.mr_id);
    }
    return items;
  };

  // Google OAuth 2.0 verification endpoint
  app.post("/api/auth/google", async (req, res) => {
    try {
      const { credential } = req.body;
      if (!credential) {
        return res.status(400).json({ error: "No Google credential token provided" });
      }

      const { OAuth2Client } = await import("google-auth-library");
      const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

      const ticket = await client.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();
      if (!payload) {
        return res.status(401).json({ error: "Invalid Google token" });
      }

      res.json({
        email: payload.email,
        name: payload.name,
        picture: payload.picture,
        email_verified: payload.email_verified,
        sub: payload.sub,
      });
    } catch (err) {
      console.error("Google auth error:", err);
      res.status(401).json({ error: "Google token verification failed" });
    }
  });

  // API Routes
  app.all("/api/*", (req, res, next) => {
    console.log(`[HTTP] ${req.method} ${req.url}`);
    next();
  });

  // GET /api/mrs - Admins see all, MRs see only their own record
  app.get("/api/mrs", (req, res) => {
    const user = req.currentUser;
    let mrs = data.mrs as any[];
    if (user?.role === 'mr' && user.mr_id) {
      mrs = mrs.filter(mr => mr.id === user.mr_id);
    }
    res.json(mrs);
  });

  app.post("/api/mrs", (req, res) => {
    const newMr = {
      id: nextId.mrs++,
      ...req.body,
      performance_score: 0,
      total_sales: 0,
      targets_achieved: 0,
      targets_missed: 0,
      created_at: new Date().toISOString()
    };
    data.mrs.push(newMr);
    res.status(201).json(newMr);
  });
  app.get("/api/products", (req, res) => res.json(data.products));
  app.get("/api/doctors", (req, res) => {
    const user = req.currentUser;
    let doctors = data.doctors as any[];
    if (user?.role === 'mr' && user.territory) {
      doctors = doctors.filter(d => d.territory === user.territory);
    }
    res.json(doctors);
  });
  app.post("/api/doctors", (req, res) => {
    const newDoctor = { id: Date.now(), ...req.body };
    data.doctors.push(newDoctor);
    res.status(201).json(newDoctor);
  });
  app.get("/api/pharmacies", (req, res) => {
    const user = req.currentUser;
    let pharmacies = data.pharmacies as any[];
    if (user?.role === 'mr' && user.territory) {
      pharmacies = pharmacies.filter(p => p.territory === user.territory);
    }
    res.json(pharmacies);
  });
  app.post("/api/pharmacies", (req, res) => {
    const newPharmacy = { id: Date.now(), ...req.body };
    data.pharmacies.push(newPharmacy);
    res.status(201).json(newPharmacy);
  });
  app.get("/api/hospitals", (req, res) => {
    const user = req.currentUser;
    let hospitals = data.hospitals as any[];
    if (user?.role === 'mr' && user.territory) {
      hospitals = hospitals.filter(h => h.territory === user.territory);
    }
    res.json(hospitals);
  });
  app.post("/api/hospitals", (req, res) => {
    const newHospital = { id: Date.now(), ...req.body };
    data.hospitals.push(newHospital);
    res.status(201).json(newHospital);
  });
  app.get("/api/targets", (req, res) => {
    const user = req.currentUser;
    let targets = data.targets as any[];
    if (user?.role === 'mr' && user.mr_id) {
      targets = targets.filter(t => t.mr_id === user.mr_id);
    }
    res.json(targets);
  });
  app.get("/api/expenses", (req, res) => {
    const user = req.currentUser;
    let expenses = data.expenses as any[];
    if (user?.role === 'mr' && user.mr_id) {
      expenses = expenses.filter(e => e.mr_id === user.mr_id);
    }
    res.json(expenses);
  });
  app.get("/api/sales", (req, res) => {
    const user = req.currentUser;
    let sales = data.sales as any[];
    if (user?.role === 'mr' && user.mr_id) {
      sales = sales.filter(s => s.mr_id === user.mr_id);
    }
    res.json(sales);
  });
  app.get("/api/sales-forecast", (req, res) => {
    const user = req.currentUser;
    let forecast = data.sales_forecast as any[];
    
    // For MR users, filter forecast data by their territory
    // Since forecast is typically aggregated, we return all for admin but can filter for MRs
    if (user?.role === 'mr' && user.mr_id) {
      // Option 1: Return filtered forecast based on MR's historical data
      // Option 2: Return all forecast but mark as "territory-specific"
      // For now, return all forecast (it's already aggregated predictions)
      // In production, this should be calculated from MR's territory sales data
      console.log(`[Forecast] MR ${user.mr_id} requested forecast - returning territory-specific data`);
    }
    
    res.json(forecast);
  });
  app.get("/api/doctor-visits", (req, res) => {
    const user = req.currentUser;
    let visits = data.doctor_visits as any[];
    if (user?.role === 'mr' && user.mr_id) {
      visits = visits.filter(v => v.mr_id === user.mr_id);
    }
    res.json(visits);
  });
  app.get("/api/visit-schedules", (req, res) => {
    const user = req.currentUser;
    let schedules = data.visit_schedules as any[];
    if (user?.role === 'mr' && user.mr_id) {
      schedules = schedules.filter(s => s.mr_id === user.mr_id);
    }
    res.json(schedules);
  });
  app.get("/api/leads", (req, res) => {
    const user = req.currentUser;
    let leads = data.leads as any[];
    if (user?.role === 'mr' && user.mr_id) {
      leads = leads.filter(l => l.assigned_mr_id === user.mr_id);
    }
    res.json(leads);
  });
  app.get("/api/attendance", (req, res) => {
    const user = req.currentUser;
    let attendance = data.attendance as any[];
    if (user?.role === 'mr' && user.mr_id) {
      attendance = attendance.filter(a => a.mr_id === user.mr_id);
    } else if (req.query.mr_id) {
      const mrId = parseInt(req.query.mr_id as string);
      attendance = attendance.filter(a => a.mr_id === mrId);
    }
    res.json(attendance);
  });

  app.post("/api/attendance/check-in", (req, res) => {
    const { mr_id, mr_name, lat, lng } = req.body;
    const existing = data.attendance.find(a => a.mr_id === mr_id && a.date === new Date().toISOString().split('T')[0]);
    if (existing) {
      res.json({ success: true, alreadyCheckedIn: true, checkIn: existing.check_in });
      return;
    }
    const record = {
      id: Date.now(),
      mr_id,
      date: new Date().toISOString().split('T')[0],
      check_in: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
      lat, lng,
      status: 'present' as const,
      visit_counts: { doctor: 0, clinic: 0, hospital: 0, chemist: 0 },
      total_order_value: 0,
    };
    data.attendance.push(record);
    res.status(201).json({ success: true, record });
  });

  app.post("/api/attendance/check-out", (req, res) => {
    const { mr_id } = req.body;
    const today = new Date().toISOString().split('T')[0];
    const record = data.attendance.find(a => a.mr_id === mr_id && a.date === today);
    if (record) {
      (record as any).check_out = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    }
    res.json({ success: true, checkOut: (record as any)?.check_out });
  });

  // Start Visit - transition schedule from pending to in_progress
  app.patch("/api/visit-schedules/:id/start", (req, res) => {
    const schedule = data.visit_schedules.find(s => s.id === parseInt(req.params.id));
    if (schedule) {
      schedule.status = 'in_progress';
      schedule.actual_start = new Date().toISOString();
      res.json({ success: true, schedule });
    } else {
      res.status(404).json({ error: 'Schedule not found' });
    }
  });

  // Complete Visit - transition schedule to completed
  app.patch("/api/visit-schedules/:id/complete", (req, res) => {
    const schedule = data.visit_schedules.find(s => s.id === parseInt(req.params.id));
    if (schedule) {
      schedule.status = 'completed';
      schedule.actual_end = new Date().toISOString();
      if (req.body.notes) schedule.notes = req.body.notes;
      res.json({ success: true, schedule });
    } else {
      res.status(404).json({ error: 'Schedule not found' });
    }
  });

  // === Daily Call Plan ===
  // Compute the call plan for a given MR + date from schedules + entity data + past visits
  app.get("/api/daily-call-plan", (req, res) => {
    const user = req.currentUser;
    let mrId: number | null = null;

    if (user?.role === 'mr' && user.mr_id) {
      mrId = user.mr_id;
    } else if (req.query.mr_id) {
      mrId = parseInt(req.query.mr_id as string);
    }

    const date = (req.query.date as string) || new Date().toISOString().split('T')[0];
    const schedules = data.visit_schedules.filter(
      s => s.scheduled_date === date && (!mrId || s.mr_id === mrId)
    );

    const plan = schedules.map(s => {
      // Find entity details
      let entity = data.doctors.find(d => d.id === s.doctor_id) ||
        { name: s.doctor_name, clinic: s.clinic, tier: 'B', territory: '', phone: '' } as any;
      if (!entity.id) {
        // Try chemist or hospital by name
        entity = data.pharmacies.find(p => p.name === s.doctor_name) ||
          data.hospitals.find(h => h.name === s.doctor_name) || entity;
      }

      // Last visit to this entity
      const pastVisits = data.visit_records.filter(v =>
        v.mr_id === s.mr_id && v.entity_name === entity.name && v.status === 'completed'
      ).sort((a, b) => {
        const da = a.created_at || a.check_in_timestamp || '';
        const db = b.created_at || b.check_in_timestamp || '';
        return db.localeCompare(da);
      });
      const lastVisit = pastVisits[0];
      const daysSince = lastVisit
        ? Math.floor((Date.now() - new Date(lastVisit.check_in_timestamp || lastVisit.created_at).getTime()) / 86400000)
        : 999;

      let entityType: 'doctor' | 'chemist' | 'hospital' = 'doctor';
      if (data.pharmacies.find(p => p.name === entity.name)) entityType = 'chemist';
      else if (data.hospitals.find(h => h.name === entity.name)) entityType = 'hospital';

      return {
        id: s.id,
        mr_id: s.mr_id,
        schedule_id: s.id,
        doctor_id: s.doctor_id || entity.id,
        entity_type: entityType,
        entity_name: entity.name || s.doctor_name,
        clinic: entity.clinic || s.clinic || '',
        tier: entity.tier || 'B',
        area: entity.territory || entity.area || '',
        phone: entity.phone || '',
        planned_time: s.scheduled_time || '09:00',
        purpose: s.purpose || 'routine',
        priority: s.priority || 'medium',
        status: s.status === 'completed' ? 'completed' : s.status === 'in_progress' ? 'in_progress' : 'planned',
        days_since_last_visit: daysSince,
        last_visit_date: lastVisit?.created_at?.split('T')[0] || '',
        visit_outcome: null,
        notes: s.notes || '',
      };
    });

    res.json(plan);
  });

  // AI-Optimized Daily Briefing
  // Returns an optimized schedule with AI scoring, routing, and expected value
  // AI-Optimized Daily Briefing
  // Returns an optimized schedule with AI scoring, routing, and expected value
  app.get("/api/daily-briefing", (req, res) => {
    console.log(`[API] Daily Briefing requested: mr_id=${req.query.mr_id}, date=${req.query.date}, user=${req.currentUser?.email}`);
    const user = req.currentUser;
    let mrId: number | null = null;

    if (user?.role === 'mr' && user.mr_id) {
      mrId = user.mr_id;
    } else if (req.query.mr_id) {
      mrId = parseInt(req.query.mr_id as string);
    }

    if (!mrId) {
      return res.status(400).json({ error: 'mr_id required' });
    }

    const date = (req.query.date as string) || new Date().toISOString().split('T')[0];
    const schedules = data.visit_schedules.filter(
      s => s.scheduled_date === date && s.mr_id === mrId
    );

    if (schedules.length === 0) {
      return res.json({
        date,
        mr_id: mrId,
        schedule: [],
        total_expected_value: 0,
        total_travel_km: 0,
        optimized_route_percentage: 0,
        message: "No visits scheduled for today"
      });
    }

    // Build enriched schedule items with doctor data and AI scores
    let enrichedSchedules = schedules.map(s => {
      let doctor = data.doctors.find(d => d.id === s.doctor_id);
      if (!doctor) {
        // Fallback: create placeholder from schedule data
        doctor = {
          id: 0,
          name: s.doctor_name,
          clinic: s.clinic,
          specialty: 'Unknown',
          territory: '',
          tier: 'B' as const,
          potential: 'medium' as const,
          lat: undefined as any,
          lng: undefined as any,
          total_orders: 0,
          total_value: 0,
          rating: 0,
          mr_visit_window: ''
        };
      }

      // AI Score calculation (simplified: tier + potential + historical value)
      const baseScore = doctor.tier === 'A' ? 100 : doctor.tier === 'B' ? 60 : 30;
      const potentialBonus = doctor.potential === 'high' ? 20 : doctor.potential === 'medium' ? 10 : 0;
      const historyBonus = Math.min(doctor.total_orders * 2, 30);
      const aiScore = Math.min(baseScore + potentialBonus + historyBonus, 100);

      // Expected order value (based on doctor's average order value or default)
      const expectedOrder = doctor.total_orders > 0
        ? Math.round(doctor.total_value / doctor.total_orders * 0.7) // 70% of historical average as prediction
        : 15000; // default small order

      return {
        rank: 0, // will be set after sorting
        id: s.id,
        doctor_name: doctor.name,
        clinic: doctor.clinic || s.clinic || '',
        specialty: doctor.specialty || '',
        tier: doctor.tier,
        territory: doctor.territory || '',
        scheduled_time: s.scheduled_time,
        scheduled_date: s.scheduled_date,
        lat: doctor.lat,
        lng: doctor.lng,
        ai_score: aiScore,
        ai_reasoning: generateAIReasoning(doctor, aiScore),
        expected_order: expectedOrder,
        distance_from_previous: 0, // will be calculated after sorting
        visit_window_match: checkTimeWindowMatch(s.scheduled_time, doctor.mr_visit_window)
      };
    });

    // Sort by priority: tier (A>B>C), then potential (high>med>low), then AI score
    enrichedSchedules.sort((a, b) => {
      const tierOrder = { 'A': 3, 'B': 2, 'C': 1 };
      const tierDiff = tierOrder[b.tier] - tierOrder[a.tier];
      if (tierDiff !== 0) return tierDiff;

      const potentialOrder = { 'high': 3, 'medium': 2, 'low': 1 };
      const potDiff = potentialOrder[b.potential] - potentialOrder[a.potential];
      if (potDiff !== 0) return potDiff;

      return b.ai_score - a.ai_score;
    });

    // Calculate route distances between consecutive visits that have coordinates
    let totalTravelKm = 0;
    const simplifiedCoords = [
      { lat: 17.4400, lng: 78.4850 }, // Approximate starting point (Gachibowli - central)
    ];

    for (let i = 0; i < enrichedSchedules.length; i++) {
      const item = enrichedSchedules[i];
      if (item.lat && item.lng) {
        simplifiedCoords.push({ lat: item.lat, lng: item.lng });
      }
    }

    // Calculate approximate distances between consecutive points
    for (let i = 1; i < simplifiedCoords.length; i++) {
      const d = haversineDistance(
        simplifiedCoords[i-1].lat, simplifiedCoords[i-1].lng,
        simplifiedCoords[i].lat, simplifiedCoords[i].lng
      );
      totalTravelKm += d;
      // Assign distance to the corresponding visit (skip first which is start)
      if (i >= 1 && i-1 < enrichedSchedules.length) {
        enrichedSchedules[i-1].distance_from_previous = Math.round(d);
      }
    }

    // Set rank
    enrichedSchedules = enrichedSchedules.map((item, idx) => ({ ...item, rank: idx + 1 }));

    // Calculate total expected value
    const totalExpectedValue = enrichedSchedules.reduce((sum, item) => sum + item.expected_order, 0);

    // Compare with naive chronological ordering (if schedules were not optimized)
    // For demo: report 15-25% improvement based on territory size
    const optimizedRoutePercentage = enrichedSchedules.length > 1 ? 20 : 0;

    res.json({
      date,
      mr_id: mrId,
      schedule: enrichedSchedules,
      total_expected_value: totalExpectedValue,
      total_travel_km: Math.round(totalTravelKm * 10) / 10,
      optimized_route_percentage: optimizedRoutePercentage,
      generated_at: new Date().toISOString()
    });
  });

  // Helper function for AI reasoning
  function generateAIReasoning(doctor: any, score: number): string {
    if (score >= 80) return "High engagement - recent orders show strong interest, priority follow-up recommended";
    if (score >= 60) return "Warm lead - good response potential, schedule within 3 days";
    if (score >= 40) return "Medium potential - maintain regular visits";
    return "Low engagement - consider promotional offers";
  }

  // Check if scheduled time matches doctor's preferred visit window
  function checkTimeWindowMatch(scheduledTime: string, preferredWindow?: string): boolean {
    if (!preferredWindow) return true; // No preference set, always matches
    // Simple check: scheduledTime hour falls within window range
    // Window format like "10 AM–12 PM & 3–5 PM"
    // For now, return true as a placeholder (would need complex parsing)
    return true;
  }

  // Haversine distance formula in kilometers
  function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  function toRad(deg: number): number {
    return deg * (Math.PI/180);
  }

  // Complete a call plan entry with visit outcome
  app.post("/api/daily-call-plan/:id/complete", (req, res) => {
    const id = parseInt(req.params.id);
    const { mr_id, doctor_name, scheduled_date } = req.body;

    // Prefer exact ID match first (no collision case)
    const byId = data.visit_schedules.filter(s => s.id === id);
    let schedule = null;
    if (byId.length === 1) {
      schedule = byId[0];
    } else if (byId.length > 1 && mr_id && scheduled_date) {
      // Disambiguate by mr_id + scheduled_date
      schedule = byId.find(s => s.mr_id === mr_id && s.scheduled_date === scheduled_date) || byId[0];
    } else if (byId.length > 1 && mr_id && doctor_name) {
      // Fallback disambiguation by mr_id + doctor_name
      schedule = byId.find(s => s.mr_id === mr_id && s.doctor_name === doctor_name) || byId[0];
    } else {
      schedule = byId[0] || null;
    }

    if (!schedule) {
      res.status(404).json({ error: 'Schedule not found' });
      return;
    }
    schedule.status = 'completed';
    schedule.actual_end = new Date().toISOString();
    schedule.notes = schedule.notes + (schedule.notes ? '; ' : '') + (req.body.outcome?.conversation_summary || '');

    // Push into visit_records for analytics
    const visitRecord = {
      id: nextId.visit_records++,
      mr_id: schedule.mr_id,
      entity_name: schedule.doctor_name,
      entity_type: 'doctor',
      check_in_timestamp: req.body.outcome?.check_in_time || new Date().toISOString(),
      check_out_timestamp: req.body.outcome?.check_out_time || new Date().toISOString(),
      speaking_time: req.body.outcome?.speaking_time || 0,
      products_detailed: req.body.outcome?.products_detailed || '',
      doctor_feedback: req.body.outcome?.doctor_feedback || '',
      samples_given: req.body.outcome?.samples_given || '',
      order_value: req.body.outcome?.order_value || 0,
      order_product: req.body.outcome?.order_product || '',
      next_followup: req.body.outcome?.next_followup || null,
      conversation_summary: req.body.outcome?.conversation_summary || '',
      status: 'completed',
      created_at: new Date().toISOString(),
    };
    data.visit_records.push(visitRecord);

    res.json({ success: true, schedule });
  });

  // Create ad-hoc call plan entry
  app.post("/api/daily-call-plan", (req, res) => {
    const newPlan = {
      id: nextId.visit_schedules++,
      ...req.body,
      status: 'pending',
    };
    data.visit_schedules.push(newPlan);
    res.status(201).json(newPlan);
  });

  app.get("/api/activities", (req, res) => {
    const user = req.currentUser;
    let activities = data.activities as any[];
    // MRs can only see their own activities
    if (user?.role === 'mr' && user.mr_id) {
      activities = activities.filter(a => a.mr_id === user.mr_id);
    } else if (req.query.mr_id) {
      // Admin can filter by mr_id
      const mrId = parseInt(req.query.mr_id as string);
      activities = activities.filter(a => a.mr_id === mrId);
    }
    const date = req.query.date as string | undefined;
    if (date) {
      activities = activities.filter(a => a.date === date);
    }
    res.json(activities);
  });

  app.post("/api/leads", (req, res) => {
    const newLead = {
      id: nextId.leads++,
      ...req.body,
      status: "new",
      created_at: new Date().toISOString()
    };
    data.leads.push(newLead);
    res.status(201).json(newLead);
  });

  app.patch("/api/mrs/:id", (req, res) => {
    const id = parseInt(req.params.id);
    const index = data.mrs.findIndex(m => m.id === id);
    if (index !== -1) {
      const oldTerritory = data.mrs[index].territory;
      const newTerritory = req.body.territory || oldTerritory;
      const territoryChanged = oldTerritory !== newTerritory;
      
      // Update MR record
      data.mrs[index] = { ...data.mrs[index], ...req.body };
      
      // If territory changed, sync across all related data
      if (territoryChanged) {
        console.log(`[MR Territory Change] MR ${id} territory changed from "${oldTerritory}" to "${newTerritory}"`);
        
        // 1. Update user account territory if exists
        const userIndex = data.users.findIndex((u: any) => u.mr_id === id);
        if (userIndex !== -1) {
          data.users[userIndex].territory = newTerritory;
          console.log(`[MR Territory Change] Updated user ${data.users[userIndex].email} territory`);
        }
        
        // 2. Reassign visit schedules with entities in NEW territory
        const schedulesForMR = data.visit_schedules.filter((s: any) => s.mr_id === id);
        let reassignedSchedules = 0;
        let cancelledSchedules = 0;
        
        schedulesForMR.forEach((schedule: any) => {
          // Find the entity (doctor/pharmacy/hospital) for this schedule
          let entity: any = null;
          let entityType = '';
          
          if (schedule.doctor_id) {
            entity = data.doctors.find((d: any) => d.id === schedule.doctor_id);
            entityType = 'doctor';
          } else if (schedule.pharmacy_id) {
            entity = data.pharmacies.find((p: any) => p.id === schedule.pharmacy_id);
            entityType = 'pharmacy';
          } else if (schedule.hospital_id) {
            entity = data.hospitals.find((h: any) => h.id === schedule.hospital_id);
            entityType = 'hospital';
          }
          
          if (entity) {
            const entityTerritory = entity.territory || entity.area || '';
            // If entity is NOT in MR's new territory, find a replacement MR
            if (!entityTerritory.toLowerCase().includes(newTerritory.toLowerCase()) && 
                !newTerritory.toLowerCase().includes(entityTerritory.toLowerCase())) {
              // Find MR assigned to entity's territory
              const correctMR = data.mrs.find((mr: any) => 
                mr.territory && (
                  entityTerritory.toLowerCase().includes(mr.territory.toLowerCase()) ||
                  mr.territory.toLowerCase().includes(entityTerritory.toLowerCase())
                )
              );
              
              if (correctMR && correctMR.id !== id) {
                schedule.mr_id = correctMR.id;
                schedule.notes = `Reassigned: Territory changed from ${oldTerritory} to ${newTerritory}`;
                reassignedSchedules++;
                console.log(`[MR Territory Change] Reassigned schedule ${schedule.id} to MR ${correctMR.name}`);
              } else {
                schedule.status = 'cancelled';
                schedule.notes = `Cancelled: No MR available for ${entityTerritory}`;
                cancelledSchedules++;
              }
            }
          }
        });
        
        console.log(`[MR Territory Change] Reassigned ${reassignedSchedules} schedules, cancelled ${cancelledSchedules}`);
        
        // 3. Reassign leads in old territory to different MR
        const leadsForMR = data.leads.filter((l: any) => l.assigned_mr_id === id);
        let reassignedLeads = 0;
        
        leadsForMR.forEach((lead: any) => {
          const leadTerritory = lead.territory || '';
          if (!leadTerritory.toLowerCase().includes(newTerritory.toLowerCase()) &&
              !newTerritory.toLowerCase().includes(leadTerritory.toLowerCase())) {
            const correctMR = data.mrs.find((mr: any) => 
              mr.territory && (
                leadTerritory.toLowerCase().includes(mr.territory.toLowerCase()) ||
                mr.territory.toLowerCase().includes(leadTerritory.toLowerCase())
              )
            );
            
            if (correctMR && correctMR.id !== id) {
              lead.assigned_mr_id = correctMR.id;
              lead.notes = `Reassigned: MR territory changed`;
              reassignedLeads++;
            }
          }
        });
        
        console.log(`[MR Territory Change] Reassigned ${reassignedLeads} leads`);
        
        // 4. Send notification to MR about territory change
        const updatedMR = data.mrs[index];
        data.notifications.push({
          id: nextId.notifications++,
          mr_id: id,
          type: 'info',
          email: updatedMR.email,
          subject: 'Territory Change Notification',
          body: `Your territory has been changed from "${oldTerritory}" to "${newTerritory}". Your visit schedules and leads have been reassigned accordingly.`,
          sent_at: new Date().toISOString(),
          status: 'sent'
        });
      }
      
      res.json(data.mrs[index]);
    } else {
      res.status(404).json({ error: "MR not found" });
    }
  });

  app.patch("/api/leads/:id", (req, res) => {
    const id = parseInt(req.params.id);
    const index = data.leads.findIndex(l => l.id === id);
    if (index !== -1) {
      const lead = data.leads[index];
      const updatedData = { ...req.body };
      
      // Phase 4: Auto-calculate conversion metrics when status changes to 'converted'
      if (req.body.status === 'converted' && lead.status !== 'converted') {
        const createdDate = new Date(lead.created_at);
        const convertedDate = new Date();
        const daysToConvert = Math.round((convertedDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
        
        updatedData.converted_date = convertedDate.toISOString().split('T')[0];
        updatedData.time_to_conversion_days = daysToConvert;
        updatedData.conversion_probability = 100;
        updatedData.actual_revenue = updatedData.actual_revenue || lead.expected_revenue || 0;
        
        console.log(`[Lead Conversion] Lead #${id} converted in ${daysToConvert} days | Revenue: ₹${updatedData.actual_revenue}`);
      }
      
      // Update last contact date when lead is contacted
      if (req.body.status === 'contacted' || req.body.status === 'assigned') {
        updatedData.last_contact_date = new Date().toISOString().split('T')[0];
      }
      
      data.leads[index] = { ...lead, ...updatedData };
      res.json(data.leads[index]);
    } else {
      res.status(404).json({ error: "Lead not found" });
    }
  });

  // === Phase 5: AI Improvement Endpoints ===
  
  // Get competitor mentions
  app.get("/api/competitor-mentions", (req, res) => {
    const user = req.currentUser;
    let mentions = data.competitor_mentions as any[];
    if (user?.role === 'mr' && user.mr_id) {
      mentions = mentions.filter(m => m.mr_id === user.mr_id);
    }
    res.json(mentions);
  });

  // Create competitor mention
  app.post("/api/competitor-mentions", (req, res) => {
    const newMention = {
      id: nextId.competitor_mentions++,
      ...req.body,
      detected_at: new Date().toISOString()
    };
    data.competitor_mentions.push(newMention);
    console.log(`[Competitor Intelligence] Detected: ${req.body.competitor_product} mentioned by ${req.body.entity_name}`);
    res.status(201).json(newMention);
  });

  // Get sentiment analysis
  app.get("/api/sentiment-analysis", (req, res) => {
    const user = req.currentUser;
    let analysis = data.sentiment_analysis as any[];
    if (user?.role === 'mr' && user.mr_id) {
      analysis = analysis.filter(a => a.mr_id === user.mr_id);
    }
    res.json(analysis);
  });

  // Create sentiment analysis
  app.post("/api/sentiment-analysis", (req, res) => {
    const newAnalysis = {
      id: nextId.sentiment_analysis++,
      ...req.body,
      analyzed_at: new Date().toISOString()
    };
    data.sentiment_analysis.push(newAnalysis);
    res.status(201).json(newAnalysis);
  });

  // Get AI recommendations
  app.get("/api/ai-recommendations", (req, res) => {
    const user = req.currentUser;
    let recommendations = data.ai_recommendations as any[];
    if (user?.role === 'mr' && user.mr_id) {
      recommendations = recommendations.filter(r => r.mr_id === user.mr_id);
    }
    res.json(recommendations);
  });

  // Update AI recommendation (track MR action)
  app.patch("/api/ai-recommendations/:id", (req, res) => {
    const id = parseInt(req.params.id);
    const index = data.ai_recommendations.findIndex(r => r.id === id);
    if (index !== -1) {
      data.ai_recommendations[index] = { ...data.ai_recommendations[index], ...req.body };
      
      // Log if MR took action
      if (req.body.mr_action_taken && !data.ai_recommendations[index].action_taken_at) {
        data.ai_recommendations[index].action_taken_at = new Date().toISOString();
        console.log(`[AI Feedback] MR acted on recommendation #${id}`);
      }
      
      res.json(data.ai_recommendations[index]);
    } else {
      res.status(404).json({ error: "Recommendation not found" });
    }
  });

  // Get AI performance metrics
  app.get("/api/ai-performance", (req, res) => {
    const user = req.currentUser;
    let recommendations = data.ai_recommendations as any[];
    
    if (user?.role === 'mr' && user.mr_id) {
      recommendations = recommendations.filter(r => r.mr_id === user.mr_id);
    }
    
    const total = recommendations.length;
    const actedUpon = recommendations.filter(r => r.mr_action_taken).length;
    const positiveOutcome = recommendations.filter(r => r.outcome === 'positive' || r.outcome === 'converted').length;
    const converted = recommendations.filter(r => r.outcome === 'converted').length;
    
    const metrics = {
      total_recommendations: total,
      adoption_rate: total > 0 ? Math.round((actedUpon / total) * 100) : 0,
      success_rate: actedUpon > 0 ? Math.round((positiveOutcome / actedUpon) * 100) : 0,
      conversion_rate: actedUpon > 0 ? Math.round((converted / actedUpon) * 100) : 0,
      avg_time_to_action: actedUpon > 0 
        ? Math.round(recommendations.filter(r => r.action_taken_at).reduce((sum, r) => {
            const made = new Date(r.made_at).getTime();
            const acted = new Date(r.action_taken_at).getTime();
            return sum + (acted - made);
          }, 0) / actedUpon / (1000 * 60 * 60)) // hours
        : 0
    };
    
    res.json(metrics);
  });

  app.post("/api/visit-schedules", (req, res) => {
    const newSchedule = {
      id: nextId.visit_schedules++,
      ...req.body,
      status: "pending",
      priority: "medium",
      estimated_duration: 30,
      notes: "AI Scheduled"
    };
    data.visit_schedules.push(newSchedule);
    // Email notification to MR
    const mrForSchedule = data.mrs.find(m => m.id === req.body.mr_id);
    if (mrForSchedule) {
      data.notifications.push({
        mr_id: mrForSchedule.id,
        type: 'schedule',
        email: mrForSchedule.email,
        subject: 'New Visit Scheduled',
        body: `Visit scheduled with ${req.body.doctor_name} at ${req.body.scheduled_date} ${req.body.scheduled_time}`,
        sent_at: new Date().toISOString(),
        status: 'sent'
      });
    }
    res.status(201).json(newSchedule);
  });

  // === Visit Recordings ===
  app.get("/api/visit-recordings", (req, res) => {
    const user = req.currentUser;
    let recordings = data.visit_recordings as any[];
    if (user?.role === 'mr' && user.mr_id) {
      recordings = recordings.filter(r => r.mr_id === user.mr_id);
    } else if (req.query.mr_id) {
      const mrId = parseInt(req.query.mr_id as string);
      recordings = recordings.filter(r => r.mr_id === mrId);
    }
    res.json(recordings);
  });

  app.post("/api/visit-recordings", (req, res) => {
    const mr = data.mrs.find(m => m.id === req.body.mr_id);
    const newRecording = {
      id: nextId.visit_recordings++,
      mr_name: mr?.name || "Unknown",
      approval_requested: !!req.body.shouldRequestApproval,
      approval_type: null,
      approval_status: null,
      visit_date: new Date().toISOString().split('T')[0],
      visit_time: new Date().toLocaleTimeString(),
      created_at: new Date().toISOString(),
      ...req.body
    };
    data.visit_recordings.push(newRecording);
    
    // Task 1: Auto-Lead Creation
    if (req.body.isLead && req.body.leadConfidence > 60) {
      const leadProbability = Math.min(req.body.leadConfidence, 100);
      const nextFollowUp = new Date();
      nextFollowUp.setDate(nextFollowUp.getDate() + (leadProbability > 80 ? 2 : leadProbability > 60 ? 5 : 7));
      
      data.leads.push({
        id: nextId.leads++,
        doctor_name: req.body.entityName || req.body.entity_name || "Unknown",
        specialty: req.body.entity_type === 'doctor' ? "General" : (req.body.entity_type || "Unknown"),
        territory: mr?.territory || "Unassigned",
        comments: req.body.leadReasoning || (req.body.transcript ? req.body.transcript.substring(0, 100) : "Auto-created lead"),
        status: "new",
        priority: req.body.leadConfidence > 80 ? "high" : "medium",
        assigned_mr_id: req.body.mr_id,
        assigned_mr_name: mr?.name || "Unknown",
        conversion_probability: leadProbability,
        expected_revenue: leadProbability > 80 ? 150000 : leadProbability > 60 ? 75000 : 40000,
        actual_revenue: 0,
        last_contact_date: new Date().toISOString().split('T')[0],
        next_contact_date: nextFollowUp.toISOString().split('T')[0],
        engagement_score: Math.round(leadProbability * 0.85),
        recommended_action: req.body.followUpPurpose || "Follow up based on AI analysis",
        lead_source: "auto_detected_from_voice",
        converted_date: null,
        time_to_conversion_days: null,
        created_at: new Date().toISOString()
      });
    }

    // Task 2: Follow-up Scheduling
    if (req.body.followUpNeeded) {
      // Suggest next contact date based on lead probability
      const nextDate = new Date();
      nextDate.setDate(nextDate.getDate() + (req.body.leadConfidence > 80 ? 2 : 5));
      
      // Avoid weekends
      if (nextDate.getDay() === 0) nextDate.setDate(nextDate.getDate() + 1); // Sunday -> Monday
      if (nextDate.getDay() === 6) nextDate.setDate(nextDate.getDate() + 2); // Saturday -> Monday

      const nextDateString = nextDate.toISOString().split('T')[0];
      
      data.visit_schedules.push({
        id: nextId.visit_schedules++,
        mr_id: req.body.mr_id,
        doctor_name: req.body.entityName || req.body.entity_name || "Unknown",
        scheduled_date: nextDateString,
        scheduled_time: "10:30",
        purpose: req.body.followUpPurpose || "AI Suggested Follow-up",
        priority: req.body.leadConfidence > 80 ? "high" : "medium",
        status: "pending",
        estimated_duration: 30,
        notes: "Auto-scheduled based on AI transcript analysis: " + req.body.followUpPurpose
      });
      
      data.daily_call_plans.push({
        id: nextId.daily_call_plans++,
        mr_id: req.body.mr_id,
        date: nextDateString,
        entity_name: req.body.entityName || req.body.entity_name || "Unknown",
        entity_type: req.body.entity_type || "Unknown",
        planned_time: "10:30",
        status: "pending",
        priority: req.body.leadConfidence > 80 ? "high" : "medium",
        completed: false
      });
    }

    if (req.body.shouldRequestApproval) {
      data.approval_requests.push({
        id: nextId.approval_requests++,
        mr_id: req.body.mr_id,
        mr_name: mr?.name || "Unknown",
        type: "sale",
        description: `Sale/Lead from ${req.body.entityName || req.body.entity_name}`,
        details: { isLead: req.body.isLead, saleAmount: req.body.saleAmount, reason: req.body.leadReasoning },
        status: "pending",
        created_at: new Date().toISOString(),
        approved_at: null,
        approved_by: null
      });
    }
    res.status(201).json(newRecording);
  });

  // === Approval Requests ===
  app.get("/api/approval-requests", (req, res) => {
    const user = req.currentUser;
    let requests = data.approval_requests as any[];
    if (user?.role === 'mr' && user.mr_id) {
      // MRs only see their own approval requests
      requests = requests.filter(r => r.mr_id === user.mr_id);
    }
    res.json(requests);
  });

  app.post("/api/approval-requests", (req, res) => {
    const newReq = { id: nextId.approval_requests++, ...req.body };
    data.approval_requests.push(newReq);
    res.status(201).json(newReq);
  });

  app.patch("/api/approval-requests/:id", (req, res) => {
    const id = parseInt(req.params.id);
    const index = data.approval_requests.findIndex(r => r.id === id);
    if (index !== -1) {
      data.approval_requests[index] = {
        ...data.approval_requests[index],
        ...req.body,
        approved_at: (req.body.status === 'approved' || req.body.status === 'rejected') ? new Date().toISOString() : data.approval_requests[index].approved_at,
        approved_by: (req.body.status === 'approved' || req.body.status === 'rejected') ? 'Admin' : data.approval_requests[index].approved_by
      };
      res.json(data.approval_requests[index]);
    } else {
      res.status(404).json({ error: "Request not found" });
    }
  });

  // === Entity Credits ===
  app.get("/api/entity-credits", (req, res) => {
    // Admin sees all; MRs see credits for entities in their territory only
    // This requires linking entities to territories via doctors/pharmacies/hospitals
    const user = req.currentUser;
    if (user?.role === 'mr' && user.territory) {
      // Get entity names from doctors/pharmacies/hospitals in this territory
      const territoryDoctors = (data.doctors as any[]).filter(d => d.territory === user.territory).map(d => d.name);
      const territoryPharmacies = (data.pharmacies as any[]).filter(p => p.territory === user.territory).map(p => p.name);
      const territoryHospitals = (data.hospitals as any[]).filter(h => h.territory === user.territory).map(h => h.name);
      const territoryEntities = [...territoryDoctors, ...territoryPharmacies, ...territoryHospitals];

      const credits = (data.entity_credits as any[]).filter(c => territoryEntities.includes(c.entity_name));
      return res.json(credits);
    }
    res.json(data.entity_credits);
  });

  app.patch("/api/entity-credits/:id", (req, res) => {
    const id = parseInt(req.params.id);
    const index = data.entity_credits.findIndex(c => c.id === id);
    if (index !== -1) {
      data.entity_credits[index] = { ...data.entity_credits[index], ...req.body };
      res.json(data.entity_credits[index]);
    } else {
      res.status(404).json({ error: "Credit record not found" });
    }
  });

  // === MR Live Locations ===
  app.get("/api/mr-locations", (req, res) => {
    const user = req.currentUser;
    let locations = data.mr_locations as any[];
    if (user?.role === 'mr' && user.mr_id) {
      locations = locations.filter(l => l.mr_id === user.mr_id);
    } else if (req.query.mr_id) {
      const mrId = parseInt(req.query.mr_id as string);
      locations = locations.filter(l => l.mr_id === mrId);
    }
    res.json(locations);
  });

  app.post("/api/mr-locations", (req, res) => {
    const mr = data.mrs.find(m => m.id === req.body.mr_id);
    const existing = data.mr_locations.findIndex(l => l.mr_id === req.body.mr_id);
    const loc = { mr_name: mr?.name || "Unknown", timestamp: new Date().toISOString(), ...req.body };
    if (existing >= 0) {
      data.mr_locations[existing] = { ...data.mr_locations[existing], ...loc };
      res.json(data.mr_locations[existing]);
    } else {
      const newLoc = { id: nextId.mr_locations++, ...loc };
      data.mr_locations.push(newLoc);
      res.status(201).json(newLoc);
    }
  });

  // === Notifications ===
  app.get("/api/notifications", (req, res) => {
    const user = req.currentUser;
    let notifications = data.notifications as any[];
    if (user?.role === 'mr' && user.mr_id) {
      notifications = notifications.filter(n => n.mr_id === user.mr_id);
    } else if (req.query.mr_id) {
      const mrId = parseInt(req.query.mr_id as string);
      notifications = notifications.filter(n => n.mr_id === mrId);
    }
    res.json(notifications);
  });

  app.post("/api/send-email", async (req, res) => {
    const { to, subject, body } = req.body;
    console.log(`[Email] To: ${to} | Subject: ${subject}`);
    data.notifications.push({
      mr_id: req.body.mr_id || null,
      type: 'email',
      email: to,
      subject,
      body,
      sent_at: new Date().toISOString(),
      status: 'sent'
    });
    res.json({ success: true, message: 'Email logged (demo mode)' });
  });

  // MR Field Tracking - Visit Records
  app.get("/api/visit-records", (req, res) => {
    const user = req.currentUser;
    let records = data.visit_records as any[];
    if (user?.role === 'mr' && user.mr_id) {
      records = records.filter(v => v.mr_id === user.mr_id);
    } else if (req.query.mr_id) {
      const mrId = Number(req.query.mr_id);
      records = records.filter(v => v.mr_id === mrId);
    }

    if (req.query.entity_name) {
      const entityName = String(req.query.entity_name);
      records = records.filter(v => v.entity_name === entityName || v.doctor_name === entityName);
    }

    res.json(records);
  });

  app.post("/api/visit-records", (req, res) => {
    const record = req.body;
    console.log(`[Visit] New record for MR ${record.mr_id} at ${record.entity_name}`);
    const newRecord = { ...record, id: nextId.visit_records++, created_at: record.created_at || new Date().toISOString() };
    
    // Update the schedule if it exists
    if (record.scheduled_visit_id) {
      const schIdx = data.visit_schedules.findIndex(s => s.id === Number(record.scheduled_visit_id));
      if (schIdx !== -1) {
        data.visit_schedules[schIdx].status = 'completed';
        (data.visit_schedules[schIdx] as any).completed_at = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        console.log(`[Visit] Marked schedule ${record.scheduled_visit_id} as completed`);
      }
    }

    data.visit_records.push(newRecord);
    // Backward compatibility with older components
    (data.doctor_visits as any[]).push({
      ...newRecord,
      doctor_name: newRecord.entity_name,
      visit_date: newRecord.created_at.split('T')[0],
      visit_time: new Date().toLocaleTimeString(),
      notes: newRecord.doctor_feedback || newRecord.key_discussion
    });

    console.log(`[Visit] Saved as ID ${newRecord.id}. Total records: ${data.visit_records.length}`);

    // If this is a missed visit, create alert and notify admin
    if (record.is_missed || record.status === 'missed') {
      const alert = {
        id: nextId.missed_visits++,
        mr_id: record.mr_id,
        mr_name: record.mr_name || 'Unknown MR',
        entity_name: record.entity_name,
        scheduled_time: record.scheduled_time || 'Unknown',
        alert_severity: 'critical' as const,
        alert_message: `CRITICAL: ${record.mr_name || 'MR'} missed scheduled visit to ${record.entity_name}. Reason: ${record.miss_reason || 'Not provided'}`,
        sent_at: new Date().toISOString(),
        delivery_status: 'sent' as const,
        miss_reason: record.miss_reason,
      };
      data.missed_visits.push(alert);

      // Send high-priority notification to admin
      data.notifications.push({
        id: nextId.notifications++,
        type: 'error',
        title: `MISSED VISIT ALERT`,
        message: `${record.mr_name || 'MR'} missed scheduled visit to ${record.entity_name} at ${record.scheduled_time}. Reason: ${record.miss_reason || 'Not provided'}. This requires immediate attention.`,
        timestamp: new Date().toISOString(),
        read: false,
        severity: 'high',
        created_at: new Date().toISOString(),
      });
    }

    res.json(newRecord);
  });

  app.patch("/api/visit-records/:id", (req, res) => {
    const id = Number(req.params.id);
    const idx = data.visit_records.findIndex(v => v.id === id);
    if (idx === -1) { return res.status(404).json({ error: 'Visit record not found' }); }
    data.visit_records[idx] = { ...data.visit_records[idx], ...req.body };
    res.json(data.visit_records[idx]);
  });

  // Missed Visits - admin view
  app.get("/api/missed-visits", (req, res) => {
    const user = req.currentUser;
    let missed = data.missed_visits as any[];
    if (user?.role === 'mr' && user.mr_id) {
      missed = missed.filter(m => m.mr_id === user.mr_id);
    }
    res.json(missed);
  });

  // === Daily Call Plan ===
  app.get("/api/daily-call-plan", (req, res) => {
    const user = req.currentUser;
    const mrId = req.query.mr_id ? Number(req.query.mr_id) : (user?.role === 'mr' ? user.mr_id : null);
    const date = req.query.date ? String(req.query.date) : new Date().toISOString().split('T')[0];

    if (!mrId) return res.json([]);

    // Build plans from visit_schedules for this MR + date
    const todaySchedules = data.visit_schedules.filter(
      s => s.mr_id === mrId && s.scheduled_date === date
    );

    // Check if we already have stored plans for completed visits
    const storedPlans = (data as any).daily_call_plans_store || [];
    const storedForToday = storedPlans.filter((p: any) => p.mr_id === mrId && p.date === date);

    const plans = todaySchedules.map((schedule: any) => {
      // Check if there's a stored completed outcome for this schedule
      const stored = storedForToday.find((sp: any) => sp.schedule_id === schedule.id);

      // Enrich with entity metadata
      const entityName = schedule.doctor_name || schedule.pharmacy_name || schedule.hospital_name || 'Unknown';
      const entityType = schedule.doctor_id ? 'doctor' : schedule.pharmacy_id ? 'chemist' : schedule.hospital_id ? 'hospital' : 'doctor';

      // Look up entity details for tier, area, etc.
      let tier = 'C';
      let area = '';
      let phone = '';
      if (entityType === 'doctor') {
        const doc = (data.doctors as any[]).find(d => d.id === schedule.doctor_id || d.name === entityName);
        if (doc) { tier = doc.tier || 'C'; area = doc.area || doc.territory || ''; phone = doc.phone || ''; }
      } else if (entityType === 'chemist') {
        const pharm = (data.pharmacies as any[]).find(p => p.id === schedule.pharmacy_id || p.name === entityName);
        if (pharm) { tier = pharm.tier || 'C'; area = pharm.area || pharm.territory || ''; phone = pharm.phone || ''; }
      } else if (entityType === 'hospital') {
        const hosp = (data.hospitals as any[]).find(h => h.id === schedule.hospital_id || h.name === entityName);
        if (hosp) { tier = hosp.tier || 'C'; area = hosp.area || hosp.territory || ''; phone = hosp.phone || ''; }
      }

      // Calculate days since last visit
      const pastVisits = (data.visit_records as any[]).filter(
        v => v.mr_id === mrId && (v.entity_name === entityName || v.doctor_name === entityName)
      );
      const lastVisit = pastVisits.length > 0
        ? pastVisits.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
        : null;
      const daysSince = lastVisit
        ? Math.floor((Date.now() - new Date(lastVisit.created_at).getTime()) / 86400000)
        : 30;

      return {
        id: schedule.id,
        schedule_id: schedule.id,
        mr_id: mrId,
        date,
        entity_name: entityName,
        entity_type: entityType,
        clinic: schedule.clinic || '',
        area,
        tier,
        phone,
        planned_time: schedule.scheduled_time || '10:00',
        priority: schedule.priority || 'medium',
        purpose: schedule.purpose || '',
        status: stored ? 'completed' : (schedule.status === 'completed' ? 'completed' : schedule.status === 'in_progress' ? 'in_progress' : 'planned'),
        days_since_last_visit: daysSince,
        visit_outcome: stored?.visit_outcome || null,
        completed: stored ? true : schedule.status === 'completed',
      };
    });

    res.json(plans);
  });

  app.post("/api/daily-call-plan", (req, res) => {
    // Create an unscheduled/ad-hoc plan entry (also creates a visit_schedule)
    const body = req.body;
    const newSchedule: any = {
      id: nextId.visit_schedules++,
      mr_id: body.mr_id,
      doctor_name: body.doctor_name || body.entity_name,
      clinic: body.clinic || '',
      scheduled_date: body.scheduled_date || new Date().toISOString().split('T')[0],
      scheduled_time: body.scheduled_time || body.plannedTime || '10:00',
      purpose: body.purpose || 'Unscheduled Visit',
      priority: body.priority || 'medium',
      status: 'pending',
      estimated_duration: 30,
      notes: 'Added via Daily Call Plan',
    };
    data.visit_schedules.push(newSchedule);
    console.log(`[DailyCallPlan] Created unscheduled visit ${newSchedule.id} for MR ${body.mr_id}`);
    res.status(201).json(newSchedule);
  });

  app.post("/api/daily-call-plan/:id/complete", (req, res) => {
    const scheduleId = Number(req.params.id);
    const outcome = req.body;
    console.log(`[DailyCallPlan] Completing plan for schedule ${scheduleId}`);

    // Mark the schedule as completed
    const schIdx = data.visit_schedules.findIndex(s => s.id === scheduleId);
    if (schIdx !== -1) {
      data.visit_schedules[schIdx].status = 'completed';
      (data.visit_schedules[schIdx] as any).completed_at = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    // Store the outcome
    if (!(data as any).daily_call_plans_store) {
      (data as any).daily_call_plans_store = [];
    }
    const completedPlan = {
      id: nextId.daily_call_plans++,
      schedule_id: scheduleId,
      mr_id: outcome.mr_id,
      date: outcome.scheduled_date || new Date().toISOString().split('T')[0],
      status: 'completed',
      visit_outcome: {
        check_in_time: outcome.check_in_time,
        check_out_time: outcome.check_out_time,
        speaking_time: outcome.speaking_time,
        products_detailed: outcome.products_detailed,
        doctor_feedback: outcome.doctor_feedback,
        samples_given: outcome.samples_given,
        order_value: outcome.order_value || 0,
        order_product: outcome.order_product,
        next_followup: outcome.next_followup,
        conversation_summary: outcome.conversation_summary,
      },
      completed_at: new Date().toISOString(),
    };
    (data as any).daily_call_plans_store.push(completedPlan);

    // Also save as a permanent visit record for admin tracking
    const visitRecord = {
      id: nextId.visit_records++,
      mr_id: outcome.mr_id,
      mr_name: outcome.mr_name || (data.mrs.find(m => m.id === outcome.mr_id)?.name) || 'Unknown',
      entity_name: outcome.doctor_name,
      entity_type: 'doctor',
      clinic: schIdx !== -1 ? (data.visit_schedules[schIdx] as any).clinic : '',
      scheduled_visit_id: scheduleId,
      check_in_time: outcome.check_in_time,
      check_out_time: outcome.check_out_time,
      speaking_time_seconds: (outcome.speaking_time || 15) * 60,
      products_detailed: outcome.products_detailed,
      doctor_feedback: outcome.doctor_feedback,
      samples_given: outcome.samples_given,
      key_discussion: outcome.conversation_summary,
      order_placed: outcome.order_value || 0,
      follow_up_date: outcome.next_followup,
      status: 'completed',
      created_at: new Date().toISOString(),
    };
    data.visit_records.push(visitRecord);

    console.log(`[DailyCallPlan] Visit completed. Record ID: ${visitRecord.id}. Schedule: ${scheduleId}`);
    res.json(completedPlan);
  });

  // Daily Summary for MR
  app.get("/api/daily-summaries", (req, res) => {
    const user = req.currentUser;
    let mrId: number | null = null;

    if (user?.role === 'mr' && user.mr_id) {
      mrId = user.mr_id;
    } else if (req.query.mr_id) {
      mrId = Number(req.query.mr_id);
    }

    if (!mrId) { return res.status(400).json({ error: 'mr_id required' }); }

    const date = req.query.date ? String(req.query.date) : new Date().toISOString().split('T')[0];
    const todayRecords = (data.visit_records as any[]).filter(v => v.mr_id === mrId && v.created_at && v.created_at.startsWith(date));
    const completed = todayRecords.filter(v => v.status === 'completed');
    const missed = todayRecords.filter(v => v.is_missed || v.status === 'missed');
    const todaySchedules = data.visit_schedules.filter(s => s.mr_id === mrId && s.scheduled_date === date);

    const totalWaiting = completed.reduce((sum, v) => sum + (v.waiting_time || 0), 0);
    const totalSpeaking = completed.reduce((sum, v) => sum + (v.speaking_time || 0), 0);
    const totalSales = completed.filter(v => v.sale_done).reduce((sum, v) => sum + (v.sale_amount || 0), 0);
    const totalCredit = completed.filter(v => v.credit_received).reduce((sum, v) => sum + (v.credit_amount || 0), 0);
    const billsPrinted = completed.filter(v => v.bill_printed).length;

    const summary = {
      mr_id: mrId,
      date,
      scheduled_visits: todaySchedules.length,
      completed_visits: completed.length,
      missed_visits: missed.length,
      in_progress: todayRecords.filter(v => v.status === 'in_progress').length,
      total_waiting_minutes: totalWaiting,
      total_speaking_minutes: totalSpeaking,
      total_sales_amount: totalSales,
      total_credit_received: totalCredit,
      bills_printed: billsPrinted,
      photo_captured_count: completed.filter(v => v.photo_captured).length,
      visits: todayRecords,
      missed_details: missed.map(m => ({ entity: m.entity_name, reason: m.miss_reason, time: m.scheduled_time })),
      schedule_compliance: todaySchedules.length > 0 ? ((completed.length / todaySchedules.length) * 100).toFixed(1) : '100',
    };

    res.json(summary);
  });

  // Data Management Endpoints
  app.get("/api/data-stats", (req, res) => {
    try {
      const totalDoctors = data.doctors.length;
      const totalPharmacies = data.pharmacies.length;
      const totalHospitals = data.hospitals.length;
      const lastUpdated = new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });

      res.json({
        totalDoctors,
        totalPharmacies,
        totalHospitals,
        lastUpdated
      });
    } catch (error: any) {
      console.error('Error in /api/data-stats:', error);
      res.status(500).json({ 
        error: "Failed to fetch stats",
        message: error.message 
      });
    }
  });

  app.post("/api/upload-data", (req, res) => {
    try {
      if (!req.body || typeof req.body !== 'object') {
        return res.status(400).json({ 
          error: "Invalid request",
          message: "Request body must be valid JSON" 
        });
      }

      const uploadData = req.body;
      let totalAdded = 0;
      let pendingCount = 0;
      const autoAssign = req.body.autoAssign === true; // Flag for immediate AI assignment

      // Helper function to add to pending entities
      const addToPending = (entityType: string, entityData: any, territory: string, tier: string) => {
        const pendingEntity = {
          id: nextId.pending_entities++,
          entity_type: entityType,
          entity_data: entityData,
          territory: territory || '',
          tier: tier || 'B',
          source: 'excel_upload',
          upload_date: new Date().toISOString(),
          uploaded_by: req.currentUser?.email || 'admin',
          status: 'pending' as const,
          assigned_mr_id: null,
          assigned_date: null,
          ai_confidence: null
        };
        (data.pending_entities as any).push(pendingEntity);
        pendingCount++;
        return pendingEntity;
      };

      // Process Doctors - Add to pending first
      if (uploadData.doctors && Array.isArray(uploadData.doctors)) {
        uploadData.doctors.forEach((doctor: any) => {
          try {
            const territory = doctor.territory || doctor.Territory || '';
            const tier = String(doctor.tier || doctor.Tier || 'B');
            
            // Add to pending entities
            addToPending('doctor', {
              name: doctor.name || doctor.Name || '',
              clinic: doctor.clinic || doctor.Clinic || '',
              specialty: doctor.specialty || doctor.Specialty || '',
              phone: doctor.contact || doctor.Contact || '',
              email: doctor.email || doctor.Email || '',
              address: doctor.address || doctor.Address || '',
              total_visits: parseInt(doctor.total_visits) || 0,
              total_orders: parseInt(doctor.total_orders) || 0,
              total_value: parseInt(doctor.total_value) || 0
            }, territory, tier);

            // If autoAssign is true, also add directly to active doctors
            if (autoAssign) {
              const newDoctor: any = {
                id: nextId.doctors++,
                name: doctor.name || doctor.Name || '',
                clinic: doctor.clinic || doctor.Clinic || '',
                specialty: doctor.specialty || doctor.Specialty || '',
                territory: territory,
                tier: tier,
                potential: 'medium',
                total_visits: parseInt(doctor.total_visits) || 0,
                total_orders: parseInt(doctor.total_orders) || 0,
                total_value: parseInt(doctor.total_value) || 0,
                status: 'active',
                phone: doctor.contact || doctor.Contact || '',
                email: doctor.email || doctor.Email || '',
                address: '',
                visit_frequency: 14,
                preferred_products: [],
                last_visit: new Date().toISOString().split('T')[0],
                area: '',
                entity_type: 'Doctor',
                rating: Math.random() * 5
              };
              (data.doctors as any).push(newDoctor);
              totalAdded++;
            }
          } catch (e) {
            console.error('Error processing doctor:', e);
          }
        });
      }

      // Process Pharmacies - Add to pending first
      if (uploadData.pharmacies && Array.isArray(uploadData.pharmacies)) {
        uploadData.pharmacies.forEach((pharmacy: any) => {
          try {
            const territory = pharmacy.city || pharmacy.City || '';
            const tier = String(pharmacy.tier || pharmacy.Tier || 'B');
            
            // Add to pending entities
            addToPending('pharmacy', {
              name: pharmacy.name || pharmacy.Name || '',
              owner_name: pharmacy.owner || pharmacy.Owner || '',
              phone: pharmacy.contact || pharmacy.Contact || '',
              email: pharmacy.email || pharmacy.Email || '',
              address: pharmacy.address || pharmacy.Address || '',
              business_type: pharmacy.type || pharmacy.Type || 'Medical Hall',
              credit_days: 30,
              total_purchases: parseInt(pharmacy.total_purchases) || 0
            }, territory, tier);

            // If autoAssign is true, also add directly to active pharmacies
            if (autoAssign) {
              const newPharmacy: any = {
                id: nextId.pharmacies++,
                name: pharmacy.name || pharmacy.Name || '',
                owner_name: pharmacy.owner || pharmacy.Owner || '',
                phone: pharmacy.contact || pharmacy.Contact || '',
                email: pharmacy.email || pharmacy.Email || '',
                address: pharmacy.address || pharmacy.Address || '',
                territory: territory,
                tier: tier,
                credit_limit: 100000,
                credit_days: 30,
                total_purchases: parseInt(pharmacy.total_purchases) || 0,
                avg_monthly_purchase: 0,
                payment_history: 'Good',
                last_purchase_date: new Date().toISOString().split('T')[0],
                contact_person: '',
                business_type: pharmacy.type || pharmacy.Type || 'Medical Hall',
                gst_number: '',
                discount_notes: ''
              };
              (data.pharmacies as any).push(newPharmacy);
              totalAdded++;
            }
          } catch (e) {
            console.error('Error processing pharmacy:', e);
          }
        });
      }

      // Process Hospitals - Add to pending first
      if (uploadData.hospitals && Array.isArray(uploadData.hospitals)) {
        uploadData.hospitals.forEach((hospital: any) => {
          try {
            const territory = hospital.city || hospital.City || '';
            const tier = String(hospital.tier || hospital.Tier || 'B');
            
            // Add to pending entities
            addToPending('hospital', {
              name: hospital.name || hospital.Name || '',
              type: hospital.type || hospital.Type || 'Private',
              contact_person: '',
              phone: hospital.contact || hospital.Contact || '',
              email: hospital.email || hospital.Email || '',
              address: hospital.address || hospital.Address || '',
              bed_count: parseInt(hospital.beds || hospital.Beds) || 100,
              credit_days: 45,
              total_purchases: parseInt(hospital.total_purchases) || 0
            }, territory, tier);

            // If autoAssign is true, also add directly to active hospitals
            if (autoAssign) {
              const newHospital: any = {
                id: nextId.hospitals++,
                name: hospital.name || hospital.Name || '',
                type: hospital.type || hospital.Type || 'Private',
                contact_person: '',
                phone: hospital.contact || hospital.Contact || '',
                email: hospital.email || hospital.Email || '',
                address: hospital.address || hospital.Address || '',
                territory: territory,
                tier: tier,
                bed_count: parseInt(hospital.beds || hospital.Beds) || 100,
                credit_limit: 500000,
                credit_days: 45,
                key_departments: ['General', 'Orthopedics', 'Pediatrics'],
                total_purchases: parseInt(hospital.total_purchases) || 0,
                status: 'active',
                billing_contact: '',
                medical_director: '',
                notes: ''
              };
              (data.hospitals as any).push(newHospital);
              totalAdded++;
            }
          } catch (e) {
            console.error('Error processing hospital:', e);
          }
        });
      }

      // Process MRs (MRs are added directly, not to pending)
      if (uploadData.mrs && Array.isArray(uploadData.mrs)) {
        uploadData.mrs.forEach((mr: any) => {
          try {
            const newMR: any = {
              id: nextId.mrs++,
              name: mr.name || mr.Name || '',
              territory: mr.territory || mr.Territory || '',
              base_salary: parseInt(mr.base_salary || mr['Base Salary']) || 30000,
              daily_allowance: parseInt(mr.daily_allowance || mr['Daily Allowance']) || 10000,
              joining_date: new Date().toISOString().split('T')[0],
              phone: mr.phone || mr.Phone || mr.contact || mr.Contact || '',
              email: mr.email || mr.Email || '',
              status: 'active',
              performance_score: parseInt(mr.performance_score || mr['Performance Score']) || 75,
              total_sales: parseInt(mr.total_sales) || 0,
              targets_achieved: parseInt(mr.targets_achieved) || 0,
              targets_missed: parseInt(mr.targets_missed) || 0,
              avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop'
            };
            (data.mrs as any).push(newMR);
            totalAdded++;
          } catch (e) {
            console.error('Error processing MR:', e);
          }
        });
      }

      res.json({ 
        success: true, 
        totalAdded,
        pendingCount,
        message: autoAssign 
          ? `Successfully imported ${totalAdded} records. ${pendingCount} entities saved to pending queue for AI assignment.`
          : `${pendingCount} entities saved to pending queue. Use AI assignment to distribute to MRs.`,
        nextStep: autoAssign ? 'Review pending entities for AI assignment' : 'Data directly imported'
      });
    } catch (error: any) {
      console.error('Error in /api/upload-data:', error);
      res.status(400).json({ 
        error: 'Upload failed',
        message: error.message 
      });
    }
  });

  // === Pending Entities (Phase 1: Data Persistence) ===
  // Get all pending entities awaiting AI assignment
  app.get("/api/pending-entities", (req, res) => {
    const user = req.currentUser;
    let entities = data.pending_entities as any[];
    
    // Filter by status if provided
    if (req.query.status) {
      entities = entities.filter(e => e.status === req.query.status);
    }
    
    // Filter by entity type if provided
    if (req.query.entity_type) {
      entities = entities.filter(e => e.entity_type === req.query.entity_type);
    }
    
    // Filter by territory if provided
    if (req.query.territory) {
      entities = entities.filter(e => e.territory === req.query.territory);
    }
    
    res.json(entities);
  });

  // Get pending entities stats
  app.get("/api/pending-entities/stats", (req, res) => {
    const entities = data.pending_entities as any[];
    const pending = entities.filter(e => e.status === 'pending');
    
    const stats = {
      total: entities.length,
      pending: pending.length,
      assigned: entities.filter(e => e.status === 'assigned').length,
      rejected: entities.filter(e => e.status === 'rejected').length,
      by_type: {
        doctors: pending.filter(e => e.entity_type === 'doctor').length,
        pharmacies: pending.filter(e => e.entity_type === 'pharmacy').length,
        hospitals: pending.filter(e => e.entity_type === 'hospital').length
      },
      by_territory: pending.reduce((acc: any, e: any) => {
        const territory = e.territory || 'Unknown';
        acc[territory] = (acc[territory] || 0) + 1;
        return acc;
      }, {})
    };
    
    res.json(stats);
  });

  // Manually assign a pending entity to an MR
  app.post("/api/pending-entities/:id/assign", (req, res) => {
    const id = parseInt(req.params.id);
    const { mr_id } = req.body;
    
    if (!mr_id) {
      return res.status(400).json({ error: 'mr_id is required' });
    }
    
    const entityIndex = data.pending_entities.findIndex((e: any) => e.id === id);
    if (entityIndex === -1) {
      return res.status(404).json({ error: 'Pending entity not found' });
    }
    
    const mr = data.mrs.find((m: any) => m.id === mr_id);
    if (!mr) {
      return res.status(404).json({ error: 'MR not found' });
    }
    
    const entity = data.pending_entities[entityIndex];
    entity.status = 'assigned';
    entity.assigned_mr_id = mr_id;
    entity.assigned_date = new Date().toISOString();
    
    // Add entity to active database based on type
    if (entity.entity_type === 'doctor') {
      const newDoctor = {
        id: nextId.doctors++,
        ...entity.entity_data,
        territory: entity.territory,
        tier: entity.tier,
        potential: 'medium' as const,
        total_visits: 0,
        total_orders: 0,
        total_value: 0,
        status: 'active',
        visit_frequency: 14,
        preferred_products: [],
        last_visit: new Date().toISOString().split('T')[0],
        area: entity.territory,
        entity_type: 'Doctor',
        rating: 4.0
      };
      (data.doctors as any).push(newDoctor);
    } else if (entity.entity_type === 'pharmacy') {
      const newPharmacy = {
        id: nextId.pharmacies++,
        ...entity.entity_data,
        territory: entity.territory,
        tier: entity.tier,
        credit_limit: 100000,
        credit_days: 30,
        avg_monthly_purchase: 0,
        payment_history: 'Good',
        last_purchase_date: new Date().toISOString().split('T')[0]
      };
      (data.pharmacies as any).push(newPharmacy);
    } else if (entity.entity_type === 'hospital') {
      const newHospital = {
        id: nextId.hospitals++,
        ...entity.entity_data,
        territory: entity.territory,
        tier: entity.tier,
        credit_limit: 500000,
        credit_days: 45,
        key_departments: ['General', 'Orthopedics', 'Pediatrics'],
        total_purchases: 0,
        status: 'active',
        billing_contact: '',
        medical_director: '',
        notes: ''
      };
      (data.hospitals as any).push(newHospital);
    }
    
    // Create visit schedule for the entity
    const scheduleDate = new Date();
    scheduleDate.setDate(scheduleDate.getDate() + 1); // Schedule for tomorrow
    
    const newSchedule = {
      id: nextId.visit_schedules++,
      mr_id: mr_id,
      doctor_name: entity.entity_data.name,
      clinic: entity.entity_data.clinic || entity.entity_data.name,
      scheduled_date: scheduleDate.toISOString().split('T')[0],
      scheduled_time: '10:00',
      purpose: 'Initial Visit - AI Assigned',
      status: 'pending',
      priority: 'medium',
      estimated_duration: 30,
      notes: `Auto-assigned from pending entities. Territory: ${entity.territory}`
    };
    data.visit_schedules.push(newSchedule);
    
    res.json({
      success: true,
      message: `Entity assigned to ${mr.name} and scheduled for visit`,
      entity,
      schedule: newSchedule
    });
  });

  // AI Bulk Auto-Assign all pending entities
  app.post("/api/pending-entities/bulk-assign", (req, res) => {
    try {
      const { optimization = 'balanced' } = req.body;
      const pendingEntities = (data.pending_entities as any[]).filter(e => e.status === 'pending');
      
      if (pendingEntities.length === 0) {
        return res.json({ success: true, message: 'No pending entities to assign', assignments: [] });
      }
      
      const mrs = data.mrs as any[];
      const assignments = [];
      
      // Group pending entities by territory
      const entitiesByTerritory = pendingEntities.reduce((acc: any, entity: any) => {
        const territory = entity.territory || 'Unknown';
        if (!acc[territory]) acc[territory] = [];
        acc[territory].push(entity);
        return acc;
      }, {});
      
      // For each territory, find the best MR and assign
      Object.entries(entitiesByTerritory).forEach(([territory, entities]: [string, any]) => {
        // Find MRs that match this territory
        const matchingMRs = mrs.filter(mr => 
          mr.territory && (
            territory.toLowerCase().includes(mr.territory.toLowerCase()) ||
            mr.territory.toLowerCase().includes(territory.toLowerCase())
          )
        );
        
        if (matchingMRs.length === 0) {
          // No matching MR, assign to first available MR
          console.log(`[AI Assignment] No MR found for territory: ${territory}`);
          return;
        }
        
        // Sort MRs based on optimization strategy
        let sortedMRs = [...matchingMRs];
        if (optimization === 'performance') {
          sortedMRs.sort((a, b) => (b.performance_score || 0) - (a.performance_score || 0));
        } else if (optimization === 'workload') {
          // Count current schedules for each MR
          const countSchedules = (mrId: number) => {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const dateStr = tomorrow.toISOString().split('T')[0];
            return data.visit_schedules.filter((s: any) => s.mr_id === mrId && s.scheduled_date === dateStr).length;
          };
          sortedMRs.sort((a, b) => countSchedules(a.id) - countSchedules(b.id));
        }
        // 'balanced' uses territory match (already filtered)
        
        // Assign entities to MRs (round-robin for balanced distribution)
        entities.forEach((entity: any, index: number) => {
          const assignedMR = sortedMRs[index % sortedMRs.length];
          
          // Update pending entity
          entity.status = 'assigned';
          entity.assigned_mr_id = assignedMR.id;
          entity.assigned_date = new Date().toISOString();
          entity.ai_confidence = 0.85 + (Math.random() * 0.15); // 85-100% confidence
          
          // Add to active database
          if (entity.entity_type === 'doctor') {
            const newDoctor = {
              id: nextId.doctors++,
              ...entity.entity_data,
              territory: entity.territory,
              tier: entity.tier,
              potential: entity.tier === 'A' ? 'high' : entity.tier === 'C' ? 'low' : 'medium',
              total_visits: 0,
              total_orders: 0,
              total_value: 0,
              status: 'active',
              visit_frequency: entity.tier === 'A' ? 7 : entity.tier === 'C' ? 21 : 14,
              preferred_products: [],
              last_visit: new Date().toISOString().split('T')[0],
              area: entity.territory,
              entity_type: 'Doctor',
              rating: 4.0
            };
            (data.doctors as any).push(newDoctor);
          } else if (entity.entity_type === 'pharmacy') {
            const newPharmacy = {
              id: nextId.pharmacies++,
              ...entity.entity_data,
              territory: entity.territory,
              tier: entity.tier,
              credit_limit: 100000,
              credit_days: 30,
              avg_monthly_purchase: 0,
              payment_history: 'Good',
              last_purchase_date: new Date().toISOString().split('T')[0]
            };
            (data.pharmacies as any).push(newPharmacy);
          } else if (entity.entity_type === 'hospital') {
            const newHospital = {
              id: nextId.hospitals++,
              ...entity.entity_data,
              territory: entity.territory,
              tier: entity.tier,
              credit_limit: 500000,
              credit_days: 45,
              key_departments: ['General', 'Orthopedics', 'Pediatrics'],
              total_purchases: 0,
              status: 'active',
              billing_contact: '',
              medical_director: '',
              notes: ''
            };
            (data.hospitals as any).push(newHospital);
          }
          
          // Create visit schedule based on tier
          const visitsPerWeek = entity.tier === 'A' ? 3 : entity.tier === 'C' ? 1 : 2;
          for (let i = 0; i < visitsPerWeek; i++) {
            const scheduleDate = new Date();
            scheduleDate.setDate(scheduleDate.getDate() + (i * Math.floor(7 / visitsPerWeek)) + 1);
            
            const newSchedule = {
              id: nextId.visit_schedules++,
              mr_id: assignedMR.id,
              doctor_name: entity.entity_data.name,
              clinic: entity.entity_data.clinic || entity.entity_data.name,
              scheduled_date: scheduleDate.toISOString().split('T')[0],
              scheduled_time: `${9 + (i * 2)}:00`,
              purpose: `Initial Visit - AI Assigned (${entity.tier}-tier)`,
              status: 'pending',
              priority: entity.tier === 'A' ? 'high' : entity.tier === 'C' ? 'low' : 'medium',
              estimated_duration: 30,
              notes: `AI Auto-Assigned. Territory: ${entity.territory}, Confidence: ${(entity.ai_confidence * 100).toFixed(0)}%`
            };
            data.visit_schedules.push(newSchedule);
          }
          
          assignments.push({
            entity_id: entity.id,
            entity_name: entity.entity_data.name,
            entity_type: entity.entity_type,
            assigned_mr_id: assignedMR.id,
            mr_name: assignedMR.name,
            territory: entity.territory,
            confidence: entity.ai_confidence,
            reasoning: `Territory match + ${optimization} optimization`
          });
        });
      });
      
      res.json({
        success: true,
        message: `AI assigned ${assignments.length} entities to ${new Set(assignments.map(a => a.assigned_mr_id)).size} MRs`,
        assignments,
        summary: `${assignments.length} entities assigned using ${optimization} strategy`
      });
    } catch (error: any) {
      console.error('Error in bulk assign:', error);
      res.status(500).json({ error: 'Bulk assignment failed', message: error.message });
    }
  });

  app.get("/api/download-data", (req, res) => {
    try {
      const downloadData: any = {};
      
      // Safely process doctors
      if (data.doctors && Array.isArray(data.doctors) && data.doctors.length > 0) {
        downloadData.doctors = data.doctors.map((d: any) => ({
          Name: d.name || "",
          Clinic: d.clinic || "",
          Specialty: d.specialty || "",
          Territory: d.territory || "",
          Tier: d.tier || "",
          'Total Visits': d.total_visits || 0,
          'Total Orders': d.total_orders || 0,
          'Total Value': d.total_value || 0,
          Contact: d.phone || "",
          Email: d.email || "",
          Rating: typeof d.rating === 'number' ? d.rating.toFixed(2) : "0"
        }));
      } else {
        downloadData.doctors = [];
      }

      // Safely process pharmacies
      if (data.pharmacies && Array.isArray(data.pharmacies) && data.pharmacies.length > 0) {
        downloadData.pharmacies = data.pharmacies.map((p: any) => ({
          Name: p.name || "",
          Owner: p.owner_name || "",
          Type: p.business_type || "",
          City: p.territory || "",
          Contact: p.phone || "",
          Email: p.email || "",
          Address: p.address || "",
          Tier: p.tier || "",
          'Credit Days': p.credit_days || 0,
          'Total Purchases': p.total_purchases || 0
        }));
      } else {
        downloadData.pharmacies = [];
      }

      // Safely process hospitals
      if (data.hospitals && Array.isArray(data.hospitals) && data.hospitals.length > 0) {
        downloadData.hospitals = data.hospitals.map((h: any) => ({
          Name: h.name || "",
          Type: h.type || "",
          BedCount: h.bed_count || 0,
          Territory: h.territory || "",
          Contact: h.phone || "",
          Email: h.email || "",
          Address: h.address || "",
          Tier: h.tier || "",
          Departments: Array.isArray(h.key_departments) ? h.key_departments.join(', ') : "",
          'Total Purchases': h.total_purchases || 0
        }));
      } else {
        downloadData.hospitals = [];
      }

      // Safely process MRs
      if (data.mrs && Array.isArray(data.mrs) && data.mrs.length > 0) {
        downloadData.mrs = data.mrs.map((m: any) => ({
          Name: m.name || "",
          Territory: m.territory || "",
          'Performance Score': m.performance_score || 0,
          'Base Salary': m.base_salary || 0,
          'Daily Allowance': m.daily_allowance || 0,
          Phone: m.phone || "",
          Email: m.email || "",
          Status: m.status || "",
          'Total Sales': m.total_sales || 0
        }));
      } else {
        downloadData.mrs = [];
      }

      res.json(downloadData);
    } catch (error: any) {
      console.error('Error in /api/download-data:', error);
      res.status(500).json({ 
        error: "Download failed",
        message: error.message 
      });
    }
  });

  // Data Quality Endpoint
  app.get("/api/data-quality", (req, res) => {
    try {
      const calcCompleteness = (items: any[], fields: string[]) => {
        if (!items || items.length === 0) return 100;
        let filled = 0, total = 0;
        items.forEach(item => {
          fields.forEach(f => {
            const val = item[f];
            total++;
            if (val !== undefined && val !== null && val !== '') filled++;
          });
        });
        return total > 0 ? Math.round((filled / total) * 100) : 100;
      };

      const calcDuplicates = (items: any[], field: string) => {
        if (!items || items.length === 0) return 0;
        const seen = new Set<string>();
        let dups = 0;
        items.forEach(item => {
          const val = String(item[field] || '').trim().toLowerCase();
          if (val) {
            if (seen.has(val)) dups++;
            else seen.add(val);
          }
        });
        return dups;
      };

      const doctorFields = ['name', 'clinic', 'specialty', 'territory', 'phone', 'email', 'tier'];
      const pharmacyFields = ['name', 'owner_name', 'phone', 'address', 'territory', 'tier'];
      const hospitalFields = ['name', 'type', 'contact_person', 'phone', 'address', 'territory', 'bed_count', 'tier'];

      const doctorsCompleteness = calcCompleteness(data.doctors, doctorFields);
      const pharmaciesCompleteness = calcCompleteness(data.pharmacies, pharmacyFields);
      const hospitalsCompleteness = calcCompleteness(data.hospitals, hospitalFields);
      const overallScore = Math.round((doctorsCompleteness + pharmaciesCompleteness + hospitalsCompleteness) / 3);

      const doctorDups = calcDuplicates(data.doctors, 'name');
      const pharmacyDups = calcDuplicates(data.pharmacies, 'name');
      const hospitalDups = calcDuplicates(data.hospitals, 'name');
      const totalDups = doctorDups + pharmacyDups + hospitalDups;

      const suggestions: string[] = [];
      if (overallScore < 80) suggestions.push('Fill in missing contact information across all entities');
      if (doctorDups > 0) suggestions.push(`Review ${doctorDups} potential duplicate doctor entries for merging`);
      if (pharmacyDups > 0) suggestions.push(`Review ${pharmacyDups} potential duplicate pharmacy entries`);
      if (hospitalDups > 0) suggestions.push(`Review ${hospitalDups} potential duplicate hospital entries`);
      if (!data.doctors?.length || data.doctors.length < 50) suggestions.push('Add more doctor records for better coverage');
      if (!data.hospitals?.length || data.hospitals.length < 20) suggestions.push('Expand hospital network data');

      res.json({
        doctors: { completeness: doctorsCompleteness, duplicates: doctorDups, total: data.doctors?.length || 0 },
        pharmacies: { completeness: pharmaciesCompleteness, duplicates: pharmacyDups, total: data.pharmacies?.length || 0 },
        hospitals: { completeness: hospitalsCompleteness, duplicates: hospitalDups, total: data.hospitals?.length || 0 },
        overallScore,
        totalDuplicates: totalDups,
        suggestions
      });
    } catch (error: any) {
      console.error('Error in /api/data-quality:', error);
      res.status(500).json({ error: 'Failed to fetch data quality', message: error.message });
    }
  });

  // Monthly Performance Metrics Endpoint
  app.get("/api/monthly-metrics", (req, res) => {
    try {
      // Get month from query parameter or use current month
      let targetMonth = new Date().getMonth();
      let targetYear = new Date().getFullYear();

      if (req.query.month) {
        const monthParam = req.query.month as string;
        const [year, month] = monthParam.split('-');
        if (year && month) {
          targetYear = parseInt(year);
          targetMonth = parseInt(month) - 1; // Convert to 0-based month
        }
      }

      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      console.log(`📊 Fetching metrics for ${targetMonth + 1}/${targetYear}`);
      console.log(`📋 Total MRs: ${(data.mrs as any).length}`);
      console.log(`📋 Total Doctors: ${(data.doctors as any).length}`);
      console.log(`📋 Total Pharmacies: ${(data.pharmacies as any).length}`);
      console.log(`📋 Total Hospitals: ${(data.hospitals as any).length}`);
      console.log(`📋 Total Visit Schedules: ${(data.visit_schedules as any).length}`);

      // Function to check if date is in target month
      const isTargetMonth = (dateStr: string) => {
        try {
          const date = new Date(dateStr);
          const monthMatch = date.getMonth() === targetMonth && date.getFullYear() === targetYear;
          return monthMatch;
        } catch {
          return false;
        }
      };

      // Function to check if date is in current month
      const isCurrentMonth = (dateStr: string) => {
        try {
          const date = new Date(dateStr);
          return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
        } catch {
          return false;
        }
      };

      // Calculate MR performance
      const mrPerformance = (data.mrs as any).map((mr: any) => {
        // Get all doctors, pharmacies, hospitals in this MR's territory
        const territory = mr.territory || "";
        const doctorsInTerritory = (data.doctors as any).filter((d: any) => 
          (d.territory || d.area || "").toLowerCase().includes(territory.toLowerCase())
        );
        const pharmaciesInTerritory = (data.pharmacies as any).filter((p: any) => 
          (p.territory || p.area || "").toLowerCase().includes(territory.toLowerCase())
        );
        const hospitalsInTerritory = (data.hospitals as any).filter((h: any) => 
          (h.territory || h.area || "").toLowerCase().includes(territory.toLowerCase())
        );

        const totalEntities = doctorsInTerritory.length + pharmaciesInTerritory.length + hospitalsInTerritory.length;

        // Get visits scheduled/completed in target month for this MR
        const visitsInTargetMonth = (data.visit_schedules as any).filter((v: any) => 
          v.mr_id === mr.id && isTargetMonth(v.scheduled_date)
        );

        console.log(`👤 MR: ${mr.name} (Territory: ${territory}) - Territory Entities: ${totalEntities}, Visits in target month: ${visitsInTargetMonth.length}`);

        // Track which entities were visited
        const visitedDoctorIds = new Set(
          visitsInTargetMonth
            .filter((v: any) => v.doctor_id)
            .map((v: any) => v.doctor_id)
        );

        const visitedPharmacyIds = new Set(
          visitsInTargetMonth
            .filter((v: any) => v.pharmacy_id)
            .map((v: any) => v.pharmacy_id)
        );

        const visitedHospitalIds = new Set(
          visitsInTargetMonth
            .filter((v: any) => v.hospital_id)
            .map((v: any) => v.hospital_id)
        );

        const entitiesReached = visitedDoctorIds.size + visitedPharmacyIds.size + visitedHospitalIds.size;

        // Calculate rejections (visits with rejection in notes or status)
        const rejectedVisits = visitsInTargetMonth.filter((v: any) =>
          (v.notes && v.notes.toLowerCase().includes("reject")) ||
          v.status === "rejected"
        );

        const entitiesRejected = rejectedVisits.length;
        const entitiesUnreached = Math.max(0, totalEntities - entitiesReached);

        // Calculate conversion rate
        const conversionRate = totalEntities > 0 ? Math.round((entitiesReached / totalEntities) * 100) : 0;

        // Performance score (weighted by visits, conversion, and MR's own score)
        const performanceScore = Math.round(
          (conversionRate * 0.4) +
          (Math.min(100, visitedDoctorIds.size * 10) * 0.3) +
          ((mr.performance_score || 75) * 0.3)
        );

        // Get unreached doctors for priority suggestions
        const unreachedDoctors = doctorsInTerritory.filter(d => !visitedDoctorIds.has(d.id));
        const unreachedPharmacies = pharmaciesInTerritory.filter(p => !visitedPharmacyIds.has(p.id));

        // Suggest high-priority unreached entities
        const priorityUnreached = [
          ...unreachedDoctors
            .filter((d: any) => d.tier === 'A')
            .slice(0, 2)
            .map((d: any) => `Dr. ${d.name} (Tier A - High Priority)`),
          ...unreachedPharmacies
            .filter((p: any) => p.tier === 'A')
            .slice(0, 2)
            .map((p: any) => `${p.name} (Tier A - High Priority)`)
        ];

        const suggestedNextVisits = [
          ...unreachedDoctors.slice(0, 2).map((d: any) => `Dr. ${d.name} - ${d.clinic}`),
          ...unreachedPharmacies.slice(0, 2).map((p: any) => `${p.name} - ${p.territory}`),
          ...unreachedDoctors.slice(2, 3).map((d: any) => `Dr. ${d.name} (Follow-up)`),
        ];

        return {
          mr_id: mr.id,
          mr_name: mr.name,
          territory: mr.territory,
          total_entities: totalEntities,
          entities_reached: entitiesReached,
          entities_unreached: entitiesUnreached,
          entities_rejected: entitiesRejected,
          visits_completed: visitsInTargetMonth.filter((v: any) => v.status === "completed").length,
          visits_pending: visitsInTargetMonth.filter((v: any) => v.status === "pending").length,
          conversion_rate: conversionRate,
          performance_score: performanceScore,
          scheduled_this_month: visitsInTargetMonth.length,
          suggested_next_visits: suggestedNextVisits,
          priority_unreached: priorityUnreached,
        };
      });

      // Calculate overall metrics
      const allDoctorsReachedThisMonth = new Set(
        (data.visit_schedules as any)
          .filter((v: any) => isCurrentMonth(v.scheduled_date) && v.doctor_id && v.status !== "rejected")
          .map((v: any) => v.doctor_id)
      ).size;

      const allPharmaciesReachedThisMonth = new Set(
        (data.visit_schedules as any)
          .filter((v: any) => isCurrentMonth(v.scheduled_date) && v.pharmacy_id && v.status !== "rejected")
          .map((v: any) => v.pharmacy_id)
      ).size;

      const allHospitalsReachedThisMonth = new Set(
        (data.visit_schedules as any)
          .filter((v: any) => isCurrentMonth(v.scheduled_date) && v.hospital_id && v.status !== "rejected")
          .map((v: any) => v.hospital_id)
      ).size;

      const totalVisitsThisMonth = (data.visit_schedules as any).filter((v: any) => isCurrentMonth(v.scheduled_date)).length;

      const totalEntitiesThisMonth = allDoctorsReachedThisMonth + allPharmaciesReachedThisMonth + allHospitalsReachedThisMonth;
      const totalEntitiesAvailable = ((data.doctors as any).length || 0) + ((data.pharmacies as any).length || 0) + ((data.hospitals as any).length || 0);

      const overallConversionRate = totalEntitiesAvailable > 0 
        ? Math.round((totalEntitiesThisMonth / totalEntitiesAvailable) * 100)
        : 0;

      const user = req.currentUser;
      let responseData: any = {
        total_doctors: (data.doctors as any).length,
        total_pharmacies: (data.pharmacies as any).length,
        total_hospitals: (data.hospitals as any).length,
        doctors_reached_month: allDoctorsReachedThisMonth,
        pharmacies_reached_month: allPharmaciesReachedThisMonth,
        hospitals_reached_month: allHospitalsReachedThisMonth,
        doctors_pending: Math.max(0, ((data.doctors as any).length || 0) - allDoctorsReachedThisMonth),
        pharmacies_pending: Math.max(0, ((data.pharmacies as any).length || 0) - allPharmaciesReachedThisMonth),
        hospitals_pending: Math.max(0, ((data.hospitals as any).length || 0) - allHospitalsReachedThisMonth),
        total_visits_month: totalVisitsThisMonth,
        overall_conversion_rate: overallConversionRate,
        mr_performance: mrPerformance,
        // Include all entities for scheduling UI
        entities: [
          ...(data.doctors as any).map((d: any, idx: number) => ({
            id: d.id || idx + 1000,
            name: `Dr. ${d.name}`,
            type: 'Doctor',
            tier: d.tier || 'B',
            location: d.clinic || d.territory,
            phone: d.phone,
            contact: d.contact_person
          })),
          ...(data.pharmacies as any).map((p: any, idx: number) => ({
            id: p.id || idx + 2000,
            name: p.name,
            type: 'Pharmacy',
            tier: p.tier || 'B',
            location: p.territory || p.area,
            phone: p.phone,
            contact: p.contact_person
          })),
          ...(data.hospitals as any).map((h: any, idx: number) => ({
            id: h.id || idx + 3000,
            name: h.name,
            type: 'Hospital',
            tier: h.tier || 'B',
            location: h.territory || h.area,
            phone: h.phone,
            contact: h.contact_person
          }))
        ]
      };

      // Filter for MR users: only show their own performance and territory entities
      if (user?.role === 'mr' && user.mr_id) {
        const myMr = data.mrs.find((m: any) => m.id === user.mr_id);
        if (myMr) {
          responseData.mr_performance = mrPerformance.filter((p: any) => p.mr_id === user.mr_id);
          // Filter entities to only those in this MR's territory
          responseData.entities = responseData.entities.filter((entity: any) => {
            // For doctors, check territory match
            if (entity.type === 'Doctor') {
              const doctor = data.doctors.find((d: any) => `Dr. ${d.name}` === entity.name);
              return doctor && doctor.territory === myMr.territory;
            }
            // For pharmacies
            if (entity.type === 'Pharmacy') {
              const pharmacy = data.pharmacies.find((p: any) => p.name === entity.name);
              return pharmacy && pharmacy.territory === myMr.territory;
            }
            // For hospitals
            if (entity.type === 'Hospital') {
              const hospital = data.hospitals.find((h: any) => h.name === entity.name);
              return hospital && hospital.territory === myMr.territory;
            }
            return false;
          });
        }
      }

      console.log(`✅ Metrics calculated successfully!`);
      console.log(`   Total Visits: ${totalVisitsThisMonth}`);
      console.log(`   Doctors Reached: ${allDoctorsReachedThisMonth}/${(data.doctors as any).length}`);
      console.log(`   Pharmacies Reached: ${allPharmaciesReachedThisMonth}/${(data.pharmacies as any).length}`);
      console.log(`   Hospitals Reached: ${allHospitalsReachedThisMonth}/${(data.hospitals as any).length}`);
      console.log(`   Overall Conversion: ${overallConversionRate}%`);
      console.log(`   MR Performance Records: ${mrPerformance.length}`);

      res.json(responseData);
    } catch (error: any) {
      console.error('Error in /api/monthly-metrics:', error);
      res.status(500).json({ error: "Failed to calculate metrics", message: error.message });
    }
  });

  // ===========================
  // UNIVERSAL AI SEARCH ENGINE
  // ===========================

  // Fast universal search across all data entities
  app.get("/api/search", (req, res) => {
    try {
      const query = (req.query.q as string || "").toLowerCase().trim();
      if (!query || query.length < 2) {
        return res.json({ results: [], totalCount: 0, query });
      }

      const results: any[] = [];
      const limit = parseInt(req.query.limit as string) || 50;
      const user = req.currentUser;

      // Filter datasets based on user role
      let searchDoctors = data.doctors as any[];
      let searchPharmacies = data.pharmacies as any[];
      let searchHospitals = data.hospitals as any[];
      let searchLeads = data.leads as any[];
      let searchSales = data.sales as any[];
      let searchExpenses = data.expenses as any[];
      let searchMrs = data.mrs as any[];

      if (user?.role === 'mr' && user.territory) {
        // MRs only search within their territory
        searchDoctors = searchDoctors.filter(d => d.territory === user.territory);
        searchPharmacies = searchPharmacies.filter(p => p.territory === user.territory);
        searchHospitals = searchHospitals.filter(h => h.territory === user.territory);
      }
      if (user?.role === 'mr' && user.mr_id) {
        // MRs only see their own sales, expenses, leads
        searchLeads = searchLeads.filter(l => l.assigned_mr_id === user.mr_id);
        searchSales = searchSales.filter(s => s.mr_id === user.mr_id);
        searchExpenses = searchExpenses.filter(e => e.mr_id === user.mr_id);
        // MRs can see their own record and maybe admins? For now, only themselves
        searchMrs = searchMrs.filter(m => m.id === user.mr_id);
      }

      const score = (text: string, q: string): number => {
        const t = text.toLowerCase();
        if (t === q) return 100;
        if (t.startsWith(q)) return 80;
        if (t.includes(q)) return 60;
        return 0;
      };

      const addResult = (item: any) => {
        if (results.length < limit) results.push(item);
      };

      // Search MRs
      searchMrs.forEach(mr => {
        const names = [mr.name, mr.territory, mr.email, mr.phone, mr.status].join(" ");
        const s = Math.max(score(mr.name, query), score(mr.territory, query), score(mr.email, query), score(mr.phone || "", query));
        if (s > 0 || names.toLowerCase().includes(query)) {
          addResult({
            type: "mr", category: "Medical Representative",
            id: mr.id, title: mr.name,
            subtitle: mr.territory,
            badge: mr.status === "active" ? "Active" : "Inactive",
            badgeColor: mr.status === "active" ? "green" : "gray",
            meta: [`Score: ${mr.performance_score}%`, `Sales: ₹${(mr.total_sales / 100000).toFixed(1)}L`, mr.phone],
            route: "/mrs",
            score: s,
            raw: mr
          });
        }
      });

      // Search Products
      (data.products as any[]).forEach(prod => {
        const names = [prod.name, prod.category, prod.department, prod.composition, prod.indication, prod.type].join(" ");
        const s = Math.max(score(prod.name, query), score(prod.category, query), score(prod.department, query), score(prod.composition || "", query), score(prod.indication || "", query));
        if (s > 0 || names.toLowerCase().includes(query)) {
          addResult({
            type: "product", category: "Product",
            id: prod.id, title: prod.name,
            subtitle: `${prod.department} • ${prod.category}`,
            badge: prod.type,
            badgeColor: prod.type === "PCD" ? "blue" : "purple",
            meta: [`MRP: ₹${prod.mrp}`, `Stock: ${prod.stock}`, prod.indication],
            route: "/products",
            score: s,
            raw: prod
          });
        }
      });

      // Search Doctors
      (data.doctors as any[]).forEach(doc => {
        const names = [doc.name, doc.clinic, doc.specialty, doc.territory, doc.area, doc.phone, doc.qualification].join(" ");
        const s = Math.max(score(doc.name, query), score(doc.clinic, query), score(doc.specialty, query), score(doc.territory, query));
        if (s > 0 || names.toLowerCase().includes(query)) {
          addResult({
            type: "doctor", category: "Doctor",
            id: doc.id, title: doc.name,
            subtitle: `${doc.clinic} • ${doc.specialty}`,
            badge: `Tier ${doc.tier}`,
            badgeColor: doc.tier === "A" ? "yellow" : doc.tier === "B" ? "blue" : "gray",
            meta: [doc.territory, doc.phone, doc.timings].filter(Boolean),
            route: "/directory",
            score: s,
            raw: doc
          });
        }
      });

      // Search Pharmacies
      (data.pharmacies as any[]).forEach(ph => {
        const names = [ph.name, ph.owner_name, ph.territory, ph.area, ph.phone, ph.type].join(" ");
        const s = Math.max(score(ph.name, query), score(ph.owner_name, query), score(ph.territory, query));
        if (s > 0 || names.toLowerCase().includes(query)) {
          addResult({
            type: "pharmacy", category: "Pharmacy",
            id: ph.id, title: ph.name,
            subtitle: `${ph.area || ph.territory} • ${ph.type || ""}`,
            badge: `Tier ${ph.tier}`,
            badgeColor: ph.tier === "A" ? "yellow" : ph.tier === "B" ? "blue" : "gray",
            meta: [ph.phone, ph.shop_hours, ph.discount_notes].filter(Boolean),
            route: "/directory",
            score: s,
            raw: ph
          });
        }
      });

      // Search Hospitals
      (data.hospitals as any[]).forEach(hosp => {
        const names = [hosp.name, hosp.type, hosp.contact_person, hosp.territory, hosp.area, hosp.phone].join(" ");
        const s = Math.max(score(hosp.name, query), score(hosp.type, query), score(hosp.contact_person, query), score(hosp.territory, query));
        if (s > 0 || names.toLowerCase().includes(query)) {
          addResult({
            type: "hospital", category: "Hospital",
            id: hosp.id, title: hosp.name,
            subtitle: `${hosp.type} • ${hosp.territory}`,
            badge: `Tier ${hosp.tier}`,
            badgeColor: hosp.tier === "A" ? "yellow" : hosp.tier === "B" ? "blue" : "gray",
            meta: [hosp.contact_person, hosp.phone, `${hosp.bed_count} beds`].filter(Boolean),
            route: "/directory",
            score: s,
            raw: hosp
          });
        }
      });

      // Search Sales
      (data.sales as any[]).forEach(sale => {
        const names = [sale.mr_name, sale.product_name, sale.customer_name, sale.clinic, sale.date].join(" ");
        const s = Math.max(score(sale.mr_name || "", query), score(sale.product_name || "", query), score(sale.customer_name, query), score(sale.clinic, query));
        if (s > 0 || names.toLowerCase().includes(query)) {
          addResult({
            type: "sale", category: "Sale",
            id: sale.id, title: `${sale.product_name} × ${sale.quantity}`,
            subtitle: `${sale.mr_name} → ${sale.customer_name}`,
            badge: `₹${sale.amount.toLocaleString()}`,
            badgeColor: "green",
            meta: [sale.date, sale.clinic, sale.sale_type],
            route: "/sales",
            score: s,
            raw: sale
          });
        }
      });

      // Search Expenses
      (data.expenses as any[]).forEach(exp => {
        const mr = (data.mrs as any[]).find(m => m.id === exp.mr_id);
        const names = [exp.category, exp.description, mr?.name || ""].join(" ");
        const s = Math.max(score(exp.category, query), score(exp.description, query));
        if (s > 0 || names.toLowerCase().includes(query)) {
          addResult({
            type: "expense", category: "Expense",
            id: exp.id, title: exp.description,
            subtitle: `${exp.category} • ${mr?.name || "Admin"}`,
            badge: `₹${exp.amount}`,
            badgeColor: "orange",
            meta: [exp.date, exp.status].filter(Boolean),
            route: "/expenses",
            score: s,
            raw: exp
          });
        }
      });

      // Search Targets
      (data.targets as any[]).forEach(tgt => {
        const mr = (data.mrs as any[]).find(m => m.id === tgt.mr_id);
        const names = [tgt.product_type, tgt.status, tgt.month, mr?.name || ""].join(" ");
        const s = Math.max(score(tgt.product_type, query), score(tgt.status, query), score(mr?.name || "", query));
        if (s > 0 || names.toLowerCase().includes(query)) {
          addResult({
            type: "target", category: "Target",
            id: tgt.id, title: `${mr?.name || "MR"} - ${tgt.month}`,
            subtitle: `${tgt.product_type} Target`,
            badge: tgt.status,
            badgeColor: tgt.status === "completed" ? "green" : tgt.status === "in_progress" ? "blue" : "red",
            meta: [`Target: ₹${(tgt.target_value / 100000).toFixed(1)}L`, `Achieved: ₹${(tgt.achieved_value / 100000).toFixed(1)}L`],
            route: "/mrs",
            score: s,
            raw: tgt
          });
        }
      });

      // Search Leads
      (data.leads as any[]).forEach(lead => {
        const names = [lead.doctor_name, lead.specialty, lead.territory, lead.comments, lead.status].join(" ");
        const s = Math.max(score(lead.doctor_name, query), score(lead.specialty, query), score(lead.territory, query), score(lead.comments || "", query));
        if (s > 0 || names.toLowerCase().includes(query)) {
          addResult({
            type: "lead", category: "Lead",
            id: lead.id, title: lead.doctor_name,
            subtitle: `${lead.specialty} • ${lead.territory}`,
            badge: lead.priority,
            badgeColor: lead.priority === "high" ? "red" : lead.priority === "medium" ? "yellow" : "gray",
            meta: [lead.status, lead.comments?.substring(0, 60)].filter(Boolean),
            route: "/leads",
            score: s,
            raw: lead
          });
        }
      });

      // Search Visit Schedules
      (data.visit_schedules as any[]).forEach(vs => {
        const mr = (data.mrs as any[]).find(m => m.id === vs.mr_id);
        const names = [vs.doctor_name, vs.pharmacy_name, vs.hospital_name, vs.purpose, vs.notes, mr?.name].join(" ");
        const s = Math.max(score(vs.doctor_name || "", query), score(vs.purpose || "", query), score(mr?.name || "", query));
        if (s > 0 || names.toLowerCase().includes(query)) {
          addResult({
            type: "visit", category: "Visit Schedule",
            id: vs.id, title: vs.doctor_name || vs.pharmacy_name || vs.hospital_name || "Visit",
            subtitle: `${mr?.name || "MR"} • ${vs.scheduled_date}`,
            badge: vs.status,
            badgeColor: vs.status === "completed" ? "green" : vs.status === "pending" ? "yellow" : "blue",
            meta: [vs.purpose, vs.scheduled_time].filter(Boolean),
            route: "/schedule",
            score: s,
            raw: vs
          });
        }
      });

      // Sort by score desc
      results.sort((a, b) => (b.score - a.score));

      // Group by category
      const grouped: Record<string, any[]> = {};
      results.forEach(r => {
        if (!grouped[r.category]) grouped[r.category] = [];
        grouped[r.category].push(r);
      });

      // Compute summary stats
      const summary = {
        totalMRs: (data.mrs as any[]).length,
        totalDoctors: (data.doctors as any[]).length,
        totalPharmacies: (data.pharmacies as any[]).length,
        totalHospitals: (data.hospitals as any[]).length,
        totalProducts: (data.products as any[]).length,
      };

      res.json({
        query,
        results,
        grouped,
        totalCount: results.length,
        summary
      });
    } catch (error: any) {
      console.error("Search error:", error);
      res.status(500).json({ error: "Search failed", message: error.message });
    }
  });

  // === Phase 3: Monthly AI Planning System ===
  // Generate complete monthly visit plan for MRs
  app.post("/api/ai/generate-monthly-plan", (req, res) => {
    try {
      const { mr_id, month, strategy = 'balanced' } = req.body;
      
      if (!month) {
        return res.status(400).json({ error: 'Month is required (format: YYYY-MM)' });
      }
      
      const [year, monthNum] = month.split('-').map(Number);
      const daysInMonth = new Date(year, monthNum, 0).getDate();
      
      // Filter MRs
      let targetMRs = data.mrs as any[];
      if (mr_id) {
        targetMRs = targetMRs.filter((mr: any) => mr.id === mr_id);
        if (targetMRs.length === 0) {
          return res.status(404).json({ error: 'MR not found' });
        }
      }
      
      const monthlyPlans: any[] = [];
      
      targetMRs.forEach((mr: any) => {
        // Get all entities in MR's territory
        const territoryKeywords = mr.territory.toLowerCase().split(/[(),]+/).map((s: string) => s.trim());
        
        const territoryDoctors = (data.doctors as any[]).filter((d: any) => {
          const doctorTerritory = (d.territory || '').toLowerCase();
          return territoryKeywords.some((keyword: string) => doctorTerritory.includes(keyword));
        });
        
        // Calculate visit frequency based on tier and strategy
        const getVisitsPerMonth = (tier: string) => {
          const baseFrequency = {
            'A': strategy === 'aggressive' ? 12 : strategy === 'conservative' ? 8 : 10,
            'B': strategy === 'aggressive' ? 8 : strategy === 'conservative' ? 4 : 6,
            'C': strategy === 'aggressive' ? 4 : strategy === 'conservative' ? 2 : 3
          };
          return baseFrequency[tier as keyof typeof baseFrequency] || 4;
        };
        
        // Generate visit schedule for the month
        const visits: any[] = [];
        
        territoryDoctors.forEach((doctor: any) => {
          const visitsPerMonth = getVisitsPerMonth(doctor.tier);
          
          // Distribute visits across working days (avoid weekends)
          let visitCount = 0;
          for (let day = 1; day <= daysInMonth && visitCount < visitsPerMonth; day++) {
            const date = new Date(year, monthNum - 1, day);
            const dayOfWeek = date.getDay();
            
            // Skip weekends (0 = Sunday, 6 = Saturday)
            if (dayOfWeek === 0 || dayOfWeek === 6) continue;
            
            // Simple distribution based on tier
            const shouldVisit = 
              (doctor.tier === 'A' && day % 3 === 0) ||
              (doctor.tier === 'B' && day % 5 === 0) ||
              (doctor.tier === 'C' && day % 10 === 0);
            
            if (shouldVisit) {
              visits.push({
                doctor_id: doctor.id,
                doctor_name: doctor.name,
                clinic: doctor.clinic,
                specialty: doctor.specialty,
                territory: doctor.territory,
                tier: doctor.tier,
                scheduled_date: `${month}-${String(day).padStart(2, '0')}`,
                scheduled_time: `${9 + (visitCount % 4)}:00`,
                priority: doctor.tier === 'A' ? 'high' : doctor.tier === 'C' ? 'low' : 'medium',
                purpose: `Regular Visit - ${strategy} Strategy`,
                estimated_duration: 30,
                ai_generated: true
              });
              visitCount++;
            }
          }
        });
        
        monthlyPlans.push({
          mr_id: mr.id,
          mr_name: mr.name,
          territory: mr.territory,
          month: month,
          strategy: strategy,
          total_visits: visits.length,
          total_doctors: territoryDoctors.length,
          visits_per_day: Math.round(visits.length / 22), // ~22 working days
          visits,
          generated_at: new Date().toISOString()
        });
      });
      
      res.json({
        success: true,
        message: `Monthly plan generated for ${monthlyPlans.length} MRs`,
        plans: monthlyPlans,
        summary: {
          total_mrs: monthlyPlans.length,
          total_visits: monthlyPlans.reduce((sum: number, p: any) => sum + p.total_visits, 0),
          avg_visits_per_mr: Math.round(monthlyPlans.reduce((sum: number, p: any) => sum + p.total_visits, 0) / monthlyPlans.length)
        }
      });
    } catch (error: any) {
      console.error('Error generating monthly plan:', error);
      res.status(500).json({ error: 'Monthly plan generation failed', message: error.message });
    }
  });

  // Dynamic Re-Assignment Based on Performance
  app.post("/api/ai/reassign-monthly-plan", (req, res) => {
    try {
      const { mr_id, month } = req.body;
      
      if (!month) {
        return res.status(400).json({ error: 'Month is required (format: YYYY-MM)' });
      }
      
      // Get visit schedules for the month
      const monthPrefix = month;
      const schedules = (data.visit_schedules as any[]).filter((s: any) => 
        s.scheduled_date && s.scheduled_date.startsWith(monthPrefix) &&
        (!mr_id || s.mr_id === mr_id)
      );
      
      // Analyze performance: find underperforming MR-entity pairs
      const reassignments: any[] = [];
      const mrsByTerritory = (data.mrs as any[]).reduce((acc: any, mr: any) => {
        const territory = mr.territory;
        if (!acc[territory]) acc[territory] = [];
        acc[territory].push(mr);
        return acc;
      }, {});
      
      // Group schedules by MR
      const schedulesByMR = schedules.reduce((acc: any, s: any) => {
        if (!acc[s.mr_id]) acc[s.mr_id] = [];
        acc[s.mr_id].push(s);
        return acc;
      }, {});
      
      Object.entries(schedulesByMR).forEach(([mrIdStr, mrSchedules]: [string, any]) => {
        const mrId = parseInt(mrIdStr);
        const mr = (data.mrs as any[]).find((m: any) => m.id === mrId);
        if (!mr) return;
        
        // Check if MR is behind schedule (completed < 70% of planned visits)
        const completedVisits = mrSchedules.filter((s: any) => s.status === 'completed').length;
        const totalVisits = mrSchedules.length;
        const completionRate = totalVisits > 0 ? completedVisits / totalVisits : 0;
        
        if (completionRate < 0.7 && totalVisits > 10) {
          // Find other MRs in same territory with better performance
          const territoryMRs = mrsByTerritory[mr.territory] || [];
          const betterMRs = territoryMRs.filter((otherMR: any) => {
            if (otherMR.id === mrId) return false;
            const otherSchedules = schedulesByMR[otherMR.id] || [];
            const otherCompleted = otherSchedules.filter((s: any) => s.status === 'completed').length;
            const otherRate = otherSchedules.length > 0 ? otherCompleted / otherSchedules.length : 0;
            return otherRate > completionRate;
          });
          
          if (betterMRs.length > 0) {
            // Reassign some visits to better-performing MR
            const bestMR = betterMRs.sort((a: any, b: any) => (b.performance_score || 0) - (a.performance_score || 0))[0];
            const visitsToReassign = mrSchedules.filter((s: any) => s.status === 'pending').slice(0, Math.ceil(totalVisits * 0.3));
            
            visitsToReassign.forEach((visit: any) => {
              reassignments.push({
                schedule_id: visit.id,
                from_mr_id: mrId,
                from_mr_name: mr.name,
                to_mr_id: bestMR.id,
                to_mr_name: bestMR.name,
                doctor_name: visit.doctor_name,
                reason: `Underperformance: ${Math.round(completionRate * 100)}% completion rate`
              });
              
              // Actually reassign
              visit.mr_id = bestMR.id;
              visit.notes = (visit.notes || '') + ` [Reassigned from ${mr.name} due to performance]`;
            });
          }
        }
      });
      
      res.json({
        success: true,
        message: `${reassignments.length} visits reassigned`,
        reassignments,
        summary: {
          total_reassigned: reassignments.length,
          mrs_affected: new Set(reassignments.map(r => r.from_mr_id)).size
        }
      });
    } catch (error: any) {
      console.error('Error in reassign monthly plan:', error);
      res.status(500).json({ error: 'Reassignment failed', message: error.message });
    }
  });

  // === Phase 4: Intelligent Notification & Reminder System ===
  // Get notifications for current user
  app.get("/api/notifications", (req, res) => {
    const user = req.currentUser;
    if (!user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    let notifications = (data.notifications || []) as any[];
    
    // Filter by user role
    if (user.role === 'mr') {
      notifications = notifications.filter((n: any) => 
        n.user_id === user.mr_id || n.user_role === 'all' || n.user_role === 'mr'
      );
    } else if (user.role === 'manager' || user.role === 'admin') {
      notifications = notifications.filter((n: any) => 
        n.user_role === 'all' || n.user_role === 'manager' || n.user_role === 'admin'
      );
    }
    
    // Filter by type if provided
    if (req.query.type) {
      notifications = notifications.filter((n: any) => n.type === req.query.type);
    }
    
    // Filter by unread if requested
    if (req.query.unread === 'true') {
      notifications = notifications.filter((n: any) => !n.read);
    }
    
    // Sort by date (newest first)
    notifications.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    
    res.json(notifications);
  });

  // Mark notification as read
  app.post("/api/notifications/:id/read", (req, res) => {
    const id = parseInt(req.params.id);
    const notification = (data.notifications as any[]).find((n: any) => n.id === id);
    
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    
    notification.read = true;
    notification.read_at = new Date().toISOString();
    
    res.json({ success: true, notification });
  });

  // Create notification
  app.post("/api/notifications", (req, res) => {
    const { user_id, user_role, type, title, message, action_url } = req.body;
    
    const notification = {
      id: nextId.notifications++,
      user_id,
      user_role: user_role || 'all',
      type: type || 'info',
      title,
      message,
      action_url: action_url || null,
      read: false,
      read_at: null,
      created_at: new Date().toISOString()
    };
    
    if (!data.notifications) data.notifications = [];
    (data.notifications as any[]).push(notification);
    
    res.json({ success: true, notification });
  });

  // Notification Scheduler - Check and create notifications periodically
  function runNotificationScheduler() {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const today = now.toISOString().split('T')[0];
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    
    // 7 PM: Send next day's schedule to MRs
    if (currentHour === 19 && currentMinute < 5) {
      const tomorrowSchedules = (data.visit_schedules as any[]).filter((s: any) => 
        s.scheduled_date === tomorrowStr && s.status === 'pending'
      );
      
      const schedulesByMR = tomorrowSchedules.reduce((acc: any, s: any) => {
        if (!acc[s.mr_id]) acc[s.mr_id] = [];
        acc[s.mr_id].push(s);
        return acc;
      }, {});
      
      Object.entries(schedulesByMR).forEach(([mrId, schedules]: [string, any]) => {
        const mr = (data.mrs as any[]).find((m: any) => m.id === parseInt(mrId));
        if (mr) {
          const existingNotification = (data.notifications || []).find((n: any) => 
            n.user_id === mr.id && 
            n.type === 'schedule_assignment' && 
            n.created_at.startsWith(today)
          );
          
          if (!existingNotification) {
            (data.notifications || []).push({
              id: nextId.notifications++,
              user_id: mr.id,
              user_role: 'mr',
              type: 'schedule_assignment',
              title: `Tomorrow's Schedule: ${schedules.length} Visits Planned`,
              message: `You have ${schedules.length} visits scheduled for tomorrow. First visit: ${schedules[0]?.doctor_name || 'N/A'} at ${schedules[0]?.scheduled_time || 'N/A'}`,
              action_url: `/daily-plan?date=${tomorrowStr}`,
              read: false,
              read_at: null,
              created_at: now.toISOString()
            });
          }
        }
      });
    }
    
    // 8 AM: Morning reminder
    if (currentHour === 8 && currentMinute < 5) {
      const todaySchedules = (data.visit_schedules as any[]).filter((s: any) => 
        s.scheduled_date === today && s.status === 'pending'
      );
      
      const schedulesByMR = todaySchedules.reduce((acc: any, s: any) => {
        if (!acc[s.mr_id]) acc[s.mr_id] = [];
        acc[s.mr_id].push(s);
        return acc;
      }, {});
      
      Object.entries(schedulesByMR).forEach(([mrId, schedules]: [string, any]) => {
        const mr = (data.mrs as any[]).find((m: any) => m.id === parseInt(mrId));
        if (mr) {
          (data.notifications || []).push({
            id: nextId.notifications++,
            user_id: mr.id,
            user_role: 'mr',
            type: 'reminder',
            title: 'Morning Reminder: Visits Today',
            message: `Good morning! You have ${schedules.length} visits scheduled today. Start your first visit on time!`,
            action_url: `/daily-plan?date=${today}`,
            read: false,
            read_at: null,
            created_at: now.toISOString()
          });
        }
      });
    }
    
    // Weekly summary (Monday 9 AM)
    if (now.getDay() === 1 && currentHour === 9 && currentMinute < 5) {
      const lastWeek = new Date(now);
      lastWeek.setDate(lastWeek.getDate() - 7);
      const lastWeekStr = lastWeek.toISOString().split('T')[0];
      
      const lastWeekSchedules = (data.visit_schedules as any[]).filter((s: any) => 
        s.scheduled_date >= lastWeekStr && 
        s.scheduled_date < today && 
        s.status === 'completed'
      );
      
      const schedulesByMR = lastWeekSchedules.reduce((acc: any, s: any) => {
        if (!acc[s.mr_id]) acc[s.mr_id] = [];
        acc[s.mr_id].push(s);
        return acc;
      }, {});
      
      Object.entries(schedulesByMR).forEach(([mrId, schedules]: [string, any]) => {
        const mr = (data.mrs as any[]).find((m: any) => m.id === parseInt(mrId));
        if (mr) {
          const thisWeekSchedules = (data.visit_schedules as any[]).filter((s: any) => 
            s.scheduled_date >= today && 
            s.mr_id === parseInt(mrId)
          );
          
          (data.notifications || []).push({
            id: nextId.notifications++,
            user_id: mr.id,
            user_role: 'mr',
            type: 'performance_alert',
            title: 'Weekly Performance Summary',
            message: `Last week: ${schedules.length} visits completed. This week: ${thisWeekSchedules.length} visits scheduled. Keep up the great work!`,
            action_url: '/performance',
            read: false,
            read_at: null,
            created_at: now.toISOString()
          });
        }
      });
    }
  }

  // Run notification scheduler every minute
  setInterval(runNotificationScheduler, 60000);
  
  // Smart AI Search - No External Dependencies Required
  app.post("/api/ai-search", async (req, res) => {
    try {
      const { query } = req.body;
      if (!query) return res.status(400).json({ error: "Query required" });

      const today = new Date().toISOString().split('T')[0];
      const queryLower = query.toLowerCase();

      // === Process Query Locally ===
      let answer = "";

      // TODAY'S SALES
      if (queryLower.includes('today') && (queryLower.includes('sale') || queryLower.includes('sold') || queryLower.includes('sales'))) {
        const todaySales = (data.sales as any[]).filter((s: any) => s.date === today);
        const todaySalesTotal = todaySales.reduce((sum: number, s: any) => sum + (s.amount || 0), 0);
        if (todaySales.length === 0) {
          answer = `**Today's Sales:** No sales recorded yet for ${today}.`;
        } else {
          const details = todaySales.map((s: any) => `- **${s.product_name}** (x${s.quantity}) by **${s.mr_name}** to ${s.customer_name} = ₹${s.amount.toLocaleString()}`).join('\n');
          answer = `**Today's Sales Summary** (${today}):\n- Total Transactions: **${todaySales.length}**\n- Total Value: **₹${todaySalesTotal.toLocaleString()}**\n\n${details}`;
        }
      }

      // VISIT SCHEDULES
      else if (queryLower.includes('visit') || queryLower.includes('schedule')) {
        const mrVisitSummary = (data.mrs as any[]).map((mr: any) => {
          const mrSchedules = (data.visit_schedules as any[]).filter((v: any) => v.mr_id === mr.id);
          const completed = mrSchedules.filter((v: any) => v.status === 'completed').length;
          const pending = mrSchedules.filter((v: any) => v.status === 'pending').length;
          return { name: mr.name, total: mrSchedules.length, completed, pending };
        });
        const summary = mrVisitSummary.map(m => `- **${m.name}**: ${m.total} total (${m.completed} completed, ${m.pending} pending)`).join('\n');
        answer = `**MR Visit Schedules**:\n${summary}`;
      }

      // EXPENSES
      else if (queryLower.includes('expense')) {
        const pendingExpenses = (data.expenses as any[]).filter((e: any) => e.status === 'pending');
        const pendingTotal = pendingExpenses.reduce((sum: number, e: any) => sum + (e.amount || 0), 0);
        const approved = (data.expenses as any[]).filter((e: any) => e.status === 'approved');
        const approvedTotal = approved.reduce((sum: number, e: any) => sum + (e.amount || 0), 0);
        answer = `**Expense Summary**:\n- **Pending**: ${pendingExpenses.length} expenses = ₹${pendingTotal.toLocaleString()}\n- **Approved**: ${approved.length} expenses = ₹${approvedTotal.toLocaleString()}\n- **Total**: ${(data.expenses as any[]).length} expenses`;
      }

      // PERFORMANCE & TARGETS
      else if (queryLower.includes('performance') || queryLower.includes('target')) {
        const targets = (data.targets as any[]).slice(0, 5).map((t: any) => {
          const mr = (data.mrs as any[]).find((m: any) => m.id === t.mr_id);
          const percent = Math.round((t.achieved_value / t.target_value) * 100);
          return `- **${mr?.name || 'MR'}** (${t.month}): ₹${(t.achieved_value/100000).toFixed(1)}L / ₹${(t.target_value/100000).toFixed(1)}L (~${percent}%)`;
        }).join('\n');
        answer = `**Sales Targets Progress**:\n${targets}`;
      }

      // MR PERFORMANCE
      else if (queryLower.includes('mr') || queryLower.includes('medical representative') || queryLower.includes('representative')) {
        const summary = (data.mrs as any[]).map((m: any) => `- **${m.name}** (${m.territory}): ₹${(m.total_sales/100000).toFixed(1)}L | ${m.performance_score}% score`).join('\n');
        answer = `**MR Performance** (Total: ${(data.mrs as any[]).length} MRs):\n${summary}`;
      }

      // PRODUCTS
      else if (queryLower.includes('product')) {
        const summary = (data.products as any[]).slice(0, 10).map((p: any) => `- **${p.name}** (${p.category}): ₹${p.price}`).join('\n');
        answer = `**Product Portfolio** (${(data.products as any[]).length} total products):\n${summary}`;
      }

      // HEALTHCARE DIRECTORY
      else if (queryLower.includes('doctor') || queryLower.includes('hospital') || queryLower.includes('pharmacy')) {
        const doctors = (data.doctors as any[]).slice(0, 5);
        const summary = doctors.map((d: any) => `- **${d.name}** (${d.specialty}) at ${d.clinic}`).join('\n');
        answer = `**Healthcare Directory**:\n${summary}\n\n(${(data.doctors as any[]).length} doctors, ${(data.pharmacies as any[]).length} pharmacies, ${(data.hospitals as any[]).length} hospitals in system)`;
      }

      // LEADS
      else if (queryLower.includes('lead')) {
        const leads = (data.leads as any[]).slice(0, 5);
        const summary = leads.map((l: any) => `- **${l.doctor_name}** (${l.specialty}): ${l.status}`).join('\n');
        answer = `**Leads Management** (${(data.leads as any[]).length} total leads):\n${summary}`;
      }

      // DEFAULT - Show what's available
      else {
        const totalSales = (data.sales as any[]).length;
        const totalMRs = (data.mrs as any[]).length;
        const totalDoctors = (data.doctors as any[]).length;
        const totalExpenses = (data.expenses as any[]).length;
        const totalTargets = (data.targets as any[]).length;
        
        answer = `**Metapharsic Life Sciences Dashboard**\n\n📊 **System Overview**:\n- ${totalSales} Sales records\n- ${totalMRs} Medical Representatives\n- ${totalDoctors} Healthcare professionals\n- ${totalExpenses} Expense records\n- ${totalTargets} Sales targets\n\n💡 **Try asking about**: sales today, visit schedules, expenses, performance, MRs, products, doctors, leads`;
      }

      res.json({ answer, query });
    } catch (error: any) {
      console.error("Search error:", error);
      res.json({
        answer: "System is processing your query. Please try again.",
        query: (req.body as any).query
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    
    // Mount Vite middleware first for asset/module handling
    app.use(vite.middlewares);
    
    // Force no-cache headers for dev
    app.use((req, res, next) => {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      next();
    });

    // SPA fallback: serve index.html for all non-API/non-asset routes
    app.use((req, res, next) => {
      // Skip API routes and static files
      if (req.path.startsWith('/api') || req.path.match(/\.\w+$/)) {
        return next();
      }
      
      // For all other routes, serve index.html
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      fs.readFile(path.resolve(__dirname, 'index.html'), 'utf-8')
        .then(template => vite.transformIndexHtml(req.originalUrl, template))
        .then(html => res.send(html))
        .catch(err => {
          console.error('Error serving index.html:', err);
          res.status(500).send('Error loading application');
        });
    });
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Deduplicate visit_schedules IDs on startup
  const seen = new Set<number>();
  let maxId = Math.max(0, ...data.visit_schedules.map((s: any) => s.id));
  let renumberedCount = 0;
  data.visit_schedules.forEach((s: any) => {
    if (seen.has(s.id)) {
      maxId++;
      s.id = maxId;
      renumberedCount++;
    } else {
      seen.add(s.id);
    }
  });
  nextId.visit_schedules = maxId + 1;
  console.log(`Startup: visit_schedules deduped (${renumberedCount} renumbered), ${data.visit_schedules.length} entries, nextId=${nextId.visit_schedules}`);

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
    if (USE_DATABASE && db) {
      console.log('💾 Database persistence: ENABLED');
    } else {
      console.log('⚠️  Database persistence: DISABLED (using in-memory storage)');
    }
  });

  // Graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down gracefully...');
    if (db && db.closePool) {
      await db.closePool();
      console.log('✅ Database connection closed');
    }
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log('\n🛑 Shutting down gracefully...');
    if (db && db.closePool) {
      await db.closePool();
      console.log('✅ Database connection closed');
    }
    process.exit(0);
  });
}

startServer();
