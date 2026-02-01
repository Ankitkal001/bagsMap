const { getTopTokensWithStats } = require('./bagsApi');

// In-memory cache of the world state
let currentState = {
  characters: [],
  lastUpdated: 0
};

// Data Rotation State
let allTokensCache = [];
let lastFetchTime = 0;
let rotationIndex = 0;
const ROTATION_INTERVAL = 120000; // 2 minutes
const BATCH_SIZE = 25;

/**
 * Normalizes a raw token project from the fees endpoint into a Character.
 * @param {Object} tokenData - Data from lifetime-fees endpoint
 */
function normalizeCharacter(tokenData) {
  // Defensive checks
  const mint = tokenData.token;
  const info = tokenData.tokenInfo || {};
  const symbol = info.symbol || '???';
  const name = info.name || symbol;
  const icon = info.icon || null;
  const holders = info.holderCount || 0;
  const mcap = info.mcap || 0;
  
  // Creator & Royalty info
  // The API returns 'creators' at the top level, NOT inside 'tokenInfo'
  const creators = tokenData.creators || [];
  let creatorObj = { username: 'Unknown', pfp: null, handle: 'Unknown' };
  let royaltyObj = { username: 'None', pfp: null, handle: 'None' };

  // Find actual creator
  const foundCreator = creators.find(c => c.isCreator) || creators[0];
  if (foundCreator) {
      creatorObj = {
          username: foundCreator.username || foundCreator.twitterUsername || 'Unknown',
          pfp: foundCreator.pfp,
          handle: foundCreator.twitterUsername || foundCreator.username
      };
  }

  // Find royalty receiver (highest bps that is not the creator, or just highest if unique)
  // The user asked for "reyality twieter" -> Royalty Twitter
  const royaltyReceiver = creators.find(c => c.royaltyBps > 0 && c.username !== creatorObj.username);
  if (royaltyReceiver) {
      royaltyObj = {
          username: royaltyReceiver.username || royaltyReceiver.twitterUsername || 'Unknown',
          pfp: royaltyReceiver.pfp,
          handle: royaltyReceiver.twitterUsername || royaltyReceiver.username
      };
  } else if (creators.length > 0) {
     // fallback if only one person or creator gets royalties
     const r = creators.find(c => c.royaltyBps > 0);
     if (r) {
        royaltyObj = {
            username: r.username || r.twitterUsername,
            pfp: r.pfp,
            handle: r.twitterUsername || r.username
        };
     }
  }

  if (!mint) return null;

  // 1. Determine Size (Importance) based on Fees
  // Convert raw Lamports to SOL (1 SOL = 1,000,000,000 Lamports)
  const rawFees = parseFloat(tokenData.lifetimeFees || 0);
  const feesSol = rawFees / 1_000_000_000;
  
  let size = 1; // Small
  if (feesSol > 2000) size = 3; // Large (> 2000 SOL)
  else if (feesSol > 200) size = 2; // Medium (> 200 SOL)

  // 2. Determine Speed/State based on Price/Activity
  let speed = 1.0;
  
  // Use 24h price change as activity proxy if available
  const stats24h = info.stats24h || {};
  const priceChange = stats24h.priceChange || 0;
  const buyVol = stats24h.buyVolume || 0;
  const sellVol = stats24h.sellVolume || 0;
  const volume24h = buyVol + sellVol;

  // More volatility (up or down) = more speed
  // Cap at 3x speed
  speed = 1.0 + Math.min(Math.abs(priceChange) / 10, 2.0);

  return {
    id: mint,
    symbol: symbol,
    name: name,
    icon: icon,
    size: size,
    speed: speed,
    state: 'active',
    fees: feesSol, // Send fees in SOL
    priceDelta: priceChange, // Use 24h change for display
    mcap: mcap,
    volume24h: volume24h,
    holders: holders,
    creator: creatorObj,
    royalty: royaltyObj,
    priceUsd: info.usdPrice || 0
  };
}

/**
 * Main update function.
 * Fetches data, normalizes it, and updates currentState.
 */
async function updateWorldState() {
  const now = Date.now();
  
  // 1. Fetch & Cache Data (if empty or stale > 5 min)
  if (allTokensCache.length === 0 || now - lastFetchTime > 300000) {
      console.log('Fetching fresh data from API...');
      const topTokensData = await getTopTokensWithStats();
      
      if (topTokensData && Array.isArray(topTokensData)) {
          // Normalize & Cache ALL (up to 100)
          allTokensCache = topTokensData
            .map(normalizeCharacter)
            .filter(c => c !== null);
          lastFetchTime = now;
          console.log(`Cached ${allTokensCache.length} tokens.`);
      }
  }

  // 2. Select Active Batch
  let activeTokens = [];
  if (allTokensCache.length > 0) {
      const start = rotationIndex * BATCH_SIZE;
      const end = start + BATCH_SIZE;
      
      // If index is out of bounds, reset
      if (start >= allTokensCache.length) {
          rotationIndex = 0;
          activeTokens = allTokensCache.slice(0, BATCH_SIZE);
      } else {
          activeTokens = allTokensCache.slice(start, end);
          // Wrap around fill
          if (activeTokens.length < BATCH_SIZE && allTokensCache.length > BATCH_SIZE) {
              activeTokens = activeTokens.concat(allTokensCache.slice(0, BATCH_SIZE - activeTokens.length));
          }
      }
  }

  currentState = {
    characters: activeTokens,
    lastUpdated: Date.now()
  };

  return currentState;
}

// Rotation Loop
setInterval(() => {
    if (allTokensCache.length > 0) {
        rotationIndex++;
        if (rotationIndex * BATCH_SIZE >= allTokensCache.length) rotationIndex = 0;
        // Trigger update to refresh state with new batch
        updateWorldState();
    }
}, ROTATION_INTERVAL);

function getWorldState() {
  return currentState;
}

module.exports = {
  updateWorldState,
  getWorldState
};
