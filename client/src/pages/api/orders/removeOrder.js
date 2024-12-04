import axios from 'axios';

/**
 * Deletes an order from the database.
 * @param {number} orderId - The ID of the order to delete.
 * @returns {Promise} - Resolves if the deletion is successful, rejects otherwise.
 */
const removeOrder = async (orderId) => {
  try {
    const response = await axios.delete(`/api/orders/${orderId}`);
    return response.data;
  } catch (error) {
    console.error(`Failed to delete order with ID ${orderId}:`, error);
    throw error;
  }
};

export default removeOrder;
