/**
 * @typedef {Object} Message
 * @property {'user'|'assistant'} role
 * @property {string} content
 */

/**
 * @typedef {Object} DiagnoseRequestPayload
 * @property {string} sessionId
 * @property {string} currentMessage
 * @property {Message[]} conversationHistory
 */

/**
 * @typedef {Object} AIDiagnosticSession
 * @property {string} sessionId
 * @property {string} [userId]
 * @property {string} rawUserText
 * @property {string} parsedDeviceModel
 * @property {string} suspectedIssue
 * @property {'Low'|'Medium'|'High'} urgencyLevel
 * @property {string} estimatedCostRange
 * @property {'Pending'|'Booked'|'Abandoned'} status
 */

/**
 * Validates the incoming payload for the POST /api/v1/diagnose endpoint.
 * @param {any} data
 * @returns {DiagnoseRequestPayload}
 * @throws {Error} If validation fails
 */
export function validateDiagnoseRequest(data) {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid request payload: must be a JSON object.');
  }

  const { sessionId, currentMessage, conversationHistory } = data;

  if (typeof sessionId !== 'string' || !sessionId.trim()) {
    throw new Error('Validation Error: "sessionId" is required and must be a non-empty string.');
  }

  if (typeof currentMessage !== 'string' || !currentMessage.trim()) {
    throw new Error('Validation Error: "currentMessage" is required and must be a non-empty string.');
  }

  if (conversationHistory !== undefined) {
    if (!Array.isArray(conversationHistory)) {
      throw new Error('Validation Error: "conversationHistory" must be an array of message objects.');
    }

    for (let i = 0; i < conversationHistory.length; i++) {
      const msg = conversationHistory[i];
      if (!msg || typeof msg !== 'object') {
        throw new Error(`Validation Error: "conversationHistory[${i}]" must be a message object.`);
      }
      if (msg.role !== 'user' && msg.role !== 'assistant') {
        throw new Error(`Validation Error: "conversationHistory[${i}].role" must be either "user" or "assistant".`);
      }
      if (typeof msg.content !== 'string' || !msg.content.trim()) {
        throw new Error(`Validation Error: "conversationHistory[${i}].content" must be a non-empty string.`);
      }
    }
  }

  return {
    sessionId: sessionId.trim(),
    currentMessage: currentMessage.trim(),
    conversationHistory: conversationHistory || []
  };
}

/**
 * Validates the AIDiagnosticSession data model before DB persistence.
 * @param {any} data
 * @returns {AIDiagnosticSession}
 * @throws {Error} If validation fails
 */
export function validateAIDiagnosticSession(data) {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid session payload: must be a JSON object.');
  }

  const {
    sessionId,
    userId,
    rawUserText,
    parsedDeviceModel,
    suspectedIssue,
    urgencyLevel,
    estimatedCostRange,
    status
  } = data;

  if (typeof sessionId !== 'string' || !sessionId.trim()) {
    throw new Error('Validation Error: "sessionId" is required and must be a non-empty string.');
  }

  if (userId !== undefined && userId !== null && typeof userId !== 'string') {
    throw new Error('Validation Error: "userId" must be a string.');
  }

  if (typeof rawUserText !== 'string' || !rawUserText.trim()) {
    throw new Error('Validation Error: "rawUserText" is required and must be a non-empty string.');
  }

  if (typeof parsedDeviceModel !== 'string' || !parsedDeviceModel.trim()) {
    throw new Error('Validation Error: "parsedDeviceModel" is required and must be a non-empty string.');
  }

  if (typeof suspectedIssue !== 'string' || !suspectedIssue.trim()) {
    throw new Error('Validation Error: "suspectedIssue" is required and must be a non-empty string.');
  }

  if (urgencyLevel !== 'Low' && urgencyLevel !== 'Medium' && urgencyLevel !== 'High') {
    throw new Error('Validation Error: "urgencyLevel" must be one of "Low", "Medium", or "High".');
  }

  if (typeof estimatedCostRange !== 'string' || !estimatedCostRange.trim()) {
    throw new Error('Validation Error: "estimatedCostRange" is required and must be a non-empty string.');
  }

  if (status !== 'Pending' && status !== 'Booked' && status !== 'Abandoned') {
    throw new Error('Validation Error: "status" must be one of "Pending", "Booked", or "Abandoned".');
  }

  return {
    sessionId: sessionId.trim(),
    userId: userId ? userId.trim() : undefined,
    rawUserText: rawUserText.trim(),
    parsedDeviceModel: parsedDeviceModel.trim(),
    suspectedIssue: suspectedIssue.trim(),
    urgencyLevel,
    estimatedCostRange: estimatedCostRange.trim(),
    status
  };
}
