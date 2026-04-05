/**
 * Voice Assistant Utilities
 * Handles form interaction, data extraction, and page content reading
 */

// Extract all readable content from page
export function extractPageContent(): {
  title: string;
  content: string;
  tables: any[];
  forms: any[];
  metrics: any[];
} {
  const title = document.title;
  
  // Get main text content
  const mainElement = document.querySelector('main') || document.body;
  const textContent = (mainElement as HTMLElement).innerText;
  
  // Extract tables
  const tables = Array.from(document.querySelectorAll('table')).map(table => {
    const rows = Array.from(table.querySelectorAll('tr')).map(row => {
      const cells = Array.from(row.querySelectorAll('td, th')).map(cell => (cell as HTMLElement).innerText);
      return cells.join(' | ');
    });
    return rows.join('\n');
  });
  
  // Extract forms
  const forms = Array.from(document.querySelectorAll('form')).map(form => {
    const formData: any = {};
    const inputs = form.querySelectorAll('input, textarea, select');
    inputs.forEach((input: any) => {
      const label = (form.querySelector(`label[for="${input.id}"]`) as HTMLElement)?.innerText || input.name || input.placeholder;
      formData[label] = input.value || '';
    });
    return formData;
  });
  
  // Extract metric cards/stats
  const metrics = Array.from(document.querySelectorAll('[class*="card"], [class*="stat"], [class*="metric"]'))
    .slice(0, 5)
    .map(el => (el as HTMLElement).innerText);
  
  return {
    title,
    content: textContent.substring(0, 1000), // First 1000 chars
    tables,
    forms,
    metrics
  };
}

// Find all forms on page with improved detection
export function getAllForms(): {
  id: string;
  element: HTMLFormElement;
  fields: Array<{ name: string; type: string; value: string; label: string; element: any }>;
}[] {
  return Array.from(document.querySelectorAll('form')).map((form, idx) => {
    const fields = Array.from(form.querySelectorAll('input, textarea, select')).map((field: any, fieldIdx: number) => {
      const label = (form.querySelector(`label[for="${field.id}"]`) as HTMLElement)?.innerText || field.name || field.placeholder || `Field ${fieldIdx + 1}`;
      return {
        name: field.name || field.id || `field_${idx}_${fieldIdx}`,
        type: field.type || 'text',
        value: field.value || '',
        label: label.replace(/:/g, '').trim(),
        element: field
      };
    });
    return {
      id: form.id || `form_${idx}`,
      element: form as HTMLFormElement,
      fields
    };
  });
}

// Enhanced form field filling with React support
export function fillFormField(fieldIdentifier: string, value: string): boolean {
  console.log(`[Voice] Attempting to fill field: "${fieldIdentifier}" with value: "${value}"`);
  
  let field: any = null;
  
  // Step 1: Try direct selectors with ID
  const fieldId = fieldIdentifier.toLowerCase().replace(/\s+/g, '-');
  field = document.getElementById(fieldId) ||
           document.getElementById(`expense-${fieldId}`) ||
           document.querySelector(`[name="${fieldIdentifier}"]`) ||
           document.querySelector(`#${fieldIdentifier}`);
  
  // Step 2: Try fuzzy matching if not found
  if (!field) {
    const allInputs = Array.from(document.querySelectorAll('input, textarea, select'));
    for (const input of allInputs) {
      const inputName = (input as any).name?.toLowerCase() || '';
      const inputId = input.id?.toLowerCase() || '';
      const inputPlaceholder = (input as any).placeholder?.toLowerCase() || '';
      const inputLabel = (input.parentElement?.querySelector('label') as any)?.innerText?.toLowerCase() || '';
      const fieldLower = fieldIdentifier.toLowerCase();
      
      // Exact word matching
      if (inputName === fieldLower || inputId === fieldLower || inputPlaceholder.includes(fieldLower)) {
        field = input;
        console.log(`[Voice] Exact matched field: ${(input as any).name || input.id || 'unnamed'}`);
        break;
      }
      
      // Partial matching
      if (inputName.includes(fieldLower) || inputId.includes(fieldLower) || 
          inputPlaceholder.includes(fieldLower) || inputLabel.includes(fieldLower) ||
          fieldLower.includes(inputName.split('_')[0]) || fieldLower.includes(inputId.split('_')[0])) {
        field = input;
        console.log(`[Voice] Fuzzy matched field: ${(input as any).name || input.id || 'unnamed'}`);
        break;
      }
    }
  }
  
  if (!field) {
    console.log(`[Voice] Field not found: "${fieldIdentifier}". Available fields:`, getAllForms().flatMap(f => f.fields.map(fld => fld.name)));
    return false;
  }
  
  try {
    console.log(`[Voice] Found field element, type: ${(field as any).type}, current value: "${(field as any).value}"`);
    
    // Focus on field
    (field as any).focus();
    
    // Set the value
    const previousValue = (field as any).value;
    (field as any).value = value;
    
    console.log(`[Voice] Set value from "${previousValue}" to "${value}"`);
    
    // For select elements, also trigger change on options
    if ((field as any).tagName === 'SELECT') {
      const option = (field as any).querySelector(`option[value="${value}"]`);
      if (option) {
        option.selected = true;
      }
    }
    
    // Trigger all relevant events in sequence
    const events = [
      new Event('input', { bubbles: true, cancelable: true }),
      new Event('change', { bubbles: true, cancelable: true }),
      new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'Enter', code: 'Enter' }),
      new KeyboardEvent('keyup', { bubbles: true, cancelable: true }),
      new FocusEvent('blur', { bubbles: true, cancelable: true }),
    ];
    
    for (const event of events) {
      (field as any).dispatchEvent(event);
    }
    
    // Give React time to process
    setTimeout(() => {
      console.log(`[Voice] Post-event processing complete for "${fieldIdentifier}"`);
    }, 50);
    
    console.log(`[Voice] Successfully filled: "${fieldIdentifier}" with "${value}"`);
    return true;
  } catch (error) {
    console.error(`[Voice] Error filling field: ${error}`);
    return false;
  }
}

