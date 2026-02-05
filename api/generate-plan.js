// Vercel Serverless Function for DeepSeek API
export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const {
      userName,
      mood,
      studySubject,
      studyType,
      focusTopic,
      startTime,
      endTime,
      syllabusContent
    } = req.body;

    // Your DeepSeek API Key (set as environment variable)
    const apiKey = process.env.DEEPSEEK_API_KEY;

    if (!apiKey) {
      console.error('DeepSeek API key not configured');
      return res.status(500).json({ 
        error: 'Server configuration error',
        message: 'API key not configured',
        fallbackPlan: generateFallbackPlan(req.body)
      });
    }

    // Calculate total study time
    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);
    const totalMinutes = (end - start) / (1000 * 60);

    // Mood-based configuration
    const moodConfig = {
      tired: { sessionLength: 25, breakLength: 15, intensity: 'gentle' },
      neutral: { sessionLength: 30, breakLength: 10, intensity: 'balanced' },
      focused: { sessionLength: 45, breakLength: 10, intensity: 'focused' },
      motivated: { sessionLength: 50, breakLength: 5, intensity: 'intense' },
      overwhelmed: { sessionLength: 20, breakLength: 10, intensity: 'relaxed' }
    };

    const config = moodConfig[mood] || moodConfig.neutral;
    const maxSessions = Math.floor(totalMinutes / (config.sessionLength + config.breakLength));
    const totalSessions = Math.min(6, maxSessions);

    // Create the schedule
    const schedule = [];
    let currentTime = new Date(start);

    for (let i = 0; i < totalSessions; i++) {
      const sessionEnd = new Date(currentTime.getTime() + config.sessionLength * 60000);
      const breakEnd = new Date(sessionEnd.getTime() + config.breakLength * 60000);
      
      schedule.push({
        session: i + 1,
        start: formatTime(currentTime),
        end: formatTime(sessionEnd),
        type: 'study',
        duration: config.sessionLength
      });
      
      if (i < totalSessions - 1) {
        schedule.push({
          session: i + 1,
          start: formatTime(sessionEnd),
          end: formatTime(breakEnd),
          type: 'break',
          duration: config.breakLength
        });
      }
      
      currentTime = breakEnd;
    }

    // Prepare prompt for DeepSeek
    const prompt = `You are LumiStudy, an AI study planner with a friendly, encouraging tone. 
Create a personalized study plan for ${userName} who is studying ${studySubject}.

Mood: ${mood}
Study Type: ${studyType}
${focusTopic ? `Focus Topic: ${focusTopic}` : ''}
${syllabusContent ? `Syllabus context: ${syllabusContent.substring(0, 300)}` : ''}

Time Available: ${startTime} to ${endTime} (${totalMinutes} minutes total)
Recommended: ${totalSessions} study sessions of ${config.sessionLength} minutes each, with ${config.breakLength} minute breaks

IMPORTANT: Respond in this EXACT JSON format:
{
  "greeting": "Warm greeting using their name",
  "moodResponse": "1-2 sentences acknowledging their mood",
  "planSummary": "Brief summary of the plan",
  "tips": ["Tip 1", "Tip 2", "Tip 3"],
  "encouragement": "Final encouraging note"
}

Keep it friendly, human, and encouraging. Use 1-2 emojis max.`;

    // Call DeepSeek API
    const deepseekResponse = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat', // or 'deepseek-coder' if coding-related
        messages: [
          {
            role: 'system',
            content: 'You are LumiStudy, a helpful, friendly AI study planner. You create personalized study plans based on user mood, available time, and study goals. Always be encouraging and realistic. Respond in valid JSON format only.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 500,
        response_format: { type: "json_object" }
      })
    });

    const deepseekData = await deepseekResponse.json();
    
    if (!deepseekResponse.ok) {
      console.error('DeepSeek API error:', deepseekData);
      throw new Error(deepseekData.error?.message || 'DeepSeek API error');
    }

    let aiResponse;
    try {
      aiResponse = JSON.parse(deepseekData.choices[0]?.message?.content || '{}');
    } catch (e) {
      console.error('Failed to parse AI response:', e);
      aiResponse = {
        greeting: `Hi ${userName}!`,
        moodResponse: `I see you're feeling ${mood}. Let's create a plan that works for you.`,
        planSummary: `${totalSessions} study sessions of ${config.sessionLength} minutes with ${config.breakLength} minute breaks.`,
        tips: ["Take short breaks to stay fresh", "Stay hydrated while studying"],
        encouragement: "You've got this! 🌟"
      };
    }

    // Return the plan
    res.status(200).json({
      success: true,
      plan: {
        userName,
        mood,
        schedule,
        totalSessions,
        sessionLength: config.sessionLength,
        breakLength: config.breakLength,
        intensity: config.intensity,
        aiResponse
      }
    });

  } catch (error) {
    console.error('Error generating plan:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate study plan',
      message: error.message,
      fallbackPlan: generateFallbackPlan(req.body)
    });
  }
}

function formatTime(date) {
  return date.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit', 
    hour12: true 
  });
}

function generateFallbackPlan(data) {
  const { userName, mood } = data;
  const moodConfig = {
    tired: { sessionLength: 25, breakLength: 15, totalSessions: 3, intensity: 'gentle' },
    neutral: { sessionLength: 30, breakLength: 10, totalSessions: 4, intensity: 'balanced' },
    focused: { sessionLength: 45, breakLength: 10, totalSessions: 5, intensity: 'focused' },
    motivated: { sessionLength: 50, breakLength: 5, totalSessions: 6, intensity: 'intense' },
    overwhelmed: { sessionLength: 20, breakLength: 10, totalSessions: 3, intensity: 'relaxed' }
  };
  
  const config = moodConfig[mood] || moodConfig.neutral;
  
  return {
    userName,
    mood,
    totalSessions: config.totalSessions,
    sessionLength: config.sessionLength,
    breakLength: config.breakLength,
    intensity: config.intensity,
    aiResponse: {
      greeting: `Hi ${userName}!`,
      moodResponse: `I see you're feeling ${mood}. Let's create a plan that works for you.`,
      planSummary: `${config.totalSessions} study sessions of ${config.sessionLength} minutes with ${config.breakLength} minute breaks.`,
      tips: ["Take short breaks to stay fresh", "Stay hydrated while studying", "Review notes after each session"],
      encouragement: "You've got this! Remember: consistency beats perfection. 🌟"
    }
  };
}