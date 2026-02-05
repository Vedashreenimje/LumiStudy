// LumiStudy - AI Pomodoro Study Planner
// Main Application Script
// Only for testing locally
const DEEPSEEK_API_KEY = "sk-3f75f3c5e37a45d8a4339dfc85c05a4c";
// Application State
const appState = {
    currentPage: 'home-page',
    userName: '',
    studySubject: '',
    studyType: 'syllabus',
    syllabusContent: '',
    focusTopic: '',
    startTime: '13:00',
    endTime: '16:00',
    mood: '',
    aiPlan: null,
    timerConfig: null,
    sessionActive: false,
    isPaused: false,
    currentSession: 0,
    totalSessions: 4,
    timeRemaining: 0,
    timerInterval: null
};

// DOM Elements
const pages = {
    'home-page': document.getElementById('home-page'),
    'name-page': document.getElementById('name-page'),
    'study-page': document.getElementById('study-page'),
    'mood-page': document.getElementById('mood-page'),
    'planner-page': document.getElementById('planner-page'),
    'timer-page': document.getElementById('timer-page'),
    'reflection-page': document.getElementById('reflection-page')
};

// Page Dots
const pageDots = [
    document.getElementById('page-dot-1'),
    document.getElementById('page-dot-2'),
    document.getElementById('page-dot-3'),
    document.getElementById('page-dot-4'),
    document.getElementById('page-dot-5'),
    document.getElementById('page-dot-6')
];

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeEventListeners();
    updatePageDots();
    showToast('Welcome to LumiStudy! ✨', '🌱');
});

// Event Listeners Setup
function initializeEventListeners() {
    // Home page
    document.getElementById('begin-btn').addEventListener('click', () => navigateTo('name-page'));
    
    // Name page
    document.getElementById('name-continue-btn').addEventListener('click', handleNameSubmit);
    document.getElementById('user-name').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') handleNameSubmit();
    });
    
    // Study page
    document.getElementById('study-continue-btn').addEventListener('click', () => navigateTo('mood-page'));
    document.querySelectorAll('.option-card').forEach(card => {
        card.addEventListener('click', function() {
            const type = this.getAttribute('data-type');
            setStudyType(type);
        });
    });
    document.getElementById('study-subject').addEventListener('input', function() {
        appState.studySubject = this.value;
    });
    document.getElementById('syllabus-content').addEventListener('input', function() {
        appState.syllabusContent = this.value;
    });
    document.getElementById('focus-topic').addEventListener('input', function() {
        appState.focusTopic = this.value;
    });
    document.getElementById('start-time').addEventListener('change', function() {
        appState.startTime = this.value;
    });
    document.getElementById('end-time').addEventListener('change', function() {
        appState.endTime = this.value;
    });
    
    // Mood page
    document.querySelectorAll('.mood-card').forEach(card => {
        card.addEventListener('click', function() {
            selectMood(this);
        });
    });
    document.getElementById('generate-plan-btn').addEventListener('click', generateAIPlan);
    document.getElementById('back-to-study-btn').addEventListener('click', () => navigateTo('study-page'));
    
    // Planner page
    document.getElementById('start-session-btn').addEventListener('click', startPomodoroSession);
    document.getElementById('back-to-mood-btn').addEventListener('click', () => navigateTo('mood-page'));
    
    // Timer page
    document.getElementById('pause-btn').addEventListener('click', togglePause);
    document.getElementById('end-session-btn').addEventListener('click', endSessionEarly);
    
    // Reflection page
    document.getElementById('save-progress-btn').addEventListener('click', saveProgress);
    document.getElementById('new-session-btn').addEventListener('click', startNewSession);
}

// Navigation Functions
function navigateTo(pageId) {
    // Hide all pages
    Object.values(pages).forEach(page => {
        if (page) page.classList.add('hidden');
    });
    
    // Show target page
    pages[pageId].classList.remove('hidden');
    appState.currentPage = pageId;
    
    // Update page dots
    updatePageDots();
    
    // Special handling for each page
    switch(pageId) {
        case 'planner-page':
            if (!appState.aiPlan) generateAIPlan();
            break;
    }
}

