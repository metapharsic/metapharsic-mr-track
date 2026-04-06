import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, MicOff } from 'lucide-react';
import {
  extractPageContent,
  getAllForms,
  fillFormField,
  submitNearestForm,
  clickButtonByText,
  readPageContent,
  getFormSummary,
  getCurrentFormValues,
  deleteEntityByName,
  readTableData,
  searchAndNavigate,
} from '../utils/voiceUtils';

export interface VoiceAssistantProps {
  onCommand: (command: string) => void;
  onNavigate: (path: string) => void;
}

// Navigation mapping (English)
const NAV_MAP: Record<string, string> = {
  '(dashboard|home|main)': '/',
  '(mr|medical representative|mr management|mr list)': '/mrs',
  '(product|portfolio|items)': '/products',
  '(healthcare|directory|doctor|hospital|clinic|doctor.*directory)': '/directory',
  '(sale|sales|revenue|orders)': '/sales',
  '(expense|cost|bill|expense.*manager)': '/expenses',
  '(schedule|visit|calendar)': '/schedule',
  '(lead)': '/leads',
  '(mr-dashboard)': '/mr-dashboard',
  '(performance|report|analytics)': '/performance',
  '(data management|data)': '/data-management',
  '(setting)': '/settings',
  '(user|user management)': '/users',
  '(approv)': '/approvals',
  '(credit|entity credit)': '/entity-credits',
};

// Page names for feedback
const PAGE_NAMES: Record<string, string> = {
  '/': 'Dashboard',
  '/mrs': 'MR Management',
  '/products': 'Product Portfolio',
  '/directory': 'Healthcare Directory',
  '/sales': 'Sales Tracking',
  '/expenses': 'Expense Manager',
  '/schedule': 'Visit Schedule',
  '/leads': 'Leads Management',
  '/mr-dashboard': 'MR Dashboard',
  '/performance': 'Performance',
  '/data-management': 'Data Management',
  '/settings': 'Settings',
};

// Hindi page names
const HINDI_PAGE_NAMES: Record<string, string> = {
  '/': 'डैशबोर्ड',
  '/mrs': 'एमआर मैनेजमेंट',
  '/products': 'प्रोडक्ट पोर्टफोलियो',
  '/directory': 'हेल्थकेयर डायरेक्टरी',
  '/sales': 'सेल्स ट्रैकिंग',
  '/expenses': 'एक्सपेंस मैनेजर',
  '/schedule': 'विजिट शेड्यूल',
  '/leads': 'लीड्स मैनेजमेंट',
  '/mr-dashboard': 'एमआर डैशबोर्ड',
  '/performance': 'परफॉर्मेंस',
  '/data-management': 'डेटा मैनेजमेंट',
  '/settings': 'सेटिंग्स',
};

// Hindi navigation commands
const HINDI_NAV_MAP: [RegExp, string][] = [
  [/डैशबोर्ड|होम|मुख्यपृष्ठ|घर|डैश बोर्ड/, '/'],
  [/एमआर|मेडिकल.*रिप्रेजेंटेटिव|mr\s*मैनेजमेंट|mr\s*लिस्ट/, '/mrs'],
  [/प्रोडक्ट|उत्पाद|पोर्टफोलियो|आइटम/, '/products'],
  [/डॉक्टर|डायरेक्टरी|health|healthcare|clinic|क्लिनिक|अस्पताल|hospital/, '/directory'],
  [/सेल्स|बिक्री|राजस्व|revenue|sale/, '/sales'],
  [/खर्च|expense|लागत|cost|बिल/, '/expenses'],
  [/शेड्यूल|विजिट|schedule|calendar/, '/schedule'],
  [/लीड|lead/, '/leads'],
  [/परफॉर्मेंस|performance|रिपोर्ट/, '/performance'],
  [/डेटा|data/, '/data-management'],
  [/सेटिंग|setting/, '/settings'],
  [/mr-डैशबोर्ड|mr\s*डैशबोर्ड/, '/mr-dashboard'],
  [/यूज़र|user|प्रयोक्ता/, '/users'],
  [/अप्रूवल|approval|अनुमोदन/, '/approvals'],
];

