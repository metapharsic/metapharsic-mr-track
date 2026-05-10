import { api } from './api';

export interface SyncOperation {
  id: string;
  type: 'visit' | 'location' | 'expense' | 'lead';
  payload: any;
  timestamp: number;
  retryCount: number;
}

class SyncService {
  private queue: SyncOperation[] = [];
  private isProcessing: boolean = false;
  private STORAGE_KEY = 'metapharsic_sync_queue';

  constructor() {
    this.loadQueue();
    window.addEventListener('online', () => this.processQueue());
  }

  private loadQueue() {
    const saved = localStorage.getItem(this.STORAGE_KEY);
    if (saved) {
      try {
        this.queue = JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse sync queue', e);
        this.queue = [];
      }
    }
  }

  private saveQueue() {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.queue));
  }

  async addToQueue(type: SyncOperation['type'], payload: any) {
    const operation: SyncOperation = {
      id: crypto.randomUUID(),
      type,
      payload,
      timestamp: Date.now(),
      retryCount: 0
    };

    this.queue.push(operation);
    this.saveQueue();

    if (navigator.onLine) {
      this.processQueue();
    } else {
      console.log('Offline: Operation queued for sync', operation);
    }
  }

  async processQueue() {
    if (this.isProcessing || this.queue.length === 0 || !navigator.onLine) return;

    this.isProcessing = true;
    console.log(`Starting sync process for ${this.queue.length} operations...`);

    const operations = [...this.queue];
    
    for (const op of operations) {
      try {
        await this.syncOperation(op);
        // Success: remove from queue
        this.queue = this.queue.filter(item => item.id !== op.id);
        this.saveQueue();
      } catch (error) {
        console.error(`Failed to sync operation ${op.id}`, error);
        op.retryCount++;
        if (op.retryCount > 5) {
          // Remove if too many retries? Or keep?
          this.queue = this.queue.filter(item => item.id !== op.id);
          this.saveQueue();
        }
      }
    }

    this.isProcessing = false;
    if (this.queue.length > 0 && navigator.onLine) {
      // Retry after delay if something failed
      setTimeout(() => this.processQueue(), 5000);
    }
  }

  private async syncOperation(op: SyncOperation) {
    // Send to backend sync-queue endpoint
    const response = await fetch('/api/sync-queue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mr_id: op.payload.mr_id || 1, // Default for demo
        operation_type: op.type,
        payload: op.payload,
        client_timestamp: new Date(op.timestamp).toISOString()
      })
    });

    if (!response.ok) {
      throw new Error(`Server returned ${response.status}`);
    }

    return response.json();
  }

  getQueueStatus() {
    return {
      pending: this.queue.length,
      isProcessing: this.isProcessing,
      isOnline: navigator.onLine
    };
  }
}

export const syncService = new SyncService();
