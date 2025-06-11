const { Pool } = require('pg');
require('dotenv').config();

// PostgreSQL connection pool
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'hospital_db',
  password: process.env.DB_PASSWORD || 'your_password',
  port: process.env.DB_PORT || 5432,
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test database connection
const testConnection = async () => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() as current_time, version() as pg_version');
    console.log('✅ Database connected successfully');
    console.log('📅 Current time:', result.rows[0].current_time);
    console.log('🗄️ PostgreSQL version:', result.rows[0].pg_version.split(' ')[0]);
    client.release();
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
};

// Query helper function
const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('📊 Query executed', { text: text.substring(0, 50) + '...', duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('❌ Query error:', { text: text.substring(0, 50) + '...', error: error.message });
    throw error;
  }
};

// Transaction helper
const transaction = async (callback) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

// Seed data with Pakistani names
const patientNames = [
  { first: 'Muhammad', last: 'Ali' },
  { first: 'Ayesha', last: 'Khan' },
  { first: 'Imran', last: 'Ahmed' },
  { first: 'Fatima', last: 'Malik' },
  { first: 'Hassan', last: 'Raza' },
  { first: 'Saima', last: 'Nawaz' },
  { first: 'Ahmed', last: 'Rashid' },
  { first: 'Sadia', last: 'Hussain' },
  { first: 'Adeel', last: 'Akhtar' },
  { first: 'Zainab', last: 'Sheikh' }
];

const doctorNames = [
  { first: 'Asim', last: 'Hussain', specialization: 'Cardiology' },
  { first: 'Sana', last: 'Tariq', specialization: 'Pediatrics' },
  { first: 'Zafar', last: 'Iqbal', specialization: 'Orthopedics' },
  { first: 'Nadia', last: 'Patel', specialization: 'Neurology' },
  { first: 'Kamran', last: 'Malik', specialization: 'Dermatology' }
];

// Common Pakistani diagnoses and treatments
const diagnoses = [
  'Hypertension',
  'Type 2 Diabetes',
  'Typhoid Fever',
  'Acute Gastroenteritis',
  'Malaria',
  'Dengue Fever',
  'Respiratory Tract Infection',
  'Tuberculosis',
  'Hepatitis B',
  'Anemia'
];

module.exports = {
  pool,
  testConnection,
  query,
  transaction,
  patientNames,
  doctorNames,
  diagnoses
};