// Hindi action detection
function detectHindiAction(text: string): string | null {
  const t = text.toLowerCase().trim();
  // Delete
  if (/हटा|डिलीट|remove|निकाल/.test(t)) return 'delete';
  // Create/Add
  if (/नया|नया.*बनाओ|ऐड|add|जोड़|शामिल|create/.test(t)) return 'create';
  // Update
  if (/अपडेट|बदल|modify|update|बदलाव|संपादन|edit/.test(t)) return 'update';
  // Search/Find
  if (/सर्च|खोज|search|find|ढूंढ|दिखाओ|show|देखो/.test(t)) return 'search';
  // Read
  if (/पढ़|read|बताओ|tell|सुनाओ|क्या/.test(t)) return 'read';
  // Submit
  if (/सबमिट|submit|जमा|send/.test(t)) return 'submit';
  // Fill
  if (/भर|fill|सेट|set|डाल/.test(t)) return 'fill';
  // Click
  if (/क्लिक|click|दबा/.test(t)) return 'click';
  // Navigate
  if (/जाओ|go|navigate|open|खोल|ले चलो|take.*to|ले चल|visit/.test(t)) return 'navigate';
  return null;
}

// Entity type detection (bilingual)
function detectEntityType(text: string): string | null {
  const lower = text.toLowerCase();
  if (/doctor|डॉक्टर|physician|डाक्टर/.test(lower)) return 'doctor';
  if (/pharmacy|फार्मेसी|chemist|medical\s*hall|केमिस्ट/.test(lower)) return 'pharmacy';
  if (/hospital|अस्पताल|हॉस्पिटल|clinic|क्लिनिक|नर्सिंग होम/.test(lower)) return 'hospital';
  if (/\bmr\b|medical\s*representative|प्रतिनिधि|mr\s*repr|medrep/.test(lower)) return 'mr';
  if (/product|प्रोडक्ट|उत्पाद|product|item/.test(lower)) return 'product';
  if (/sale|सेल्स|बिक्री|revenue|order/.test(lower)) return 'sale';
  if (/expense|खर्च|expense|cost|बिल|लागत/.test(lower)) return 'expense';
  if (/lead|लीड/.test(lower)) return 'lead';
  if (/visit|विजिट/.test(lower)) return 'visit';
  return null;
}

// Entity names for speech (bilingual)
const ENTITY_NAMES: Record<string, { en: string; hi: string }> = {
  doctor: { en: 'doctor', hi: 'डॉक्टर' },
  pharmacy: { en: 'pharmacy', hi: 'फार्मेसी' },
  hospital: { en: 'hospital', hi: 'अस्पताल' },
  mr: { en: 'MR', hi: 'एमआर' },
  product: { en: 'product', hi: 'प्रोडक्ट' },
  sale: { en: 'sale', hi: 'सेल्स' },
  expense: { en: 'expense', hi: 'खर्च' },
  lead: { en: 'lead', hi: 'लीड' },
  visit: { en: 'visit', hi: 'विजिट' },
};

// API path mapping for entities
function entityToApiPath(type: string): string {
  const map: Record<string, string> = {
    doctor: 'doctors',
    pharmacy: 'pharmacies',
    hospital: 'hospitals',
    mr: 'mrs',
    product: 'products',
    sale: 'sales',
    expense: 'expenses',
    lead: 'leads',
    visit: 'visits',
  };
  return map[type] || '';
}

// Entity to page route
function entityToRoute(type: string): string {
  const map: Record<string, string> = {
    doctor: '/directory',
    pharmacy: '/directory',
    hospital: '/directory',
    mr: '/mrs',
    product: '/products',
    sale: '/sales',
    expense: '/expenses',
    lead: '/leads',
    visit: '/schedule',
  };
  return map[type] || '/';
}

