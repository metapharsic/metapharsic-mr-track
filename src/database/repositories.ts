import { pool } from './db';

// Local query helper to avoid circular dependency with db.ts
const query = async (text: string, params?: any[]) => {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text, duration, rows: result.rowCount });
    return result;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
};

// ==================== AI Performance (New) ====================
export const getCompetitorMentions = async (mrId?: number) => {
  let sql = 'SELECT * FROM competitor_mentions';
  const params: any[] = [];
  if (mrId) {
    sql += ' WHERE mr_id = $1';
    params.push(mrId);
  }
  sql += ' ORDER BY detected_at DESC';
  const result = await query(sql, params);
  return result.rows;
};

export const createCompetitorMention = async (mention: any) => {
  const result = await query(
    `INSERT INTO competitor_mentions (mr_id, entity_name, competitor_product, mention_context, sentiment, visit_date)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [mention.mr_id, mention.entity_name, mention.competitor_product, mention.mention_context, mention.sentiment, mention.visit_date]
  );
  return result.rows[0];
};

export const getSentimentAnalysis = async (mrId?: number) => {
  let sql = 'SELECT * FROM sentiment_analysis';
  const params: any[] = [];
  if (mrId) {
    sql += ' WHERE mr_id = $1';
    params.push(mrId);
  }
  sql += ' ORDER BY analyzed_at DESC';
  const result = await query(sql, params);
  return result.rows;
};

export const createSentimentAnalysis = async (analysis: any) => {
  const result = await query(
    `INSERT INTO sentiment_analysis (mr_id, visit_record_id, entity_name, visit_date, overall_sentiment, sentiment_score, tone, urgency_level, emotion_detected, key_phrases, doctor_satisfaction, mr_confidence)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
    [analysis.mr_id, analysis.visit_record_id, analysis.entity_name, analysis.visit_date, analysis.overall_sentiment, analysis.sentiment_score, analysis.tone, analysis.urgency_level, analysis.emotion_detected, analysis.key_phrases, analysis.doctor_satisfaction, analysis.mr_confidence]
  );
  return result.rows[0];
};

export const getAIRecommendations = async (mrId?: number) => {
  let sql = 'SELECT * FROM ai_recommendations';
  const params: any[] = [];
  if (mrId) {
    sql += ' WHERE mr_id = $1';
    params.push(mrId);
  }
  sql += ' ORDER BY made_at DESC';
  const result = await query(sql, params);
  return result.rows;
};

