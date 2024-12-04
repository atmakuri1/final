import { pool } from '../../lib/db';

export default async function handler(req, res) {
  try {
    const { rows } = await pool.query(`
      SELECT 
          o.orders_id, 
          o.employee_id, 
          o.price, 
          o.status, 
          o.order_time, 
          ARRAY_AGG(
              CASE 
                  WHEN mi.menu_item_id = 1 THEN 'Bowl: ' || mi.name || COALESCE(' ( ' || sub_items.sub_item_list || ')', '')
                  WHEN mi.menu_item_id = 2 THEN 'Plate: ' || mi.name || COALESCE(' ( ' || sub_items.sub_item_list || ')', '')
                  WHEN mi.menu_item_id = 3 THEN 'Bigger Plate: ' || mi.name || COALESCE(' ( ' || sub_items.sub_item_list || ')', '')
                  ELSE mi.name
              END
          ) AS items
      FROM Orders o
      LEFT JOIN Order_Entry oe ON o.orders_id = oe.order_id
      LEFT JOIN Menu_Item mi ON oe.menu_item_id = mi.menu_item_id
      LEFT JOIN LATERAL (
          SELECT string_agg(sub.name, ', ') AS sub_item_list
          FROM Menu_Item sub
          WHERE sub.menu_item_id IN (oe.id1, oe.id2, oe.id3, oe.side1_id, oe.side2_id)
      ) sub_items ON TRUE
      WHERE o.status NOT IN ('Completed', 'Canceled')
      GROUP BY o.orders_id
      ORDER BY o.order_time ASC;
    `);

    res.status(200).json(rows);
  } catch (error) {
    console.error('Database query error:', error.message);
    res.status(500).json({ message: 'Internal Server Error' });
  }
}