// Extract name from command after entity keywords
function extractName(text: string, entityType: string): string {
  const lower = text.toLowerCase();
  const keywords = [
    'doctor', 'pharmacy', 'hospital', 'mr', 'medical representative',
    'product', 'sale', 'expense', 'lead', 'visit',
    'doctor named', 'pharmacy named', 'hospital named', 'mr named',
    'डॉक्टर', 'फार्मेसी', 'अस्पताल', 'प्रोडक्ट', 'उत्पाद',
    'named', 'called', 'जिसका नाम', 'नाम', 'है', 'the',
    'delete', 'remove', 'हटा', 'डिलीट', 'create', 'new',
    'add', 'नया', 'ऐड', 'जोड़', 'update', 'बदल',
    'show', 'find', 'search', 'खोज', 'दिखाओ',
    'for', 'का', 'की', 'को', 'में', 'से',
    'how', 'many', 'much', 'total', 'कितने', 'कितनी',
  ];

  let name = lower;
  for (const kw of keywords) {
    const regex = new RegExp(kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    name = name.replace(regex, '');
  }

  return name.replace(/^[\s,:;"'\-]+|[\s,:;"'\-]+$/g, '').replace(/^[,.\-]+|[,.\-]+$/g, '').trim();
}

// Detect Hindi/Devanagari
const isHindi = (text: string): boolean => /[\u0900-\u097F]/.test(text);

export default function VoiceAssistant({ onCommand, onNavigate }: VoiceAssistantProps) {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [feedback, setFeedback] = useState('');
  const [voiceEnabled] = useState(true);
  const [showPanel, setShowPanel] = useState(false);
  const [position, setPosition] = useState(() => {
    const saved = localStorage.getItem('voice-assistant-pos');
    return saved ? JSON.parse(saved) : { x: 16, y: 16 };
  });
  const [isDragging, setIsDragging] = useState(false);
  const dragOffsetRef = useRef({ px: 0, py: 0 });
  const [dragging, setDragging] = useState(false);

  const recognitionRef = useRef<any>(null);
  const feedbackTimeoutRef = useRef<number | null>(null);

  const savePosition = useCallback((pos: { x: number; y: number }) => {
    localStorage.setItem('voice-assistant-pos', JSON.stringify(pos));
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    setIsDragging(true);
    setDragging(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    const currentPos = position;
    dragOffsetRef.current = { px: e.clientX - currentPos.x, py: e.clientY - currentPos.y };
  }, [position]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging) return;
    const x = e.clientX - dragOffsetRef.current.px;
    const y = e.clientY - dragOffsetRef.current.py;
    setPosition({ x, y });
  }, [isDragging]);

  const handlePointerUp = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);
    setTimeout(() => setDragging(false), 150);
  }, [isDragging]);

  const setFeedbackTemp = useCallback((text: string, duration = 3000) => {
    if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
    setFeedback(text);
    feedbackTimeoutRef.current = window.setTimeout(() => setFeedback(''), duration);
  }, []);

  // Bilingual speech
  const speak = useCallback((text: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.volume = 0.7;

    if (isHindi(text)) {
      utterance.lang = 'hi-IN';
      const voices = window.speechSynthesis.getVoices();
      const hiVoice = voices.find(v => v.lang.startsWith('hi'));
      if (hiVoice) utterance.voice = hiVoice;
    } else {
      utterance.lang = 'en-IN';
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  }, []);

  // Unified command parser
  const processCommand = useCallback((command: string) => {
    console.log('[Voice] Command:', command);

    const isHindiInput = isHindi(command);
    const action = detectHindiAction(command);
    const entityType = detectEntityType(command);
    const extractedName = entityType ? extractName(command, entityType) : '';

    // ==== READ COMMANDS ====
    if (
      command.includes('read') || command.includes('पढ़') ||
      (/tell/i.test(command) && /me/i.test(command)) ||
      (/बता/i.test(command)) || (/सुना/i.test(command)) ||
      /what\s+(is|are)/i.test(command) || /क्या\s*है/i.test(command)
    ) {
      if (command.includes('form')) {
        speak(getFormSummary());
        setFeedbackTemp('📋 Forms read');
      } else if (command.includes('table')) {
        speak(readTableData());
        setFeedbackTemp('📊 Table read');
      } else if (command.includes('field') || command.includes('value') || command.includes('क्षेत्र')) {
        const values = getCurrentFormValues();
        const entries = Object.entries(values).slice(0, 5);
        speak(`${entries.length} fields: ${entries.map(([k, v]) => `${k} is ${v}`).join(', ')}`);
        setFeedbackTemp('📋 Field values read');
      } else {
        const content = readPageContent('summary');
        speak(content);
        setFeedbackTemp('📄 Page read');
      }
      return;
    }

    // ==== HELP ====
    if (command.includes('help') || command.includes('मदद') || command.includes('कैसे') || command.includes('क्या कर')) {
      const help = isHindiInput
        ? 'मैं ये कर सकता हूँ: डैशबोर्ड जाओ, डॉक्टर सर्च करो, ABC फार्मेसी हटाओ, फॉर्म भर, सबमिट करो, पेज पढ़ो'
        : 'I can: navigate pages, search entities, delete by name, fill forms, submit, count items, read page. Try: "go to sales", "delete pharmacy ABC", "how many doctors"';
      speak(help);
      setFeedbackTemp('📋 Command help');
      return;
    }

    // ==== DELETE ====
    const isDelete = (
      (action === 'delete' && entityType) ||
      /(delete|remove|hata|डिलीट|हटा|निकाल)\s+(the\s+)?(?:doctor|pharmacy|hospital|mr|डॉक्टर|फार्मेसी|अस्पताल)/i.test(command)
    );

    if (isDelete && entityType && extractedName) {
      const apiPath = entityToApiPath(entityType);
      const hi = ENTITY_NAMES[entityType] || { en: entityType, hi: entityType };
      const enName = hi.en;
      const hiName = hi.hi;

      deleteEntityByName(entityType as any, extractedName).then(result => {
        if (result.success) {
          if (isHindiInput) {
            speak(`${hiName} "${extractedName}" सफलतापूर्वक हटा दिया गया`);
          } else {
            speak(`Successfully deleted ${enName} ${extractedName}`);
          }
          setFeedbackTemp(`🗑️ Deleted ${enName}: ${extractedName}`);
        } else {
          if (isHindiInput) {
            speak(`${hiName} "${extractedName}" नहीं मिला या हटाने में एरर`);
          } else {
            speak(`Could not find or delete ${enName} ${extractedName}`);
          }
          setFeedbackTemp(`❌ ${enName} not found`);
        }
      }).catch(err => {
        console.error('[Voice] Delete error:', err);
        speak(isHindiInput ? 'डिलीट में एरर आया' : 'Error deleting entity');
        setFeedbackTemp('❌ Deletion failed');
      });
      return;
    }

    // ==== NAVIGATION ====
    // English navigation
    const cleanText = command
      .replace(/^(show\s*me|take\s*me\s*to|go\s*to|go|open|navigate\s*to|navigate|visit|bring\s*up|जाओ|ले\s*चलो|नैविगेट|खोल)\s*/i, '')
      .trim();

    for (const [pattern, path] of Object.entries(NAV_MAP)) {
      if (new RegExp(pattern, 'i').test(cleanText)) {
        onNavigate(path);
        const name = isHindiInput ? HINDI_PAGE_NAMES[path] || path : PAGE_NAMES[path] || path;
        speak(isHindiInput ? `${name} जा रहे हैं` : `Going to ${name}`);
        setFeedbackTemp(`→ ${name}`);
        return;
      }
    }

    // Hindi navigation
    if (isHindiInput) {
      for (const [pattern, path] of HINDI_NAV_MAP) {
        if (pattern.test(command)) {
          onNavigate(path);
          const name = HINDI_PAGE_NAMES[path] || path;
          speak(`${name} जा रहे हैं`);
          setFeedbackTemp(`→ ${name}`);
          return;
        }
      }
    }

    // ==== COUNT / "HOW MANY" ====
    if (/how\s*many|कितने|कितनी|total.*count|गिनती|कुल/i.test(command)) {
      if (entityType) {
        const apiPath = entityToApiPath(entityType);
        const hi = ENTITY_NAMES[entityType]!;
        const countPhrase = isHindiInput
          ? `${apiPath} की गिनती बताओ`
          : `total ${entityType} count summary`;

        // Open search and also try AI search
        onCommand('open-search');
        const spokenQuery = isHindiInput
          ? `${apiPath} कितने ${entityType || ''}`
          : `how many ${entityType}`;

        speak(isHindiInput ? `सर्च कर रहा हूँ ${hi.hi} की संख्या` : `Searching for ${hi.en} count`);
        setFeedbackTemp(`🔍 Counting ${hi.en}...`);

        setTimeout(() => {
          const searchInput = document.querySelector(
            'input[placeholder*="Searcheverything"], input[placeholder*="Ask anything"]'
          ) as HTMLInputElement;
          if (searchInput) {
            const setter = Object.getOwnPropertyDescriptor(
              window.HTMLInputElement.prototype,
              'value'
            )?.set;
            if (setter) setter.call(searchInput, spokenQuery);
            else searchInput.value = spokenQuery;
            searchInput.dispatchEvent(new Event('input', { bubbles: true }));
            searchInput.dispatchEvent(new Event('change', { bubbles: true }));
            searchInput.focus();
          }
        }, 500);

        // Also try AI search for the spoken answer
        (async () => {
          try {
            const res = await fetch('/api/ai-search', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ query: `How many ${entityType} are there? Give me a count.` }),
            });
            if (res.ok) {
              const data = await res.json();
              if (data.answer) {
                setTimeout(() => speak(data.answer), 2000);
              }
            }
          } catch { /* silent */ }
        })();

        return;
      }
    }

    // ==== FILL FORM ====
    if (
      action === 'fill' ||
      /fill|set\s+.*\s+to\b|सेट\s+\S+\s+को/i.test(command)
    ) {
      const match = command.match(/(?:fill|set)\s+(.+?)\s+(?:with|to|को|में)\s+(.+?)(?:\.|$)/i) ||
                    command.match(/(?:भर|set)\s+(.+?)\s+(.+?)(?:\.|$)/i);
      if (match && match.length >= 3) {
        const field = match[1].trim();
        const value = match[2].trim();
        const success = fillFormField(field, value);
        if (success) {
          speak(isHindiInput ? `${field} में ${value} भर दिया` : `Set ${field} to ${value}`);
          setFeedbackTemp(`✓ ${field} = ${value}`);
        } else {
          speak(isHindiInput ? `फ़ील्ड ${field} नहीं मिला` : `Could not find field ${field}`);
          setFeedbackTemp(`❌ Field not found`);
        }
        return;
      }
    }

    // ==== SUBMIT ====
    if (action === 'submit' || command.includes('submit') || command.includes('जमा') || command.includes('सबमिट')) {
      const success = submitNearestForm();
      speak(success ? (isHindiInput ? 'फॉर्म सबमिट हो गया' : 'Form submitted') : (isHindiInput ? 'कोई फॉर्म नहीं मिला' : 'No form found to submit'));
      setFeedbackTemp(success ? '✓ Submitted' : '❌ No form');
      return;
    }

    // ==== CLICK ====
    if (action === 'click' || /click\s+/i.test(command) || /क्लिक/i.test(command)) {
      const btnMatch = command.match(/(?:click|क्लिक)\s+(.+?)(?:\.|$)/i);
      if (btnMatch) {
        const btnName = btnMatch[1].trim();
        const success = clickButtonByText(btnName);
        speak(success ? (isHindiInput ? `${btnName} क्लिक किया` : `Clicked ${btnName}`) : (isHindiInput ? `${btnName} नहीं मिला` : `Could not find ${btnName}`));
        setFeedbackTemp(success ? `✓ Clicked ${btnName}` : `❌ Not found`);
      }
      return;
    }

    // ==== CLOSE ====
    if (command.includes('close') || command.includes('dismiss') || command.includes('बंद')) {
      onCommand('close-search');
      speak(isHindiInput ? 'बंद किया' : 'Closed');
      setFeedbackTemp('✓ Closed');
      return;
    }

    // ==== ENTITY-SPECIFIC CREATE/UPDATE (navigate to relevant page) ====
    if ((action === 'create' || action === 'update') && entityType) {
      const route = entityToRoute(entityType);
      if (route) {
        onNavigate(route);
        const hi = ENTITY_NAMES[entityType]!;
        const pageName = isHindiInput ? HINDI_PAGE_NAMES[route] || route : PAGE_NAMES[route] || route;
        if (action === 'create') {
          speak(isHindiInput ? `${hi.hi} पेज जा रहे हैं नया बनाने के लिए` : `Going to ${pageName} to create new ${hi.en}`);
          setFeedbackTemp(`+ Create ${hi.en} → ${pageName}`);
        } else {
          speak(isHindiInput ? `${hi.hi} पेज जा रहे हैं अपडेट करने के लिए` : `Going to ${pageName} to update ${hi.en}`);
          setFeedbackTemp(`✏️ Update ${hi.en} → ${pageName}`);
        }
        return;
      }
    }

    // ==== SEARCH (AI-powered) ====
    const isSearch = (
      action === 'search' ||
      /search|find|show|look|tell\s+me\s+about|kya\s+hai|dikhao|ढूंढ|खोज|सर्च|दिखाओ|बताओ|में/i.test(command)
    );

    if (isSearch && command.length > 2) {
      const searchTerm = cleanText || command;
      onCommand('open-search');
      speak(isHindiInput ? `सर्च कर रहा हूँ` : `Searching for ${searchTerm}`);
      setFeedbackTemp(`🔍 Searching...`);

      setTimeout(() => {
        const searchInput = document.querySelector(
          'input[placeholder*="Searcheverything"], input[placeholder*="Ask anything"]'
        ) as HTMLInputElement;
        if (searchInput) {
          const setter = Object.getOwnPropertyDescriptor(
            window.HTMLInputElement.prototype,
            'value'
          )?.set;
          if (setter) setter.call(searchInput, searchTerm);
          else searchInput.value = searchTerm;
          searchInput.dispatchEvent(new Event('input', { bubbles: true }));
          searchInput.dispatchEvent(new Event('change', { bubbles: true }));
          searchInput.focus();
        }
      }, 500);

      // Also trigger AI search, speak answer
      (async () => {
        const result = await searchAndNavigate(searchTerm, () => {}, () => {});
        if (result?.answer) {
          setTimeout(() => speak(result.answer!), 3000);
          setFeedbackTemp('🤖 AI Answer ready', 8000);
        }
      })();

      return;
    }

    // ==== DEFAULT: open global search with full command ====
    if (command.length > 2) {
      onCommand('open-search');
      setFeedbackTemp(`🔍 Searching: "${command}"`);
      setTimeout(() => {
        const searchInput = document.querySelector(
          'input[placeholder*="Searcheverything"], input[placeholder*="Ask anything"]'
        ) as HTMLInputElement;
        if (searchInput) {
          const setter = Object.getOwnPropertyDescriptor(
            window.HTMLInputElement.prototype,
            'value'
          )?.set;
          if (setter) setter.call(searchInput, command);
          else searchInput.value = command;
          searchInput.dispatchEvent(new Event('input', { bubbles: true }));
          searchInput.dispatchEvent(new Event('change', { bubbles: true }));
          searchInput.focus();
        }
      }, 500);
      speak(isHindiInput ? `सर्च कर रहा हूँ` : `Searching: ${command}`);

      (async () => {
        const result = await searchAndNavigate(command, () => {}, () => {});
        if (result?.answer) {
          setTimeout(() => speak(result.answer!), 3000);
        }
      })();

      return;
    }

    // Unrecognized
    speak(isHindiInput ? 'समझ नहीं आया, मदद कहिये' : "I didn't understand. Try help for commands.");
    setFeedbackTemp('❓ Say "help" for commands');
  }, [onCommand, onNavigate, speak, setFeedbackTemp]);

  // Speech Recognition Setup
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setFeedbackTemp('❌ Speech not supported');
      return;
    }

    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = false;
    recognitionRef.current.interimResults = true;
    recognitionRef.current.lang = 'en-IN';

    recognitionRef.current.onstart = () => {
      setIsListening(true);
      setShowPanel(true);
      setFeedback('🎤 Listening...');
    };

    recognitionRef.current.onresult = (event: any) => {
      let interim = '';
      let final = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final += t + ' ';
        } else {
          interim += t;
        }
      }
      setTranscript(final || interim);
      if (final) {
        processCommand(final.trim());
      }
    };

    recognitionRef.current.onerror = (event: any) => {
      console.error('[Voice] Error:', event.error);
      setFeedbackTemp(`⚠️ ${event.error}`);
      setIsListening(false);
    };

    recognitionRef.current.onend = () => {
      setIsListening(false);
      setShowPanel(false);
      setTranscript('');
    };

    return () => {
      if (recognitionRef.current) recognitionRef.current.abort();
    };
  }, [processCommand, setFeedbackTemp]);

  const startListening = () => {
    if (recognitionRef.current && !isListening && !isSpeaking) {
      setTranscript('');
      try {
        recognitionRef.current.start();
      } catch {
        recognitionRef.current.abort();
        recognitionRef.current.start();
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="Voice assistant"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      style={{
        position: 'fixed',
        left: `${position.x}px`,
        bottom: `${position.y}px`,
        zIndex: 1000,
        touchAction: 'none',
        userSelect: 'none',
        fontFamily: 'Arial, sans-serif',
      }}
    >
      {/* Listening Panel */}
      {showPanel && isListening && !isDragging && (
        <div style={{
          backgroundColor: '#1e40af',
          borderRadius: '8px',
          padding: '6px 12px',
          marginBottom: '6px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          color: 'white',
          animation: 'pulse 1s infinite',
          width: '160px',
          fontSize: '11px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444', animation: 'pulse 1s infinite' }} />
            <span>Listening...</span>
          </div>
          {transcript && (
            <div style={{ fontSize: '10px', color: '#60a5fa', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              "{transcript}"
            </div>
          )}
        </div>
      )}

      {/* Feedback Toast */}
      {feedback && !isDragging && (
        <div style={{
          position: 'absolute',
          bottom: '44px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: isListening ? '#1e40af' : '#374151',
          color: 'white',
          padding: '4px 10px',
          borderRadius: '6px',
          fontSize: '11px',
          whiteSpace: 'nowrap',
          maxWidth: '250px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          animation: 'fadeIn 0.2s ease',
        }}>
          {feedback}
        </div>
      )}

      {/* Mic Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          if (!dragging) isListening ? stopListening() : startListening();
        }}
        disabled={isSpeaking}
        style={{
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          backgroundColor: isListening ? '#ef4444' : '#6366f1',
          color: 'white',
          border: 'none',
          cursor: isSpeaking ? 'not-allowed' : 'grab',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: isListening ? '0 0 16px rgba(239,68,68,0.5)' : '0 2px 8px rgba(99,102,241,0.4)',
          transition: 'box-shadow 0.2s',
          opacity: isSpeaking ? 0.7 : 1,
        }}
        title={isSpeaking ? 'Currently speaking...' : 'Drag to move. Click to talk (Hindi/English)'}
      >
        {isListening ? <MicOff size={14} /> : <Mic size={14} />}
      </button>

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