// Submit nearest form with improved detection
export function submitNearestForm(): boolean {
  console.log('[Voice] Looking for form to submit...');
  
  // Try multiple approaches to find and click submit button
  const submitSelectors = [
    'button[type="submit"]',
    'button:contains("Submit")',
    'input[type="submit"]',
    'button[aria-label*="submit" i]',
    'button:contains("Save")',
    'button:contains("Confirm")',
    'button[class*="submit" i]',
    'button[class*="save" i]',
  ];
  
  for (const selector of submitSelectors) {
    let button: any;
    try {
      if (selector.includes(':contains')) {
        // Fallback for :contains which isn't standard
        const text = selector.match(/:contains\("([^"]+)"\)/)?.[1];
        if (text) {
          button = Array.from(document.querySelectorAll('button')).find(b => 
            b.innerText.toLowerCase().includes(text.toLowerCase())
          ) as any;
        }
      } else {
        button = document.querySelector(selector) as any;
      }
      
      if (button && !button.disabled) {
        console.log(`[Voice] Found submit button with selector: ${selector}`);
        button.click();
        console.log('[Voice] Form submitted');
        return true;
      }
    } catch (error) {
      // Continue to next selector
    }
  }
  
  // Fallback: find first form and click its first button
  const form = document.querySelector('form') as any;
  if (form) {
    const button = form.querySelector('button, input[type="submit"]') as any;
    if (button) {
      console.log('[Voice] Using fallback submit click');
      button.click();
      return true;
    }
  }
  
  console.log('[Voice] No submit button found');
  return false;
}

// Click button by text - improved
export function clickButtonByText(buttonText: string): boolean {
  console.log(`[Voice] Looking for button: "${buttonText}"`);
  
  const buttons = Array.from(document.querySelectorAll('button, [role="button"]'));
  const button = buttons.find(btn => {
    const text = (btn as HTMLElement).innerText.toLowerCase();
    const ariaLabel = btn.getAttribute('aria-label')?.toLowerCase() || '';
    const title = btn.getAttribute('title')?.toLowerCase() || '';
    const searchLower = buttonText.toLowerCase();
    
    return text.includes(searchLower) || ariaLabel.includes(searchLower) || title.includes(searchLower);
  }) as any;
  
  if (button) {
    console.log(`[Voice] Found button, clicking: "${buttonText}"`);
    button.click();
    return true;
  }
  
  console.log(`[Voice] Button not found: "${buttonText}"`);
  return false;
}

// Read page content aloud - improved
export function readPageContent(type: 'summary' | 'detailed' | 'metrics' = 'summary'): string {
  const content = extractPageContent();
  
  let text = '';
  
  if (type === 'summary' || type === 'detailed') {
    text += `Current page: ${content.title}. `;
    
    if (content.metrics.length > 0) {
      text += `Key metrics: ${content.metrics.slice(0, 2).join('. ')}. `;
    }
    
    if (type === 'detailed') {
      if (content.tables.length > 0) {
        text += `${content.tables.length} data table available. `;
      }
      if (content.forms.length > 0) {
        text += `${content.forms.length} form found. `;
      }
    }
  }
  
  if (type === 'metrics') {
    text = content.metrics.slice(0, 3).join('. ') || 'No metrics found on this page.';
  }
  
  return text;
}

