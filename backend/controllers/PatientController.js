const { pool, query, transaction } = require('../config/database');

const patientController = {
  
  // GET /api/patients - Get all patients with pagination and search
  getAllPatients: async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const search = req.query.search || '';
      const sortBy = req.query.sortBy || 'first_name';
      const sortOrder = req.query.sortOrder || 'ASC';
      const offset = (page - 1) * limit;

      let whereClause = '';
      let queryParams = [];

      if (search) {
        whereClause = `WHERE 
          first_name ILIKE $1 OR 
          last_name ILIKE $1 OR 
          email ILIKE $1 OR
          phone_number LIKE $1`;
        queryParams = [`%${search}%`];
      }

      const validSortColumns = ['first_name', 'last_name', 'date_of_birth', 'gender', 'email'];
      const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'first_name';
      const order = ['ASC', 'DESC'].includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'ASC';

      // Main query using patient_id as primary key
      const patientsQuery = `
        SELECT 
          patient_id,
          first_name,
          last_name,
          CASE 
            WHEN gender = 'M' THEN 'Male'
            WHEN gender = 'F' THEN 'Female'
            ELSE 'Other'
          END as gender,
          date_of_birth,
          phone_number,
          email,
          address,
          EXTRACT(YEAR FROM CURRENT_DATE) - EXTRACT(YEAR FROM date_of_birth) as age
        FROM patients
        ${whereClause}
        ORDER BY ${sortColumn} ${order}
        LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}
      `;

      // Count query
      const countQuery = `SELECT COUNT(*) as total FROM patients ${whereClause}`;

      const [patientsResult, countResult] = await Promise.all([
        pool.query(patientsQuery, [...queryParams, limit, offset]),
        pool.query(countQuery, queryParams)
      ]);

      const totalCount = parseInt(countResult.rows[0].total);
      const totalPages = Math.ceil(totalCount / limit);

      res.json({
        success: true,
        data: {
          patients: patientsResult.rows,
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
      console.error('Error in getAllPatients:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch patients',
        message: error.message
      });
    }
  },

  // GET /api/patients/:id - Get patient by ID with all related data
  getPatientById: async (req, res) => {
    try {
      const { id } = req.params;

      if (!id || isNaN(id)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid patient ID'
        });
      }

      // Main patient query
      const patientQuery = `
        SELECT 
          patient_id,
          first_name,
          last_name,
          CASE 
            WHEN gender = 'M' THEN 'Male'
            WHEN gender = 'F' THEN 'Female'
            ELSE 'Other'
          END as gender,
          date_of_birth,
          phone_number,
          email,
          address,
          EXTRACT(YEAR FROM CURRENT_DATE) - EXTRACT(YEAR FROM date_of_birth) as age
        FROM patients 
        WHERE patient_id = $1
      `;

      // Related data queries using proper foreign keys
      const appointmentsQuery = `
        SELECT 
          a.id,
          a.patient_id,
          a.doctor_id,
          a.appointment_date,
          a.status,
          a.notes,
          d.first_name as doctor_first_name,
          d.last_name as doctor_last_name,
          d.specialization,
          d.phone_number as doctor_phone,
          d.email as doctor_email
        FROM appointments a
        LEFT JOIN doctors d ON a.doctor_id = d.id
        WHERE a.patient_id = $1
        ORDER BY a.appointment_date DESC
        LIMIT 20
      `;

      const medicalRecordsQuery = `
        SELECT 
          id,
          patient_id,
          diagnosis,
          treatment,
          record_date
        FROM medical_records 
        WHERE patient_id = $1 
        ORDER BY record_date DESC
        LIMIT 20
      `;

      const billingQuery = `
        SELECT 
          id,
          patient_id,
          bill_date,
          amount,
          paid
        FROM billing 
        WHERE patient_id = $1 
        ORDER BY bill_date DESC
        LIMIT 20
      `;

      const admissionsQuery = `
        SELECT 
          a.id,
          a.patient_id,
          a.ward_id,
          a.admission_date,
          a.discharge_date,
          w.ward_name,
          w.capacity,
          CASE 
            WHEN a.discharge_date IS NULL THEN 'Current'
            ELSE 'Discharged'
          END as status,
          CASE 
            WHEN a.discharge_date IS NOT NULL 
            THEN a.discharge_date - a.admission_date
            ELSE CURRENT_DATE - a.admission_date
          END as length_of_stay
        FROM admissions a
        LEFT JOIN wards w ON a.ward_id = w.ward_id
        WHERE a.patient_id = $1
        ORDER BY a.admission_date DESC
        LIMIT 10
      `;

      // Execute all queries in parallel
      const [patient, appointments, medicalRecords, billing, admissions] = await Promise.all([
        pool.query(patientQuery, [id]),
        pool.query(appointmentsQuery, [id]),
        pool.query(medicalRecordsQuery, [id]),
        pool.query(billingQuery, [id]),
        pool.query(admissionsQuery, [id])
      ]);

      if (patient.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Patient not found'
        });
      }

      // Calculate summary statistics
      const totalBilled = billing.rows.reduce((sum, bill) => sum + parseFloat(bill.amount || 0), 0);
      const paidAmount = billing.rows
        .filter(bill => bill.paid)
        .reduce((sum, bill) => sum + parseFloat(bill.amount || 0), 0);
      const outstandingBalance = totalBilled - paidAmount;

      res.json({
        success: true,
        data: {
          patient: patient.rows[0],
          appointments: appointments.rows,
          medicalRecords: medicalRecords.rows,
          billing: billing.rows,
          admissions: admissions.rows,
          summary: {
            totalAppointments: appointments.rows.length,
            totalMedicalRecords: medicalRecords.rows.length,
            totalBilled: totalBilled.toFixed(2),
            paidAmount: paidAmount.toFixed(2),
            outstandingBalance: outstandingBalance.toFixed(2),
            currentlyAdmitted: admissions.rows.some(a => a.status === 'Current')
          }
        }
      });

    } catch (error) {
      console.error('Error in getPatientById:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch patient details',
        message: error.message
      });
    }
  },

  // POST /api/patients - Create new patient (ACID Transaction)
  createPatient: async (req, res) => {
    try {
      const {
        first_name,
        last_name,
        gender,
        date_of_birth,
        phone_number,
        email,
        address
      } = req.body;

      // Validation
      if (!first_name || !last_name || !gender || !date_of_birth) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields',
          required: ['first_name', 'last_name', 'gender', 'date_of_birth']
        });
      }

      // Validate date format
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(date_of_birth)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid date format. Use YYYY-MM-DD'
        });
      }

      // Validate gender and convert to single character
      let genderChar;
      const genderLower = gender.toLowerCase();
      if (genderLower === 'male' || genderLower === 'm') {
        genderChar = 'M';
      } else if (genderLower === 'female' || genderLower === 'f') {
        genderChar = 'F';
      } else {
        return res.status(400).json({
          success: false,
          error: 'Invalid gender. Use Male/M or Female/F'
        });
      }

      // Use transaction to ensure ACID properties
      const result = await transaction(async (client) => {
        // Check if email already exists (if provided)
        if (email) {
          const emailCheck = await client.query(
            'SELECT patient_id FROM patients WHERE email = $1',
            [email]
          );
          
          if (emailCheck.rows.length > 0) {
            throw new Error('Email already exists');
          }
        }

        // Insert new patient
        const insertQuery = `
          INSERT INTO patients (first_name, last_name, gender, date_of_birth, phone_number, email, address)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING patient_id, first_name, last_name, 
                   CASE 
                     WHEN gender = 'M' THEN 'Male'
                     WHEN gender = 'F' THEN 'Female'
                     ELSE 'Other'
                   END as gender,
                   date_of_birth, phone_number, email, address
        `;

        const insertResult = await client.query(insertQuery, [
          first_name.trim(),
          last_name.trim(),
          genderChar,
          date_of_birth,
          phone_number || null,
          email ? email.trim().toLowerCase() : null,
          address ? address.trim() : null
        ]);

        return insertResult.rows[0];
      });

      res.status(201).json({
        success: true,
        message: 'Patient created successfully',
        data: {
          patient: result
        }
      });

    } catch (error) {
      console.error('Error in createPatient:', error);
      
      if (error.message === 'Email already exists') {
        res.status(409).json({
          success: false,
          error: 'Email already exists'
        });
      } else if (error.code === '23505') { // PostgreSQL unique constraint violation
        res.status(409).json({
          success: false,
          error: 'Unique constraint violation',
          details: error.detail
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Failed to create patient',
          message: error.message
        });
      }
    }
  },

  // PUT /api/patients/:id - Update patient (ACID Transaction)
  updatePatient: async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      if (!id || isNaN(id)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid patient ID'
        });
      }

      // Remove patient_id from update data if present
      delete updateData.patient_id;

      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({
          success: false,
          error: 'No fields to update'
        });
      }

      // Convert gender if provided
      if (updateData.gender) {
        const genderLower = updateData.gender.toLowerCase();
        if (genderLower === 'male' || genderLower === 'm') {
          updateData.gender = 'M';
        } else if (genderLower === 'female' || genderLower === 'f') {
          updateData.gender = 'F';
        } else {
          return res.status(400).json({
            success: false,
            error: 'Invalid gender. Use Male/M or Female/F'
          });
        }
      }

      // Validate date format if provided
      if (updateData.date_of_birth && !/^\d{4}-\d{2}-\d{2}$/.test(updateData.date_of_birth)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid date format. Use YYYY-MM-DD'
        });
      }

      const result = await transaction(async (client) => {
        // Check if patient exists
        const existCheck = await client.query(
          'SELECT patient_id FROM patients WHERE patient_id = $1',
          [id]
        );

        if (existCheck.rows.length === 0) {
          throw new Error('Patient not found');
        }

        // Check email uniqueness if email is being updated
        if (updateData.email) {
          const emailCheck = await client.query(
            'SELECT patient_id FROM patients WHERE email = $1 AND patient_id != $2',
            [updateData.email.trim().toLowerCase(), id]
          );

          if (emailCheck.rows.length > 0) {
            throw new Error('Email already exists');
          }
        }

        // Build dynamic update query
        const fields = Object.keys(updateData);
        const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');
        const values = [id, ...fields.map(field => {
          if (field === 'email' && updateData[field]) {
            return updateData[field].trim().toLowerCase();
          }
          if (typeof updateData[field] === 'string' && field !== 'gender') {
            return updateData[field].trim();
          }
          return updateData[field];
        })];

        const updateQuery = `
          UPDATE patients 
          SET ${setClause}
          WHERE patient_id = $1
          RETURNING patient_id, first_name, last_name,
                   CASE 
                     WHEN gender = 'M' THEN 'Male'
                     WHEN gender = 'F' THEN 'Female'
                     ELSE 'Other'
                   END as gender,
                   date_of_birth, phone_number, email, address
        `;

        const updateResult = await client.query(updateQuery, values);
        return updateResult.rows[0];
      });

      res.json({
        success: true,
        message: 'Patient updated successfully',
        data: {
          patient: result
        }
      });

    } catch (error) {
      console.error('Error in updatePatient:', error);
      
      if (error.message === 'Patient not found') {
        res.status(404).json({
          success: false,
          error: 'Patient not found'
        });
      } else if (error.message === 'Email already exists') {
        res.status(409).json({
          success: false,
          error: 'Email already exists'
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Failed to update patient',
          message: error.message
        });
      }
    }
  },

  // DELETE /api/patients/:id - Delete patient (with relationship checks)
  deletePatient: async (req, res) => {
    try {
      const { id } = req.params;

      if (!id || isNaN(id)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid patient ID'
        });
      }

      const result = await transaction(async (client) => {
        // Check if patient exists
        const patientCheck = await client.query(
          'SELECT patient_id, first_name, last_name FROM patients WHERE patient_id = $1',
          [id]
        );

        if (patientCheck.rows.length === 0) {
          throw new Error('Patient not found');
        }

        // Check for related records (referential integrity)
        const relatedRecordsQuery = `
          SELECT 
            (SELECT COUNT(*) FROM appointments WHERE patient_id = $1) as appointments,
            (SELECT COUNT(*) FROM medical_records WHERE patient_id = $1) as medical_records,
            (SELECT COUNT(*) FROM billing WHERE patient_id = $1) as billing,
            (SELECT COUNT(*) FROM admissions WHERE patient_id = $1) as admissions
        `;

        const relatedResult = await client.query(relatedRecordsQuery, [id]);
        const related = relatedResult.rows[0];

        const hasRelatedRecords = Object.values(related).some(count => parseInt(count) > 0);

        if (hasRelatedRecords) {
          throw new Error('Cannot delete patient with existing records');
        }

        // Delete patient
        const deleteResult = await client.query(
          'DELETE FROM patients WHERE patient_id = $1 RETURNING *',
          [id]
        );

        return {
          patient: deleteResult.rows[0],
          relatedRecords: related
        };
      });

      res.json({
        success: true,
        message: 'Patient deleted successfully',
        data: result
      });

    } catch (error) {
      console.error('Error in deletePatient:', error);
      
      if (error.message === 'Patient not found') {
        res.status(404).json({
          success: false,
          error: 'Patient not found'
        });
      } else if (error.message === 'Cannot delete patient with existing records') {
        res.status(409).json({
          success: false,
          error: 'Cannot delete patient with existing medical records, appointments, or billing',
          message: 'Please remove all related records first'
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Failed to delete patient',
          message: error.message
        });
      }
    }
  }
};

module.exports = patientController;