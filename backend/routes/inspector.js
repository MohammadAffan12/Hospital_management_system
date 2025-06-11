const express = require('express');
const { pool } = require('../config/database');
const dbInspector = require('../utils/dbInspector');

const router = express.Router();

// GET /api/inspector/tables - Get all table names
router.get('/tables', async (req, res) => {
  try {
    const tables = await dbInspector.getAllTables();
    res.json({
      success: true,
      data: {
        tables,
        count: tables.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get tables',
      message: error.message
    });
  }
});

// GET /api/inspector/structure/:tableName - Get table structure
router.get('/structure/:tableName', async (req, res) => {
  try {
    const { tableName } = req.params;
    const structure = await dbInspector.getTableStructure(tableName);
    const sampleData = await dbInspector.getSampleData(tableName, 3);
    
    res.json({
      success: true,
      data: {
        tableName,
        structure,
        sampleData,
        columnCount: structure.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: `Failed to get structure for table ${req.params.tableName}`,
      message: error.message
    });
  }
});

// GET /api/inspector/overview - Get complete database overview
router.get('/overview', async (req, res) => {
  try {
    const overview = await dbInspector.getDatabaseOverview();
    res.json({
      success: true,
      data: overview,
      summary: {
        totalTables: Object.keys(overview).length,
        tablesWithData: Object.keys(overview).filter(table => 
          overview[table].sampleData && overview[table].sampleData.length > 0
        ).length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get database overview',
      message: error.message
    });
  }
});

// GET /api/inspector/test-patients - Quick test of patients table
router.get('/test-patients', async (req, res) => {
  try {
    // Get table structure
    const structureQuery = `
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'patients'
      ORDER BY ordinal_position
    `;
    const structure = await pool.query(structureQuery);
    
    // Get first 3 rows with all columns
    const dataQuery = `SELECT * FROM patients LIMIT 3`;
    const data = await pool.query(dataQuery);
    
    // Get row count
    const countQuery = `SELECT COUNT(*) as total FROM patients`;
    const count = await pool.query(countQuery);
    
    res.json({
      success: true,
      data: {
        structure: structure.rows,
        sampleData: data.rows,
        totalRows: count.rows[0].total,
        columns: structure.rows.map(col => col.column_name)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to test patients table',
      message: error.message
    });
  }
});

// GET /api/inspector/all-structures - Get all table structures quickly
router.get('/all-structures', async (req, res) => {
  try {
    const tables = ['patients', 'doctors', 'appointments', 'wards', 'admissions', 'medical_records', 'billing'];
    const structures = {};
    
    for (const table of tables) {
      try {
        const structureQuery = `
          SELECT column_name, data_type, is_nullable
          FROM information_schema.columns 
          WHERE table_name = $1
          ORDER BY ordinal_position
        `;
        const result = await pool.query(structureQuery, [table]);
        
        // Get sample data
        const sampleQuery = `SELECT * FROM ${table} LIMIT 2`;
        const sampleResult = await pool.query(sampleQuery);
        
        structures[table] = {
          columns: result.rows,
          sampleData: sampleResult.rows
        };
      } catch (error) {
        structures[table] = { error: error.message };
      }
    }
    
    res.json({
      success: true,
      data: structures
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get all structures',
      message: error.message
    });
  }
});

// GET /api/inspector/doctors - Check doctors table
router.get('/doctors', async (req, res) => {
  try {
    const structure = await dbInspector.getTableStructure('doctors');
    const sampleData = await dbInspector.getSampleData('doctors', 2);
    
    res.json({
      success: true,
      data: { structure, sampleData }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get doctors structure',
      message: error.message
    });
  }
});

// GET /api/inspector/appointments - Check appointments table
router.get('/appointments', async (req, res) => {
  try {
    const structure = await dbInspector.getTableStructure('appointments');
    const sampleData = await dbInspector.getSampleData('appointments', 2);
    
    res.json({
      success: true,
      data: { structure, sampleData }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get appointments structure',
      message: error.message
    });
  }
});

// GET /api/inspector/wards - Check wards table
router.get('/wards', async (req, res) => {
  try {
    const structure = await dbInspector.getTableStructure('wards');
    const sampleData = await dbInspector.getSampleData('wards', 2);
    
    res.json({
      success: true,
      data: { structure, sampleData }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get wards structure',
      message: error.message
    });
  }
});

// GET /api/inspector/quick-check - Simple check of all tables
router.get('/quick-check', async (req, res) => {
  try {
    const result = {};
    
    // Check patients
    try {
      const patientsStructure = await pool.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'patients' 
        ORDER BY ordinal_position
      `);
      const patientsSample = await pool.query('SELECT * FROM patients LIMIT 1');
      result.patients = {
        columns: patientsStructure.rows,
        sample: patientsSample.rows[0]
      };
    } catch (error) {
      result.patients = { error: error.message };
    }

    // Check doctors
    try {
      const doctorsStructure = await pool.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'doctors' 
        ORDER BY ordinal_position
      `);
      const doctorsSample = await pool.query('SELECT * FROM doctors LIMIT 1');
      result.doctors = {
        columns: doctorsStructure.rows,
        sample: doctorsSample.rows[0]
      };
    } catch (error) {
      result.doctors = { error: error.message };
    }

    // Check appointments
    try {
      const appointmentsStructure = await pool.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'appointments' 
        ORDER BY ordinal_position
      `);
      const appointmentsSample = await pool.query('SELECT * FROM appointments LIMIT 1');
      result.appointments = {
        columns: appointmentsStructure.rows,
        sample: appointmentsSample.rows[0]
      };
    } catch (error) {
      result.appointments = { error: error.message };
    }

    // Check wards
    try {
      const wardsStructure = await pool.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'wards' 
        ORDER BY ordinal_position
      `);
      const wardsSample = await pool.query('SELECT * FROM wards LIMIT 1');
      result.wards = {
        columns: wardsStructure.rows,
        sample: wardsSample.rows[0]
      };
    } catch (error) {
      result.wards = { error: error.message };
    }

    // Check admissions
    try {
      const admissionsStructure = await pool.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'admissions' 
        ORDER BY ordinal_position
      `);
      const admissionsSample = await pool.query('SELECT * FROM admissions LIMIT 1');
      result.admissions = {
        columns: admissionsStructure.rows,
        sample: admissionsSample.rows[0]
      };
    } catch (error) {
      result.admissions = { error: error.message };
    }

    // Check medical_records
    try {
      const medicalStructure = await pool.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'medical_records' 
        ORDER BY ordinal_position
      `);
      const medicalSample = await pool.query('SELECT * FROM medical_records LIMIT 1');
      result.medical_records = {
        columns: medicalStructure.rows,
        sample: medicalSample.rows[0]
      };
    } catch (error) {
      result.medical_records = { error: error.message };
    }

    // Check billing
    try {
      const billingStructure = await pool.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'billing' 
        ORDER BY ordinal_position
      `);
      const billingSample = await pool.query('SELECT * FROM billing LIMIT 1');
      result.billing = {
        columns: billingStructure.rows,
        sample: billingSample.rows[0]
      };
    } catch (error) {
      result.billing = { error: error.message };
    }

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to check structures',
      message: error.message
    });
  }
});

// Placeholder routes for system inspection/monitoring
router.get('/status', (req, res) => {
  res.json({
    success: true,
    message: 'System Status API endpoint',
    data: {
      status: {
        server: 'OK',
        database: 'OK',
        cache: 'OK',
        lastError: null
      }
    }
  });
});

router.get('/logs', (req, res) => {
  res.json({
    success: true,
    message: 'System Logs API endpoint',
    data: {
      logs: []
    }
  });
});

module.exports = router;