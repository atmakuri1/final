import { pool } from '@/lib/db';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const query = `
        SELECT 
          menu_item_id,
          price,
          name,
          amount_available,
          type,
          description,
          expiry_date,
          ratings_sum,
          ratings_count
        FROM Menu_Item
        WHERE (expiry_date IS NULL OR expiry_date > CURRENT_DATE)
        ORDER BY
          CASE type
            WHEN 'category' THEN 1
            WHEN 'side' THEN 2
            WHEN 'entree' THEN 3
            WHEN 'premium entree' THEN 4
            WHEN 'appetizer' THEN 5
            WHEN 'dessert' THEN 6
            WHEN 'drink' THEN 7
            ELSE 8
          END,
          name;
      `;
      
      const { rows } = await pool.query(query);
      res.status(200).json(rows);
    } catch (error) {
      console.error('Error fetching menu items:', error);
      res.status(500).json({ error: 'Failed to fetch menu items' });
    }
  } else if (req.method === 'PUT') {
    try {
      const { menuItemId, newAmount } = req.body;
      
      const query = `
        UPDATE Menu_Item
        SET amount_available = $1
        WHERE menu_item_id = $2
        RETURNING *;
      `;
      
      const { rows } = await pool.query(query, [newAmount, menuItemId]);
      res.status(200).json(rows[0]);
    } catch (error) {
      console.error('Error updating item availability:', error);
      res.status(500).json({ error: 'Failed to update item availability' });
    }
  } else if (req.method === 'POST') {
    try {
      console.log('POST request received');
      console.log('Request body:', req.body);
      
      const client = await pool.connect();
      
      try {
        await client.query('BEGIN');

        if (req.body.ratings) {
          // Handle ratings
          for (const rating of req.body.ratings) {
            if (rating.rating !== null) {
              const updateQuery = `
                UPDATE Menu_Item
                SET 
                  ratings_sum = COALESCE(ratings_sum, 0) + $1,
                  ratings_count = COALESCE(ratings_count, 0) + 1
                WHERE menu_item_id = $2;
              `;
              await client.query(updateQuery, [rating.rating, rating.menuItemId]);
            }
          }

          await client.query('COMMIT');
          res.status(200).json({ 
            success: true, 
            message: 'Ratings updated successfully' 
          });
        } else {
          const { customerName, price, items } = req.body;
          console.log('Order data:', { customerName, price, itemsCount: items?.length });

          // Get the next orders_id
          const getMaxIdQuery = `
            SELECT COALESCE(MAX(orders_id), 0) + 1 as next_id FROM Orders;
          `;
          const maxIdResult = await client.query(getMaxIdQuery);
          const nextOrderId = maxIdResult.rows[0].next_id;
          console.log('Next Order ID:', nextOrderId);

          // Insert the order
          const orderQuery = `
            INSERT INTO Orders (orders_id, employee_id, price, order_time, customer_name, status)
            VALUES ($1, 1, $2, CURRENT_TIMESTAMP, $3, 'pending')
            RETURNING orders_id;
          `;
          
          const orderResult = await client.query(orderQuery, [nextOrderId, price, customerName]);
          const orderId = orderResult.rows[0].orders_id;
          console.log('Order created with ID:', orderId);

          // Get the next order_entry_id
          const getMaxEntryIdQuery = `
            SELECT COALESCE(MAX(order_entry_id), 0) + 1 as next_id FROM Order_Entry;
          `;
          const maxEntryIdResult = await client.query(getMaxEntryIdQuery);
          let nextEntryId = maxEntryIdResult.rows[0].next_id;

          // Insert order entries
          for (const entry of items) {
            for (const item of entry.items) {
              const entryPrice = entry.price / entry.items.length;
              console.log('Inserting entry:', {
                entryId: nextEntryId,
                orderId,
                menuItemId: item.menu_item_id,
                price: entryPrice
              });

              const entryQuery = `
                INSERT INTO Order_Entry (
                  order_entry_id,
                  order_id, 
                  menu_item_id, 
                  id1, 
                  id2, 
                  id3, 
                  side1_id, 
                  side2_id, 
                  entry_price
                )
                VALUES ($1, $2, $3, -1, -1, -1, -1, -1, $4);
              `;
              
              await client.query(entryQuery, [
                nextEntryId,
                orderId, 
                item.menu_item_id, 
                entryPrice
              ]);

              // Increment the entry ID for the next item
              nextEntryId++;
            }
          }

          await client.query('COMMIT');
          console.log('Transaction committed successfully');
          
          res.status(200).json({ 
            success: true, 
            orderId,
            message: 'Order created successfully' 
          });
        }
      } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error processing order:', {
          message: error.message,
          stack: error.stack,
          code: error.code,
          detail: error.detail,
          query: error.query
        });
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Final error:', {
        message: error.message,
        stack: error.stack,
        code: error.code,
        detail: error.detail
      });
      res.status(500).json({ 
        error: 'Failed to process request',
        details: error.message,
        code: error.code
      });
    }
  } else {
    res.setHeader('Allow', ['GET', 'PUT', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}