import { pool } from '../../lib/db';

export default async function handler(req, res) {
  try {
    const { startDate, endDate } = req.query;

    // Default date range to the past month
    const defaultStartDate = new Date();
    defaultStartDate.setMonth(defaultStartDate.getMonth() - 3);
     const formattedStartDate = startDate || defaultStartDate.toISOString().split('T')[0];
    const formattedEndDate = endDate || new Date().toISOString().split('T')[0];

    console.log('Start Date:', formattedStartDate, 'End Date:', formattedEndDate);

    // Query for the line chart (Sales over time)
    const salesDataQuery = `
  SELECT 
    TO_CHAR(order_time, 'YYYY-MM-DD') AS day,
    SUM(price) AS net_sales_profit,
    COUNT(*) AS total_sales
  FROM Orders
  WHERE status = 'Completed'
  AND ($1::date IS NULL OR order_time >= $1::date)
  AND ($2::date IS NULL OR order_time <= $2::date)
  GROUP BY 1
  ORDER BY MIN(order_time);
`;

    const salesByItemQuery = `
      SELECT 
        mi.name AS item_name,
        SUM(oe.entry_price) AS total_sales,
        COUNT(*) AS items_sold
      FROM Order_Entry oe
      JOIN Menu_Item mi ON oe.menu_item_id = mi.menu_item_id
      JOIN Orders o ON oe.order_id = o.orders_id
      WHERE o.status = 'Completed'
      AND ($1::date IS NULL OR o.order_time >= $1::date)
      AND ($2::date IS NULL OR o.order_time <= $2::date)
      GROUP BY mi.name
      ORDER BY total_sales DESC
      LIMIT 10;
    `;

    const { rows: salesData } = await pool.query(salesDataQuery, [
      formattedStartDate,
      formattedEndDate,
    ]);
    const { rows: salesByItem } = await pool.query(salesByItemQuery, [
      formattedStartDate,
      formattedEndDate,
    ]);

    res.status(200).json({ salesData, salesByItem });
  } catch (error) {
    console.error('Error fetching trends data:', error.message);
    res.status(500).json({ message: 'Internal Server Error' });
  }
}
