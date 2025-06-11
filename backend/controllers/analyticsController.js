const { pool, query } = require('../config/database');

const analyticsController = {
  // GET /api/hospital/dashboard - Get dashboard statistics
  getDashboard: async (req, res) => {
    try {
      // Use simpler queries to avoid complex joins that might be failing
      const patientCountQuery = 'SELECT COUNT(*) as count FROM patients';
      const doctorCountQuery = 'SELECT COUNT(*) as count FROM doctors';
      const appointmentsTodayQuery = `
        SELECT COUNT(*) as count 
        FROM appointments 
        WHERE status = 'Scheduled' 
        AND DATE(appointment_date) = CURRENT_DATE
      `;
      const wardCapacityQuery = `
        SELECT
          SUM(capacity) as total_capacity,
          COUNT(*) as ward_count
        FROM wards
      `;
      const currentOccupancyQuery = `
        SELECT COUNT(*) as current_patients
        FROM admissions
        WHERE discharge_date IS NULL
      `;

      // Execute all queries in parallel
      const [
        patientResult, 
        doctorResult, 
        appointmentsResult, 
        capacityResult,
        occupancyResult
      ] = await Promise.all([
        pool.query(patientCountQuery),
        pool.query(doctorCountQuery),
        pool.query(appointmentsTodayQuery),
        pool.query(wardCapacityQuery),
        pool.query(currentOccupancyQuery)
      ]);
      
      // Calculate occupancy rate
      const totalCapacity = parseInt(capacityResult.rows[0].total_capacity) || 1; // Avoid division by zero
      const currentPatients = parseInt(occupancyResult.rows[0].current_patients) || 0;
      const occupancyRate = Math.round((currentPatients / totalCapacity) * 100);
      
      const dashboardData = {
        patientCount: parseInt(patientResult.rows[0].count),
        doctorCount: parseInt(doctorResult.rows[0].count),
        appointmentsToday: parseInt(appointmentsResult.rows[0].count),
        occupancyRate: occupancyRate,
        totalBeds: totalCapacity,
        occupiedBeds: currentPatients,
        wardCount: parseInt(capacityResult.rows[0].ward_count)
      };
      
      res.json({
        success: true,
        data: {
          stats: dashboardData
        }
      });

    } catch (error) {
      console.error('Error in getDashboard:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch dashboard data',
        message: error.message
      });
    }
  },
  
  // GET /api/hospital/analytics - Get detailed analytics
  getAnalytics: async (req, res) => {
    try {
      // Simplified analysis for better reliability
      // Basic stats
      const basicStatsQuery = `
        SELECT
          COUNT(*) as total_appointments,
          COUNT(CASE WHEN status = 'Completed' THEN 1 END) as completed,
          COUNT(CASE WHEN status = 'Scheduled' THEN 1 END) as scheduled,
          COUNT(CASE WHEN status = 'Cancelled' THEN 1 END) as cancelled,
          COUNT(CASE WHEN status = 'No-Show' THEN 1 END) as no_show
        FROM appointments
      `;
      
      // Monthly appointment counts
      const monthlyStatsQuery = `
        SELECT
          DATE_TRUNC('month', appointment_date) as month,
          COUNT(*) as count
        FROM appointments
        WHERE appointment_date >= CURRENT_DATE - INTERVAL '6 months'
        GROUP BY month
        ORDER BY month
      `;
      
      // Doctor performance (top 5)
      const doctorStatsQuery = `
        SELECT
          d.doctor_id,
          d.first_name,
          d.last_name,
          d.specialization,
          COUNT(a.appointment_id) as appointment_count
        FROM doctors d
        LEFT JOIN appointments a ON d.doctor_id = a.doctor_id
        GROUP BY d.doctor_id, d.first_name, d.last_name, d.specialization
        ORDER BY appointment_count DESC
        LIMIT 5
      `;
      
      const [basicStats, monthlyStats, doctorStats] = await Promise.all([
        pool.query(basicStatsQuery),
        pool.query(monthlyStatsQuery),
        pool.query(doctorStatsQuery)
      ]);
      
      res.json({
        success: true,
        data: {
          overview: basicStats.rows[0],
          monthly: monthlyStats.rows,
          topDoctors: doctorStats.rows
        }
      });
      
    } catch (error) {
      console.error('Error in getAnalytics:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch analytics data',
        message: error.message
      });
    }
  }
};

module.exports = analyticsController;
