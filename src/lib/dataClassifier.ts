/**
 * Smart Data Classification Engine
 * Intelligently segregates mixed healthcare provider data
 */

interface ClassificationResult {
  doctors: any[];
  pharmacies: any[];
  hospitals: any[];
  mrs: any[];
  unclassified: any[];
}

interface ClassificationStats {
  totalRows: number;
  doctors: number;
  rmp: number;
  pharmacies: number;
  medicalHalls: number;
  hospitals: number;
  mrs: number;
  unclassified: number;
}

// Keywords for entity type detection
const DOCTOR_KEYWORDS = ['dr.', 'doctor', 'md', 'mbbs', 'specialist', 'physician', 'consultant', 'qualification', 'clinic', 'practice'];
const RMP_KEYWORDS = ['rmp', 'registered medical practitioner', 'health worker', 'practitioner'];
const PHARMACY_KEYWORDS = ['pharmacy', 'chemist', 'medical hall', 'drug store', 'retail pharmacy', 'chain pharmacy', 'chemistere'];
const HOSPITAL_KEYWORDS = ['hospital', 'multispeciality', 'nursing home', 'healthcare', 'medical center', 'clinic chain'];
const MR_KEYWORDS = ['mr', 'medical representative', 'sales representative', 'territory', 'performance score', 'targets', 'salary', 'allowance'];

/**
 * Normalize column names for flexible matching
 */
function normalizeColumn(col: string): string {
  return col.toLowerCase().trim().replace(/[\s_-]/g, '');
}

/**
 * Check if a value matches keywords
 */
function hasKeywords(value: string, keywords: string[]): boolean {
  if (!value) return false;
  const normalized = value.toLowerCase();
  return keywords.some(kw => normalized.includes(kw));
}

/**
 * Detect entity type from a single row
 */
function detectEntityType(row: any, columns: string[]): string {
  // Convert row data to analyzable format
  const rowData = Object.entries(row)
    .map(([key, val]) => String(val || '').toLowerCase())
    .join(' ');

  const rowJson = JSON.stringify(row).toLowerCase();

  // Check for RMP first (more specific)
  if (hasKeywords(rowJson, RMP_KEYWORDS)) {
    return 'doctor'; // Will be marked as RMP in processing
  }

  // Check for doctor
  if (hasKeywords(rowJson, DOCTOR_KEYWORDS)) {
    return 'doctor';
  }

  // Check for hospital
  if (hasKeywords(rowJson, HOSPITAL_KEYWORDS)) {
    const bedCount = Object.values(row).find(v => {
      const num = parseInt(String(v));
      return num > 50 && num < 1000; // Typical bed counts
    });
    if (bedCount) return 'hospital';
  }

  // Check for pharmacy/medical hall
  if (hasKeywords(rowJson, PHARMACY_KEYWORDS)) {
    return 'pharmacy';
  }

  // Check for MR (must have territory or performance score)
  if (hasKeywords(rowJson, MR_KEYWORDS)) {
    const hasTerritoryOrScore = columns.some(col => {
      const normalized = normalizeColumn(col);
      return normalized.includes('territory') || normalized.includes('score') || normalized.includes('performance');
    });
    if (hasTerritoryOrScore) {
      return 'mr';
    }
  }

  return 'unclassified';
}

/**
 * Extract relevant fields based on entity type
 */