// Get form summary - improved
export function getFormSummary(): string {
  const forms = getAllForms();
  
  if (forms.length === 0) {
    return 'No forms found on this page.';
  }
  
  if (forms.length === 1) {
    const form = forms[0];
    let summary = `Found form with ${form.fields.length} fields: `;
    summary += form.fields.map(f => `${f.label}`).join(', ');
    return summary;
  }
  
  return `Found ${forms.length} forms on this page with ${forms.reduce((sum, f) => sum + f.fields.length, 0)} total fields.`;
}

// Get current form field values - improved
export function getCurrentFormValues(): Record<string, string> {
  const forms = getAllForms();
  const values: Record<string, string> = {};
  
  forms.forEach((form, formIdx) => {
    form.fields.forEach(field => {
      const key = forms.length === 1 ? field.label : `Form ${formIdx + 1} - ${field.label}`;
      values[key] = field.value && field.value.trim() ? field.value : '(empty)';
    });
  });
  
  return values;
}

// Delete entity by name via API
export async function deleteEntityByName(
  entityType: 'doctor' | 'pharmacy' | 'hospital' | 'mr',
  name: string
): Promise<{ success: boolean; deleted?: boolean; error?: string }> {
  const apiPaths: Record<string, string> = {
    doctor: 'doctors',
    pharmacy: 'pharmacies',
    hospital: 'hospitals',
    mr: 'mrs',
  };

  const path = apiPaths[entityType];
  if (!path) return { success: false, error: `Unknown entity type: ${entityType}` };

  try {
    const res = await fetch(`/api/${path}${path === 'mrs' ? '' : ''}?name=${encodeURIComponent(name)}`, {
      method: 'DELETE',
    });

    if (!res.ok) {
      return { success: false, error: `Server error: ${res.status}` };
    }

    const data = await res.json();
    return { success: true, deleted: data.deleted !== false };
  } catch (err) {
    console.error('[Voice] Delete API error:', err);
    return { success: false, error: String(err) };
  }
}

// Search and route voice queries intelligently
export async function searchAndNavigate(
  query: string,
  onCommand: (cmd: string) => void,
  navigate: (path: string) => void
): Promise<{ answer?: string; count?: number; action?: string } | null> {
  const lower = query.toLowerCase();

  // Try keyword search first
  try {
    const res = await fetch(`/api/search?q=${encodeURIComponent(query)}&limit=10`);
    if (res.ok) {
      const data = await res.json();
      const count = data.totalCount || 0;

      // If results found, open global search
      if (count > 0) {
        onCommand('open-search');
        setTimeout(() => {
          const searchInput = document.querySelector(
            'input[placeholder*="Searcheverything"], input[placeholder*="Ask anything"]'
          ) as HTMLInputElement;
          if (searchInput) {
            const setter = Object.getOwnPropertyDescriptor(
              window.HTMLInputElement.prototype,
              'value'
            )?.set;
            if (setter) setter.call(searchInput, query);
            else searchInput.value = query;
            searchInput.dispatchEvent(new Event('input', { bubbles: true }));
            searchInput.dispatchEvent(new Event('change', { bubbles: true }));
            searchInput.focus();
          }
        }, 500);
      }

      return { count, action: count > 0 ? 'search' : 'none' };
    }
  } catch {
    // Search failed, try AI search
  }

  // Try AI search
  try {
    const res = await fetch('/api/ai-search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    });
    if (res.ok) {
      const data = await res.json();
      onCommand('open-search');
      setTimeout(() => {
        const searchInput = document.querySelector(
          'input[placeholder*="Searcheverything"], input[placeholder*="Ask anything"]'
        ) as HTMLInputElement;
        if (searchInput) {
          const setter = Object.getOwnPropertyDescriptor(
            window.HTMLInputElement.prototype,
            'value'
          )?.set;
          if (setter) setter.call(searchInput, query);
          else searchInput.value = query;
          searchInput.dispatchEvent(new Event('input', { bubbles: true }));
          searchInput.dispatchEvent(new Event('change', { bubbles: true }));
          searchInput.focus();
        }
      }, 500);
      return { answer: data.answer, action: 'ai' };
    }
  } catch {
    // AI search failed
  }

  return null;
}

// Read table data - improved
export function readTableData(tableIndex: number = 0): string {
  const tables = document.querySelectorAll('table');
  if (tables.length === 0) {
    return 'No tables found on this page.';
  }
  
  const table = tables[tableIndex];
  if (!table) {
    return `Table ${tableIndex + 1} not found.`;
  }
  
  try {
    const rows = Array.from(table.querySelectorAll('tr')).slice(0, 3);
    const data = rows.map((row, rowIdx) => {
      const cells = Array.from(row.querySelectorAll('td, th')).map(cell => (cell as HTMLElement).innerText.trim()).filter(t => t);
      return cells.join(' - ');
    }).filter(d => d).join('. ');
    
    return data ? `Table data: ${data}` : 'No data in table.';
  } catch (error) {
    console.error('[Voice] Error reading table:', error);
    return 'Could not read table data.';
  }
}
