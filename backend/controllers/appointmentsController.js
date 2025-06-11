const { pool, query, transaction } = require('../config/database');

const appointmentsController = {
  
  // GET /api/appointments - Get all appointments with complex filtering
  getAllAppointments: async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const search = req.query.search || '';
      const status = req.query.status || '';
      const doctorId = req.query.doctorId || '';
      const patientId = req.query.patientId || '';
      const specialization = req.query.specialization || '';
      const startDate = req.query.startDate || '';
      const endDate = req.query.endDate || '';
      const sortBy = req.query.sortBy || 'appointment_date';
      const sortOrder = req.query.sortOrder || 'DESC';
      const offset = (page - 1) * limit;

      let whereConditions = [];
      let queryParams = [];
      let paramIndex = 1;

      // Search in patient or doctor names
      if (search) {
        whereConditions.push(`(
          p.first_name ILIKE $${paramIndex} OR 
          p.last_name ILIKE $${paramIndex} OR 
          d.first_name ILIKE $${paramIndex} OR 
          d.last_name ILIKE $${paramIndex} OR
          a.notes ILIKE $${paramIndex}
        )`);
        queryParams.push(`%${search}%`);
        paramIndex++;
      }

      if (status) {
        whereConditions.push(`a.status = $${paramIndex}`);
        queryParams.push(status);
        paramIndex++;
      }

      if (doctorId) {
        whereConditions.push(`a.doctor_id = $${paramIndex}`);
        queryParams.push(doctorId);
        paramIndex++;
      }

      if (patientId) {
        whereConditions.push(`a.patient_id = $${paramIndex}`);
        queryParams.push(patientId);
        paramIndex++;
      }

      if (specialization) {
        whereConditions.push(`d.specialization = $${paramIndex}`);
        queryParams.push(specialization);
        paramIndex++;
      }

      if (startDate) {
        whereConditions.push(`a.appointment_date >= $${paramIndex}::timestamp`);
        queryParams.push(startDate);
        paramIndex++;
      }

      if (endDate) {
        whereConditions.push(`a.appointment_date <= $${paramIndex}::timestamp`);
        queryParams.push(endDate);
        paramIndex++;
      }

      const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

      const validSortColumns = ['appointment_date', 'status', 'patient_name', 'doctor_name'];
      const sortColumn = validSortColumns.includes(sortBy) ? 
        (sortBy === 'patient_name' ? 'p.last_name' : 
         sortBy === 'doctor_name' ? 'd.last_name' : 
         `a.${sortBy}`) : 'a.appointment_date';
      const order = ['ASC', 'DESC'].includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'DESC';

      // Complex query with INNER JOINs
      const appointmentsQuery = `
        SELECT 
          a.appointment_id,
          a.patient_id,
          a.doctor_id,
          a.appointment_date,
          a.status,
          a.notes,
          p.first_name as patient_first_name,
          p.last_name as patient_last_name,
          p.phone_number as patient_phone,
          p.email as patient_email,
          d.first_name as doctor_first_name,
          d.last_name as doctor_last_name,
          d.specialization,
          d.phone_number as doctor_phone,
          d.email as doctor_email,
          CASE 
            WHEN a.appointment_date < CURRENT_TIMESTAMP AND a.status = 'Scheduled' THEN 'Overdue'
            ELSE a.status
          END as computed_status
        FROM appointments a
        INNER JOIN patients p ON a.patient_id = p.patient_id
        INNER JOIN doctors d ON a.doctor_id = d.doctor_id
        ${whereClause}
        ORDER BY ${sortColumn} ${order}
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;

      const countQuery = `
        SELECT COUNT(*) as total 
        FROM appointments a
        INNER JOIN patients p ON a.patient_id = p.patient_id
        INNER JOIN doctors d ON a.doctor_id = d.doctor_id
        ${whereClause}
      `;

      queryParams.push(limit, offset);

      const [appointmentsResult, countResult] = await Promise.all([
        pool.query(appointmentsQuery, queryParams),
        pool.query(countQuery, queryParams.slice(0, -2))
      ]);

      const totalCount = parseInt(countResult.rows[0].total);
      const totalPages = Math.ceil(totalCount / limit);

      res.json({
        success: true,
        data: {
          appointments: appointmentsResult.rows,
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
      console.error('Error in getAllAppointments:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch appointments',
        message: error.message
      });
    }
  },

  // GET /api/appointments/:id - Get appointment by ID
  getAppointmentById: async (req, res) => {
    try {
      const { id } = req.params;

      if (!id || isNaN(id)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid appointment ID'
        });
      }

      const appointmentQuery = `
        SELECT 
          a.appointment_id,
          a.patient_id,
          a.doctor_id,
          a.appointment_date,
          a.status,
          a.notes,
          p.first_name as patient_first_name,
          p.last_name as patient_last_name,
          p.phone_number as patient_phone,
          p.email as patient_email,
          p.address as patient_address,
          p.date_of_birth as patient_dob,
          CASE 
            WHEN p.gender = 'M' THEN 'Male'
            WHEN p.gender = 'F' THEN 'Female'
            ELSE 'Other'
          END as patient_gender,
          d.first_name as doctor_first_name,
          d.last_name as doctor_last_name,
          d.specialization,
          d.phone_number as doctor_phone,
          d.email as doctor_email
        FROM appointments a
        INNER JOIN patients p ON a.patient_id = p.patient_id
        INNER JOIN doctors d ON a.doctor_id = d.doctor_id
        WHERE a.appointment_id = $1
      `;

      const result = await pool.query(appointmentQuery, [id]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Appointment not found'
        });
      }

      res.json({
        success: true,
        data: {
          appointment: result.rows[0]
        }
      });

    } catch (error) {
      console.error('Error in getAppointmentById:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch appointment details',
        message: error.message
      });
    }
  },

  // POST /api/appointments - Create new appointment (ACID Transaction)
  createAppointment: async (req, res) => {
    try {
      const {
        patient_id,
        doctor_id,
        appointment_date,
        status = 'Scheduled',
        notes
      } = req.body;

      // Validation
      if (!patient_id || !doctor_id || !appointment_date) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields',
          required: ['patient_id', 'doctor_id', 'appointment_date']
        });
      }

      // Validate date format
      const appointmentDateTime = new Date(appointment_date);
      if (isNaN(appointmentDateTime.getTime())) {
        return res.status(400).json({
          success: false,
          error: 'Invalid appointment date format'
        });
      }

      const validStatuses = ['Scheduled', 'Completed', 'Cancelled', 'No-Show'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid status',
          validStatuses
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

        // Check if doctor exists
        const doctorCheck = await client.query(
          'SELECT doctor_id, first_name, last_name, specialization FROM doctors WHERE doctor_id = $1',
          [doctor_id]
        );

        if (doctorCheck.rows.length === 0) {
          throw new Error('Doctor not found');
        }

        // Check for appointment conflicts (same doctor, overlapping time)
        const conflictCheck = await client.query(`
          SELECT appointment_id 
          FROM appointments 
          WHERE doctor_id = $1 
            AND status IN ('Scheduled', 'Completed')
            AND ABS(EXTRACT(EPOCH FROM (appointment_date - $2::timestamp))) < 3600
        `, [doctor_id, appointment_date]);

        if (conflictCheck.rows.length > 0) {
          throw new Error('Doctor has a conflicting appointment within 1 hour of this time');
        }

        // Insert new appointment
        const insertQuery = `
          INSERT INTO appointments (patient_id, doctor_id, appointment_date, status, notes)
          VALUES ($1, $2, $3, $4, $5)
          RETURNING appointment_id, patient_id, doctor_id, appointment_date, status, notes
        `;

        const insertResult = await client.query(insertQuery, [
          patient_id,
          doctor_id,
          appointment_date,
          status,
          notes || null
        ]);

        return {
          appointment: insertResult.rows[0],
          patient: patientCheck.rows[0],
          doctor: doctorCheck.rows[0]
        };
      });

      res.status(201).json({
        success: true,
        message: 'Appointment created successfully',
        data: result
      });

    } catch (error) {
      console.error('Error in createAppointment:', error);
      
      const errorMessage = error.message;
      if (errorMessage.includes('not found') || errorMessage.includes('conflicting appointment')) {
        res.status(400).json({
          success: false,
          error: errorMessage
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Failed to create appointment',
          message: errorMessage
        });
      }
    }
  },

  // PUT /api/appointments/:id - Update appointment
  updateAppointment: async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      if (!id || isNaN(id)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid appointment ID'
        });
      }

      delete updateData.appointment_id;

      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({
          success: false,
          error: 'No fields to update'
        });
      }

      // Validate status if provided
      if (updateData.status) {
        const validStatuses = ['Scheduled', 'Completed', 'Cancelled', 'No-Show'];
        if (!validStatuses.includes(updateData.status)) {
          return res.status(400).json({
            success: false,
            error: 'Invalid status',
            validStatuses
          });
        }
      }

      // Validate date if provided
      if (updateData.appointment_date) {
        const appointmentDateTime = new Date(updateData.appointment_date);
        if (isNaN(appointmentDateTime.getTime())) {
          return res.status(400).json({
            success: false,
            error: 'Invalid appointment date format'
          });
        }
      }

      const result = await transaction(async (client) => {
        // Check if appointment exists
        const existCheck = await client.query(
          'SELECT appointment_id, doctor_id FROM appointments WHERE appointment_id = $1',
          [id]
        );

        if (existCheck.rows.length === 0) {
          throw new Error('Appointment not found');
        }

        // Check for conflicts if time or doctor is being changed
        if (updateData.appointment_date || updateData.doctor_id) {
          const doctorId = updateData.doctor_id || existCheck.rows[0].doctor_id;
          const appointmentDate = updateData.appointment_date;

          if (appointmentDate) {
            const conflictCheck = await client.query(`
              SELECT appointment_id 
              FROM appointments 
              WHERE doctor_id = $1 
                AND appointment_id != $2
                AND status IN ('Scheduled', 'Completed')
                AND ABS(EXTRACT(EPOCH FROM (appointment_date - $3::timestamp))) < 3600
            `, [doctorId, id, appointmentDate]);

            if (conflictCheck.rows.length > 0) {
              throw new Error('Doctor has a conflicting appointment within 1 hour of this time');
            }
          }
        }

        // Build dynamic update query
        const fields = Object.keys(updateData);
        const setClause = fields.map((field, index) => `${field} = ${index + 2}`).join(', ');
        const values = [id, ...Object.values(updateData)];

        const updateQuery = `
          UPDATE appointments 
          SET ${setClause}
          WHERE appointment_id = $1
          RETURNING *
        `;

        const updateResult = await client.query(updateQuery, values);
        return updateResult.rows[0];
      });

      res.json({
        success: true,
        message: 'Appointment updated successfully',
        data: {
          appointment: result
        }
      });

    } catch (error) {
      console.error('Error in updateAppointment:', error);
      
      const errorMessage = error.message;
      if (errorMessage === 'Appointment not found') {
        res.status(404).json({
          success: false,
          error: 'Appointment not found'
        });
      } else if (errorMessage.includes('conflicting appointment')) {
        res.status(409).json({
          success: false,
          error: errorMessage
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Failed to update appointment',
          message: errorMessage
        });
      }
    }
  },

  // DELETE /api/appointments/:id - Cancel appointment
  deleteAppointment: async (req, res) => {
    try {
      const { id } = req.params;

      if (!id || isNaN(id)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid appointment ID'
        });
      }

      const result = await transaction(async (client) => {
        // Check if appointment exists
        const appointmentCheck = await client.query(
          'SELECT * FROM appointments WHERE appointment_id = $1',
          [id]
        );

        if (appointmentCheck.rows.length === 0) {
          throw new Error('Appointment not found');
        }

        const appointment = appointmentCheck.rows[0];

        // Instead of deleting, update status to Cancelled for audit trail
        const updateResult = await client.query(
          'UPDATE appointments SET status = $1 WHERE appointment_id = $2 RETURNING *',
          ['Cancelled', id]
        );

        return updateResult.rows[0];
      });

      res.json({
        success: true,
        message: 'Appointment cancelled successfully',
        data: {
          appointment: result
        }
      });

    } catch (error) {
      console.error('Error in deleteAppointment:', error);
      
      if (error.message === 'Appointment not found') {
        res.status(404).json({
          success: false,
          error: 'Appointment not found'
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Failed to cancel appointment',
          message: error.message
        });
      }
    }
  },

  // GET /api/appointments/statistics - Get appointment statistics
  getStatistics: async (req, res) => {
    try {
      const { startDate, endDate } = req.query;

      let dateFilter = '';
      let queryParams = [];

      if (startDate && endDate) {
        dateFilter = 'WHERE a.appointment_date BETWEEN $1::timestamp AND $2::timestamp';
        queryParams = [startDate, endDate];
      } else if (startDate) {
        dateFilter = 'WHERE a.appointment_date >= $1::timestamp';
        queryParams = [startDate];
      } else if (endDate) {
        dateFilter = 'WHERE a.appointment_date <= $1::timestamp';
        queryParams = [endDate];
      }

      const statisticsQuery = `
        WITH appointment_stats AS (
          SELECT 
            COUNT(*) as total_appointments,
            COUNT(CASE WHEN status = 'Scheduled' THEN 1 END) as scheduled_appointments,
            COUNT(CASE WHEN status = 'Completed' THEN 1 END) as completed_appointments,
            COUNT(CASE WHEN status = 'Cancelled' THEN 1 END) as cancelled_appointments,
            COUNT(CASE WHEN status = 'No-Show' THEN 1 END) as no_show_appointments,
            COUNT(DISTINCT patient_id) as unique_patients,
            COUNT(DISTINCT doctor_id) as active_doctors
          FROM appointments a
          ${dateFilter}
        ),
        specialization_stats AS (
          SELECT 
            d.specialization,
            COUNT(a.appointment_id) as appointment_count,
            COUNT(CASE WHEN a.status = 'Completed' THEN 1 END) as completed_count,
            ROUND(
              COUNT(CASE WHEN a.status = 'Completed' THEN 1 END) * 100.0 / 
              NULLIF(COUNT(a.appointment_id), 0), 2
            ) as completion_rate
          FROM appointments a
          INNER JOIN doctors d ON a.doctor_id = d.doctor_id
          ${dateFilter}
          GROUP BY d.specialization
          ORDER BY appointment_count DESC
        ),
        daily_stats AS (
          SELECT 
            DATE(appointment_date) as appointment_date,
            COUNT(*) as appointments_count,
            COUNT(CASE WHEN status = 'Completed' THEN 1 END) as completed_count
          FROM appointments a
          ${dateFilter}
          GROUP BY DATE(appointment_date)
          ORDER BY appointment_date DESC
          LIMIT 30
        )
        SELECT 
          (SELECT row_to_json(aps.*) FROM appointment_stats aps) as overview,
          (SELECT json_agg(ss.*) FROM specialization_stats ss) as by_specialization,
          (SELECT json_agg(ds.*) FROM daily_stats ds) as daily_breakdown
      `;

      const result = await pool.query(statisticsQuery, queryParams);
      const stats = result.rows[0];

      res.json({
        success: true,
        data: stats,
        filters: {
          startDate: startDate || 'All time',
          endDate: endDate || 'Current date'
        },
        generatedAt: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error in getStatistics:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch appointment statistics',
        message: error.message
      });
    }
  },

  // GET /api/appointments/upcoming - Get upcoming appointments
  getUpcomingAppointments: async (req, res) => {
    try {
      const limit = parseInt(req.query.limit) || 20;
      const doctorId = req.query.doctorId || '';

      let whereClause = "WHERE a.status = 'Scheduled' AND a.appointment_date >= CURRENT_TIMESTAMP";
      let queryParams = [limit];

      if (doctorId) {
        whereClause += " AND a.doctor_id = $2";
        queryParams = [limit, doctorId];
      }

      const upcomingQuery = `
        SELECT 
          a.appointment_id,
          a.appointment_date,
          a.notes,
          p.first_name as patient_first_name,
          p.last_name as patient_last_name,
          p.phone_number as patient_phone,
          d.first_name as doctor_first_name,
          d.last_name as doctor_last_name,
          d.specialization,
          EXTRACT(EPOCH FROM (a.appointment_date - CURRENT_TIMESTAMP))/3600 as hours_until_appointment
        FROM appointments a
        INNER JOIN patients p ON a.patient_id = p.patient_id
        INNER JOIN doctors d ON a.doctor_id = d.doctor_id
        ${whereClause}
        ORDER BY a.appointment_date ASC
        LIMIT $1
      `;

      const result = await pool.query(upcomingQuery, queryParams);

      res.json({
        success: true,
        data: {
          upcomingAppointments: result.rows,
          count: result.rows.length
        }
      });

    } catch (error) {
      console.error('Error in getUpcomingAppointments:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch upcoming appointments',
        message: error.message
      });
    }
  }
};

module.exports = appointmentsController;