function updatePageDots() {
    const pageOrder = ['home-page', 'name-page', 'study-page', 'mood-page', 'planner-page', 'timer-page', 'reflection-page'];
    const currentIndex = pageOrder.indexOf(appState.currentPage);
    
    pageDots.forEach((dot, index) => {
        if (index === currentIndex) {
            dot.classList.add('active');
        } else {
            dot.classList.remove('active');
        }
    });
}

// Handle Name Submission
function handleNameSubmit() {
    const nameInput = document.getElementById('user-name');
    const name = nameInput.value.trim();
    
    if (name.length < 2) {
        showToast('Please enter a valid name (at least 2 characters)', '⚠️');
        nameInput.focus();
        return;
    }
    
    appState.userName = name;
    showToast(`Hi ${name}! Let's create your study plan.`, '👋');
    navigateTo('study-page');
}

// Study Type Selection
function setStudyType(type) {
    appState.studyType = type;
    
    // Update UI
    document.querySelectorAll('.option-card').forEach(card => {
        card.classList.remove('active');
        if (card.getAttribute('data-type') === type) {
            card.classList.add('active');
        }
    });
    
    // Show appropriate input
    const syllabusInput = document.getElementById('syllabus-input');
    const topicInput = document.getElementById('topic-input');
    
    if (type === 'syllabus') {
        syllabusInput.classList.remove('hidden');
        topicInput.classList.add('hidden');
    } else {
        syllabusInput.classList.add('hidden');
        topicInput.classList.remove('hidden');
    }
}

// Mood Selection
function selectMood(element) {
    const mood = element.getAttribute('data-mood');
    appState.mood = mood;
    
    // Update UI
    document.querySelectorAll('.mood-card').forEach(card => {
        card.classList.remove('selected');
    });
    element.classList.add('selected');
    
    // Enable generate button
    document.getElementById('generate-plan-btn').disabled = false;
}

// AI Plan Generation
async function generateAIPlan() {
    if (!appState.mood) {
        showToast('Please select your mood first', '😊');
        return;
    }
    
    // Show loading state
    const planContent = document.getElementById('ai-plan-content');
    planContent.innerHTML = `
        <div class="text-center py-8">
            <div class="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent mb-4"></div>
            <p class="text-gray-500">Creating your personalized study plan...</p>
            <p class="text-gray-400 text-sm mt-2">Analyzing your ${appState.studyType === 'topic' ? 'topic' : 'syllabus'}...</p>
        </div>
    `;
    
    navigateTo('planner-page');
    
    try {
        // Prepare enhanced prompt with syllabus/topic
        let studyContext = '';
        if (appState.studyType === 'syllabus' && appState.syllabusContent) {
            studyContext = `Syllabus to cover: ${appState.syllabusContent.substring(0, 200)}`;
        } else if (appState.studyType === 'topic' && appState.focusTopic) {
            studyContext = `Focus topic: ${appState.focusTopic}`;
        } else {
            studyContext = `Subject: ${appState.studySubject || 'General study'}`;
        }
        
        // Call our API endpoint with enhanced context
        const response = await fetch('/api/generate-plan', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                userName: appState.userName,
                mood: appState.mood,
                studySubject: appState.studySubject,
                studyType: appState.studyType,
                focusTopic: appState.focusTopic,
                syllabusContent: appState.syllabusContent,
                startTime: appState.startTime,
                endTime: appState.endTime,
                studyContext: studyContext
            })
        });
        
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.message || 'Failed to generate plan');
        }
        
        // Use the AI-generated plan
        displayAIPlan(data.plan);
        
    } catch (error) {
        console.error('Error generating AI plan:', error);
        
        // Fallback to enhanced simulated AI
        showToast('Using enhanced simulated AI plan', '⚡');
        setTimeout(() => {
            createAIPlan(); // Use the updated createAIPlan function
        }, 500);
    }
}

