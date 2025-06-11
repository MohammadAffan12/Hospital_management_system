const { pool, query, transaction } = require('../config/database');

const wardsController = {
  
  // GET /api/wards - Get all wards with occupancy statistics
  getAllWards: async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const search = req.query.search || '';
      const sortBy = req.query.sortBy || 'ward_name';
      const sortOrder = req.query.sortOrder || 'ASC';
      const offset = (page - 1) * limit;

      let whereClause = '';
      let queryParams = [];

      if (search) {
        whereClause = `WHERE w.ward_name ILIKE $1 OR w.ward_type ILIKE $1`;
        queryParams = [`%${search}%`];
      }

      const validSortColumns = ['ward_name', 'ward_type', 'capacity', 'occupancy_rate'];
      const sortColumn = validSortColumns.includes(sortBy) ? 
        (sortBy === 'occupancy_rate' ? 'current_occupancy' : `w.${sortBy}`) : 'w.ward_name';
      const order = ['ASC', 'DESC'].includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'ASC';

      // Complex query with LEFT JOIN and aggregate functions
      const wardsQuery = `
        SELECT 
          w.ward_id,
          w.ward_name,
          w.ward_type,
          w.capacity,
          COUNT(CASE WHEN a.discharge_date IS NULL THEN 1 END) as current_occupancy,
          (w.capacity - COUNT(CASE WHEN a.discharge_date IS NULL THEN 1 END)) as available_beds,
          ROUND(
            COUNT(CASE WHEN a.discharge_date IS NULL THEN 1 END) * 100.0 / 
            NULLIF(w.capacity, 0), 2
          ) as occupancy_rate,
          COUNT(a.admission_id) as total_admissions_ever,
          COUNT(CASE WHEN a.admission_date >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as admissions_last_30_days
        FROM wards w
        LEFT JOIN admissions a ON w.ward_id = a.ward_id
        ${whereClause}
        GROUP BY w.ward_id, w.ward_name, w.ward_type, w.capacity
        ORDER BY ${sortColumn} ${order}
        LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}
      `;

      const countQuery = `SELECT COUNT(*) as total FROM wards w ${whereClause}`;

      queryParams.push(limit, offset);

      const [wardsResult, countResult] = await Promise.all([
        pool.query(wardsQuery, queryParams),
        pool.query(countQuery, queryParams.slice(0, -2))
      ]);

      const totalCount = parseInt(countResult.rows[0].total);
      const totalPages = Math.ceil(totalCount / limit);

      res.json({
        success: true,
        data: {
          wards: wardsResult.rows,
          pagination: {
            currentPage: page,
            totalPages,
            totalCount,
            limit,
            hasNextPage: page < totalPages,
            hasPreviousPage: page > 1
          }
        }
      });

    } catch (error) {
      console.error('Error in getAllWards:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch wards',
        message: error.message
      });
    }
  },

  // GET /api/wards/:id - Get ward by ID with current patients
  getWardById: async (req, res) => {
    try {
      const { id } = req.params;

      if (!id || isNaN(id)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid ward ID'
        });
      }

      // Ward details query
      const wardQuery = `
        SELECT 
          w.ward_id,
          w.ward_name,
          w.ward_type,
          w.capacity,
          COUNT(CASE WHEN a.discharge_date IS NULL THEN 1 END) as current_occupancy,
          (w.capacity - COUNT(CASE WHEN a.discharge_date IS NULL THEN 1 END)) as available_beds
        FROM wards w
        LEFT JOIN admissions a ON w.ward_id = a.ward_id
        WHERE w.ward_id = $1
        GROUP BY w.ward_id, w.ward_name, w.ward_type, w.capacity
      `;

      // Current patients in ward
      const currentPatientsQuery = `
        SELECT 
          a.admission_id,
          a.admission_date,
          a.patient_id,
          p.first_name as patient_first_name,
          p.last_name as patient_last_name,
          p.phone_number as patient_phone,
          p.email as patient_email,
          CASE 
            WHEN p.gender = 'M' THEN 'Male'
            WHEN p.gender = 'F' THEN 'Female'
            ELSE 'Other'
          END as patient_gender,
          CURRENT_DATE - a.admission_date as days_admitted
        FROM admissions a
        INNER JOIN patients p ON a.patient_id = p.patient_id
        WHERE a.ward_id = $1 AND a.discharge_date IS NULL
        ORDER BY a.admission_date ASC
      `;

      // Ward history (last 20 admissions)
      const historyQuery = `
        SELECT 
          a.admission_id,
          a.admission_date,
          a.discharge_date,
          p.first_name as patient_first_name,
          p.last_name as patient_last_name,
          CASE 
            WHEN a.discharge_date IS NOT NULL 
            THEN a.discharge_date - a.admission_date
            ELSE CURRENT_DATE - a.admission_date
          END as length_of_stay
        FROM admissions a
        INNER JOIN patients p ON a.patient_id = p.patient_id
        WHERE a.ward_id = $1
        ORDER BY a.admission_date DESC
        LIMIT 20
      `;

      const [ward, currentPatients, history] = await Promise.all([
        pool.query(wardQuery, [id]),
        pool.query(currentPatientsQuery, [id]),
        pool.query(historyQuery, [id])
      ]);

      if (ward.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Ward not found'
        });
      }

      res.json({
        success: true,
        data: {
          ward: ward.rows[0],
          currentPatients: currentPatients.rows,
          recentHistory: history.rows
        }
      });

    } catch (error) {
      console.error('Error in getWardById:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch ward details',
        message: error.message
      });
    }
  }
};

module.exports = wardsController;