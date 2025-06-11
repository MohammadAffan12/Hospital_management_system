const { pool } = require('../config/database');

/**
 * Database inspection utilities to help diagnose schema issues
 */
const dbInspector = {
  /**
   * Get all tables in the database
   */
  getAllTables: async () => {
    const query = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;
    
    const result = await pool.query(query);
    return result.rows.map(row => row.table_name);
  },
  
  /**
   * Get the structure of a table
   */
  getTableStructure: async (tableName) => {
    const query = `
      SELECT 
        column_name, 
        data_type, 
        is_nullable,
        column_default
      FROM information_schema.columns 
      WHERE table_name = $1
      ORDER BY ordinal_position
    `;
    
    const result = await pool.query(query, [tableName]);
    return result.rows;
  },
  
  /**
   * Get sample data from a table
   */
  getSampleData: async (tableName, limit = 5) => {
    const query = `SELECT * FROM ${tableName} LIMIT ${limit}`;
    
    const result = await pool.query(query);
    return result.rows;
  },
  
  /**
   * Get complete database overview
   */
  getDatabaseOverview: async () => {
    const tables = await dbInspector.getAllTables();
    const overview = {};
    
    for (const tableName of tables) {
      try {
        const structure = await dbInspector.getTableStructure(tableName);
        const sampleData = await dbInspector.getSampleData(tableName, 2);
        
        overview[tableName] = {
          structure,
          sampleData,
          columnCount: structure.length,
          rowCount: await dbInspector.getTableRowCount(tableName)
        };
      } catch (error) {
        overview[tableName] = { error: error.message };
      }
    }
    
    return overview;
  },
  
  /**
   * Get row count for a table
   */
  getTableRowCount: async (tableName) => {
    const query = `SELECT COUNT(*) as count FROM ${tableName}`;
    
    const result = await pool.query(query);
    return parseInt(result.rows[0].count);
  }
};

module.exports = dbInspector;