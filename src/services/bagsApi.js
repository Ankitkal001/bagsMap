const axios = require('axios');

const BASE_URL = 'https://api2.bags.fm/api/v1';

/**
 * Fetches top tokens by lifetime fees.
 * This endpoint contains rich data including symbol, price, and stats.
 */
async function getTopTokensWithStats() {
  try {
    const response = await axios.get(`${BASE_URL}/token-launch/top-tokens/lifetime-fees`);
    // API returns { success: true, response: [...] }
    if (response.data && response.data.response && Array.isArray(response.data.response)) {
        return response.data.response;
    }
    // Handle case where it might be just the array (defensive)
    if (Array.isArray(response.data)) {
        return response.data;
    }
    console.warn('Unexpected API response structure:', Object.keys(response.data));
    return [];
  } catch (error) {
    console.error('Error fetching top tokens with stats:', error.message);
    return [];
  }
}

/**
 * Fetches the latest price for a specific token mint.
 * @param {string} tokenMint 
 */
async function getLatestPrice(tokenMint) {
  try {
    const response = await axios.get(`${BASE_URL}/solana/latestPrice?token=${tokenMint}`);
    return response.data;
  } catch (error) {
    return null;
  }
}

module.exports = {
  getTopTokensWithStats,
  getLatestPrice
};
