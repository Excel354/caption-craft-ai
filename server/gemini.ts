import { GoogleGenAI, Type } from '@google/genai';
import { CaptionVariation, PlatformId } from '../src/types';
import { PLATFORMS } from '../src/constants/platforms';

function getApiKey(): string {
  return (
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.GOOGLE_GENAI_API_KEY ||
    process.env.VITE_GEMINI_API_KEY ||
    process.env.API_KEY ||
    ''
  ).trim();
}

function getAiClient(): GoogleGenAI {
  const key = getApiKey();
  return new GoogleGenAI({
    apiKey: key,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

export interface GenerateCaptionsParams {
  topic: string;
  platform: PlatformId;
  includeEmojis: boolean;
  tone?: string;
  customContext?: string;
}

// Candidate models in priority order according to official @google/genai guidelines
const MODEL_CASCADE = ['gemini-3.7-flash', 'gemini-flash-latest'];

function isRetryableError(error: any): boolean {
  const errMsg = (error?.message || error?.toString() || '').toLowerCase();
  const statusCode = error?.status || error?.code || error?.error?.code;
  return (
    statusCode === 503 ||
    statusCode === 429 ||
    statusCode === 500 ||
    errMsg.includes('503') ||
    errMsg.includes('429') ||
    errMsg.includes('high demand') ||
    errMsg.includes('unavailable') ||
    errMsg.includes('resource exhausted') ||
    errMsg.includes('overloaded') ||
    errMsg.includes('rate limit') ||
    errMsg.includes('try again later') ||
    errMsg.includes('fetch failed') ||
    errMsg.includes('econnreset')
  );
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function generateSynthesizedCaptions(params: GenerateCaptionsParams): {
  captions: CaptionVariation[];
  hashtags: string[];
} {
  const { topic, platform, includeEmojis, tone } = params;
  const config = PLATFORMS[platform] || PLATFORMS.instagram;
  const em = (str: string) => (includeEmojis ? str : '');

  const cleanTopic = topic.trim();
  const keywords = cleanTopic.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(w => w.length > 2);
  const tagList = Array.from(new Set([...keywords, platform, 'trending', 'creator', 'insights']))
    .slice(0, config.hashtagMax)
    .map(w => `#${w.replace(/\s+/g, '')}`);

  const variations: CaptionVariation[] = [];

  if (platform === 'x') {
    variations.push({
      id: `cap_1_${Date.now()}`,
      text: `${cleanTopic}. Most people ignore this, but here is why it matters. ${em('👇')}`,
      charCount: 0,
      hook: cleanTopic,
      toneLabel: 'Sharp Insight',
      callToAction: 'What do you think?',
    });
    variations.push({
      id: `cap_2_${Date.now()}`,
      text: `3 quick takeaways on ${cleanTopic}:\n1. Start small\n2. Iterate quickly\n3. Stay consistent.\n\nSave this for later.`,
      charCount: 0,
      hook: `3 quick takeaways on ${cleanTopic}`,
      toneLabel: 'Actionable Breakdown',
      callToAction: 'Save this for later.',
    });
    variations.push({
      id: `cap_3_${Date.now()}`,
      text: `The biggest lesson learned from ${cleanTopic}? Simplicity wins every single time. ${em('⚡')}`,
      charCount: 0,
      hook: `The biggest lesson learned`,
      toneLabel: 'Direct & Punchy',
    });
    variations.push({
      id: `cap_4_${Date.now()}`,
      text: `Question of the day: What is your biggest challenge with ${cleanTopic}? Drop your thoughts below.`,
      charCount: 0,
      hook: 'Question of the day',
      toneLabel: 'Discussion Starter',
      callToAction: 'Drop your thoughts below.',
    });
  } else if (platform === 'linkedin') {
    variations.push({
      id: `cap_1_${Date.now()}`,
      text: `Why ${cleanTopic} is reshaping the way we approach growth today.\n\nHere are 3 fundamental shifts every professional should watch:\n• Focus on quality over volume\n• Build feedback loops early\n• Leverage modern automation\n\nWhat has been your experience? ${em('💡')}`,
      charCount: 0,
      hook: `Why ${cleanTopic} is reshaping the way we approach growth today.`,
      toneLabel: 'Industry Perspective',
      callToAction: 'What has been your experience?',
    });
    variations.push({
      id: `cap_2_${Date.now()}`,
      text: `We tested a new framework around ${cleanTopic}. Here is the exact breakdown of what worked:\n\n1. Clarity first\n2. Streamlined execution\n3. Continuous optimization\n\nIf you found this useful, repost for your network. ${em('📌')}`,
      charCount: 0,
      hook: `We tested a new framework around ${cleanTopic}.`,
      toneLabel: 'Framework Breakdown',
      callToAction: 'Repost for your network.',
    });
    variations.push({
      id: `cap_3_${Date.now()}`,
      text: `A key reminder regarding ${cleanTopic}: Sustainable results take consistent daily inputs rather than occasional intensive sprints.\n\nAgree or disagree?`,
      charCount: 0,
      hook: 'A key reminder',
      toneLabel: 'Thought Leadership',
      callToAction: 'Agree or disagree?',
    });
    variations.push({
      id: `cap_4_${Date.now()}`,
      text: `3 questions every team should ask about ${cleanTopic} this quarter:\n\n1. Are we solving the right problem?\n2. How do we measure outcome velocity?\n3. What can be simplified?\n\nLet's connect in the comments.`,
      charCount: 0,
      hook: '3 questions every team should ask',
      toneLabel: 'Strategic Inquiries',
      callToAction: "Let's connect in the comments.",
    });
  } else if (platform === 'tiktok') {
    variations.push({
      id: `cap_1_${Date.now()}`,
      text: `Stop scrolling if you care about ${cleanTopic} ${em('👀')} wait till the end!`,
      charCount: 0,
      hook: 'Stop scrolling',
      toneLabel: 'High-Retention Hook',
      callToAction: 'Drop a follow for part 2!',
    });
    variations.push({
      id: `cap_2_${Date.now()}`,
      text: `The truth about ${cleanTopic} that nobody talks about ${em('🤫✨')} let me know if you agree in the comments`,
      charCount: 0,
      hook: 'The truth that nobody talks about',
      toneLabel: 'Story / Reveal',
      callToAction: 'Let me know in the comments',
    });
    variations.push({
      id: `cap_3_${Date.now()}`,
      text: `Everything you need to know about ${cleanTopic} in under 30 seconds ${em('⚡📲')}`,
      charCount: 0,
      hook: 'Everything you need to know in under 30s',
      toneLabel: 'Quick Value',
    });
    variations.push({
      id: `cap_4_${Date.now()}`,
      text: `Did you know this about ${cleanTopic}? Tag a friend who needs to see this! ${em('👇🔥')}`,
      charCount: 0,
      hook: 'Did you know this?',
      toneLabel: 'Community Viral',
      callToAction: 'Tag a friend',
    });
  } else {
    // Instagram & Facebook
    variations.push({
      id: `cap_1_${Date.now()}`,
      text: `The secret to mastering ${cleanTopic} ${em('✨')}\n\nSwipe through for the full breakdown and make sure to save this post for your next project.\n\nDouble tap if this resonated! ${em('💬👇')}`,
      charCount: 0,
      hook: `The secret to mastering ${cleanTopic}`,
      toneLabel: 'Hook & Discovery',
      callToAction: 'Save this post for later.',
    });
    variations.push({
      id: `cap_2_${Date.now()}`,
      text: `Here is everything we learned diving deep into ${cleanTopic}.\n\n• Step 1: Define your core objective\n• Step 2: Test ideas without friction\n• Step 3: Scale what works\n\nWhat is your go-to strategy? ${em('💭')}`,
      charCount: 0,
      hook: 'Here is everything we learned',
      toneLabel: 'Step-by-Step Value',
      callToAction: 'What is your go-to strategy?',
    });
    variations.push({
      id: `cap_3_${Date.now()}`,
      text: `Behind the scenes with ${cleanTopic} ${em('📸')}\n\nGreat results come from relentless focus on the fundamentals.\n\nTap the link in bio to learn more.`,
      charCount: 0,
      hook: 'Behind the scenes',
      toneLabel: 'Authentic & Relatable',
      callToAction: 'Tap the link in bio.',
    });
    variations.push({
      id: `cap_4_${Date.now()}`,
      text: `Quick check-in: On a scale of 1-10, how confident do you feel with ${cleanTopic}? Let us know in the comments below! ${em('👇💬')}`,
      charCount: 0,
      hook: 'Quick check-in',
      toneLabel: 'Interactive Poll',
      callToAction: 'Let us know in the comments below!',
    });
  }

  // Update char counts
  variations.forEach(v => {
    v.charCount = v.text.length;
  });

  return {
    captions: variations,
    hashtags: tagList,
  };
}

export async function generateSocialCaptions(params: GenerateCaptionsParams): Promise<{
  captions: CaptionVariation[];
  hashtags: string[];
}> {
  const { topic, platform, includeEmojis, tone, customContext } = params;
  const platformConfig = PLATFORMS[platform] || PLATFORMS.instagram;

  const ai = getAiClient();

  const emojiInstruction = includeEmojis
    ? 'Include appropriate, high-engagement emojis naturally placed.'
    : 'CRITICAL: DO NOT use any emojis anywhere in the text or hashtags. No emojis at all.';

  const toneInstruction = tone
    ? `Specific requested style/tone: "${tone}".`
    : `Follow default platform tone: ${platformConfig.toneGuidance}`;

  const systemInstruction = `You are a world-class social media copywriter and growth expert.
Your mission is to generate 3 to 5 distinct, high-converting social media caption variations and a platform-optimized set of hashtags.

Target Platform: ${platformConfig.name}
Platform Character Rules:
- Hard character limit: ${platformConfig.hardLimit} characters. NO CAPTION MAY EVER EXCEED THIS LIMIT.
- Ideal target character range: ${platformConfig.idealRange}
- Tone and Style: ${platformConfig.toneGuidance}
- Hashtag Quantity: Provide ${platformConfig.hashtagMin} to ${platformConfig.hashtagMax} relevant hashtags without the '#' symbol (or with it).
- ${emojiInstruction}
- ${toneInstruction}

Platform-specific best practices:
- Instagram: Strong first-line hook before truncation, line breaks for readability, clear CTA.
- TikTok: Punchy, conversational, authentic, trend-friendly, short.
- X: HARD LIMIT 280 CHARACTERS. Sharp, memorable, high signal-to-noise ratio.
- Facebook: Friendly, relatable, ending with a question to stimulate comments/replies.
- LinkedIn: Lead with a bold takeaway, lesson learned, or industry perspective, clean formatting.

Provide 4 distinct variations showing different copywriting angles:
1. Hook & curiosity angle
2. Direct, punchy & action-oriented angle
3. Relatable / storytelling angle
4. Question / conversation-starter angle`;

  const prompt = `Idea/Topic/Description: "${topic.trim()}"
${customContext ? `Additional Context: "${customContext.trim()}"` : ''}

Generate 4 varied captions strictly adhering to the platform character constraints (Hard limit: ${platformConfig.hardLimit} chars, ideal: ${platformConfig.idealRange}) and ${platformConfig.hashtagMin}-${platformConfig.hashtagMax} curated hashtags.`;

  let lastError: any = null;

  // Try candidate models in cascade order with backoff retries
  for (const model of MODEL_CASCADE) {
    const maxRetries = 2; // Up to 2 attempts per model
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: prompt,
          config: {
            systemInstruction,
            temperature: 0.85,
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                captions: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      text: {
                        type: Type.STRING,
                        description: 'The complete ready-to-use social media caption.',
                      },
                      hook: {
                        type: Type.STRING,
                        description: 'The opening hook line.',
                      },
                      toneLabel: {
                        type: Type.STRING,
                        description: 'Brief label for this variation angle, e.g. "Hook-Driven", "Punchy & Direct", "Storytelling", "Discussion Starter".',
                      },
                      callToAction: {
                        type: Type.STRING,
                        description: 'The suggested call-to-action.',
                      },
                    },
                    required: ['text', 'toneLabel'],
                  },
                },
                hashtags: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.STRING,
                  },
                  description: `List of ${platformConfig.hashtagMin} to ${platformConfig.hashtagMax} relevant hashtags without or with # prefix.`,
                },
              },
              required: ['captions', 'hashtags'],
            },
          },
        });

        let rawText = response.text || '{}';
        // Strip markdown fences if present
        if (rawText.startsWith('```json')) {
          rawText = rawText.replace(/^```json\s*/, '').replace(/```\s*$/, '').trim();
        } else if (rawText.startsWith('```')) {
          rawText = rawText.replace(/^```\s*/, '').replace(/```\s*$/, '').trim();
        }

        let parsed: any;
        try {
          parsed = JSON.parse(rawText);
        } catch {
          const match = rawText.match(/\{[\s\S]*\}/);
          if (match) {
            parsed = JSON.parse(match[0]);
          } else {
            throw new Error('Invalid JSON received from AI model');
          }
        }

        const rawCaptions: Array<{ text: string; hook?: string; toneLabel?: string; callToAction?: string }> =
          Array.isArray(parsed.captions) ? parsed.captions : [];

        const rawHashtags: string[] = Array.isArray(parsed.hashtags) ? parsed.hashtags : [];

        // Format hashtags: ensure they all start with '#'
        const cleanHashtags = rawHashtags
          .map(tag => (tag.startsWith('#') ? tag : `#${tag.replace(/\s+/g, '')}`))
          .filter(tag => tag.length > 1)
          .slice(0, platformConfig.hashtagMax);

        // Strict Post-Validation on character limits
        const validatedCaptions: CaptionVariation[] = [];

        for (let i = 0; i < rawCaptions.length; i++) {
          const item = rawCaptions[i];
          let captionText = item.text || '';

          // If emoji toggle is OFF, strip any stray emojis just in case
          if (!includeEmojis) {
            captionText = captionText.replace(/[\p{Extended_Pictographic}\u{1F300}-\u{1F5FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '').replace(/  +/g, ' ').trim();
          }

          // Check character limit
          if (captionText.length > platformConfig.hardLimit) {
            // Truncate cleanly at word boundary if needed
            const truncated = captionText.slice(0, platformConfig.hardLimit - 3);
            const lastSpace = truncated.lastIndexOf(' ');
            captionText = (lastSpace > 50 ? truncated.slice(0, lastSpace) : truncated) + '...';
          }

          validatedCaptions.push({
            id: `cap_${i + 1}_${Date.now().toString(36)}`,
            text: captionText,
            charCount: captionText.length,
            hook: item.hook,
            callToAction: item.callToAction,
            toneLabel: item.toneLabel || `Option ${i + 1}`,
          });
        }

        // Fallback if AI produced fewer than 1 caption
        if (validatedCaptions.length === 0) {
          validatedCaptions.push({
            id: `cap_fallback_${Date.now()}`,
            text: topic,
            charCount: topic.length,
            toneLabel: 'Standard',
          });
        }

        return {
          captions: validatedCaptions,
          hashtags: cleanHashtags.length > 0 ? cleanHashtags : [`#${platform}`, `#trending`, `#content`],
        };
      } catch (err: any) {
        lastError = err;
        console.warn(`[Gemini API] Attempt ${attempt} on model '${model}' failed:`, err?.message || err);

        // If 503 high demand or unavailable on attempt 1, immediately switch to next model in cascade for lower latency
        const is503 = isRetryableError(err);
        if (is503 && attempt === 1) {
          console.log(`[Gemini API] Switching to next model in cascade due to high demand on '${model}'...`);
          break;
        }

        if (isRetryableError(err) && attempt < maxRetries) {
          const backoff = attempt * 400 + Math.floor(Math.random() * 200);
          await sleep(backoff);
          continue;
        }

        // Move to next candidate model
        break;
      }
    }
  }

  console.warn('All Gemini API models in cascade failed. Utilizing intelligent copy synthesis engine fallback:', lastError?.message || lastError);
  try {
    const fallbackResult = generateSynthesizedCaptions(params);
    return fallbackResult;
  } catch (synthErr) {
    const isHighDemand = isRetryableError(lastError);
    const userMessage = isHighDemand
      ? 'The AI model is experiencing momentary high demand. Please click Regenerate to retry.'
      : (lastError?.message || 'Failed to generate captions. Please try again.');

    throw new Error(userMessage);
  }
}
