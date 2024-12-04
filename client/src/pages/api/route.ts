import { pool } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { ratings } = await request.json();
    
    // Start a transaction since we're doing multiple updates
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      for (const rating of ratings) {
        if (rating.rating !== null) { // Only process items that were rated
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
      return NextResponse.json({ message: 'Ratings updated successfully' });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error updating ratings:', error);
    return NextResponse.json(
      { error: 'Failed to update ratings' },
      { status: 500 }
    );
  }
}