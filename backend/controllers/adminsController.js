const admissionsController = {
  
  // GET /api/admissions - Get all admissions with filtering
  getAllAdmissions: async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const search = req.query.search || '';
      const wardId = req.query.wardId || '';
      const status = req.query.status || ''; // 'current' or 'discharged'
      const startDate = req.query.startDate || '';
      const endDate = req.query.endDate || '';
      const sortBy = req.query.sortBy || 'admission_date';
      const sortOrder = req.query.sortOrder || 'DESC';
      const offset = (page - 1) * limit;

      let whereConditions = [];
      let queryParams = [];
      let paramIndex = 1;

      if (search) {
        whereConditions.push(`(
          p.first_name ILIKE $${paramIndex} OR 
          p.last_name ILIKE $${paramIndex} OR 
          w.ward_name ILIKE $${paramIndex}
        )`);
        queryParams.push(`%${search}%`);
        paramIndex++;
      }

      if (wardId) {
        whereConditions.push(`a.ward_id = $${paramIndex}`);
        queryParams.push(wardId);
        paramIndex++;
      }

      if (status === 'current') {
        whereConditions.push('a.discharge_date IS NULL');
      } else if (status === 'discharged') {
        whereConditions.push('a.discharge_date IS NOT NULL');
      }

      if (startDate) {
        whereConditions.push(`a.admission_date >= $${paramIndex}::date`);
        queryParams.push(startDate);
        paramIndex++;
      }

      if (endDate) {
        whereConditions.push(`a.admission_date <= $${paramIndex}::date`);
        queryParams.push(endDate);
        paramIndex++;
      }

      const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

      const validSortColumns = ['admission_date', 'discharge_date', 'patient_name', 'ward_name'];
      const sortColumn = validSortColumns.includes(sortBy) ? 
        (sortBy === 'patient_name' ? 'p.last_name' : 
         sortBy === 'ward_name' ? 'w.ward_name' : 
         `a.${sortBy}`) : 'a.admission_date';
      const order = ['ASC', 'DESC'].includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'DESC';

      // Complex query with multiple INNER JOINs
      const admissionsQuery = `
        SELECT 
          a.admission_id,
          a.patient_id,
          a.ward_id,
          a.admission_date,
          a.discharge_date,
          p.first_name as patient_first_name,
          p.last_name as patient_last_name,
          p.phone_number as patient_phone,
          p.email as patient_email,
          CASE 
            WHEN p.gender = 'M' THEN 'Male'
            WHEN p.gender = 'F' THEN 'Female'
            ELSE 'Other'
          END as patient_gender,
          w.ward_name,
          w.ward_type,
          w.capacity,
          CASE 
            WHEN a.discharge_date IS NULL THEN 'Current'
            ELSE 'Discharged'
          END as admission_status,
          CASE 
            WHEN a.discharge_date IS NOT NULL 
            THEN a.discharge_date - a.admission_date
            ELSE CURRENT_DATE - a.admission_date
          END as length_of_stay
        FROM admissions a
        INNER JOIN patients p ON a.patient_id = p.patient_id
        INNER JOIN wards w ON a.ward_id = w.ward_id
        ${whereClause}
        ORDER BY ${sortColumn} ${order}
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;

      const countQuery = `
        SELECT COUNT(*) as total 
        FROM admissions a
        INNER JOIN patients p ON a.patient_id = p.patient_id
        INNER JOIN wards w ON a.ward_id = w.ward_id
        ${whereClause}
      `;

      queryParams.push(limit, offset);

      const [admissionsResult, countResult] = await Promise.all([
        pool.query(admissionsQuery, queryParams),
        pool.query(countQuery, queryParams.slice(0, -2))
      ]);

      const totalCount = parseInt(countResult.rows[0].total);
      const totalPages = Math.ceil(totalCount / limit);

      res.json({
        success: true,
        data: {
          admissions: admissionsResult.rows,
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
      console.error('Error in getAllAdmissions:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch admissions',
        message: error.message
      });
    }
  },

  // POST /api/admissions - Admit patient (ACID Transaction)
  createAdmission: async (req, res) => {
    try {
      const {
        patient_id,
        ward_id,
        admission_date = new Date().toISOString().split('T')[0]
      } = req.body;

      // Validation
      if (!patient_id || !ward_id) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields',
          required: ['patient_id', 'ward_id']
        });
      }

      const result = await transaction(async (client) => {
        // Check if patient exists
        const patientCheck = await client.query(
          'SELECT patient_id, first_name, last_name FROM patients WHERE patient_id = $1',
          [patient_id]
        );

        if (patientCheck.rows.length === 0) {
          throw new Error('Patient not found');
        }

        // Check if patient is already admitted
        const currentAdmissionCheck = await client.query(
          'SELECT admission_id FROM admissions WHERE patient_id = $1 AND discharge_date IS NULL',
          [patient_id]
        );

        if (currentAdmissionCheck.rows.length > 0) {
          throw new Error('Patient is already admitted');
        }

        // Check ward capacity with row lock
        const wardCheck = await client.query(
          'SELECT ward_id, ward_name, capacity FROM wards WHERE ward_id = $1 FOR UPDATE',
          [ward_id]
        );

        if (wardCheck.rows.length === 0) {
          throw new Error('Ward not found');
        }

        const ward = wardCheck.rows[0];

        // Check current occupancy
        const occupancyCheck = await client.query(
          'SELECT COUNT(*) as current_occupancy FROM admissions WHERE ward_id = $1 AND discharge_date IS NULL',
          [ward_id]
        );

        const currentOccupancy = parseInt(occupancyCheck.rows[0].current_occupancy);

        if (currentOccupancy >= ward.capacity) {
          throw new Error(`Ward ${ward.ward_name} is at full capacity (${ward.capacity} beds)`);
        }

        // Insert admission
        const insertQuery = `
          INSERT INTO admissions (patient_id, ward_id, admission_date)
          VALUES ($1, $2, $3)
          RETURNING *
        `;

        const insertResult = await client.query(insertQuery, [
          patient_id,
          ward_id,
          admission_date
        ]);

        return {
          admission: insertResult.rows[0],
          patient: patientCheck.rows[0],
          ward: ward
        };
      });

      res.status(201).json({
        success: true,
        message: 'Patient admitted successfully',
        data: result
      });

    } catch (error) {
      console.error('Error in createAdmission:', error);
      res.status(400).json({
        success: false,
        error: 'Admission failed',
        message: error.message
      });
    }
  },

  // PUT /api/admissions/:id/discharge - Discharge patient
  dischargePatient: async (req, res) => {
    try {
      const { id } = req.params;
      const { discharge_date = new Date().toISOString().split('T')[0] } = req.body;

      if (!id || isNaN(id)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid admission ID'
        });
      }

      const result = await transaction(async (client) => {
        // Check if admission exists and is current
        const admissionCheck = await client.query(
          'SELECT * FROM admissions WHERE admission_id = $1',
          [id]
        );

        if (admissionCheck.rows.length === 0) {
          throw new Error('Admission not found');
        }

        const admission = admissionCheck.rows[0];

        if (admission.discharge_date) {
          throw new Error('Patient already discharged');
        }

        // Update admission with discharge date
        const dischargeResult = await client.query(`
          UPDATE admissions 
          SET discharge_date = $1 
          WHERE admission_id = $2 
          RETURNING *
        `, [discharge_date, id]);

        // Get patient and ward info
        const detailsQuery = `
          SELECT 
            a.*,
            p.first_name as patient_first_name,
            p.last_name as patient_last_name,
            w.ward_name,
            a.discharge_date - a.admission_date as length_of_stay
          FROM admissions a
          INNER JOIN patients p ON a.patient_id = p.patient_id
          INNER JOIN wards w ON a.ward_id = w.ward_id
          WHERE a.admission_id = $1
        `;

        const detailsResult = await client.query(detailsQuery, [id]);

        return detailsResult.rows[0];
      });

      res.json({
        success: true,
        message: 'Patient discharged successfully',
        data: {
          admission: result
        }
      });

    } catch (error) {
      console.error('Error in dischargePatient:', error);
      
      const errorMessage = error.message;
      if (errorMessage.includes('not found') || errorMessage.includes('already discharged')) {
        res.status(400).json({
          success: false,
          error: errorMessage
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Failed to discharge patient',
          message: errorMessage
        });
      }
    }
  }
};

module.exports = { wardsController, admissionsController };