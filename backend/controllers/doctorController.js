const { pool, query, transaction } = require('../config/database');

const doctorController = {
  
  // GET /api/doctors - Get all doctors with pagination and search
  getAllDoctors: async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const search = req.query.search || '';
      const specialization = req.query.specialization || '';
      const sortBy = req.query.sortBy || 'last_name';
      const sortOrder = req.query.sortOrder || 'ASC';
      const offset = (page - 1) * limit;

      let whereClause = [];
      let queryParams = [];
      let paramCounter = 1;

      if (search) {
        whereClause.push(`(first_name ILIKE $${paramCounter} OR last_name ILIKE $${paramCounter} OR email ILIKE $${paramCounter})`);
        queryParams.push(`%${search}%`);
        paramCounter++;
      }

      if (specialization) {
        whereClause.push(`specialization ILIKE $${paramCounter}`);
        queryParams.push(`%${specialization}%`);
        paramCounter++;
      }

      const whereStatement = whereClause.length > 0 ? `WHERE ${whereClause.join(' AND ')}` : '';

      const validSortColumns = ['first_name', 'last_name', 'specialization', 'email'];
      const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'last_name';
      const order = ['ASC', 'DESC'].includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'ASC';

      // Main query - Updated to remove office_hours
      const doctorsQuery = `
        SELECT 
          doctor_id,
          first_name,
          last_name,
          specialization,
          phone_number,
          email
        FROM doctors
        ${whereStatement}
        ORDER BY ${sortColumn} ${order}
        LIMIT $${paramCounter} OFFSET $${paramCounter + 1}
      `;

      // Count query
      const countQuery = `SELECT COUNT(*) as total FROM doctors ${whereStatement}`;

      const [doctorsResult, countResult] = await Promise.all([
        pool.query(doctorsQuery, [...queryParams, limit, offset]),
        pool.query(countQuery, queryParams)
      ]);

      const totalCount = parseInt(countResult.rows[0].total);
      const totalPages = Math.ceil(totalCount / limit);

      res.json({
        success: true,
        data: {
          doctors: doctorsResult.rows,
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
      console.error('Error in getAllDoctors:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch doctors',
        message: error.message
      });
    }
  },

  // GET /api/doctors/:id - Get doctor by ID with all related data
  getDoctorById: async (req, res) => {
    try {
      const { id } = req.params;

      if (!id || isNaN(id)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid doctor ID'
        });
      }

      // Main doctor query - Updated to remove office_hours
      const doctorQuery = `
        SELECT 
          doctor_id,
          first_name,
          last_name,
          specialization,
          phone_number,
          email
        FROM doctors 
        WHERE doctor_id = $1
      `;

      // Related data queries
      const appointmentsQuery = `
        SELECT 
          a.id,
          a.appointment_date,
          a.status,
          a.notes,
          p.patient_id,
          p.first_name as patient_first_name,
          p.last_name as patient_last_name,
          p.phone_number as patient_phone,
          p.email as patient_email
        FROM appointments a
        LEFT JOIN patients p ON a.patient_id = p.patient_id
        WHERE a.doctor_id = $1
        ORDER BY a.appointment_date DESC
        LIMIT 20
      `;

      // Execute all queries in parallel
      const [doctor, appointments] = await Promise.all([
        pool.query(doctorQuery, [id]),
        pool.query(appointmentsQuery, [id]),
      ]);

      if (doctor.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Doctor not found'
        });
      }

      res.json({
        success: true,
        data: {
          doctor: doctor.rows[0],
          appointments: appointments.rows,
          summary: {
            totalAppointments: appointments.rows.length,
            upcomingAppointments: appointments.rows.filter(a => 
              new Date(a.appointment_date) > new Date() && a.status !== 'Cancelled'
            ).length,
            cancelledAppointments: appointments.rows.filter(a => a.status === 'Cancelled').length
          }
        }
      });

    } catch (error) {
      console.error('Error in getDoctorById:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch doctor details',
        message: error.message
      });
    }
  },

  // GET /api/doctors/specializations - Get all doctor specializations
  getSpecializations: async (req, res) => {
    try {
      const query = `
        SELECT DISTINCT specialization 
        FROM doctors 
        ORDER BY specialization
      `;
      
      const result = await pool.query(query);
      
      res.json({
        success: true,
        data: {
          specializations: result.rows.map(row => row.specialization)
        }
      });
    } catch (error) {
      console.error('Error in getSpecializations:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch specializations',
        message: error.message
      });
    }
  },

  // POST /api/doctors - Create new doctor
  createDoctor: async (req, res) => {
    try {
      const {
        first_name,
        last_name,
        specialization,
        phone_number,
        email
      } = req.body;

      // Validation
      if (!first_name || !last_name || !specialization) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields',
          required: ['first_name', 'last_name', 'specialization']
        });
      }

      // Use transaction for ACID properties
      const result = await transaction(async (client) => {
        // Check if email already exists (if provided)
        if (email) {
          const emailCheck = await client.query(
            'SELECT doctor_id FROM doctors WHERE email = $1',
            [email]
          );
          
          if (emailCheck.rows.length > 0) {
            throw new Error('Email already exists');
          }
        }

        // Insert new doctor - Updated to remove office_hours
        const insertQuery = `
          INSERT INTO doctors (first_name, last_name, specialization, phone_number, email)
          VALUES ($1, $2, $3, $4, $5)
          RETURNING *
        `;

        const insertResult = await client.query(insertQuery, [
          first_name.trim(),
          last_name.trim(),
          specialization.trim(),
          phone_number || null,
          email ? email.trim().toLowerCase() : null
        ]);

        return insertResult.rows[0];
      });

      res.status(201).json({
        success: true,
        message: 'Doctor created successfully',
        data: {
          doctor: result
        }
      });

    } catch (error) {
      console.error('Error in createDoctor:', error);
      
      if (error.message === 'Email already exists') {
        res.status(409).json({
          success: false,
          error: 'Email already exists'
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Failed to create doctor',
          message: error.message
        });
      }
    }
  },

  // PUT /api/doctors/:id - Update doctor
  updateDoctor: async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      if (!id || isNaN(id)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid doctor ID'
        });
      }

      // Remove id from update data if present
      delete updateData.id;

      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({
          success: false,
          error: 'No fields to update'
        });
      }

      const result = await transaction(async (client) => {
        // Check if doctor exists
        const existCheck = await client.query(
          'SELECT doctor_id FROM doctors WHERE doctor_id = $1',
          [id]
        );

        if (existCheck.rows.length === 0) {
          throw new Error('Doctor not found');
        }

        // Check email uniqueness if email is being updated
        if (updateData.email) {
          const emailCheck = await client.query(
            'SELECT doctor_id FROM doctors WHERE email = $1 AND doctor_id != $2',
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
          if (typeof updateData[field] === 'string') {
            return updateData[field].trim();
          }
          return updateData[field];
        })];

        const updateQuery = `
          UPDATE doctors 
          SET ${setClause}
          WHERE doctor_id = $1
          RETURNING *
        `;

        const updateResult = await client.query(updateQuery, values);
        return updateResult.rows[0];
      });

      res.json({
        success: true,
        message: 'Doctor updated successfully',
        data: {
          doctor: result
        }
      });

    } catch (error) {
      console.error('Error in updateDoctor:', error);
      
      if (error.message === 'Doctor not found') {
        res.status(404).json({
          success: false,
          error: 'Doctor not found'
        });
      } else if (error.message === 'Email already exists') {
        res.status(409).json({
          success: false,
          error: 'Email already exists'
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Failed to update doctor',
          message: error.message
        });
      }
    }
  },

  // DELETE /api/doctors/:id - Delete doctor
  deleteDoctor: async (req, res) => {
    try {
      const { id } = req.params;

      if (!id || isNaN(id)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid doctor ID'
        });
      }

      const result = await transaction(async (client) => {
        // Check if doctor exists
        const doctorCheck = await client.query(
          'SELECT first_name, last_name FROM doctors WHERE doctor_id = $1',
          [id]
        );

        if (doctorCheck.rows.length === 0) {
          throw new Error('Doctor not found');
        }

        // Check if doctor has appointments
        const appointmentCheck = await client.query(
          'SELECT COUNT(*) as count FROM appointments WHERE doctor_id = $1',
          [id]
        );

        if (parseInt(appointmentCheck.rows[0].count) > 0) {
          throw new Error('Cannot delete doctor with appointments');
        }

        // Delete doctor
        const deleteResult = await client.query(
          'DELETE FROM doctors WHERE doctor_id = $1 RETURNING *',
          [id]
        );

        return deleteResult.rows[0];
      });

      res.json({
        success: true,
        message: 'Doctor deleted successfully',
        data: {
          doctor: result
        }
      });

    } catch (error) {
      console.error('Error in deleteDoctor:', error);
      
      if (error.message === 'Doctor not found') {
        res.status(404).json({
          success: false,
          error: 'Doctor not found'
        });
      } else if (error.message === 'Cannot delete doctor with appointments') {
        res.status(409).json({
          success: false,
          error: 'Cannot delete doctor with existing appointments',
          message: 'Please reassign or remove all appointments first'
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Failed to delete doctor',
          message: error.message
        });
      }
    }
  }
};

// Make sure the export is correctly named
module.exports = doctorController;