import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import { 
  extractPageContent, 
  getAllForms, 
  fillFormField, 
  submitNearestForm,
  clickButtonByText,
  readPageContent,
  getFormSummary,
  getCurrentFormValues,
  readTableData
} from '../utils/voiceUtils';

interface VoiceAssistantProps {
  onCommand: (command: string) => void;
  onNavigate: (path: string) => void;
}

// Enhanced command mapping with multiple synonyms
const COMMANDS = {
  // Navigation
  'dashboard|home': '/',
  'mr|medical representative|mr management': '/mrs',
  'product|portfolio': '/products',
  'healthcare|directory|doctor|hospital': '/directory',
  'sale|sales': '/sales',
  'expense|cost': '/expenses',
  'schedule|visit': '/schedule',
  'lead': '/leads',
  'performance': '/performance',
  'data management': '/data-management',
  
  // Reading/Querying
  'read page|read current|what is on screen|read all|tell me about': 'read-page',
  'read form|show form|what forms': 'read-form',
  'read table|read data|table data': 'read-table',
  'read all data|show all content|all metrics': 'read-detailed',
  'what is the current|current metrics|current values': 'read-metrics',
  
  // Form operations
  'fill form|fill fields|enter data': 'prepare-form',
  'submit|send|confirm': 'submit-form',
  'clear|reset': 'clear-form',
  
  // Actions
  'search|find|look': 'search',
  'close search|close': 'close-search',
  'click|button': 'handle-click',
  'help|command': 'help',
};

// Action prefixes that indicate intent
const ACTION_PREFIXES = [
  'show me', 'show', 'take me to', 'take me', 'go to', 'go', 'open',
  'navigate to', 'navigate', 'display', 'bring up', 'pull up',
  'get me', 'get to', 'access', 'view', 'check',
];

// Extract main intent/noun from sentence
function extractIntent(sentence: string): string {
  const lower = sentence.toLowerCase().trim();
  
  // Remove common action prefixes and get the remaining text
  for (const prefix of ACTION_PREFIXES) {
    if (lower.startsWith(prefix)) {
      const remaining = lower.slice(prefix.length).trim();
      return remaining.split(/\s+(for|on|today|tomorrow|this|that|at|in|and|or)\s+/)[0].trim();
    }
  }
  
  return lower;
}

// Find matching command for extracted intent
function findCommand(intent: string): string | null {
  const words = intent.split(/\s+/);
  
  // Check multi-word matches first (more specific)
  for (let i = words.length; i > 0; i--) {
    const phrase = words.slice(0, i).join(' ').trim();
    
    for (const [patterns, command] of Object.entries(COMMANDS)) {
      const patternList = patterns.split('|');
      if (patternList.some(p => phrase.includes(p) || p.includes(phrase))) {
        return command;
      }
    }
  }
  
  return null;
}

