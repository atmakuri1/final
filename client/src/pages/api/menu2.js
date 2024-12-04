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
          CASE
            WHEN type = 'entree' AND ratings_count >= 1 AND (ratings_sum::float / ratings_count) >= 4.0 THEN true
            WHEN type = 'premium entree' AND ratings_count >= 1 AND (ratings_sum::float / ratings_count) >= 4.5 THEN true
            WHEN type = 'side' AND ratings_count >= 1 AND (ratings_sum::float / ratings_count) >= 4.2 THEN true
            WHEN type IN ('appetizer', 'dessert', 'drink') AND ratings_count >= 1 AND (ratings_sum::float / ratings_count) >= 4.3 THEN true
            ELSE false
          END as is_favorite,
          image_url  -- Add this if you have it in your database
        FROM menu_item
        ORDER BY 
          CASE 
            WHEN type IN ('appetizer', 'dessert', 'drink') THEN 'Extra'
            WHEN type = 'premium entree' THEN 'entree'
            ELSE type 
          END,
          name;
      `;
      
      const { rows } = await pool.query(query);
      
      // Log the first few items to check the data
      console.log('Sample menu items:', rows.slice(0, 3));
      
      res.status(200).json(rows);
    } catch (error) {
      console.error('Error fetching menu items:', error);
      res.status(500).json({ error: 'Failed to fetch menu items' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}