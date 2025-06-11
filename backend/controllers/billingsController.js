const billingController = {
  
  // GET /api/billing - Get all billing records with filtering
  getAllBilling: async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const search = req.query.search || '';
      const patientId = req.query.patientId || '';
      const paid = req.query.paid || ''; // 'true', 'false', or ''
      const minAmount = req.query.minAmount || '';
      const maxAmount = req.query.maxAmount || '';
      const startDate = req.query.startDate || '';
      const endDate = req.query.endDate || '';
      const sortBy = req.query.sortBy || 'bill_date';
      const sortOrder = req.query.sortOrder || 'DESC';
      const offset = (page - 1) * limit;

      let whereConditions = [];
      let queryParams = [];
      let paramIndex = 1;

      if (search) {
        whereConditions.push(`(
          p.first_name ILIKE ${paramIndex} OR 
          p.last_name ILIKE ${paramIndex} OR 
          p.email ILIKE ${paramIndex}
        )`);
        queryParams.push(`%${search}%`);
        paramIndex++;
      }

      if (patientId) {
        whereConditions.push(`b.patient_id = ${paramIndex}`);
        queryParams.push(patientId);
        paramIndex++;
      }

      if (paid === 'true') {
        whereConditions.push('b.paid = true');
      } else if (paid === 'false') {
        whereConditions.push('b.paid = false');
      }

      if (minAmount) {
        whereConditions.push(`b.amount >= ${paramIndex}`);
        queryParams.push(minAmount);
        paramIndex++;
      }

      if (maxAmount) {
        whereConditions.push(`b.amount <= ${paramIndex}`);
        queryParams.push(maxAmount);
        paramIndex++;
      }

      if (startDate) {
        whereConditions.push(`b.bill_date >= ${paramIndex}::date`);
        queryParams.push(startDate);
        paramIndex++;
      }

      if (endDate) {
        whereConditions.push(`b.bill_date <= ${paramIndex}::date`);
        queryParams.push(endDate);
        paramIndex++;
      }

      const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

      const validSortColumns = ['bill_date', 'amount', 'paid', 'patient_name'];
      const sortColumn = validSortColumns.includes(sortBy) ? 
        (sortBy === 'patient_name' ? 'p.last_name' : `b.${sortBy}`) : 'b.bill_date';
      const order = ['ASC', 'DESC'].includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'DESC';

      // Complex query with INNER JOIN and aggregations
      const billingQuery = `
        SELECT 
          b.bill_id,
          b.patient_id,
          b.bill_date,
          b.amount,
          b.paid,
          p.first_name as patient_first_name,
          p.last_name as patient_last_name,
          p.phone_number as patient_phone,
          p.email as patient_email,
          CASE 
            WHEN b.paid THEN 'Paid'
            WHEN b.bill_date < CURRENT_DATE - INTERVAL '30 days' THEN 'Overdue'
            ELSE 'Pending'
          END as payment_status
        FROM billing b
        INNER JOIN patients p ON b.patient_id = p.patient_id
        ${whereClause}
        ORDER BY ${sortColumn} ${order}
        LIMIT ${paramIndex} OFFSET ${paramIndex + 1}
      `;

      const countQuery = `
        SELECT COUNT(*) as total 
        FROM billing b
        INNER JOIN patients p ON b.patient_id = p.patient_id
        ${whereClause}
      `;

      // Summary statistics query
      const summaryQuery = `
        SELECT 
          COUNT(*) as total_bills,
          SUM(amount) as total_amount,
          SUM(CASE WHEN paid THEN amount ELSE 0 END) as paid_amount,
          SUM(CASE WHEN NOT paid THEN amount ELSE 0 END) as outstanding_amount,
          COUNT(CASE WHEN paid THEN 1 END) as paid_count,
          COUNT(CASE WHEN NOT paid THEN 1 END) as unpaid_count,
          AVG(amount) as average_amount
        FROM billing b
        INNER JOIN patients p ON b.patient_id = p.patient_id
        ${whereClause}
      `;

      queryParams.push(limit, offset);

      const [billingResult, countResult, summaryResult] = await Promise.all([
        pool.query(billingQuery, queryParams),
        pool.query(countQuery, queryParams.slice(0, -2)),
        pool.query(summaryQuery, queryParams.slice(0, -2))
      ]);

      const totalCount = parseInt(countResult.rows[0].total);
      const totalPages = Math.ceil(totalCount / limit);
      const summary = summaryResult.rows[0];

      res.json({
        success: true,
        data: {
          billing: billingResult.rows,
          pagination: {
            currentPage: page,
            totalPages,
            totalCount,
            limit,
            hasNextPage: page < totalPages,
            hasPreviousPage: page > 1
          },
          summary: {
            ...summary,
            collection_rate: summary.total_amount > 0 
              ? ((summary.paid_amount / summary.total_amount) * 100).toFixed(2)
              : 0
          }
        }
      });

    } catch (error) {
      console.error('Error in getAllBilling:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch billing records',
        message: error.message
      });
    }
  },

  // POST /api/billing - Create new billing record
  createBilling: async (req, res) => {
    try {
      const {
        patient_id,
        amount,
        bill_date = new Date().toISOString().split('T')[0],
        paid = false
      } = req.body;

      // Validation
      if (!patient_id || !amount) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields',
          required: ['patient_id', 'amount']
        });
      }

      if (isNaN(amount) || parseFloat(amount) <= 0) {
        return res.status(400).json({
          success: false,
          error: 'Amount must be a positive number'
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

        // Insert billing record
        const insertQuery = `
          INSERT INTO billing (patient_id, bill_date, amount, paid)
          VALUES ($1, $2, $3, $4)
          RETURNING *
        `;

        const insertResult = await client.query(insertQuery, [
          patient_id,
          bill_date,
          parseFloat(amount),
          paid
        ]);

        return {
          billing: insertResult.rows[0],
          patient: patientCheck.rows[0]
        };
      });

      res.status(201).json({
        success: true,
        message: 'Billing record created successfully',
        data: result
      });

    } catch (error) {
      console.error('Error in createBilling:', error);
      
      if (error.message === 'Patient not found') {
        res.status(404).json({
          success: false,
          error: 'Patient not found'
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Failed to create billing record',
          message: error.message
        });
      }
    }
  },

  // PUT /api/billing/:id/pay - Mark bill as paid
  markAsPaid: async (req, res) => {
    try {
      const { id } = req.params;

      if (!id || isNaN(id)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid bill ID'
        });
      }

      const result = await transaction(async (client) => {
        // Check if bill exists and is unpaid
        const billCheck = await client.query(
          'SELECT * FROM billing WHERE bill_id = $1',
          [id]
        );

        if (billCheck.rows.length === 0) {
          throw new Error('Bill not found');
        }

        if (billCheck.rows[0].paid) {
          throw new Error('Bill is already paid');
        }

        // Update bill to paid
        const updateResult = await client.query(
          'UPDATE billing SET paid = true WHERE bill_id = $1 RETURNING *',
          [id]
        );

        return updateResult.rows[0];
      });

      res.json({
        success: true,
        message: 'Bill marked as paid successfully',
        data: {
          billing: result
        }
      });

    } catch (error) {
      console.error('Error in markAsPaid:', error);
      
      const errorMessage = error.message;
      if (errorMessage.includes('not found') || errorMessage.includes('already paid')) {
        res.status(400).json({
          success: false,
          error: errorMessage
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Failed to mark bill as paid',
          message: errorMessage
        });
      }
    }
  },

  // GET /api/billing/statistics - Get billing statistics
  getStatistics: async (req, res) => {
    try {
      const { startDate, endDate } = req.query;

      let dateFilter = '';
      let queryParams = [];

      if (startDate && endDate) {
        dateFilter = 'WHERE bill_date BETWEEN $1::date AND $2::date';
        queryParams = [startDate, endDate];
      } else if (startDate) {
        dateFilter = 'WHERE bill_date >= $1::date';
        queryParams = [startDate];
      } else if (endDate) {
        dateFilter = 'WHERE bill_date <= $1::date';
        queryParams = [endDate];
      }

      const statisticsQuery = `
        WITH billing_stats AS (
          SELECT 
            COUNT(*) as total_bills,
            SUM(amount) as total_revenue,
            SUM(CASE WHEN paid THEN amount ELSE 0 END) as collected_revenue,
            SUM(CASE WHEN NOT paid THEN amount ELSE 0 END) as outstanding_revenue,
            COUNT(CASE WHEN paid THEN 1 END) as paid_bills,
            COUNT(CASE WHEN NOT paid THEN 1 END) as unpaid_bills,
            AVG(amount) as average_bill_amount,
            MIN(amount) as min_bill_amount,
            MAX(amount) as max_bill_amount
          FROM billing
          ${dateFilter}
        ),
        monthly_stats AS (
          SELECT 
            DATE_TRUNC('month', bill_date) as month,
            COUNT(*) as bills_count,
            SUM(amount) as monthly_revenue,
            SUM(CASE WHEN paid THEN amount ELSE 0 END) as monthly_collected
          FROM billing
          ${dateFilter}
          GROUP BY DATE_TRUNC('month', bill_date)
          ORDER BY month DESC
          LIMIT 12
        ),
        patient_billing_stats AS (
          SELECT 
            COUNT(DISTINCT patient_id) as patients_with_bills,
            COUNT(DISTINCT CASE WHEN paid = false THEN patient_id END) as patients_with_outstanding
          FROM billing
          ${dateFilter}
        )
        SELECT 
          (SELECT row_to_json(bs.*) FROM billing_stats bs) as overview,
          (SELECT json_agg(ms.*) FROM monthly_stats ms) as monthly_breakdown,
          (SELECT row_to_json(pbs.*) FROM patient_billing_stats pbs) as patient_stats
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
        error: 'Failed to fetch billing statistics',
        message: error.message
      });
    }
  }
};

module.exports = { medicalRecordsController, billingController };