function displayAIPlan(plan) {
    const { userName, mood, schedule, totalSessions, sessionLength, breakLength, intensity, aiResponse } = plan;
    
    // Generate session topics for AI plan too
    const sessionTopics = generateAISessionTopics(totalSessions);
    
    // Store timer configuration with topics
    appState.timerConfig = {
        schedule: schedule || generateSchedule(totalSessions, sessionLength, breakLength, appState.startTime),
        currentSessionIndex: 0,
        totalSessions,
        sessionLength,
        breakLength,
        intensity,
        sessionTopics: sessionTopics
    };
    
    // Generate session topics for AI plan
    function generateAISessionTopics(numSessions) {
        const topics = [];
        
        if (appState.studyType === 'syllabus' && appState.syllabusContent) {
            const syllabusLines = appState.syllabusContent
                .split(/[\n,;]/)
                .filter(line => line.trim().length > 0);
            
            for (let i = 0; i < numSessions; i++) {
                if (syllabusLines.length > 0) {
                    const topicIndex = Math.min(i, syllabusLines.length - 1);
                    topics.push(`Study: ${syllabusLines[topicIndex]}`);
                } else {
                    topics.push(`Syllabus Session ${i + 1}`);
                }
            }
            
        } else if (appState.studyType === 'topic' && appState.focusTopic) {
            for (let i = 0; i < numSessions; i++) {
                topics.push(`${appState.focusTopic} - Part ${i + 1}`);
            }
        } else {
            for (let i = 0; i < numSessions; i++) {
                topics.push(`Study Session ${i + 1}`);
            }
        }
        
        return topics;
    }
    
    // Create the AI plan HTML with topics
    const planContent = document.getElementById('ai-plan-content');
    const scheduleHtml = schedule ? `
        <div class="mb-6">
            <h3 class="font-semibold text-gray-700 mb-3">Your Session Breakdown:</h3>
            <div class="space-y-3">
                ${schedule.filter(item => item.type === 'study').map((session, index) => `
                <div class="flex items-start p-4 bg-white rounded-xl border border-gray-100">
                    <div class="w-10 h-10 flex items-center justify-center rounded-full bg-accent text-white font-bold mr-4">
                        ${index + 1}
                    </div>
                    <div class="flex-1">
                        <div class="font-semibold text-gray-800 mb-1">${sessionTopics[index] || `Session ${index + 1}`}</div>
                        <div class="text-gray-500 text-sm">${session.start} - ${session.end} • ${session.duration} min</div>
                    </div>
                    <div class="px-3 py-1 rounded-full bg-lavender/20 text-gray-700 text-sm font-medium">
                        Study
                    </div>
                </div>
                ${index < totalSessions - 1 ? `
                <div class="flex items-center p-3 ml-14 rounded-lg bg-mint/20">
                    <div class="w-6 h-6 flex items-center justify-center rounded-full bg-mint text-gray-600 mr-3">⏸️</div>
                    <div class="text-gray-600">${breakLength} min break</div>
                </div>
                ` : ''}
                `).join('')}
            </div>
        </div>
    ` : '';
    
    // Tips HTML
    const tipsHtml = aiResponse.tips ? `
        <div class="mb-6">
            <h3 class="font-semibold text-gray-700 mb-2">📚 Study Tips for You:</h3>
            <ul class="space-y-2">
                ${aiResponse.tips.map(tip => `
                <li class="flex items-start">
                    <div class="text-green-500 mr-2 mt-1">✓</div>
                    <span class="text-gray-600">${tip}</span>
                </li>
                `).join('')}
            </ul>
        </div>
    ` : '';
    
    planContent.innerHTML = `
        <div class="mb-6">
            <h2 class="font-display text-2xl font-bold text-gray-800 mb-2">${aiResponse.greeting || `Hi ${userName}!`}</h2>
            <p class="text-gray-600 mb-4">${aiResponse.moodResponse || `Based on your ${mood} mood, I've created a personalized study plan.`}</p>
        </div>
        
        <div class="mb-6 p-4 bg-gradient-to-r from-lavender/20 to-peach/20 rounded-xl">
            <div class="flex items-center mb-2">
                <div class="text-2xl mr-3">🎯</div>
                <h3 class="font-semibold text-gray-700">${
                    appState.studyType === 'topic' && appState.focusTopic 
                        ? `Focusing on: ${appState.focusTopic}`
                        : appState.studyType === 'syllabus' 
                            ? 'Following Your Syllabus'
                            : `Studying ${appState.studySubject || 'Your Subject'}`
                }</h3>
            </div>
            <p class="text-gray-600 pl-10">${aiResponse.planSummary || `${totalSessions} focused sessions × ${sessionLength} min each`}</p>
        </div>
        
        ${scheduleHtml}
        
        ${tipsHtml}
        
        <div class="p-4 bg-mint/30 rounded-xl">
            <p class="text-gray-700">${aiResponse.encouragement || "Let's make this study session productive and effective! You've got this! 🌟"}</p>
        </div>
    `;
    
    // Update session info for timer page
    document.getElementById('total-sessions').textContent = totalSessions;
    
    showToast('Your AI study plan is ready!', '✨');
}

// Helper function to generate schedule if not provided by API
function generateSchedule(totalSessions, sessionLength, breakLength, startTimeStr) {
    const schedule = [];
    const startTime = new Date(`2000-01-01T${startTimeStr}`);
    let currentTime = new Date(startTime);
    
    for (let i = 0; i < totalSessions; i++) {
        const sessionEnd = new Date(currentTime.getTime() + sessionLength * 60000);
        const breakEnd = new Date(sessionEnd.getTime() + breakLength * 60000);
        
        schedule.push({
            session: i + 1,
            start: formatTime(currentTime),
            end: formatTime(sessionEnd),
            type: 'study',
            duration: sessionLength
        });
        
        if (i < totalSessions - 1) {
            schedule.push({
                session: i + 1,
                start: formatTime(sessionEnd),
                end: formatTime(breakEnd),
                type: 'break',
                duration: breakLength
            });
        }
        
        currentTime = breakEnd;
    }
    
    return schedule;
}


function createAIPlan() {
    const { userName, mood, studySubject, studyType, focusTopic, startTime, endTime } = appState;
    
    // Calculate total study time in minutes
    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);
    let totalMinutes = (end - start) / (1000 * 60);
    
    // Handle same or invalid times
    if (totalMinutes <= 0) {
        totalMinutes = 180; // Default to 3 hours
        showToast('Time adjusted to 3 hours (end time must be after start time)', '⏰');
    }
    
    // Mood-based configuration
    const moodConfig = {
        tired: { sessionLength: 25, breakLength: 15, totalSessions: 3, intensity: 'gentle' },
        neutral: { sessionLength: 30, breakLength: 10, totalSessions: 4, intensity: 'balanced' },
        focused: { sessionLength: 45, breakLength: 10, totalSessions: 5, intensity: 'focused' },
        motivated: { sessionLength: 50, breakLength: 5, totalSessions: 6, intensity: 'intense' },
        overwhelmed: { sessionLength: 20, breakLength: 10, totalSessions: 3, intensity: 'relaxed' }
    };
    
    const config = moodConfig[mood] || moodConfig.neutral;
    
    // Adjust based on total available time
    const sessionDuration = config.sessionLength + config.breakLength;
    const maxSessions = Math.max(1, Math.floor(totalMinutes / sessionDuration));
    config.totalSessions = Math.min(config.totalSessions, maxSessions);
    
    // Ensure we have at least 1 session
    if (config.totalSessions === 0) {
        config.totalSessions = 1;
    }
    
    // ===== NEW: Generate specific session topics based on syllabus/topic =====
    const sessionTopics = generateSessionTopics(config.totalSessions);
    
    // Calculate exact schedule with specific topics
    const schedule = [];
    let currentTime = new Date(start);
    
    for (let i = 0; i < config.totalSessions; i++) {
        const sessionEnd = new Date(currentTime.getTime() + config.sessionLength * 60000);
        const breakEnd = new Date(sessionEnd.getTime() + config.breakLength * 60000);
        
        schedule.push({
            session: i + 1,
            start: formatTime(currentTime),
            end: formatTime(sessionEnd),
            type: 'study',
            duration: config.sessionLength,
            topic: sessionTopics[i] || `Study Session ${i + 1}` // Add topic to session
        });
        
        if (i < config.totalSessions - 1) {
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
    
    // Store timer configuration WITH topics
    appState.timerConfig = {
        schedule: schedule,
        currentSessionIndex: 0,
        totalSessions: config.totalSessions,
        sessionLength: config.sessionLength,
        breakLength: config.breakLength,
        intensity: config.intensity,
        sessionTopics: sessionTopics
    };
    
    // Generate session topics based on user input
    function generateSessionTopics(numSessions) {
        const topics = [];
        
        if (studyType === 'syllabus' && appState.syllabusContent) {
            // Parse syllabus content into topics
            const syllabusLines = appState.syllabusContent
                .split(/[\n,;]/)
                .filter(line => line.trim().length > 0)
                .map(line => line.trim());
            
            // Distribute syllabus topics across sessions
            for (let i = 0; i < numSessions; i++) {
                if (syllabusLines.length > 0) {
                    const topicIndex = Math.min(i, syllabusLines.length - 1);
                    topics.push(`Study: ${syllabusLines[topicIndex]}`);
                } else {
                    topics.push(`Session ${i + 1}: Syllabus Review`);
                }
            }
            
        } else if (studyType === 'topic' && focusTopic) {
            // Generate subtopics for the main topic
            const subtopics = [
                `Introduction to ${focusTopic}`,
                `Core Concepts of ${focusTopic}`,
                `Advanced ${focusTopic} Principles`,
                `${focusTopic} Applications`,
                `${focusTopic} Practice Problems`,
                `Review & Mastery of ${focusTopic}`
            ];
            
            for (let i = 0; i < numSessions; i++) {
                topics.push(subtopics[i] || `${focusTopic} - Part ${i + 1}`);
            }
            
        } else {
            // Default generic topics
            for (let i = 0; i < numSessions; i++) {
                topics.push(`${studySubject || 'Study'} - Session ${i + 1}`);
            }
        }
        
        return topics;
    }
    
    // Generate study focus message
    let studyFocus = '';
    let specificPlan = '';
    
    if (studyType === 'syllabus' && appState.syllabusContent) {
        studyFocus = `Following your syllabus`;
        specificPlan = `We've broken your syllabus into ${config.totalSessions} focused sessions.`;
    } else if (studyType === 'topic' && focusTopic) {
        studyFocus = `Focusing on: ${focusTopic}`;
        specificPlan = `We've created ${config.totalSessions} sessions to master "${focusTopic}".`;
    } else {
        studyFocus = `Studying ${studySubject || 'your subject'}`;
        specificPlan = `We've prepared ${config.totalSessions} balanced study sessions.`;
    }
    
    // Create the AI plan HTML with SPECIFIC session topics
    const planContent = document.getElementById('ai-plan-content');
    planContent.innerHTML = `
        <div class="mb-6">
            <h2 class="font-display text-2xl font-bold text-gray-800 mb-2">Hi ${userName},</h2>
            <p class="text-gray-600 mb-4">Based on your <span class="font-semibold">${mood}</span> mood, here's a personalized study plan.</p>
        </div>
        
        <div class="mb-6 p-4 bg-gradient-to-r from-lavender/20 to-peach/20 rounded-xl">
            <div class="flex items-center mb-2">
                <div class="text-2xl mr-3">🎯</div>
                <h3 class="font-semibold text-gray-700">${studyFocus}</h3>
            </div>
            <p class="text-gray-600 pl-10">${specificPlan}</p>
            <p class="text-gray-500 text-sm pl-10 mt-1">Time: ${startTime} – ${endTime} (${config.totalSessions} sessions)</p>
        </div>
        
        <div class="mb-6">
            <h3 class="font-semibold text-gray-700 mb-3">Your Session Breakdown:</h3>
            <div class="space-y-3">
                ${schedule.filter(item => item.type === 'study').map((session, index) => `
                <div class="flex items-start p-4 bg-white rounded-xl border border-gray-100 hover:border-lavender transition-colors">
                    <div class="w-10 h-10 flex items-center justify-center rounded-full bg-accent text-white font-bold mr-4 flex-shrink-0">
                        ${index + 1}
                    </div>
                    <div class="flex-1">
                        <div class="font-semibold text-gray-800 mb-1">${sessionTopics[index] || `Session ${index + 1}`}</div>
                        <div class="text-gray-500 text-sm mb-2">${session.start} - ${session.end} • ${session.duration} minutes</div>
                        <div class="text-gray-600 text-sm">
                            ${getSessionDescription(sessionTopics[index], index, config.totalSessions)}
                        </div>
                    </div>
                    <div class="px-3 py-1 rounded-full bg-lavender/20 text-gray-700 text-sm font-medium border border-lavender/30">
                        Focus
                    </div>
                </div>
                ${index < config.totalSessions - 1 ? `
                <div class="flex items-center p-3 ml-14 rounded-lg bg-mint/20">
                    <div class="w-6 h-6 flex items-center justify-center rounded-full bg-mint text-gray-600 mr-3">⏸️</div>
                    <div class="flex-1">
                        <div class="font-medium">${config.breakLength} min break</div>
                        <div class="text-sm text-gray-500">Rest, stretch, hydrate</div>
                    </div>
                </div>
                ` : ''}
                `).join('')}
            </div>
        </div>
        
        <div class="p-4 bg-mint/30 rounded-xl">
            <p class="text-gray-700 italic">"${getMoodMessage(mood)}"</p>
            <p class="mt-2 text-gray-600">We'll keep the pace <span class="font-semibold">${config.intensity}</span>. Remember: small, consistent steps lead to big progress.</p>
        </div>
    `;
    
    // Update session info for timer page
    document.getElementById('total-sessions').textContent = config.totalSessions;
    
    showToast('Your personalized study plan is ready!', '✨');
    
    // Helper function for session descriptions
    function getSessionDescription(topic, index, total) {
        const actions = [
            "Understand key concepts",
            "Practice with examples", 
            "Review and summarize",
            "Apply to problems",
            "Test your knowledge",
            "Master the material"
        ];
        return `${actions[Math.min(index, actions.length - 1)]}. ${index === total - 1 ? 'Final review session!' : 'Stay focused!'}`;
    }
    
    function getMoodMessage(mood) {
        const messages = {
            tired: "You're feeling tired—let's take it gentle with shorter sessions and longer breaks.",
            neutral: "You're in a balanced state—perfect for steady, consistent progress.",
            focused: "Great focus! Let's use this energy for deep, productive sessions.",
            motivated: "High motivation detected! Let's channel this into intensive learning.",
            overwhelmed: "Feeling overwhelmed? We'll break it down into manageable pieces."
        };
        return messages[mood] || "Let's make today productive!";
    }
}

