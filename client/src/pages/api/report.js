import { pool } from '../../lib/db';

export default async function handler(req, res) {
  try {
    const { reportType } = req.query;

    if (reportType === 'x') {
      // Fetch total sales amount by hour since last_generated
      const salesQuery = `
        SELECT
          EXTRACT(HOUR FROM order_time) AS hour,
          SUM(price) AS total_sales
        FROM Orders
        WHERE order_time >= (SELECT last_generated FROM timestamp LIMIT 1)
        AND order_time <= NOW()
        GROUP BY 1
        ORDER BY 1;
      `;
      const { rows: salesData } = await pool.query(salesQuery);

      const lastGeneratedQuery = `
        SELECT last_generated
        FROM timestamp
        LIMIT 1;
      `;
      const { rows: [{ last_generated: lastGenerated }] } = await pool.query(lastGeneratedQuery);

      res.status(200).json({
        salesData, // Populate both the graph and the table
        lastGenerated,
        currentTime: new Date().toISOString(),
      });
    } else if (reportType === 'z') {
      // Fetch total sales by item since last_generated
      const salesQuery = `
        SELECT
          mi.name AS item_name,
          SUM(oe.entry_price) AS total_sales,
          COUNT(*) AS items_sold
        FROM Order_Entry oe
        JOIN Menu_Item mi ON oe.menu_item_id = mi.menu_item_id
        JOIN Orders o ON oe.order_id = o.orders_id
        WHERE o.order_time >= (SELECT last_generated FROM timestamp LIMIT 1)
        AND o.order_time <= NOW()
        GROUP BY mi.name
        ORDER BY total_sales DESC;
      `;
      const { rows: salesData } = await pool.query(salesQuery);

      // Update the last_generated timestamp after fetching the data
      const updateQuery = `
        UPDATE timestamp
        SET last_generated = NOW()
        RETURNING last_generated;
      `;
      const { rows: [{ last_generated: lastGenerated }] } = await pool.query(updateQuery);

      res.status(200).json({
        salesData,
        lastGenerated,
        currentTime: new Date().toISOString(),
      });
    } else {
      res.status(400).json({ message: 'Invalid report type' });
    }
  } catch (error) {
    console.error('Error fetching report data:', error.message);
    res.status(500).json({ message: 'Internal Server Error' });
  }
}