export const createAIRecommendation = async (rec: any) => {
  const result = await query(
    `INSERT INTO ai_recommendations (mr_id, lead_id, recommendation_type, recommendation, mr_action_taken, action_taken_at, outcome, outcome_details)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
    [rec.mr_id, rec.lead_id, rec.recommendation_type, rec.recommendation, rec.mr_action_taken || false, rec.action_taken_at, rec.outcome, rec.outcome_details]
  );
  return result.rows[0];
};

export const updateAIRecommendation = async (id: number, updates: any) => {
  const keys = Object.keys(updates).filter(k => updates[k] !== undefined);
  if (keys.length === 0) return null;
  const setString = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');
  const values = keys.map(k => updates[k]);
  values.push(id);
  const result = await query(`UPDATE ai_recommendations SET ${setString} WHERE id = $${values.length} RETURNING *`, values);
  return result.rows[0];
};

export const getAIAdoptionLeaderboard = async () => {
  const result = await query('SELECT * FROM v_ai_adoption_leaderboard');
  return result.rows;
};

export const getAtRiskEntities = async () => {
  const result = await query('SELECT * FROM v_at_risk_entities');
  return result.rows;
};

// ==================== Dashboard Metrics (Optimized) ====================
export const getMonthlyMetricsFromView = async (month: string) => {
  // month format expected: 'YYYY-MM'
  const targetMonth = `${month}-01`;
  const result = await query(
    `SELECT * FROM mr_monthly_performance 
     WHERE metric_month = date_trunc('month', $1::date)
     ORDER BY performance_score DESC`,
    [targetMonth]
  );
  return result.rows;
};

export const refreshMonthlyMetrics = async () => {
  await query('SELECT refresh_mr_monthly_performance()');
};

export const getOverallCoverageStats = async () => {
  const result = await query(
    `SELECT 
      (SELECT COUNT(*) FROM doctors) as total_doctors,
      (SELECT COUNT(*) FROM pharmacies) as total_pharmacies,
      (SELECT COUNT(*) FROM hospitals) as total_hospitals,
      (SELECT COUNT(DISTINCT doctor_id) FROM visit_schedules WHERE entity_type = 'doctor' AND status = 'completed' AND date_trunc('month', scheduled_date) = date_trunc('month', CURRENT_DATE)) as doctors_reached,
      (SELECT COUNT(DISTINCT pharmacy_id) FROM visit_schedules WHERE entity_type = 'pharmacy' AND status = 'completed' AND date_trunc('month', scheduled_date) = date_trunc('month', CURRENT_DATE)) as pharmacies_reached,
      (SELECT COUNT(DISTINCT hospital_id) FROM visit_schedules WHERE entity_type = 'hospital' AND status = 'completed' AND date_trunc('month', scheduled_date) = date_trunc('month', CURRENT_DATE)) as hospitals_reached`
  );
  return result.rows[0];
};

// ==================== MRs ====================
export const getMRs = async () => {
  const result = await query('SELECT * FROM mrs ORDER BY id');
  return result.rows;
};

export const getMRById = async (id: number) => {
  const result = await query('SELECT * FROM mrs WHERE id = $1', [id]);
  return result.rows[0];
};

export const createMR = async (mr: any) => {
  const result = await query(
    `INSERT INTO mrs (name, territory, base_salary, daily_allowance, joining_date, 
     phone, email, status, performance_score, total_sales, targets_achieved, targets_missed, avatar_url)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
     RETURNING *`,
    [mr.name, mr.territory, mr.base_salary, mr.daily_allowance, mr.joining_date,
     mr.phone, mr.email, mr.status, mr.performance_score, mr.total_sales, 
     mr.targets_achieved, mr.targets_missed, mr.avatar_url]
  );
  return result.rows[0];
};

export const updateMR = async (id: number, mr: any) => {
  const result = await query(
    `UPDATE mrs SET name = $1, territory = $2, base_salary = $3, daily_allowance = $4,
     joining_date = $5, phone = $6, email = $7, status = $8, performance_score = $9,
     total_sales = $10, targets_achieved = $11, targets_missed = $12, avatar_url = $13,
     updated_at = NOW()
     WHERE id = $14 RETURNING *`,
    [mr.name, mr.territory, mr.base_salary, mr.daily_allowance, mr.joining_date,
     mr.phone, mr.email, mr.status, mr.performance_score, mr.total_sales,
     mr.targets_achieved, mr.targets_missed, mr.avatar_url, id]
  );
  return result.rows[0];
};

// ==================== Doctors ====================
export const getDoctors = async () => {
  const result = await query('SELECT * FROM doctors ORDER BY id');
  return result.rows;
};

export const getDoctorById = async (id: number) => {
  const result = await query('SELECT * FROM doctors WHERE id = $1', [id]);
  return result.rows[0];
};

export const createDoctor = async (doctor: any) => {
  const result = await query(
    `INSERT INTO doctors (name, clinic, specialty, territory, tier, potential, 
     total_visits, total_orders, total_value, status, phone, email, address, 
     area, rating, timings, qualification, mr_visit_window, notes, 
     visit_frequency, preferred_products, last_visit, entity_type, hospital_id, lat, lng)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, 
             $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26)
     RETURNING *`,
    [doctor.name, doctor.clinic, doctor.specialty, doctor.territory, doctor.tier,
     doctor.potential, doctor.total_visits, doctor.total_orders, doctor.total_value,
     doctor.status, doctor.phone, doctor.email, doctor.address, doctor.area,
     doctor.rating, doctor.timings, doctor.qualification, doctor.mr_visit_window,
     doctor.notes, doctor.visit_frequency, doctor.preferred_products, doctor.last_visit,
     doctor.entity_type, doctor.hospital_id, doctor.lat, doctor.lng]
  );
  return result.rows[0];
};

export const updateDoctor = async (id: number, doctor: any) => {
  const result = await query(
    `UPDATE doctors SET name = $1, clinic = $2, specialty = $3, territory = $4,
     tier = $5, potential = $6, total_visits = $7, total_orders = $8, total_value = $9,
     status = $10, phone = $11, email = $12, address = $13, area = $14, rating = $15,
     timings = $16, qualification = $17, mr_visit_window = $18, notes = $19,
     visit_frequency = $20, preferred_products = $21, last_visit = $22,
     entity_type = $23, hospital_id = $24, lat = $25, lng = $26, updated_at = NOW()
     WHERE id = $27 RETURNING *`,
    [doctor.name, doctor.clinic, doctor.specialty, doctor.territory, doctor.tier,
     doctor.potential, doctor.total_visits, doctor.total_orders, doctor.total_value,
     doctor.status, doctor.phone, doctor.email, doctor.address, doctor.area,
     doctor.rating, doctor.timings, doctor.qualification, doctor.mr_visit_window,
     doctor.notes, doctor.visit_frequency, doctor.preferred_products, doctor.last_visit,
     doctor.entity_type, doctor.hospital_id, doctor.lat, doctor.lng, id]
  );
  return result.rows[0];
};

// ==================== Pharmacies ====================
export const getPharmacies = async () => {
  const result = await query('SELECT * FROM pharmacies ORDER BY id');
  return result.rows;
};

export const createPharmacy = async (pharmacy: any) => {
  const result = await query(
    `INSERT INTO pharmacies (name, owner_name, business_type, territory, tier,
     phone, email, address, credit_limit, credit_days, avg_monthly_purchase,
     payment_history, total_purchases, last_purchase_date, status, lat, lng)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
     RETURNING *`,
    [pharmacy.name, pharmacy.owner_name, pharmacy.business_type, pharmacy.territory,
     pharmacy.tier, pharmacy.phone, pharmacy.email, pharmacy.address, pharmacy.credit_limit,
     pharmacy.credit_days, pharmacy.avg_monthly_purchase, pharmacy.payment_history,
     pharmacy.total_purchases, pharmacy.last_purchase_date, pharmacy.status, pharmacy.lat, pharmacy.lng]
  );
  return result.rows[0];
};

// ==================== Hospitals ====================
export const getHospitals = async () => {
  const result = await query('SELECT * FROM hospitals ORDER BY id');
  return result.rows;
};

export const createHospital = async (hospital: any) => {
  const result = await query(
    `INSERT INTO hospitals (name, type, territory, tier, bed_count, phone, email,
     address, contact_person, credit_limit, credit_days, key_departments,
     total_purchases, status, billing_contact, medical_director, notes, lat, lng)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
     RETURNING *`,
    [hospital.name, hospital.type, hospital.territory, hospital.tier, hospital.bed_count,
     hospital.phone, hospital.email, hospital.address, hospital.contact_person,
     hospital.credit_limit, hospital.credit_days, hospital.key_departments,
     hospital.total_purchases, hospital.status, hospital.billing_contact,
     hospital.medical_director, hospital.notes, hospital.lat, hospital.lng]
  );
  return result.rows[0];
};

// ==================== Products ====================
export const getProducts = async () => {
  const result = await query('SELECT * FROM products ORDER BY id');
  return result.rows;
};

export const createProduct = async (product: any) => {
  const result = await query(
    `INSERT INTO products (name, type, cogs, mrp, pts, category, stock, department,
     reorder_level, composition, indication)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
     RETURNING *`,
    [product.name, product.type, product.cogs, product.mrp, product.pts, product.category,
     product.stock, product.department, product.reorder_level, product.composition, product.indication]
  );
  return result.rows[0];
};

// ==================== Pending Entities ====================
export const getPendingEntities = async (filters?: any) => {
  let sql = 'SELECT * FROM pending_entities WHERE 1=1';
  const params: any[] = [];
  
  if (filters?.status) {
    params.push(filters.status);
    sql += ` AND status = $${params.length}`;
  }
  if (filters?.entity_type) {
    params.push(filters.entity_type);
    sql += ` AND entity_type = $${params.length}`;
  }
  
  sql += ' ORDER BY created_at DESC';
  const result = await query(sql, params);
  return result.rows;
};

export const getPendingEntitiesStats = async () => {
  const result = await query(
    `SELECT 
      COUNT(*) as total,
      COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
      COUNT(CASE WHEN status = 'assigned' THEN 1 END) as assigned,
      COUNT(CASE WHEN entity_type = 'doctor' THEN 1 END) as doctors,
      COUNT(CASE WHEN entity_type = 'pharmacy' THEN 1 END) as pharmacies,
      COUNT(CASE WHEN entity_type = 'hospital' THEN 1 END) as hospitals
     FROM pending_entities`
  );
  return result.rows[0];
};

export const createPendingEntity = async (entity: any) => {
  const result = await query(
    `INSERT INTO pending_entities (entity_type, entity_data, territory, tier, 
     source, uploaded_by, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [entity.entity_type, JSON.stringify(entity.entity_data), entity.territory, entity.tier,
     entity.source, entity.uploaded_by, entity.status]
  );
  return result.rows[0];
};

