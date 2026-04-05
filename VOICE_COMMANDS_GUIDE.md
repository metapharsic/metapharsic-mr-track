# 🎤 Voice Command Guide - Metapharsic App

## Features

Your app now has **full voice control** with the following capabilities:

### Voice Recognition
- Click the **microphone button** in the bottom-right corner to start listening
- The system will recognize your spoken commands and show real-time transcription
- Automatic feedback with visual indicators (blue = listening, red = stopping, purple = speaking)

### Voice Feedback
- Toggle **voice response** with the speaker button (green = enabled, gray = disabled)
- The AI will speak acknowledgments for your commands
- Customizable voice speed and pitch

## Available Voice Commands

### Navigation Commands
```
"Dashboard" / "Home" / "Go home"
   → Takes you to the main dashboard

"Sales" / "Sales Tracking"
   → Navigate to Sales Tracking page

"Expenses" / "Expense" / "Cost"
   → Navigate to Expense Manager

"Visit Schedule" / "Schedule" / "Visits"
   → Navigate to Visit Schedule page

"MR Management" / "Medical Representatives" / "MR"
   → Navigate to MR Management

"Products" / "Portfolio" / "Product"
   → Navigate to Product Portfolio

"Healthcare" / "Directory" / "Doctors" / "Hospitals"
   → Navigate to Healthcare Directory

"Leads" / "Lead Management"
   → Navigate to Leads Management

"Performance" / "Dashboard Performance"
   → Navigate to MR Performance Dashboard

"Data Management"
   → Navigate to Data Management page
```

### Action Commands
```
"Search" / "Find" / "Look for"
   → Opens the AI-powered search overlay

"Open Search" / "Close Search"
   → Direct search drawer control
```

### Help
```
"Help" / "Command" / "What can I do"
   → Displays available commands
```

## How to Use

### Step 1: Click the Microphone
```
1. Click the 🎤 floating button in the bottom-right corner
2. The button will highlight in red and show "🎤 Listening..."
3. The panel shows real-time transcription as you speak
```

### Step 2: Speak Your Command
```
• Speak clearly and naturally
• Example: "Take me to the sales page"
• Example: "Search for today's expenses"
• Example: "Show my performance dashboard"
```

### Step 3: Command Processing
```
• System confirms with visual feedback
• Shows the action being performed
• Speaks acknowledgment (if voice feedback is enabled)
• Navigates to the requested page or opens search
```

## Voice Panel Features

### Status Indicators
- 🎤 **Listening**: System is recording your speech
- 🔊 **Speaking**: System is providing voice feedback
- 🎙️ **Ready**: System ready to accept commands

### Control Buttons
- **Start/Stop Button**: Begin or end voice input
- **Speaker Button**: Toggle voice feedback on/off

### Help Tips
Quick reference of common commands displayed in the panel

## Tips for Best Results

1. **Speak Naturally**: You don't need to speak robotically
2. **Pause Between Commands**: Wait for confirmation before speaking again
3. **Clear Audio**: Use in a relatively quiet environment for better recognition
4. **Complete Phrases**: Say "Navigate to sales" rather than just "Sales"
5. **Common Variations**: "Show me sales", "Take me to sales", "Go to sales" all work

## Browser Compatibility

- **Google Chrome**: Full support ✅
- **Mozilla Firefox**: Full support ✅
- **Microsoft Edge**: Full support ✅
- **Safari**: Limited support (iOS Safari may require user prompt)

## Troubleshooting

### Voice Not Working
1. Check browser microphone permissions
2. Ensure microphone is connected and working
3. Refresh the page (Ctrl+R)
4. Try a different browser

### Commands Not Recognized
1. Speak more clearly
2. Try alternative phrasings
3. Check the feedback panel for what was heard
4. Say "Help" to confirm available commands

### No Voice Feedback
1. Click the speaker button to enable voice output
2. Check browser volume settings
3. Ensure speakers are connected
4. Some browsers may require user permission first

## Advanced Features

### Keyboard Integration
- Still works with **Ctrl+K** for search
- Voice commands complement keyboard shortcuts

### Lazy Loading
- All pages load on-demand via voice navigation
- Faster app experience

### Local Processing
- All voice commands processed locally
- No data sent to external voice services (for recognition)
- Privacy-focused design

## Example Usage Scenarios

### Scenario 1: Daily Sales Review
```
1. Say "Dashboard" → Go to home
2. Say "Sales" → Navigate to sales tracking
3. Say "Search" → Open search and ask "How were sales today?"
```

### Scenario 2: Expense Review
```
1. Say "Expenses" → Navigate to expense manager
2. Interact with the UI
3. Say "Search" → Ask "Total expenses for this month?"
```

### Scenario 3: MR Performance Check
```
1. Say "Performance" → Navigate to MR Performance Dashboard
2. Review visualizations
3. Say "Dashboard" → Return to home
```

## Settings

### Voice Settings Available
- **Recognition Language**: Currently set to English (browser-specific)
- **Voice Speed**: Adjustable in component code
- **Voice Pitch**: Customizable
- **Voice Volume**: Set to medium (0.7)

To customize these settings, modify the VoiceAssistant.tsx component.

## Future Enhancements

Possible voice features to add:
- Voice-based search with natural language processing
- Multiple language support
- Custom voice profiles
- Command history and shortcuts
- Advanced query processing ("Sales for March" etc.)
- Integration with data export (voice-triggered downloads)

---

**Start using voice commands now! Click the microphone button and say "Dashboard" to get started.**
