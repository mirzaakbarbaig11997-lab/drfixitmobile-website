import express from 'express';
import { validateDiagnoseRequest } from './schemas.js';
import { queryDiagnosticsLLM } from './llmService.js';
import { lookupCRMInventoryPrice, saveAIDiagnosticSession } from './crmService.js';

const router = express.Router();

// Define safety protocols for high-risk issues
const SAFETY_PROTOCOLS = {
  'swollen battery': {
    severity: 'CRITICAL',
    title: '⚠️ CRITICAL SAFETY WARNING: Swollen Lithium-Ion Battery',
    steps: [
      'DO NOT plug the device into a charger under any circumstances.',
      'Power down the device immediately if it is still powered on.',
      'Place the device on a non-flammable surface (like concrete, metal, or tile) away from flammable materials.',
      'Do not apply pressure, squeeze, or attempt to force the bulging cover back down.',
      'Bring the device to our Strathmore shop immediately for safe thermal containment and replacement.'
    ]
  },
  'liquid damage': {
    severity: 'HIGH',
    title: '⚠️ HIGH-PRIORITY WARNING: Active Liquid Intrusion',
    steps: [
      'Power off the device immediately to prevent catastrophic short circuits.',
      'Unplug any chargers, power adapters, or peripheral cables.',
      'Wipe off external liquid with a clean, dry towel.',
      'DO NOT place the device in rice (dust and starch will worsen board erosion) and DO NOT use a hair dryer (forces liquid deeper).',
      'Bring the device in for a professional ultrasonic cleaning board-wash as soon as possible.'
    ]
  }
};

/**
 * POST /api/v1/diagnose
 * Handles incoming unstructured message, queries LLM for symptom parsing,
 * calculates inventory price quotes, persists session, and appends safety blocks.
 */
router.post('/diagnose', async (req, res) => {
  try {
    // 1. Data Validation
    const payload = validateDiagnoseRequest(req.body);

    // 2. Query LLM Service to parse symptoms
    const llmAnalysis = await queryDiagnosticsLLM(
      payload.currentMessage,
      payload.conversationHistory
    );

    // 3. CRM Database Price Lookup
    const estimatedCostRange = lookupCRMInventoryPrice(
      llmAnalysis.parsedDeviceModel,
      llmAnalysis.suspectedIssue
    );

    // 4. Save Session to CRM Mock Database
    const sessionRecord = {
      sessionId: payload.sessionId,
      userId: req.headers['x-user-id'] || null, // Optional user tracking from request headers
      rawUserText: payload.currentMessage,
      parsedDeviceModel: llmAnalysis.parsedDeviceModel,
      suspectedIssue: llmAnalysis.suspectedIssue,
      urgencyLevel: llmAnalysis.urgencyLevel,
      estimatedCostRange,
      status: 'Pending' // Initial state
    };

    await saveAIDiagnosticSession(sessionRecord);

    // 5. Safety Protocols Check
    let safetyProtocol = null;
    const issueLower = llmAnalysis.suspectedIssue.toLowerCase();
    
    if (llmAnalysis.isSafetyIssue || issueLower.includes('swollen') || issueLower.includes('liquid') || issueLower.includes('water')) {
      if (issueLower.includes('swollen') || issueLower.includes('bulging') || issueLower.includes('bloat')) {
        safetyProtocol = SAFETY_PROTOCOLS['swollen battery'];
      } else {
        safetyProtocol = SAFETY_PROTOCOLS['liquid damage'];
      }
    }

    // 6. Format Response
    const responsePayload = {
      sessionId: sessionRecord.sessionId,
      parsedDeviceModel: sessionRecord.parsedDeviceModel,
      suspectedIssue: sessionRecord.suspectedIssue,
      urgencyLevel: sessionRecord.urgencyLevel,
      estimatedCostRange: sessionRecord.estimatedCostRange,
      chatResponse: llmAnalysis.chatResponse,
      ...(safetyProtocol && { safetyProtocol })
    };

    return res.status(200).json(responsePayload);

  } catch (error) {
    console.error('Diagnostics Controller Error:', error.message);

    // Return structured validation or generic errors
    if (error.message.startsWith('Validation Error:')) {
      return res.status(400).json({
        error: 'Bad Request',
        message: error.message
      });
    }

    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'An unexpected error occurred while processing diagnostics. Please try again.'
    });
  }
});

export default router;
