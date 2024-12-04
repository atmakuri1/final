import { pool } from '@/lib/db';

async function updateInventoryForMenuItem(menuItemId, client) {
  // Get recipe ingredients for the menu item
  const recipeQuery = `
    SELECT inventory_item_id, ingredient_amount
    FROM Recipe
    WHERE menu_item_id = $1;
  `;
  const recipeResult = await client.query(recipeQuery, [menuItemId]);
  
  // Update inventory for each ingredient
  for (const ingredient of recipeResult.rows) {
    const updateQuery = `
      UPDATE Inventory_Item
      SET quantity = quantity - $1
      WHERE inventory_item_id = $2
      RETURNING quantity;
    `;
    const updateResult = await client.query(updateQuery, [
      ingredient.ingredient_amount,
      ingredient.inventory_item_id
    ]);
    
    // Check if inventory is running low
    if (updateResult.rows[0].quantity < 0) {
      throw new Error(`Insufficient inventory for item ${ingredient.inventory_item_id}`);
    }
  }
}

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { employeeId, price, orderEntries } = req.body;
    const client = await pool.connect();
    
    try {
      // Start a transaction
      await client.query('BEGIN');
      
      // Get the current maximum order ID
      const maxIdQuery = `
        SELECT COALESCE(MAX(orders_id), 0) as max_id 
        FROM Orders;
      `;
      const maxIdResult = await client.query(maxIdQuery);
      const nextOrderId = maxIdResult.rows[0].max_id + 1;
      
      // Create the order with the next ID
      const orderQuery = `
        INSERT INTO Orders (orders_id, employee_id, price, order_time)
        VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
        RETURNING orders_id;
      `;
      const orderResult = await client.query(orderQuery, [nextOrderId, employeeId, price]);
      const orderId = orderResult.rows[0].orders_id;
      
      // Get the current maximum order entry ID
      const maxEntryIdQuery = `
        SELECT COALESCE(MAX(order_entry_id), 0) as max_entry_id 
        FROM Order_Entry;
      `;
      const maxEntryIdResult = await client.query(maxEntryIdQuery);
      let nextEntryId = maxEntryIdResult.rows[0].max_entry_id + 1;
      
      // Process each order entry
      for (const entry of orderEntries) {
        const { menuItemId, id1, id2, id3, side1Id, side2Id, entryPrice } = entry;
        
        // Insert the order entry
        const entryQuery = `
          INSERT INTO Order_Entry (
            order_entry_id, order_id, menu_item_id, id1, id2, id3, 
            side1_id, side2_id, entry_price
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          RETURNING order_entry_id;
        `;
        
        await client.query(entryQuery, [
          nextEntryId,
          orderId,
          menuItemId,
          id1 || -1,
          id2 || -1,
          id3 || -1,
          side1Id || -1,
          side2Id || -1,
          entryPrice
        ]);
        
        // Update inventory based on the type of order
        if (menuItemId <= 3) {
          // For Bowl/Plate/Bigger Plate, update inventory for sides and entrees
          if (side1Id && side1Id > 0) {
            await updateInventoryForMenuItem(side1Id, client);
          }
          if (id1 && id1 > 0) {
            await updateInventoryForMenuItem(id1, client);
          }
          if (id2 && id2 > 0) {
            await updateInventoryForMenuItem(id2, client);
          }
          if (id3 && id3 > 0) {
            await updateInventoryForMenuItem(id3, client);
          }
        } else {
          // For individual items (not categories), update inventory directly
          await updateInventoryForMenuItem(menuItemId, client);
        }
        
        nextEntryId++;
      }
      
      // Commit the transaction
      await client.query('COMMIT');
      
      res.status(200).json({ 
        success: true, 
        orderId 
      });
      
    } catch (error) {
      // Rollback in case of error
      await client.query('ROLLBACK');
      console.error('Error processing order:', error);
      res.status(500).json({ 
        error: 'Failed to process order',
        details: error.message 
      });
    } finally {
      client.release();
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}