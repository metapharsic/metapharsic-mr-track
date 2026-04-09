import { query } from './db';

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
    `INSERT INTO visit_schedules (mr_id, doctor_name, clinic, scheduled_date, 
     scheduled_time, purpose, status, priority, estimated_duration, notes, ai_generated)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
     RETURNING *`,
    [schedule.mr_id, schedule.doctor_name, schedule.clinic, schedule.scheduled_date,
     schedule.scheduled_time, schedule.purpose, schedule.status, schedule.priority,
     schedule.estimated_duration, schedule.notes, schedule.ai_generated]
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
    `INSERT INTO sales (mr_id, product_id, doctor_id, quantity, amount, date)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [sale.mr_id, sale.product_id, sale.doctor_id, sale.quantity, sale.amount, sale.date]
  );
  return result.rows[0];
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
    `INSERT INTO expenses (mr_id, category, amount, description, date, status)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [expense.mr_id, expense.category, expense.amount, expense.description, expense.date, expense.status]
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
