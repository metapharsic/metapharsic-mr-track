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
// NOTE: 'clinic' and 'practice' removed — too generic; pharmacies/hospitals can contain these words
const DOCTOR_KEYWORDS = ['dr.', 'doctor', 'mbbs', 'specialist', 'physician', 'consultant', 'bams', 'bds', 'ms.', 'md.', 'dgo', 'da.', 'dnb'];
const RMP_KEYWORDS = ['rmp', 'registered medical practitioner', 'health worker', 'practitioner'];
const PHARMACY_KEYWORDS = ['pharmacy', 'chemist', 'medical hall', 'drug store', 'retail pharmacy', 'chain pharmacy', 'chemistere', 'medicals', 'medicine store', 'druggist'];
const HOSPITAL_KEYWORDS = ['hospital', 'multispeciality', 'nursing home', 'medical center', 'clinic chain', 'multi speciality', 'superspeciality', 'healthcare centre', 'health care centre'];
const MR_KEYWORDS = ['mr', 'medical representative', 'sales representative', 'territory', 'performance score', 'targets', 'salary', 'allowance'];

/**
 * Normalize column names for flexible matching
 * Removes spaces, underscores, hyphens, dots, slashes, brackets, colons
 */
function normalizeColumn(col: string): string {
  return col.toLowerCase().trim().replace(/[\s_\-\.\/\(\)\#\:\,\'\"]/g, '');
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
 * Try to read an explicit entity-type field from the row (e.g. "Entity Type", "Type", "Category")
 */
function getExplicitEntityType(row: any): string {
  const norm: Record<string, string> = {};
  for (const [k, v] of Object.entries(row)) {
    norm[normalizeColumn(k)] = String(v || '').toLowerCase().trim();
  }
  return norm['entitytype'] || norm['category'] || norm['entitycategory'] || norm['type'] || '';
}

/**
 * Detect entity type from a single row
 * Uses VALUES-ONLY checking to avoid false positives from column header names
 */
function detectEntityType(row: any, columns: string[]): string {
  // 1. Check explicit entity-type column ("Entity Type", "Category", "Type")
  const explicitType = getExplicitEntityType(row);
  if (explicitType) {
    if (/rmp|registered.?medical.?practitioner/.test(explicitType)) return 'doctor';
    if (/hospital|nursing.?home|medical.?center|multispeciali/.test(explicitType)) return 'hospital';
    if (/pharmacy|chemist|medical.?hall|drug.?store/.test(explicitType)) return 'pharmacy';
    if (/^doctor$|physician|consultant|dental/.test(explicitType)) return 'doctor';
    if (/^mr$|^medical.?rep/.test(explicitType)) return 'mr';
    if (/clinic/.test(explicitType)) return 'hospital';
    if (/^gp$/.test(explicitType)) return 'doctor';
  }

  // 2. Use VALUES ONLY (not column header keys) for keyword detection
  const valuesStr = Object.values(row)
    .map(v => String(v || '').toLowerCase())
    .join(' ');

  // Check RMP first (specific doctor subtype)
  if (hasKeywords(valuesStr, RMP_KEYWORDS)) return 'doctor';

  // Check PHARMACY before DOCTOR — pharmacy keywords are more specific and
  // reduce false-positive doctor matches (e.g. 'clinic' in pharmacy name)
  if (hasKeywords(valuesStr, PHARMACY_KEYWORDS)) return 'pharmacy';

  // Check hospital keywords in values
  if (hasKeywords(valuesStr, HOSPITAL_KEYWORDS)) return 'hospital';

  // Check doctor keywords last (broader terms)
  if (hasKeywords(valuesStr, DOCTOR_KEYWORDS)) return 'doctor';

  // Check MR — requires territory or performance in column headers (structure signal)
  if (hasKeywords(valuesStr, MR_KEYWORDS)) {
    const hasTerritoryOrScore = columns.some(col => {
      const normalized = normalizeColumn(col);
      return normalized.includes('territory') || normalized.includes('score') || normalized.includes('performance');
    });
    if (hasTerritoryOrScore) return 'mr';
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
  const getField = (keys: string[]): string => {
    // 1. Exact normalized match
    for (const key of keys) {
      const nk = normalizeColumn(key);
      const val = norm[nk];
      if (val !== undefined && val !== null && String(val).trim() !== '') {
        return String(val);
      }
    }
    // 2. Partial match: any normalized column key contains a search key (or vice-versa)
    for (const key of keys) {
      const nk = normalizeColumn(key);
      if (nk.length < 3) continue; // skip very short search terms
      for (const [colKey, val] of Object.entries(norm)) {
        if (val !== undefined && val !== null && String(val).trim() !== '') {
          if (colKey.includes(nk) || (nk.length >= 4 && nk.includes(colKey) && colKey.length >= 3)) {
            return String(val);
          }
        }
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
      name: getField(['name', 'doctorname', 'doctor', 'drname', 'fullname', 'physicianname', 'consultantname']),
      clinic: getField(['clinic', 'hospital', 'hospitalname', 'clinicname', 'practiceplace', 'hospitalclinic', 'worksatclinic']),
      specialty: getField(['specialty', 'specialization', 'speciality', 'dept', 'department', 'qualification', 'spec']),
      territory: getField(['territory', 'area', 'location', 'city', 'zone', 'region', 'district']),
      tier: String(getField(['tier', 'level', 'category', 'grade', 'priority']) || 'B'),
      contact: getField(['contact', 'phone', 'mobile', 'contactno', 'mobileno', 'phoneno', 'contactnumber', 'mobilenumber', 'phonenumber', 'tel']),
      email: getField(['email', 'emailaddress', 'emailid', 'mail']),
      total_visits: getNumField(['visits', 'totalvisits', 'visitcount']),
      total_orders: getNumField(['orders', 'totalorders', 'ordercount']),
      total_value: getNumField(['value', 'totalvalue', 'revenue']),
      isRMP: hasKeywords(JSON.stringify(row).toLowerCase(), RMP_KEYWORDS)
    };
  } else if (entityType === 'pharmacy') {
    return {
      name: getField(['name', 'pharmacyname', 'chemistname', 'shopname', 'storename', 'medicalname']),
      owner: getField(['owner', 'ownername', 'owneringpartner', 'proprietor', 'ownerpartner']),
      type: getField(['type', 'pharmacytype', 'businesstype', 'shoptype', 'storetype', 'category']),
      territory: getField(['territory', 'area', 'location', 'city', 'zone', 'region', 'district']),
      contact: getField(['contact', 'phone', 'mobile', 'contactno', 'mobileno', 'phoneno', 'contactnumber', 'mobilenumber', 'phonenumber', 'tel']),
      email: getField(['email', 'emailaddress', 'emailid', 'mail']),
      address: getField(['address', 'location', 'addr', 'streetaddress', 'fulladdress']),
      tier: String(getField(['tier', 'level', 'category', 'grade', 'priority']) || 'B'),
      total_purchases: getNumField(['purchases', 'totalpurchases', 'purchasevalue'])
    };
  } else if (entityType === 'hospital') {
    return {
      name: getField(['name', 'hospitalname', 'clinicname', 'facilityname', 'institutionname']),
      type: getField(['type', 'hospitaltype', 'classification', 'facilitytype', 'category']),
      beds: getNumField(['beds', 'bedcount', 'capacity', 'noofbeds', 'numberofbeds']),
      territory: getField(['territory', 'area', 'location', 'city', 'zone', 'region', 'district']),
      contact: getField(['contact', 'phone', 'mobile', 'contactno', 'mobileno', 'phoneno', 'contactnumber', 'mobilenumber', 'phonenumber', 'tel']),
      email: getField(['email', 'emailaddress', 'emailid', 'mail']),
      address: getField(['address', 'location', 'addr', 'streetaddress', 'fulladdress']),
      tier: String(getField(['tier', 'level', 'category', 'grade', 'priority']) || 'B'),
      total_purchases: getNumField(['purchases', 'totalpurchases', 'purchasevalue'])
    };
  } else if (entityType === 'mr') {
    return {
      name: getField(['name', 'mrname', 'representativename', 'employeename', 'fullname']),
      territory: getField(['territory', 'area', 'zone', 'region', 'district', 'city']),
      contact: getField(['contact', 'phone', 'mobile', 'contactno', 'mobileno', 'phoneno', 'contactnumber', 'mobilenumber']),
      email: getField(['email', 'emailaddress', 'emailid', 'mail']),
      phone: getField(['phone', 'mobile', 'phonenumber', 'mobileno', 'contactno']),
      performance_score: getNumField(['performance', 'performancescore', 'score'], 75),
      base_salary: getNumField(['salary', 'basesalary', 'monthlysalary', 'basepay']),
      daily_allowance: getNumField(['allowance', 'dailyallowance', 'da', 'travelallowance']),
      total_sales: getNumField(['sales', 'totalsales', 'revenue']),
      targets_achieved: getNumField(['targets', 'targetachieved', 'achieved']),
      targets_missed: getNumField(['missed', 'targetmissed'])
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

      // Use the row's own keys as columns (handles multi-sheet data correctly)
      const rowColumns = Object.keys(row);
      const entityType = detectEntityType(row, rowColumns);
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