export const updatePendingEntity = async (id: number, updates: any) => {
  const result = await query(
    `UPDATE pending_entities SET status = $1, assigned_mr_id = $2, 
     assigned_date = $3, ai_confidence = $4
     WHERE id = $5 RETURNING *`,
    [updates.status, updates.assigned_mr_id, updates.assigned_date, updates.ai_confidence, id]
  );
  return result.rows[0];
};

// ==================== Visit Schedules ====================
export const getVisitSchedules = async (filters?: any) => {
  let sql = 'SELECT * FROM visit_schedules WHERE 1=1';
  const params: any[] = [];
  
  if (filters?.mr_id) {
    params.push(filters.mr_id);
    sql += ` AND mr_id = $${params.length}`;
  }
  if (filters?.scheduled_date) {
    params.push(filters.scheduled_date);
    sql += ` AND scheduled_date = $${params.length}`;
  }
  if (filters?.status) {
    params.push(filters.status);
    sql += ` AND status = $${params.length}`;
  }
  
  sql += ' ORDER BY scheduled_date, scheduled_time';
  const result = await query(sql, params);
  return result.rows;
};

export const createVisitSchedule = async (schedule: any) => {
  const result = await query(
    `INSERT INTO visit_schedules (
      mr_id, doctor_name, clinic, scheduled_date, 
      scheduled_time, purpose, status, priority, 
      estimated_duration, notes, ai_generated,
      doctor_id, pharmacy_id, hospital_id, entity_type,
      specialty, tier, address, phone, territory
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
    RETURNING *`,
    [
      schedule.mr_id, schedule.doctor_name, schedule.clinic, schedule.scheduled_date,
      schedule.scheduled_time, schedule.purpose, schedule.status || 'pending', schedule.priority || 'medium',
      schedule.estimated_duration || 30, schedule.notes, schedule.ai_generated || false,
      schedule.doctor_id || null, schedule.pharmacy_id || null, schedule.hospital_id || null, schedule.entity_type || 'doctor',
      schedule.specialty || '', schedule.tier || 'B', schedule.address || '', schedule.phone || '', schedule.territory || ''
    ]
  );
  return result.rows[0];
};

