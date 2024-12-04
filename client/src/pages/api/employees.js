import { pool } from '@/lib/db';

// Function to generate a random 5-digit employee ID
function generateEmployeeId() {
  return Math.floor(10000 + Math.random() * 90000).toString();
}

export default async function handler(req, res) {
  try {
    // GET request to fetch all employees
    if (req.method === 'GET') {
      const { rows } = await pool.query(`
        SELECT 
          e.employee_id AS id, 
          e.employee_name AS name, 
          e.role, 
          e.email,
          COALESCE(ROUND(SUM(ett.total_time) / 3600.0, 2), 0) AS hours,
          (
            SELECT COUNT(*) 
            FROM orders o 
            WHERE o.employee_id = e.employee_id 
          ) AS completed_orders
        FROM 
          employee e
        LEFT JOIN 
          employee_time_tracking ett ON e.employee_id = ett.employee_id
        WHERE 
          e.employed = true
        GROUP BY 
          e.employee_id, e.employee_name, e.role, e.email
        ORDER BY 
          completed_orders DESC
      `);
      
      
      return res.status(200).json(rows);
    }

    // POST request to add a new employee
    if (req.method === 'POST') {
      const { name, email, role } = req.body;
      
      // Generate a unique employee ID
      const employeeId = generateEmployeeId();

      const { rows } = await pool.query(
        `INSERT INTO employee 
        (employee_id, employee_name, role, employed, email) 
        VALUES 
        ($1, $2, $3, true, $4)
        RETURNING employee_id AS id, employee_name AS name, role, email`,
        [employeeId, name, role, email]
      );

      return res.status(201).json(rows[0]);
    }

    // PUT request to modify employee role
    if (req.method === 'PUT') {
      const { name, role } = req.body;

      const { rows } = await pool.query(
        `UPDATE employee 
        SET role = $1
        WHERE employee_name = $2
        RETURNING employee_id AS id, employee_name AS name, role`,
        [role, name]
      );

      return res.status(200).json(rows[0]);
    }

    // DELETE request to remove an employee
    if (req.method === 'DELETE') {
      const { name } = req.body;

      const { rows } = await pool.query(
        `UPDATE employee 
        SET employed = false
        WHERE employee_name = $1
        RETURNING employee_id AS id, employee_name AS name`,
        [name]
      );

      return res.status(200).json(rows[0]);
    }
  } catch (error) {
    console.error('Employee API Error:', error);
    return res.status(500).json({ 
      error: 'Internal Server Error', 
      details: error.message 
    });
  }
}