export default function VoiceAssistant({ onCommand, onNavigate }: VoiceAssistantProps) {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [feedback, setFeedback] = useState('Click mic to start speaking');
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setFeedback('❌ Speech recognition not supported in this browser');
      return;
    }

    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = false;
    recognitionRef.current.interimResults = true;

    recognitionRef.current.onstart = () => {
      setIsListening(true);
      setFeedback('🎤 Listening... speak now');
      console.log('[Voice] Recognition started');
    };

    recognitionRef.current.onresult = (event: any) => {
      let interim = '';
      let final = '';
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final += transcript + ' ';
        } else {
          interim += transcript;
        }
      }

      const current = (final || interim).trim().toLowerCase();
      setTranscript(current);

      if (final) {
        processCommand(final.trim().toLowerCase());
      }
    };

    recognitionRef.current.onerror = (event: any) => {
      console.error('[Voice] Error:', event.error);
      setFeedback(`⚠️ Error: ${event.error}`);
      setIsListening(false);
    };

    recognitionRef.current.onend = () => {
      setIsListening(false);
      console.log('[Voice] Recognition ended');
    };

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  const processCommand = (command: string) => {
    console.log('[Voice] Processing command:', command);
    
    // Handle help command first
    if (command.includes('help')) {
      const helpText = 'You can navigate to Dashboard, Sales, Expenses, Healthcare Directory, or other pages. ' +
        'Search current page by saying "Search for AIG Hospital". ' +
        'Search entire app by saying "Global search for doctor" or "Search everywhere for Apollo". ' +
        'Read the current page by saying "Read page". ' +
        'Fill forms by saying "Fill name field with John". ' +
        'Submit by saying "Submit". ' +
        'Click buttons by saying "Click Save".';
      speak(helpText);
      setFeedback('📋 Help: Navigation, global search, page search, forms available');
      return;
    }

    // Handle compound commands like "in the healthcare directory, search for apollo"
    // Check for search within a location first
    const compoundSearchMatch = command.match(/(?:in|at|on)\s+(?:the\s+)?(healthcare|directory|doctor|hospital|sales|expense|product)\s+(?:directory\s+)?,?(?:\s+)?(?:search\s+(?:for\s+)?|find\s+)(.+?)(?:\.|$)/i);
    if (compoundSearchMatch) {
      const location = compoundSearchMatch[1].toLowerCase();
      const searchTerm = compoundSearchMatch[2].trim();
      console.log('[Voice] Compound command detected - Location:', location, 'Search:', searchTerm);
      
      // Navigate first
      let path = '/directory';
      if (location.includes('sale')) path = '/sales';
      else if (location.includes('expense')) path = '/expenses';
      else if (location.includes('product')) path = '/products';
      
      onNavigate(path);
      speak(`Going to ${location} directory and searching for ${searchTerm}`);
      setFeedback(`🔍 Going to ${location}, searching: "${searchTerm}"`);
      
      // Wait for navigation then search
      setTimeout(() => {
        const searchInput = document.querySelector('#healthcare-search-input, input[type="search"], input[data-search-input], input[placeholder*="search" i]') as HTMLInputElement;
        if (searchInput) {
          const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
          if (nativeInputValueSetter) {
            nativeInputValueSetter.call(searchInput, searchTerm);
          } else {
            searchInput.value = searchTerm;
          }
          searchInput.dispatchEvent(new Event('input', { bubbles: true }));
          searchInput.dispatchEvent(new Event('change', { bubbles: true }));
          searchInput.focus();
        }
      }, 800);
      return;
    }

    // Check for form/data operations first (higher priority)
    if (command.includes('read') || (command.includes('tell me') || command.includes('show me')) && (command.includes('form') || command.includes('data') || command.includes('page') || command.includes('table') || command.includes('metric'))) {
      handleReadCommand(command);
      return;
    }

    if (command.includes('fill') || command.includes('set') || command.includes('enter')) {
      handleFormCommand(command);
      return;
    }

    if (command.includes('submit') || command.includes('send') || command.includes('confirm')) {
      const success = submitNearestForm();
      if (success) {
        speak('Form submitted successfully');
        setFeedback('✓ Form submitted');
      } else {
        speak('No form found to submit');
        setFeedback('❌ No form to submit');
      }
      return;
    }

    if (command.includes('click') || command.includes('button')) {
      const clickMatch = command.match(/click\s+(.+?)(?:\.|$)/i) || command.match(/button\s+(.+?)(?:\.|$)/i);
      if (clickMatch) {
        const buttonName = clickMatch[1].trim();
        const success = clickButtonByText(buttonName);
        if (success) {
          speak(`Clicked ${buttonName}`);
          setFeedback(`✓ Clicked: ${buttonName}`);
        } else {
          speak(`Could not find button ${buttonName}`);
          setFeedback(`❌ Button not found: ${buttonName}`);
        }
      }
      return;
    }

    // Handle global search commands - "search everywhere", "global search", "find in app"
    const globalSearchMatch = command.match(/(?:global\s+search|search\s+(?:everywhere|all|app|application)|find\s+(?:everywhere|all|in\s+app))\s+(?:for\s+)?(.+?)(?:\.|$)/i);
    if (globalSearchMatch) {
      const searchTerm = globalSearchMatch[1].trim();
      console.log('[Voice] Global search command detected:', searchTerm);
      
      onCommand('open-search');
      speak(`Searching everywhere for ${searchTerm}`);
      setFeedback(`🔍 Global search: "${searchTerm}"`);
      
      // Wait for modal to open then fill search
      setTimeout(() => {
        const globalSearchInput = document.querySelector('input[placeholder*="Search everything"], input[type="search"]') as HTMLInputElement;
        if (globalSearchInput) {
          const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
          if (nativeInputValueSetter) {
            nativeInputValueSetter.call(globalSearchInput, searchTerm);
          } else {
            globalSearchInput.value = searchTerm;
          }
          globalSearchInput.dispatchEvent(new Event('input', { bubbles: true }));
          globalSearchInput.focus();
        }
      }, 400);
      return;
    }

    // Handle search commands: "search for [term]" or "find [term]"
    const searchMatch = command.match(/(?:search\s+(?:for\s+)?|find\s+)(.+?)(?:\s+(?:in|on|at)\s+.*)?(?:\.|$)/i);
    if (searchMatch) {
      const searchTerm = searchMatch[1].trim();
      console.log('[Voice] Search command detected:', searchTerm);
      
      // Try to find and fill search input - look for specific healthcare search first
      const searchInput = document.querySelector('#healthcare-search-input, input[type="search"], input[data-search-input], input[placeholder*="search" i]') as HTMLInputElement;
      
      if (searchInput) {
        // Set value and trigger React onChange
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
        if (nativeInputValueSetter) {
          nativeInputValueSetter.call(searchInput, searchTerm);
        } else {
          searchInput.value = searchTerm;
        }
        
        // Dispatch events to trigger React state update
        searchInput.dispatchEvent(new Event('input', { bubbles: true }));
        searchInput.dispatchEvent(new Event('change', { bubbles: true }));
        
        // Focus the input
        searchInput.focus();
        
        speak(`Searching for ${searchTerm}`);
        setFeedback(`🔍 Searching: "${searchTerm}"`);
      } else {
        // Fallback: try to use the global search
        onCommand('open-search');
        setTimeout(() => {
          const globalSearchInput = document.querySelector('input[placeholder*="Search everything"], input[type="search"]') as HTMLInputElement;
          if (globalSearchInput) {
            const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
            if (nativeInputValueSetter) {
              nativeInputValueSetter.call(globalSearchInput, searchTerm);
            } else {
              globalSearchInput.value = searchTerm;
            }
            globalSearchInput.dispatchEvent(new Event('input', { bubbles: true }));
            globalSearchInput.focus();
          }
        }, 400);
        speak(`Opening search for ${searchTerm}`);
        setFeedback(`🔍 Global search: "${searchTerm}"`);
      }
      return;
    }

    if (command.includes('clear') || command.includes('reset')) {
      const forms = getAllForms();
      if (forms.length > 0) {
        forms.forEach(form => {
          form.fields.forEach(field => {
            fillFormField(field.name, '');
          });
        });
        speak('Form cleared');
        setFeedback('✓ Form cleared');
      } else {
        speak('No form found');
        setFeedback('❌ No form to clear');
      }
      return;
    }

    // Extract the actual intent from the full sentence
    const intent = extractIntent(command);
    console.log('[Voice] Extracted intent:', intent);

    // Find matching command for navigation
    const matchedCommand = findCommand(intent);
    
    if (matchedCommand) {
      console.log('[Voice] Matched command:', matchedCommand);
      
      if (matchedCommand === 'search') {
        onCommand('open-search');
        speak('Opening search');
        setFeedback('🔍 Search opened');
      } else if (matchedCommand === 'close-search') {
        onCommand('close-search');
        speak('Closing search');
        setFeedback('✓ Search closed');
      } else {
        // Navigation command
        const pageName = matchedCommand === '/' ? 'Dashboard' : matchedCommand.replace(/\//g, '').replace(/-/g, ' ');
        onNavigate(matchedCommand);
        speak(`Navigating to ${pageName}`);
        setFeedback(`✓ Going to ${pageName}`);
      }
    } else {
      // Command not recognized - provide helpful feedback
      console.log('[Voice] No matching command found');
      speak(`I didn't recognize that command. Try "Read page", "Go to sales", or "Fill name with John"`);
      setFeedback(`❌ Didn't understand: "${command}"`);
    }
  };

  const handleReadCommand = (command: string) => {
    console.log('[Voice] Reading command:', command);
    
    if (command.includes('form')) {
      const formSummary = getFormSummary();
      const values = getCurrentFormValues();
      const valuesText = Object.entries(values)
        .map(([k, v]) => `${k}: ${v}`)
        .join('. ');
      const fullText = `${formSummary}. Current values: ${valuesText}`;
      speak(fullText);
      setFeedback(`📋 Forms: ${formSummary}`);
    } else if (command.includes('table') || command.includes('data')) {
      const tableData = readTableData(0);
      speak(tableData);
      setFeedback(`📊 ${tableData}`);
    } else if (command.includes('metric') || command.includes('stat')) {
      const metrics = readPageContent('metrics');
      speak(metrics || 'No metrics available on this page');
      setFeedback(`📈 ${metrics}`);
    } else {
      // Default: read page summary
      const pageContent = readPageContent('summary');
      speak(pageContent);
      setFeedback(`📄 ${pageContent.substring(0, 100)}...`);
    }
  };

  const handleFormCommand = (command: string) => {
    console.log('[Voice] Form command:', command);
    
    // Parse form field and value: "fill [field] with [value]"
    const withMatch = command.match(/fill\s+(.+?)\s+with\s+(.+?)(?:\.|$)/i) ||
                      command.match(/set\s+(.+?)\s+to\s+(.+?)(?:\.|$)/i) ||
                      command.match(/enter\s+(.+?)\s+in\s+(.+?)(?:\.|$)/i) ||
                      command.match(/add\s+(.+?)\s+(?:as\s+)?(.+?)(?:\.|$)/i);
    
    if (withMatch) {
      let fieldName = withMatch[1].trim();
      let value = withMatch[2].trim();
      
      // Swap if order is reversed ("enter in [field] [value]")
      if (command.includes('enter') && command.includes('in')) {
        [fieldName, value] = [value, fieldName];
      }
      
      console.log(`[Voice] Attempting to fill "${fieldName}" with "${value}"`);
      
      // Get all forms for context
      const forms = getAllForms();
      console.log(`[Voice] Found ${forms.length} form(s) on page`);
      
      if (forms.length === 0) {
        speak('No form found on this page');
        setFeedback('❌ No form to fill');
        return;
      }
      
      // Try to fill the field
      let success = fillFormField(fieldName, value);
      
      if (success) {
        speak(`Successfully set ${fieldName} to ${value}`);
        setFeedback(`✓ Set ${fieldName} = ${value}`);
        
        // Update displayed form values
        setTimeout(() => {
          const updatedValues = getCurrentFormValues();
          console.log('[Voice] Updated form values:', updatedValues);
        }, 100);
        
        return;
      }
      
      // If direct fill failed, try fuzzy matching
      console.log('[Voice] Direct fill failed, trying fuzzy match...');
      let foundField = false;
      
      for (const form of forms) {
        for (const field of form.fields) {
          const fieldLower = field.label.toLowerCase();
          const nameLower = fieldName.toLowerCase();
          
          // Fuzzy matching logic
          if (fieldLower.includes(nameLower) || nameLower.includes(fieldLower.split(' ')[0])) {
            console.log(`[Voice] Fuzzy matched: "${field.label}" for "${fieldName}"`);
            const fillSuccess = fillFormField(field.name, value);
            
            if (fillSuccess) {
              speak(`Set ${field.label} to ${value}`);
              setFeedback(`✓ Set ${field.label} = ${value}`);
              foundField = true;
              break;
            }
          }
        }
        if (foundField) break;
      }
      
      if (!foundField) {
        // Show what fields are available
        const availableFields = forms
          .flatMap(f => f.fields.map(fld => fld.label))
          .slice(0, 5)
          .join(', ');
        
        const message = `Could not find field "${fieldName}". Available fields: ${availableFields}`;
        speak(message);
        setFeedback(`❌ Field "${fieldName}" not found. Try: ${availableFields}`);
      }
    } else {
      speak('Please specify field and value. Say "fill amount with 5000"');
      setFeedback('❓ Usage: "fill [field] with [value]"');
    }
  };

  const speak = (text: string) => {
    if (!voiceEnabled || !('speechSynthesis' in window)) {
      return;
    }

    window.speechSynthesis.cancel();
    
    synthRef.current = new SpeechSynthesisUtterance(text);
    synthRef.current.rate = 1;
    synthRef.current.pitch = 1;
    synthRef.current.volume = 0.7;
    
    synthRef.current.onstart = () => setIsSpeaking(true);
    synthRef.current.onend = () => setIsSpeaking(false);

    window.speechSynthesis.speak(synthRef.current);
  };

  const startListening = () => {
    if (recognitionRef.current) {
      setTranscript('');
      recognitionRef.current.start();
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      zIndex: 1000,
      fontFamily: 'Arial, sans-serif',
    }}>
      {/* Voice Panel */}
      <div style={{
        backgroundColor: isListening ? '#1e40af' : isSpeaking ? '#7c3aed' : '#374151',
        borderRadius: '12px',
        padding: '16px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        color: 'white',
        minWidth: '280px',
        marginBottom: '12px',
        animation: isListening ? 'pulse 1s infinite' : 'none',
      }}>
        <style>{`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.7; }
          }
        `}</style>

        <div style={{ marginBottom: '12px' }}>
          <div style={{ fontSize: '12px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {isListening ? '🎤 Listening...' : isSpeaking ? '🔊 Speaking...' : '🎙️ Voice Assistant'}
          </div>
          <div style={{ fontSize: '13px', marginTop: '4px' }}>
            {transcript || feedback}
          </div>
        </div>

        {/* Control Buttons */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            onClick={isListening ? stopListening : startListening}
            style={{
              flex: 1,
              padding: '8px 12px',
              backgroundColor: isListening ? '#ef4444' : '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.opacity = '0.9';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.opacity = '1';
            }}
          >
            {isListening ? (
              <>
                <MicOff size={14} /> Stop
              </>
            ) : (
              <>
                <Mic size={14} /> Start
              </>
            )}
          </button>

          <button
            onClick={() => setVoiceEnabled(!voiceEnabled)}
            style={{
              padding: '8px 12px',
              backgroundColor: voiceEnabled ? '#10b981' : '#6b7280',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
            }}
            title={voiceEnabled ? 'Voice feedback on' : 'Voice feedback off'}
          >
            {voiceEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
          </button>
        </div>

        {/* Help Tips */}
        <div style={{ fontSize: '11px', marginTop: '12px', color: '#d1d5db', lineHeight: '1.4' }}>
          <div style={{ fontWeight: '600', marginBottom: '4px' }}>Try saying:</div>
          <div>• "Show me the dashboard" • "Read page"</div>
          <div>• "Fill name with John" • "Submit"</div>
          <div>• "Click save button" • "Read forms"</div>
          <div>• "Read table data" • "Show metrics"</div>
        </div>
      </div>

      {/* Floating Mic Button */}
      <button
        onClick={startListening}
        disabled={isListening || isSpeaking}
        style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          backgroundColor: isListening ? '#ef4444' : '#3b82f6',
          color: 'white',
          border: 'none',
          cursor: isListening ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          fontSize: '24px',
          opacity: isListening || isSpeaking ? 0.7 : 1,
          transition: 'all 0.2s',
        }}
        title="Click to start voice input"
      >
        🎤
      </button>
    </div>
  );
}