export const updateVisitSchedule = async (id: number, updates: any) => {
  const result = await query(
    `UPDATE visit_schedules SET status = $1, notes = $2
     WHERE id = $3 RETURNING *`,
    [updates.status, updates.notes, id]
  );
  return result.rows[0];
};

export const deleteVisitSchedule = async (id: number) => {
  await query('DELETE FROM visit_schedules WHERE id = $1', [id]);
  return { success: true };
};

// ==================== Notifications ====================
export const getNotifications = async (userId?: number, userRole?: string) => {
  if (userId) {
    const result = await query(
      'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    return result.rows;
  }
  if (userRole === 'admin' || userRole === 'manager') {
    const result = await query('SELECT * FROM notifications ORDER BY created_at DESC');
    return result.rows;
  }
  return [];
};

export const createNotification = async (notification: any) => {
  const result = await query(
    `INSERT INTO notifications (user_id, user_role, type, title, message, action_url)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [notification.user_id, notification.user_role, notification.type, 
     notification.title, notification.message, notification.action_url]
  );
  return result.rows[0];
};

export const markNotificationRead = async (id: number) => {
  const result = await query(
    'UPDATE notifications SET read = true, read_at = NOW() WHERE id = $1 RETURNING *',
    [id]
  );
  return result.rows[0];
};

// ==================== Sales ====================
export const getSales = async (filters?: any) => {
  let sql = 'SELECT * FROM sales WHERE 1=1';
  const params: any[] = [];
  
  if (filters?.mr_id) {
    params.push(filters.mr_id);
    sql += ` AND mr_id = $${params.length}`;
  }
  
  sql += ' ORDER BY date DESC';
  const result = await query(sql, params);
  return result.rows;
};

export const createSale = async (sale: any) => {
  const result = await query(
    `INSERT INTO sales (mr_id, product_id, doctor_id, visit_id, customer_name, sale_type, doctor_name, clinic, quantity, amount, date)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
     RETURNING *`,
    [sale.mr_id, sale.product_id, sale.doctor_id, sale.visit_id || null, sale.customer_name, sale.sale_type || 'primary', sale.doctor_name, sale.clinic, sale.quantity, sale.amount, sale.date]
  );
  return result.rows[0];
};

// ==================== Visit Records (ROI) ====================
export const getRecentVisitsByEntity = async (entityName: string) => {
  const result = await query(
    'SELECT id, entity_name, created_at as visit_date, purpose FROM visit_records WHERE entity_name ILIKE $1 ORDER BY created_at DESC LIMIT 10',
    [entityName]
  );
  return result.rows;
};

// ==== ROI Analytics ====
export const getSalesROIAnalytics = async () => {
  const result = await query('SELECT * FROM v_sales_roi_analytics ORDER BY efficiency_score DESC');
  return result.rows;
};

export const getMRProfitability = async () => {
  const result = await query('SELECT * FROM v_mr_profitability ORDER BY net_profit DESC');
  return result.rows;
};

export const getMarketIntelligence = async () => {
  const result = await query('SELECT * FROM v_market_intelligence ORDER BY sentiment_score ASC');
  return result.rows;
};

// ==== AI Priority Targets ====
export const getAIPriorityVisits = async (territory?: string) => {
  let sql = 'SELECT * FROM v_visit_priority WHERE 1=1';
  const params: any[] = [];
  
  if (territory) {
    params.push(territory);
    sql += ' AND territory = $1';
  }
  
  sql += ' ORDER BY priority_score DESC LIMIT 5';
  const result = await query(sql, params);
  return result.rows;
};

// ==================== Expenses ====================
export const getExpenses = async (filters?: any) => {
  let sql = 'SELECT * FROM expenses WHERE 1=1';
  const params: any[] = [];

  if (filters?.mr_id) {
    params.push(filters.mr_id);
    sql += ` AND mr_id = $${params.length}`;
  }

  sql += ' ORDER BY date DESC';
  const result = await query(sql, params);
  return result.rows;
};

export const createExpense = async (expense: any) => {
  const result = await query(
    `INSERT INTO expenses (mr_id, category, amount, description, date, status, doctor_id, pharmacy_id, hospital_id, entity_type, is_auto_approved)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
     RETURNING *`,
    [
      expense.mr_id, expense.category, expense.amount, expense.description, expense.date, 
      expense.status, expense.doctor_id, expense.pharmacy_id, expense.hospital_id, 
      expense.entity_type, expense.is_auto_approved || false
    ]
  );
  return result.rows[0];
};

// ==================== Leads ====================
export const getLeads = async (filters?: any) => {
  let sql = 'SELECT * FROM leads WHERE 1=1';
  const params: any[] = [];

  if (filters?.assigned_mr_id) {
    params.push(filters.assigned_mr_id);
    sql += ` AND assigned_mr_id = $${params.length}`;
  }

  sql += ' ORDER BY created_at DESC';
  const result = await query(sql, params);
  return result.rows;
};

export const createLead = async (lead: any) => {
  const result = await query(
    `INSERT INTO leads (doctor_name, specialty, territory, priority, status, comments, expected_revenue, conversion_probability, assigned_mr_id, assigned_mr_name, ai_generated, source_insight_id, source_insight_type)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
     RETURNING *`,
    [
      lead.doctor_name, lead.specialty, lead.territory, lead.priority || 'medium', 
      lead.status || 'new', lead.comments, lead.expected_revenue, 
      lead.conversion_probability, lead.assigned_mr_id, lead.assigned_mr_name,
      lead.ai_generated || false, lead.source_insight_id || null, lead.source_insight_type || null
    ]
  );
  return result.rows[0];
};

export const updateLead = async (id: number, lead: any) => {
  const keys = Object.keys(lead).filter(k => lead[k] !== undefined);
  if (keys.length === 0) return null;

  const setString = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');
  const values = keys.map(k => lead[k]);
  values.push(id);

  const result = await query(
    `UPDATE leads SET ${setString} WHERE id = $${values.length} RETURNING *`,
    values
  );
  return result.rows[0];
};

// ==================== Approvals ====================
export const getApprovals = async (filters?: any) => {
  let sql = 'SELECT * FROM approval_requests WHERE 1=1';
  const params: any[] = [];
  
  if (filters?.mr_id) {
    params.push(filters.mr_id);
    sql += ` AND mr_id = $${params.length}`;
  }
  if (filters?.status) {
    params.push(filters.status);
    sql += ` AND status = $${params.length}`;
  }
  
  sql += ' ORDER BY created_at DESC';
  const result = await query(sql, params);
  return result.rows;
};

export const createApprovalRequest = async (req: any) => {
  const result = await query(
    `INSERT INTO approval_requests (mr_id, mr_name, type, entity_name, details, amount, status, priority, requested_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
    [req.mr_id, req.mr_name, req.type, req.entity_name, req.details, req.amount, req.status || 'pending', req.priority || 'medium', req.date || new Date()]
  );
  return result.rows[0];
};

export const updateApprovalRequest = async (id: number, updates: any) => {
  const keys = Object.keys(updates).filter(k => updates[k] !== undefined && k !== 'id');
  if (keys.length === 0) return null;
  
  const setString = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');
  const values = keys.map(k => updates[k]);
  values.push(id);
  
  const result = await query(
    `UPDATE approval_requests SET ${setString}, updated_at = NOW() WHERE id = $${values.length} RETURNING *`,
    values
  );
  return result.rows[0];
};

// ==================== Users ====================
export const getUsers = async () => {
  const result = await query('SELECT * FROM users ORDER BY id');
  return result.rows;
};

export const getUserByEmail = async (email: string) => {
  const result = await query('SELECT * FROM users WHERE email = $1', [email]);
  return result.rows[0];
};

export const createUser = async (user: any) => {
  const result = await query(
    `INSERT INTO users (email, name, role, mr_id, territory, password_hash)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [user.email, user.name, user.role, user.mr_id, user.territory, user.password_hash]
  );
  return result.rows[0];
};

// ==================== Attendance ====================
export const getAttendance = async (mr_id?: number) => {
  let sql = 'SELECT * FROM attendance';
  const params: any[] = [];
  if (mr_id) {
    sql += ' WHERE mr_id = $1';
    params.push(mr_id);
  }
  sql += ' ORDER BY date DESC, id DESC';
  const result = await query(sql, params);
  return result.rows;
};

export const checkInAttendance = async (attendance: any) => {
  const result = await query(
    `INSERT INTO attendance (mr_id, date, check_in, lat, lng, status, visit_counts, total_order_value)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [
      attendance.mr_id, 
      attendance.date, 
      attendance.check_in, 
      attendance.lat || null, 
      attendance.lng || null, 
      attendance.status || 'present',
      attendance.visit_counts || { doctor: 0, clinic: 0, hospital: 0, chemist: 0 },
      attendance.total_order_value || 0
    ]
  );
  return result.rows[0];
};

export const checkOutAttendance = async (mr_id: number, date: string, check_out: string, prod_mins: number = 0, visit_mins: number = 0, travel_mins: number = 0, lat: number | null = null, lng: number | null = null) => {
  const result = await query(
    `UPDATE attendance 
     SET check_out = $1, productive_time_mins = $4, visit_time_mins = $5, travel_time_mins = $6, check_out_lat = $7, check_out_lng = $8
     WHERE mr_id = $2 AND date = $3
     RETURNING *`,
    [check_out, mr_id, date, prod_mins, visit_mins, travel_mins, lat, lng]
  );
  return result.rows[0];
};

export const getAttendanceByDateAndMr = async (mr_id: number, date: string) => {
  const result = await query('SELECT * FROM attendance WHERE mr_id = $1 AND date = $2', [mr_id, date]);
  return result.rows[0];
};

// ==================== Targets ====================
export const getTargets = async (mr_id?: number) => {
  let sql = 'SELECT * FROM targets';
  const params: any[] = [];
  if (mr_id) {
    sql += ' WHERE mr_id = $1';
    params.push(mr_id);
  }
  sql += ' ORDER BY month DESC';
  const result = await query(sql, params);
  return result.rows;
};

export const createTarget = async (target: any) => {
  const result = await query(
    `INSERT INTO targets (mr_id, month, target_value, achieved_value, status, product_type)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [target.mr_id, target.month, target.target_value, target.achieved_value || 0, target.status || 'in_progress', target.product_type || 'Total']
  );
  return result.rows[0];
};

// ==================== Dashboard & Analytics ====================
export const getDashboardStats = async (mr_id?: number) => {
  const params: any[] = [];
  let mrFilter = '';
  if (mr_id) {
    params.push(mr_id);
    mrFilter = ' WHERE mr_id = $1';
  }

  const salesResult = await query(`SELECT SUM(amount) as total_sales FROM sales${mrFilter}`, params);
  const mrsResult = await query(`SELECT COUNT(*) as active_mrs FROM mrs WHERE status = 'active'`);
  const targetsResult = await query(`SELECT SUM(target_value) as total_target, SUM(achieved_value) as total_achieved FROM targets${mrFilter}`, params);
  const topPerformerResult = await query(`SELECT name, total_sales, performance_score FROM mrs WHERE status = 'active' ORDER BY total_sales DESC LIMIT 1`);

  const totalSales = parseFloat(salesResult.rows[0]?.total_sales || 0);
  const totalTarget = parseFloat(targetsResult.rows[0]?.total_target || 0);
  const totalAchieved = parseFloat(targetsResult.rows[0]?.total_achieved || 0);
  
  return {
    totalSales,
    activeMRs: parseInt(mrsResult.rows[0]?.active_mrs || 0),
    achievementRate: totalTarget > 0 ? (totalAchieved / totalTarget) * 100 : 0,
    topPerformer: topPerformerResult.rows[0] || null
  };
};

export const getDashboardCharts = async (mr_id?: number) => {
  const params: any[] = [];
  let mrFilter = '';
  if (mr_id) {
    params.push(mr_id);
    mrFilter = ' WHERE mr_id = $1';
  }

  // Monthly Sales vs Targets
  const monthlyDataResult = await query(`
    SELECT 
      COALESCE(s.month, t.month) as month,
      COALESCE(s.sales, 0) as sales,
      COALESCE(t.target, 0) as target
    FROM (
      SELECT TO_CHAR(date, 'YYYY-MM') as month, SUM(amount) as sales
      FROM sales
      ${mrFilter}
      GROUP BY month
    ) s
    FULL OUTER JOIN (
      SELECT month, SUM(target_value) as target
      FROM targets
      ${mrFilter}
      GROUP BY month
    ) t ON s.month = t.month
    ORDER BY month ASC
  `, params);

  // MR Performance Leaderboard
  const leaderboardResult = await query(`
    SELECT name, total_sales as sales, performance_score as score
    FROM mrs
    WHERE status = 'active'
    ORDER BY total_sales DESC
    LIMIT 10
  `);

  // Recent Sales
  const recentSalesResult = await query(`
    SELECT s.*, p.name as product_name, m.name as mr_name
    FROM sales s
    LEFT JOIN products p ON s.product_id = p.id
    LEFT JOIN mrs m ON s.mr_id = m.id
    ${mrFilter ? ' WHERE s.mr_id = $1' : ''}
    ORDER BY s.date DESC
    LIMIT 10
  `, params);

  // Product Sales
  const productSalesResult = await query(`
    SELECT p.name, SUM(s.amount) as sales
    FROM sales s
    JOIN products p ON s.product_id = p.id
    ${mrFilter ? ' WHERE s.mr_id = $1' : ''}
    GROUP BY p.name
    ORDER BY sales DESC
    LIMIT 8
  `, params);

  // Expense Breakdown
  const expenseBreakdownResult = await query(`
    SELECT category as name, SUM(amount) as amount
    FROM expenses
    ${mrFilter ? ' WHERE mr_id = $1' : ''}
    GROUP BY category
    ORDER BY amount DESC
  `, params);

  // Sales by Type
  const salesByTypeResult = await query(`
    SELECT sale_type as name, COUNT(*) as value
    FROM sales
    ${mrFilter ? ' WHERE mr_id = $1' : ''}
    GROUP BY sale_type
  `, params);

  // Leads Pipeline
  const leadsPipelineResult = await query(`
    SELECT status as name, COUNT(*) as count
    FROM leads
    ${mrFilter ? ' WHERE assigned_mr_id = $1' : ''}
    GROUP BY status
  `, params);

  // Recent Activity (Visits)
  const recentVisitsResult = await query(`
    SELECT v.*, m.name as mr_name
    FROM doctor_visits v
    LEFT JOIN mrs m ON v.mr_id = m.id
    ${mrFilter ? ' WHERE v.mr_id = $1' : ''}
    ORDER BY v.visit_date DESC, v.id DESC
    LIMIT 10
  `, params);

  return {
    monthlyTrends: monthlyDataResult.rows,
    leaderboard: leaderboardResult.rows,
    recentSales: recentSalesResult.rows,
    productSales: productSalesResult.rows,
    expenseBreakdown: expenseBreakdownResult.rows,
    salesByType: salesByTypeResult.rows,
    leadsPipeline: leadsPipelineResult.rows,
    recentVisits: recentVisitsResult.rows
  };
};

// ==================== Visits ====================
export const getVisitRecords = async (mr_id?: number) => {
  let sql = 'SELECT * FROM visit_records';
  const params: any[] = [];
  if (mr_id) {
    sql += ' WHERE mr_id = $1';
    params.push(mr_id);
  }
  sql += ' ORDER BY created_at DESC';
  const result = await query(sql, params);
  return result.rows;
};

export const createVisitRecord = async (record: any) => {
  const ensureJson = (val: any) => {
    if (val === null || val === undefined) return null;
    if (typeof val === 'string') {
      try {
        JSON.parse(val);
        return val; // Already JSON
      } catch {
        // Not JSON, likely comma separated list
        return JSON.stringify(val.split(',').map(s => s.trim()).filter(Boolean));
      }
    }
    return JSON.stringify(val);
  };

  const result = await query(
    `INSERT INTO visit_records (
      mr_id, scheduled_visit_id, entity_type, entity_id, entity_name, 
      check_in_gps, check_out_gps, arrival_time, waiting_time, speaking_time, 
      photo_url, photo_captured, audio_recording_url, transcription, 
      conversation_summary, sentiment, key_discussion, doctor_feedback, 
      products_detailed, samples_given, promo_material, sale_done, 
      sale_amount, order_value, follow_up_required, follow_up_date, 
      detected_lead, status, purpose, check_in_time, check_out_time
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31) RETURNING *`,
    [
      record.mr_id, record.scheduled_visit_id, record.entity_type, record.entity_id, record.entity_name,
      record.check_in_gps ? JSON.stringify(record.check_in_gps) : null,
      record.check_out_gps ? JSON.stringify(record.check_out_gps) : null,
      record.arrival_time, record.waiting_time, record.speaking_time,
      record.photo_url, record.photo_captured, record.audio_recording_url, record.transcription,
      record.conversation_summary, record.sentiment, record.key_discussion, record.doctor_feedback,
      ensureJson(record.products_detailed), 
      ensureJson(record.samples_given), 
      ensureJson(record.promo_material), 
      record.sale_done,
      record.sale_amount, record.order_value, record.follow_up_required, record.follow_up_date,
      record.detected_lead ? JSON.stringify(record.detected_lead) : null,
      record.status || 'completed',
      record.purpose,
      record.check_in_time,
      record.check_out_time
    ]
  );
  return result.rows[0];
};

export const getDoctorVisits = async (mr_id?: number) => {
  let sql = 'SELECT * FROM doctor_visits';
  const params: any[] = [];
  if (mr_id) {
    sql += ' WHERE mr_id = $1';
    params.push(mr_id);
  }
  sql += ' ORDER BY created_at DESC';
  const result = await query(sql, params);
  return result.rows;
};

// ==================== Entity Credits ====================
export const getEntityCredits = async (mrId?: number, territory?: string) => {
  let sql = 'SELECT * FROM v_entity_credit_risk WHERE 1=1';
  const params: any[] = [];
  
  if (mrId) {
    params.push(mrId);
    sql += ` AND id IN (SELECT id FROM entity_credits WHERE mr_id = $${params.length})`;
  }
  
  sql += ' ORDER BY risk_score DESC, entity_name';
  const result = await query(sql, params);
  return result.rows;
};

export const updateEntityCredit = async (id: number, updates: any) => {
  const keys = Object.keys(updates).filter(k => updates[k] !== undefined && k !== 'id');
  if (keys.length === 0) return null;
  
  const setString = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');
  const values = keys.map(k => updates[k]);
  values.push(id);
  
  const result = await query(
    `UPDATE entity_credits SET ${setString}, updated_at = NOW() WHERE id = $${values.length} RETURNING *`,
    values
  );
  return result.rows[0];
};

// ==================== Payments ====================
export const getPayments = async (filters?: { entity_credit_id?: number; mr_id?: number }) => {
  let sql = 'SELECT * FROM payments WHERE 1=1';
  const params: any[] = [];
  
  if (filters?.entity_credit_id) {
    params.push(filters.entity_credit_id);
    sql += ` AND entity_credit_id = $${params.length}`;
  }
  
  if (filters?.mr_id) {
    params.push(filters.mr_id);
    sql += ` AND mr_id = $${params.length}`;
  }
  
  sql += ' ORDER BY payment_date DESC, created_at DESC';
  const result = await query(sql, params);
  return result.rows;
};

export const createPayment = async (payment: any) => {
  const result = await query(
    `INSERT INTO payments (entity_credit_id, entity_name, mr_id, amount, payment_method, reference_number, payment_date, notes, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
    [
      payment.entity_credit_id, payment.entity_name, payment.mr_id, payment.amount,
      payment.payment_method, payment.reference_number, payment.payment_date,
      payment.notes, payment.status || 'confirmed'
    ]
  );
  return result.rows[0];
};

// ==================== Collection Intelligence ====================
export const getEntityCollectionContext = async (entityName: string) => {
  console.log(`🔍 Fetching collection context for: ${entityName}`);
  try {
    const credit = await query('SELECT * FROM v_entity_credit_risk WHERE entity_name ILIKE $1', [entityName]);
    console.log(`   - Credit records found: ${credit.rowCount}`);
    
    const recentPayments = await query('SELECT * FROM payments WHERE entity_name ILIKE $1 ORDER BY payment_date DESC LIMIT 5', [entityName]);
    const recentSales = await query('SELECT * FROM sales WHERE customer_name ILIKE $1 ORDER BY date DESC LIMIT 5', [entityName]);
    const lastVisit = await query('SELECT * FROM visit_records WHERE entity_name ILIKE $1 ORDER BY created_at DESC LIMIT 1', [entityName]);
    
    return {
      credit: credit.rows[0],
      payments: recentPayments.rows,
      sales: recentSales.rows,
      lastVisit: lastVisit.rows[0]
    };
  } catch (err) {
    console.error(`❌ Error in getEntityCollectionContext for ${entityName}:`, err);
    throw err;
  }
};
