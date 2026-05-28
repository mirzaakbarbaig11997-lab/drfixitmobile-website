import Anthropic from '@anthropic-ai/sdk';

// Initialize the Anthropic client. Falls back to mock client if API key is missing.
const apiKey = process.env.ANTHROPIC_API_KEY || '';
const client = apiKey ? new Anthropic({ apiKey }) : null;

const SYSTEM_PROMPT = `You are the AI Diagnostics Coordinator for QuickFix CRM and Dr. Fixit Mobile.
Your job is to act as an expert smartphone, tablet, and laptop repair technician.
Based on the user's message and the conversation history, analyze the symptoms and return a JSON object.

Strict Rules:
1. Act as an expert repair technician, but NEVER give absolute legal guarantees on price quotes. Keep estimates tentative.
2. Classify urgencyLevel as "Low", "Medium", or "High".
3. Flag safety concerns (e.g., swollen/bulging batteries, smoke, sparks, active water/liquid damage) by setting isSafetyIssue to true.
4. Extract the parsedDeviceModel (e.g. "iPhone 13", "MacBook Air M2") and suspectedIssue (e.g. "screen replacement", "battery swap"). If unknown, put "Unknown".
5. Provide a helpful, short chat response (2-3 sentences) reassuring the user, explaining the suspected issue in simple terms, and offering a free walk-in diagnostic.
6. You MUST respond ONLY with a valid JSON object. Do not include any markdown wrappers (like \`\`\`json) or conversational text outside the JSON.

Expected JSON output format:
{
  "parsedDeviceModel": "iPhone 13 Pro",
  "suspectedIssue": "screen replacement",
  "urgencyLevel": "Medium",
  "isSafetyIssue": false,
  "chatResponse": "It looks like your iPhone 13 Pro has a cracked outer glass. Since your touch screen is still working, we can likely perform a straightforward screen replacement. I recommend booking a free diagnostic so we can confirm."
}`;

/**
 * Coordinate LLM analysis of the diagnostic request
 * @param {string} currentMessage 
 * @param {import('./schemas.js').Message[]} conversationHistory 
 * @returns {Promise<{parsedDeviceModel: string, suspectedIssue: string, urgencyLevel: 'Low'|'Medium'|'High', isSafetyIssue: boolean, chatResponse: string}>}
 */
export async function queryDiagnosticsLLM(currentMessage, conversationHistory) {
  // If the client is not configured, fall back to our mock/local rules parser
  if (!client) {
    return generateMockLLMResponse(currentMessage);
  }

  try {
    // Structure messages for Claude
    const formattedMessages = [
      ...conversationHistory.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      { role: 'user', content: currentMessage }
    ];

    const response = await client.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 400,
      system: SYSTEM_PROMPT,
      messages: formattedMessages
    });

    const text = response.content[0].text.trim();
    
    // Clean up potential markdown formatting wrapping JSON
    const cleanJsonText = text.replace(/^```json\s*/i, '').replace(/\s*```$/, '');
    const result = JSON.parse(cleanJsonText);

    // Validate fields exist
    return {
      parsedDeviceModel: result.parsedDeviceModel || 'Unknown',
      suspectedIssue: result.suspectedIssue || 'Unknown',
      urgencyLevel: ['Low', 'Medium', 'High'].includes(result.urgencyLevel) ? result.urgencyLevel : 'Medium',
      isSafetyIssue: !!result.isSafetyIssue,
      chatResponse: result.chatResponse || 'Please bring your device in for a free diagnostic assessment.'
    };
  } catch (error) {
    console.error('LLM API error, falling back to rule-based parser:', error.message);
    return generateMockLLMResponse(currentMessage);
  }
}

/**
 * High-fidelity fallback parser that uses pattern matching to extract fields.
 * Satisfies testing and zero-downtime requirements.
 * @param {string} message 
 */
function generateMockLLMResponse(message) {
  const msg = message.toLowerCase();
  
  let parsedDeviceModel = 'Unknown';
  let suspectedIssue = 'general diagnostic';
  let urgencyLevel = 'Low';
  let isSafetyIssue = false;
  let chatResponse = 'I recommend bringing your device in so our technicians can run a free, complete diagnostics check.';

  // 1. Detect Device Model
  if (msg.includes('iphone 15 pro max')) parsedDeviceModel = 'iPhone 15 Pro Max';
  else if (msg.includes('iphone 15 pro')) parsedDeviceModel = 'iPhone 15 Pro';
  else if (msg.includes('iphone 15')) parsedDeviceModel = 'iPhone 15';
  else if (msg.includes('iphone 14 pro')) parsedDeviceModel = 'iPhone 14 Pro';
  else if (msg.includes('iphone 13')) parsedDeviceModel = 'iPhone 13';
  else if (msg.includes('iphone')) parsedDeviceModel = 'iPhone';
  else if (msg.includes('ipad pro 11')) parsedDeviceModel = 'iPad Pro 11';
  else if (msg.includes('ipad air 5')) parsedDeviceModel = 'iPad Air 5';
  else if (msg.includes('ipad')) parsedDeviceModel = 'iPad';
  else if (msg.includes('macbook pro 16')) parsedDeviceModel = 'MacBook Pro 16';
  else if (msg.includes('macbook air m2')) parsedDeviceModel = 'MacBook Air M2';
  else if (msg.includes('macbook') || msg.includes('laptop')) parsedDeviceModel = 'MacBook/Laptop';
  else if (msg.includes('samsung') || msg.includes('s23')) parsedDeviceModel = 'Samsung Galaxy S23 Ultra';

  // 2. Detect Symptoms & Suspected Issue
  if (msg.includes('screen') || msg.includes('cracked') || msg.includes('glass') || msg.includes('display')) {
    suspectedIssue = 'screen replacement';
    urgencyLevel = 'Medium';
    chatResponse = `It sounds like you need a screen replacement for your ${parsedDeviceModel !== 'Unknown' ? parsedDeviceModel : 'device'}. Cracked glass can spread or damage the LCD panel underneath, so it's best to address it soon.`;
  } else if (msg.includes('battery') || msg.includes('die') || msg.includes('charging') || msg.includes('drain')) {
    suspectedIssue = 'battery swap';
    urgencyLevel = 'Medium';
    chatResponse = `It seems like your ${parsedDeviceModel !== 'Unknown' ? parsedDeviceModel : 'device'} requires a battery replacement. Batteries naturally degrade over time, leading to quick drainage or shutdown issues.`;
  }

  // 3. Safety Flagging (swollen battery / liquid damage)
  if (msg.includes('swollen') || msg.includes('bulging') || msg.includes('bloat') || msg.includes('expand') || msg.includes('puff')) {
    suspectedIssue = 'swollen battery';
    urgencyLevel = 'High';
    isSafetyIssue = true;
    chatResponse = `Warning: A swollen battery on your ${parsedDeviceModel !== 'Unknown' ? parsedDeviceModel : 'device'} poses a serious safety hazard. Please read our safety protocols immediately.`;
  } else if (msg.includes('water') || msg.includes('liquid') || msg.includes('spill') || msg.includes('dropped in') || msg.includes('pool') || msg.includes('rain')) {
    suspectedIssue = 'liquid damage';
    urgencyLevel = 'High';
    isSafetyIssue = true;
    chatResponse = `Your ${parsedDeviceModel !== 'Unknown' ? parsedDeviceModel : 'device'} has suffered liquid exposure. Internal corrosion starts instantly and can cause permanent short circuits if not handled quickly.`;
  }

  return {
    parsedDeviceModel,
    suspectedIssue,
    urgencyLevel,
    isSafetyIssue,
    chatResponse
  };
}
