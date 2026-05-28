import { validateAIDiagnosticSession } from './schemas.js';

// In-memory CRM mock database for persistent sessions
const sessionDatabase = new Map();

// Mock CRM inventory pricing tables
const inventoryPricing = {
  // iPhone models
  'iphone 15 pro max': {
    'screen': { partCost: 280, laborRate: 90 },
    'battery': { partCost: 89, laborRate: 50 },
    'port': { partCost: 69, laborRate: 60 },
  },
  'iphone 15 pro': {
    'screen': { partCost: 250, laborRate: 80 },
    'battery': { partCost: 79, laborRate: 50 },
    'port': { partCost: 59, laborRate: 60 },
  },
  'iphone 15': {
    'screen': { partCost: 220, laborRate: 80 },
    'battery': { partCost: 79, laborRate: 50 },
    'port': { partCost: 49, laborRate: 60 },
  },
  'iphone 14 pro': {
    'screen': { partCost: 230, laborRate: 80 },
    'battery': { partCost: 69, laborRate: 50 },
    'port': { partCost: 49, laborRate: 60 },
  },
  'iphone 13': {
    'screen': { partCost: 160, laborRate: 70 },
    'battery': { partCost: 59, laborRate: 40 },
    'port': { partCost: 39, laborRate: 50 },
  },

  // iPad models
  'ipad pro 11': {
    'screen': { partCost: 190, laborRate: 90 },
    'battery': { partCost: 79, laborRate: 60 },
  },
  'ipad air 5': {
    'screen': { partCost: 150, laborRate: 80 },
    'battery': { partCost: 69, laborRate: 60 },
  },

  // MacBook models
  'macbook pro 16': {
    'screen': { partCost: 450, laborRate: 150 },
    'battery': { partCost: 129, laborRate: 90 },
    'keyboard': { partCost: 110, laborRate: 120 },
  },
  'macbook air m2': {
    'screen': { partCost: 350, laborRate: 120 },
    'battery': { partCost: 109, laborRate: 80 },
    'keyboard': { partCost: 89, laborRate: 100 },
  },

  // Samsung models
  'samsung galaxy s23 ultra': {
    'screen': { partCost: 260, laborRate: 90 },
    'battery': { partCost: 69, laborRate: 50 },
    'port': { partCost: 49, laborRate: 60 },
  }
};

// Generic fallback baselines by device category
const defaultBaselines = {
  iphone: {
    'screen': { min: 120, max: 280 },
    'battery': { min: 60, max: 110 },
    'port': { min: 80, max: 150 },
    'general': { min: 80, max: 300 }
  },
  ipad: {
    'screen': { min: 140, max: 320 },
    'battery': { min: 80, max: 160 },
    'port': { min: 90, max: 180 },
    'general': { min: 90, max: 350 }
  },
  android: {
    'screen': { min: 100, max: 300 },
    'battery': { min: 50, max: 100 },
    'port': { min: 70, max: 140 },
    'general': { min: 70, max: 280 }
  },
  laptop: {
    'screen': { min: 200, max: 550 },
    'battery': { min: 90, max: 220 },
    'keyboard': { min: 120, max: 250 },
    'general': { min: 120, max: 600 }
  },
  generic: {
    'general': { min: 50, max: 400 }
  }
};

/**
 * Standardizes component search keys.
 * @param {string} component 
 * @returns {string}
 */
function normalizeComponent(component) {
  const comp = component.toLowerCase();
  if (comp.includes('screen') || comp.includes('display') || comp.includes('lcd') || comp.includes('glass')) {
    return 'screen';
  }
  if (comp.includes('battery') || comp.includes('power')) {
    return 'battery';
  }
  if (comp.includes('port') || comp.includes('charging') || comp.includes('charger')) {
    return 'port';
  }
  if (comp.includes('keyboard') || comp.includes('keys')) {
    return 'keyboard';
  }
  return 'general';
}

/**
 * Detects device category from string.
 * @param {string} model 
 * @returns {keyof defaultBaselines}
 */
function getDeviceCategory(model) {
  const lower = model.toLowerCase();
  if (lower.includes('iphone')) return 'iphone';
  if (lower.includes('ipad')) return 'ipad';
  if (lower.includes('macbook') || lower.includes('laptop') || lower.includes('computer') || lower.includes('notebook')) return 'laptop';
  if (lower.includes('samsung') || lower.includes('galaxy') || lower.includes('pixel') || lower.includes('oneplus') || lower.includes('android')) return 'android';
  return 'generic';
}

/**
 * Looks up inventory pricing from CRM tables or falls back to generic baselines.
 * Calculates an estimated cost range based on parts cost + labor rate.
 * @param {string} deviceModel 
 * @param {string} suspectedComponent 
 * @returns {string} Estimated Cost Range (e.g., "$120 - $160 CAD")
 */
export function lookupCRMInventoryPrice(deviceModel, suspectedComponent) {
  const modelKey = deviceModel.toLowerCase().trim();
  const componentKey = normalizeComponent(suspectedComponent);
  const category = getDeviceCategory(modelKey);

  // 1. Try to find the exact match in our CRM pricing database
  if (inventoryPricing[modelKey] && inventoryPricing[modelKey][componentKey]) {
    const { partCost, laborRate } = inventoryPricing[modelKey][componentKey];
    const totalCost = partCost + laborRate;
    
    // Create a range of +/- 15% around the database target price
    const minPrice = Math.round(totalCost * 0.85);
    const maxPrice = Math.round(totalCost * 1.15);
    return `$${minPrice} - $${maxPrice} CAD`;
  }

  // 2. Fall back to generic category-based baselines
  const baselines = defaultBaselines[category] || defaultBaselines.generic;
  const range = baselines[componentKey] || baselines.general;

  return `$${range.min} - $${range.max} CAD (Est.)`;
}

/**
 * Persists an AIDiagnosticSession to our database.
 * @param {import('./schemas.js').AIDiagnosticSession} sessionData 
 * @returns {Promise<import('./schemas.js').AIDiagnosticSession>}
 */
export async function saveAIDiagnosticSession(sessionData) {
  const validated = validateAIDiagnosticSession(sessionData);
  sessionDatabase.set(validated.sessionId, validated);
  return validated;
}

/**
 * Fetches an AIDiagnosticSession from database.
 * @param {string} sessionId 
 * @returns {Promise<import('./schemas.js').AIDiagnosticSession|null>}
 */
export async function getAIDiagnosticSession(sessionId) {
  return sessionDatabase.get(sessionId) || null;
}