function extractEntityData(row: any, entityType: string): any {
  const normalized = (row: any) => {
    const result: any = {};
    for (const [key, value] of Object.entries(row)) {
      result[normalizeColumn(key)] = value;
    }
    return result;
  };

  const norm = normalized(row);
  const getField = (keys: string[]) => {
    for (const key of keys) {
      if (norm[normalizeColumn(key)]) {
        return norm[normalizeColumn(key)];
      }
    }
    return '';
  };

  const getNumField = (keys: string[], defaultVal = 0) => {
    const val = getField(keys);
    return val ? parseInt(String(val)) || defaultVal : defaultVal;
  };

  if (entityType === 'doctor') {
    return {
      name: getField(['name', 'doctorname', 'doctor']),
      clinic: getField(['clinic', 'hospital', 'practiceplace']),
      specialty: getField(['specialty', 'specialization', 'speciality']),
      territory: getField(['territory', 'area', 'location', 'city']),
      tier: String(getField(['tier', 'level', 'category']) || 'B'),
      contact: getField(['contact', 'phone', 'mobile', 'contact']),
      email: getField(['email', 'emailaddress']),
      total_visits: getNumField(['visits', 'totalvisits', 'visitcount']),
      total_orders: getNumField(['orders', 'totalorders', 'ordercount']),
      total_value: getNumField(['value', 'totalvalue', 'revenue']),
      isRMP: hasKeywords(JSON.stringify(row).toLowerCase(), RMP_KEYWORDS)
    };
  } else if (entityType === 'pharmacy') {
    return {
      name: getField(['name', 'pharmacyname', 'chemistname']),
      owner: getField(['owner', 'ownername', 'owneringpartner']),
      type: getField(['type', 'pharmacytype', 'businesstype']),
      city: getField(['city', 'location', 'area']),
      contact: getField(['contact', 'phone', 'mobile']),
      email: getField(['email', 'emailaddress']),
      address: getField(['address', 'location']),
      tier: String(getField(['tier', 'level', 'category']) || 'B'),
      total_purchases: getNumField(['purchases', 'totalpurchases', 'purchasevalue'])
    };
  } else if (entityType === 'hospital') {
    return {
      name: getField(['name', 'hospitalname']),
      type: getField(['type', 'hospitaltype', 'classification']),
      beds: getNumField(['beds', 'bedcount', 'capacity']),
      city: getField(['city', 'location', 'area']),
      contact: getField(['contact', 'phone', 'mobile']),
      email: getField(['email', 'emailaddress']),
      address: getField(['address', 'location']),
      tier: String(getField(['tier', 'level', 'category']) || 'B'),
      total_purchases: getNumField(['purchases', 'totalpurchases', 'purchasevalue'])
    };
  } else if (entityType === 'mr') {
    return {
      name: getField(['name', 'mrname', 'representativename']),
      territory: getField(['territory', 'area', 'zone', 'region']),
      contact: getField(['contact', 'phone', 'mobile']),
      email: getField(['email', 'emailaddress']),
      phone: getField(['phone', 'mobile', 'phonenumber']),
      performance_score: getNumField(['performance', 'performancescore', 'score'], 75),
      base_salary: getNumField(['salary', 'basesalary', 'monthlysalary']),
      daily_allowance: getNumField(['allowance', 'dailyallowance', 'da']),
      total_sales: getNumField(['sales', 'totalsales', 'revenue']),
      targets_achieved: getNumField(['targets', 'targetachieved', 'achieved']),
      targets_missed: getNumField(['missed', 'targetmissed', 'missed'])
    };
  }

  return row;
}

/**
 * Main classification function
 */
export function classifyMixedData(data: any[]): { result: ClassificationResult; stats: ClassificationStats } {
  const result: ClassificationResult = {
    doctors: [],
    pharmacies: [],
    hospitals: [],
    mrs: [],
    unclassified: []
  };

  const stats: ClassificationStats = {
    totalRows: data.length,
    doctors: 0,
    rmp: 0,
    pharmacies: 0,
    medicalHalls: 0,
    hospitals: 0,
    mrs: 0,
    unclassified: 0
  };

  const columns = data.length > 0 ? Object.keys(data[0]) : [];

  data.forEach((row, index) => {
    try {
      // Skip empty rows
      if (!row || Object.keys(row).every(key => !row[key])) {
        return;
      }

      const entityType = detectEntityType(row, columns);
      const extractedData = extractEntityData(row, entityType);

      if (entityType === 'doctor') {
        result.doctors.push(extractedData);
        if (extractedData.isRMP) {
          stats.rmp++;
        } else {
          stats.doctors++;
        }
      } else if (entityType === 'pharmacy') {
        result.pharmacies.push(extractedData);
        if (extractedData.type?.toLowerCase().includes('medical hall')) {
          stats.medicalHalls++;
        } else {
          stats.pharmacies++;
        }
      } else if (entityType === 'hospital') {
        result.hospitals.push(extractedData);
        stats.hospitals++;
      } else if (entityType === 'mr') {
        result.mrs.push(extractedData);
        stats.mrs++;
      } else {
        result.unclassified.push(row);
        stats.unclassified++;
      }
    } catch (error) {
      console.error(`Error classifying row ${index}:`, error);
      result.unclassified.push(row);
      stats.unclassified++;
    }
  });

  return { result, stats };
}

/**
 * Get classification summary
 */
export function getClassificationSummary(stats: ClassificationStats): string {
  return `
    📊 Data Classification Summary:
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    Total Rows: ${stats.totalRows}
    
    👨‍⚕️  Doctors: ${stats.doctors}
    🏥 RMP Practitioners: ${stats.rmp}
    💊 Pharmacies: ${stats.pharmacies}
    🏪 Medical Halls: ${stats.medicalHalls}
    🏛️  Hospitals: ${stats.hospitals}
    👔 Medical Representatives (MR): ${stats.mrs}
    
    ❓ Unclassified: ${stats.unclassified}
  `;
}
