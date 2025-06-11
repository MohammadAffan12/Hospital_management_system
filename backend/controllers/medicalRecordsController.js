const { pool, query, transaction } = require('../config/database');

const medicalRecordsController = {
  
  // GET /api/medical-records - Get all medical records with filtering
  getAllMedicalRecords: async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const search = req.query.search || '';
      const patientId = req.query.patientId || '';
      const startDate = req.query.startDate || '';
      const endDate = req.query.endDate || '';
      const sortBy = req.query.sortBy || 'record_date';
      const sortOrder = req.query.sortOrder || 'DESC';
      const offset = (page - 1) * limit;

      let whereConditions = [];
      let queryParams = [];
      let paramIndex = 1;

      if (search) {
        whereConditions.push(`(
          p.first_name ILIKE ${paramIndex} OR 
          p.last_name ILIKE ${paramIndex} OR 
          mr.diagnosis ILIKE ${paramIndex} OR
          mr.treatment ILIKE ${paramIndex}
        )`);
        queryParams.push(`%${search}%`);
        paramIndex++;
      }

      if (patientId) {
        whereConditions.push(`mr.patient_id = ${paramIndex}`);
        queryParams.push(patientId);
        paramIndex++;
      }

      if (startDate) {
        whereConditions.push(`mr.record_date >= ${paramIndex}::date`);
        queryParams.push(startDate);
        paramIndex++;
      }

      if (endDate) {
        whereConditions.push(`mr.record_date <= ${paramIndex}::date`);
        queryParams.push(endDate);
        paramIndex++;
      }

      const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

      const validSortColumns = ['record_date', 'patient_name', 'diagnosis'];
      const sortColumn = validSortColumns.includes(sortBy) ? 
        (sortBy === 'patient_name' ? 'p.last_name' : 
         sortBy === 'diagnosis' ? 'mr.diagnosis' :
         `mr.${sortBy}`) : 'mr.record_date';
      const order = ['ASC', 'DESC'].includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'DESC';

      // Complex query with INNER JOIN
      const recordsQuery = `
        SELECT 
          mr.record_id,
          mr.patient_id,
          mr.diagnosis,
          mr.treatment,
          mr.record_date,
          p.first_name as patient_first_name,
          p.last_name as patient_last_name,
          p.phone_number as patient_phone,
          p.email as patient_email,
          CASE 
            WHEN p.gender = 'M' THEN 'Male'
            WHEN p.gender = 'F' THEN 'Female'
            ELSE 'Other'
          END as patient_gender,
          EXTRACT(YEAR FROM CURRENT_DATE) - EXTRACT(YEAR FROM p.date_of_birth) as patient_age
        FROM medical_records mr
        INNER JOIN patients p ON mr.patient_id = p.patient_id
        ${whereClause}
        ORDER BY ${sortColumn} ${order}
        LIMIT ${paramIndex} OFFSET ${paramIndex + 1}
      `;

      const countQuery = `
        SELECT COUNT(*) as total 
        FROM medical_records mr
        INNER JOIN patients p ON mr.patient_id = p.patient_id
        ${whereClause}
      `;

      queryParams.push(limit, offset);

      const [recordsResult, countResult] = await Promise.all([
        pool.query(recordsQuery, queryParams),
        pool.query(countQuery, queryParams.slice(0, -2))
      ]);

      const totalCount = parseInt(countResult.rows[0].total);
      const totalPages = Math.ceil(totalCount / limit);

      res.json({
        success: true,
        data: {
          medicalRecords: recordsResult.rows,
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
      console.error('Error in getAllMedicalRecords:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch medical records',
        message: error.message
      });
    }
  },

  // POST /api/medical-records - Create new medical record
  createMedicalRecord: async (req, res) => {
    try {
      const {
        patient_id,
        diagnosis,
        treatment,
        record_date = new Date().toISOString().split('T')[0]
      } = req.body;

      // Validation
      if (!patient_id || !diagnosis || !treatment) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields',
          required: ['patient_id', 'diagnosis', 'treatment']
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

        // Insert medical record
        const insertQuery = `
          INSERT INTO medical_records (patient_id, diagnosis, treatment, record_date)
          VALUES ($1, $2, $3, $4)
          RETURNING *
        `;

        const insertResult = await client.query(insertQuery, [
          patient_id,
          diagnosis.trim(),
          treatment.trim(),
          record_date
        ]);

        return {
          medicalRecord: insertResult.rows[0],
          patient: patientCheck.rows[0]
        };
      });

      res.status(201).json({
        success: true,
        message: 'Medical record created successfully',
        data: result
      });

    } catch (error) {
      console.error('Error in createMedicalRecord:', error);
      
      if (error.message === 'Patient not found') {
        res.status(404).json({
          success: false,
          error: 'Patient not found'
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Failed to create medical record',
          message: error.message
        });
      }
    }
  }
};
