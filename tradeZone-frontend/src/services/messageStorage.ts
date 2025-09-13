import { type Message } from '../types/message';

class MessageStorage {
  private static readonly STORAGE_KEY = 'tradeZone_messages';
  private static readonly SESSION_KEY = 'tradeZone_session';
  private static readonly MAX_MESSAGES = 100;

  constructor() {
    this.initializeSession();
  }

  /**
   * Initialize session and clear old messages if it's a new session
   */
  private initializeSession(): void {
    const currentSession = Date.now().toString();
    const lastSession = localStorage.getItem(MessageStorage.SESSION_KEY);

    if (!lastSession || this.isNewSession(lastSession)) {
      // New session detected - clear old messages
      console.log('🗑️ New session detected, clearing old messages');
      localStorage.removeItem(MessageStorage.STORAGE_KEY);
      localStorage.setItem(MessageStorage.SESSION_KEY, currentSession);
    } else {
      console.log('♻️ Continuing existing session');
    }

    // Set up cleanup on page unload
    this.setupCleanupOnClose();
  }

  /**
   * Check if this is a new session (app was closed and reopened)
   */
  private isNewSession(lastSession: string): boolean {
    const lastSessionTime = parseInt(lastSession);
    const currentTime = Date.now();
    const sessionTimeout = 5 * 60 * 1000; // 5 minutes

    // If more than 5 minutes have passed, consider it a new session
    return (currentTime - lastSessionTime) > sessionTimeout;
  }

  /**
   * Set up cleanup when the app is closed
   */
  private setupCleanupOnClose(): void {
    // Clear messages when the page is unloaded (app closed)
    window.addEventListener('beforeunload', () => {
      console.log('🧹 App closing, clearing temporary messages');
      localStorage.removeItem(MessageStorage.STORAGE_KEY);
    });

    // Update session timestamp periodically while app is active
    setInterval(() => {
      localStorage.setItem(MessageStorage.SESSION_KEY, Date.now().toString());
    }, 60000); // Update every minute
  }

  /**
   * Save messages to localStorage
   */
  saveMessages(messages: Message[]): void {
    try {
      // Keep only the last MAX_MESSAGES
      const messagesToSave = messages.slice(-MessageStorage.MAX_MESSAGES);
      
      // Convert dates to strings for JSON storage
      const serializedMessages = messagesToSave.map(msg => {
        let createdAt: string;
        let updatedAt: string | undefined;

        // Handle createdAt serialization
        if (msg.createdAt instanceof Date) {
          createdAt = msg.createdAt.toISOString();
        } else if (typeof msg.createdAt === 'string') {
          createdAt = msg.createdAt;
        } else {
          createdAt = new Date().toISOString();
        }

        // Handle updatedAt serialization
        if (msg.updatedAt instanceof Date) {
          updatedAt = msg.updatedAt.toISOString();
        } else if (typeof msg.updatedAt === 'string') {
          updatedAt = msg.updatedAt;
        }

        return {
          ...msg,
          createdAt,
          updatedAt
        };
      });

      localStorage.setItem(MessageStorage.STORAGE_KEY, JSON.stringify(serializedMessages));
      console.log(`💾 Saved ${serializedMessages.length} messages to localStorage`);
    } catch (error) {
      console.error('❌ Error saving messages to localStorage:', error);
    }
  }

  /**
   * Load messages from localStorage
   */
  loadMessages(): Message[] {
    try {
      const stored = localStorage.getItem(MessageStorage.STORAGE_KEY);
      if (!stored) {
        console.log('📭 No messages found in localStorage');
        return [];
      }

      const parsed = JSON.parse(stored);
      
      // Convert string dates back to Date objects
      const messages: Message[] = parsed.map((msg: any) => {
        let createdAt: Date;
        let updatedAt: Date | undefined;

        // Handle createdAt conversion
        if (msg.createdAt instanceof Date) {
          createdAt = msg.createdAt;
        } else if (typeof msg.createdAt === 'string' || typeof msg.createdAt === 'number') {
          createdAt = new Date(msg.createdAt);
          // If the date is invalid, use current time
          if (isNaN(createdAt.getTime())) {
            createdAt = new Date();
          }
        } else {
          createdAt = new Date();
        }

        // Handle updatedAt conversion
        if (msg.updatedAt) {
          if (msg.updatedAt instanceof Date) {
            updatedAt = msg.updatedAt;
          } else if (typeof msg.updatedAt === 'string' || typeof msg.updatedAt === 'number') {
            updatedAt = new Date(msg.updatedAt);
            // If the date is invalid, set to undefined
            if (isNaN(updatedAt.getTime())) {
              updatedAt = undefined;
            }
          }
        }

        return {
          ...msg,
          createdAt,
          updatedAt
        };
      });

      console.log(`📥 Loaded ${messages.length} messages from localStorage`);
      return messages;
    } catch (error) {
      console.error('❌ Error loading messages from localStorage:', error);
      return [];
    }
  }

  /**
   * Update existing messages and save to localStorage
   */
  updateMessages(messages: Message[]): void {
    this.saveMessages(messages);
  }

  /**
   * Check if storage is available and not full
   */
  isStorageAvailable(): boolean {
    try {
      const test = 'test';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (error) {
      console.warn('⚠️ localStorage is not available:', error);
      return false;
    }
  }
}

// Export a singleton instance
export const messageStorage = new MessageStorage();