function formatTime(date) {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

// Pomodoro Timer Functions
function startPomodoroSession() {
    if (!appState.timerConfig) {
        showToast('Please generate a study plan first', '📝');
        return;
    }
    
    // FIX: Ensure we have valid session data
    if (!appState.timerConfig.totalSessions || appState.timerConfig.totalSessions <= 0) {
        appState.timerConfig.totalSessions = 4; // Default to 4 sessions
    }
    
    appState.sessionActive = true;
    appState.currentSession = 0;
    appState.timeRemaining = appState.timerConfig.sessionLength * 60;
    appState.totalSessions = appState.timerConfig.totalSessions;
    
    updateTimerDisplay();
    navigateTo('timer-page');
    startTimer();
}

function startTimer() {
    if (appState.timerInterval) clearInterval(appState.timerInterval);
    
    appState.timerInterval = setInterval(() => {
        if (!appState.isPaused && appState.timeRemaining > 0) {
            appState.timeRemaining--;
            updateTimerDisplay();
            
            // Check if session ended
            if (appState.timeRemaining === 0) {
                handleSessionEnd();
            }
        }
    }, 1000);
}

function updateTimerDisplay() {
    const minutes = Math.floor(appState.timeRemaining / 60);
    const seconds = appState.timeRemaining % 60;
    const display = document.getElementById('timer-display');
    display.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    // Update progress ring
    const progressRing = document.getElementById('progress-ring');
    const totalTime = appState.timerConfig ? 
        (appState.timerConfig.schedule[appState.currentSession]?.type === 'study' ? 
         appState.timerConfig.sessionLength * 60 : appState.timerConfig.breakLength * 60) : 
        1500;
    const progress = 283 - (appState.timeRemaining / totalTime) * 283;
    progressRing.style.strokeDashoffset = progress;
    
    // Update session info
    const currentSessionIndex = appState.currentSession; // Current session index (0-based)
    const currentSessionNumber = currentSessionIndex + 1; // Display number (1-based)
    const totalSessions = appState.timerConfig ? Math.max(1, appState.timerConfig.totalSessions) : 4;
    
    // Update ALL session info elements
    document.getElementById('completed-sessions').textContent = Math.max(0, currentSessionIndex);
    document.getElementById('total-sessions').textContent = totalSessions;
    document.getElementById('progress-text').textContent = `${currentSessionNumber}/${totalSessions}`;
    
    // Handle division by zero for progress bar
    const progressWidth = totalSessions > 0 ? (currentSessionNumber / totalSessions) * 100 : 0;
    document.getElementById('progress-bar').style.width = `${progressWidth}%`;
    
    // FIXED: Calculate remaining time correctly
    let totalRemainingSeconds = 0;
    if (appState.timerConfig && totalSessions > 0) {
        // Start with current session remaining time
        totalRemainingSeconds = appState.timeRemaining;
        
        // Add time for REMAINING sessions (not including current)
        const sessionsLeft = totalSessions - currentSessionNumber; // Sessions after current
        
        for (let i = 0; i < sessionsLeft; i++) {
            // Each remaining session has study time
            totalRemainingSeconds += appState.timerConfig.sessionLength * 60;
            
            // Add break time except after the very last session
            if (i < sessionsLeft - 1) {
                totalRemainingSeconds += appState.timerConfig.breakLength * 60;
            }
        }
    }
    
    // Ensure time is never negative
    totalRemainingSeconds = Math.max(0, totalRemainingSeconds);
    
    const remainingHours = Math.floor(totalRemainingSeconds / 3600);
    const remainingMinutes = Math.floor((totalRemainingSeconds % 3600) / 60);
    const remainingSeconds = Math.floor(totalRemainingSeconds % 60);
    
    document.getElementById('time-remaining').textContent = 
        `${remainingHours}:${remainingMinutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    
    // Update session type
    const sessionType = document.getElementById('session-type');
    const sessionMessage = document.getElementById('session-message');
    
    if (appState.timerConfig && appState.timerConfig.schedule[currentSessionIndex]) {
        const current = appState.timerConfig.schedule[currentSessionIndex];
        if (current.type === 'study') {
            sessionType.textContent = 'Focus Time';
            sessionType.className = 'inline-block px-4 py-2 rounded-full bg-lavender text-gray-700 font-medium';
            sessionMessage.textContent = getRandomStudyMessage();
        } else {
            sessionType.textContent = 'Break Time';
            sessionType.className = 'inline-block px-4 py-2 rounded-full bg-mint text-gray-700 font-medium';
            sessionMessage.textContent = getRandomBreakMessage();
        }
    }
}

function getRandomStudyMessage() {
    const messages = [
        "One step at a time. You're doing great!",
        "Stay focused. You've got this!",
        "Deep work mode activated. ✨",
        "Concentrate on the present task.",
        "Your future self will thank you for this."
    ];
    return messages[Math.floor(Math.random() * messages.length)];
}

function getRandomBreakMessage() {
    const messages = [
        "Time to recharge. Stretch and breathe.",
        "Break time! Refresh your mind.",
        "Step away from the screen for a bit.",
        "Hydrate and relax. You deserve it.",
        "Mindful break to boost productivity."
    ];
    return messages[Math.floor(Math.random() * messages.length)];
}

function handleSessionEnd() {
    appState.currentSession++;
    
    if (appState.currentSession >= (appState.timerConfig?.schedule.length || 0)) {
        // All sessions completed
        completeSession();
        return;
    }
    
    // Start next session
    const nextSession = appState.timerConfig.schedule[appState.currentSession];
    appState.timeRemaining = nextSession.duration * 60;
    
    // Show notification
    const sessionType = nextSession.type === 'study' ? 'Study' : 'Break';
    showToast(`${sessionType} session ${nextSession.session} starting now!`, nextSession.type === 'study' ? '📚' : '☕');
    
    updateTimerDisplay();
}

function togglePause() {
    appState.isPaused = !appState.isPaused;
    const pauseBtn = document.getElementById('pause-btn');
    
    if (appState.isPaused) {
        pauseBtn.innerHTML = '<i class="fas fa-play mr-2"></i> Resume';
        showToast('Session paused', '⏸️');
    } else {
        pauseBtn.innerHTML = '<i class="fas fa-pause mr-2"></i> Pause';
        showToast('Session resumed', '▶️');
    }
}

function endSessionEarly() {
    if (confirm('Are you sure you want to end the session early?')) {
        completeSession();
    }
}

function completeSession() {
    clearInterval(appState.timerInterval);
    appState.sessionActive = false;
    appState.isPaused = false;
    
    // Generate reflection
    generateReflection();
    navigateTo('reflection-page');
}

// Reflection Functions
function generateReflection() {
    const { userName, mood, timerConfig } = appState;
    const completed = timerConfig ? Math.max(0, appState.currentSession - 1) : 0;
    const total = timerConfig ? timerConfig.totalSessions : 4;
    const completionRate = Math.round((completed / total) * 100);
    
    // Generate reflection message based on performance
    let reflectionMessage = '';
    let suggestion = '';
    
    if (completionRate >= 90) {
        reflectionMessage = `Outstanding work, ${userName}! You completed ${completed}/${total} sessions. Your consistency is impressive.`;
        suggestion = 'Consider increasing session length by 5 minutes tomorrow to build on this momentum.';
    } else if (completionRate >= 70) {
        reflectionMessage = `Great job, ${userName}! You completed ${completed}/${total} sessions. That's solid progress.`;
        suggestion = 'Try maintaining this rhythm. Consistency is key to building lasting study habits.';
    } else if (completionRate >= 50) {
        reflectionMessage = `Good effort, ${userName}! You completed ${completed}/${total} sessions. Every bit of focused time counts.`;
        suggestion = 'Consider shorter sessions tomorrow if you felt rushed. Quality over quantity.';
    } else {
        reflectionMessage = `You started, and that's what matters, ${userName}. You completed ${completed}/${total} sessions.`;
        suggestion = 'Tomorrow, try a gentler approach with shorter sessions and more breaks. Progress, not perfection.';
    }
    
    const reflectionContent = document.getElementById('reflection-content');
    reflectionContent.innerHTML = `
        <div class="mb-4">
            <h3 class="font-display text-xl font-bold text-gray-800 mb-2">Well done, ${userName}!</h3>
            <p class="text-gray-600 mb-4">${reflectionMessage}</p>
            <p class="text-gray-700 mb-4">You stayed consistent, and that matters more than perfection. If you continue like this, your focus will improve naturally.</p>
        </div>
        
        <div class="p-4 bg-white/50 rounded-lg">
            <h4 class="font-semibold text-gray-700 mb-2">📈 AI Suggestion for Tomorrow:</h4>
            <p class="text-gray-600">${suggestion}</p>
        </div>
        
        <div class="mt-6 pt-4 border-t border-gray-100">
            <div class="flex items-center justify-between">
                <div class="text-center">
                    <div class="text-2xl font-bold text-accent">${completionRate}%</div>
                    <div class="text-sm text-gray-500">Completion</div>
                </div>
                <div class="text-center">
                    <div class="text-2xl font-bold text-accent">${completed}</div>
                    <div class="text-sm text-gray-500">Sessions Done</div>
                </div>
                <div class="text-center">
                    <div class="text-2xl font-bold text-accent">${mood}</div>
                    <div class="text-sm text-gray-500">Your Mood</div>
                </div>
            </div>
        </div>
    `;
}

function saveProgress() {
    showToast('Progress saved successfully!', '💾');
    // In a real app, this would save to localStorage or a backend
}

function startNewSession() {
    // Reset some state
    appState.sessionActive = false;
    appState.isPaused = false;
    appState.currentSession = 0;
    
    // Go back to mood selection
    navigateTo('mood-page');
}

// Utility Functions
function showToast(message, icon = '✨') {
    const toast = document.getElementById('toast');
    const toastIcon = document.getElementById('toast-icon');
    const toastMessage = document.getElementById('toast-message');
    
    toastIcon.textContent = icon;
    toastMessage.textContent = message;
    
    toast.classList.remove('hidden');
    toast.classList.remove('translate-x-full');
    
    // Show toast
    setTimeout(() => {
        toast.classList.remove('translate-x-full');
    }, 10);
    
    // Hide after 3 seconds
    setTimeout(() => {
        toast.classList.add('translate-x-full');
        setTimeout(() => {
            toast.classList.add('hidden');
        }, 300);
    }, 3000);
}

// Initialize the app with default values
setStudyType('syllabus');