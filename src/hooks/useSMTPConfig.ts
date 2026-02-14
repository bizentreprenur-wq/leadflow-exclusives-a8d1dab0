import { useState, useEffect, useCallback } from 'react';

export interface SMTPConfig {
  host: string;
  port: string;
  username: string;
  password: string;
  fromEmail: string;
  fromName: string;
  secure: boolean;
}

export interface SMTPStatus {
  isConnected: boolean;
  isVerified: boolean;
  lastTestDate?: string;
}

const SMTP_CONFIG_KEY = 'bamlead_smtp_config';
const SMTP_STATUS_KEY = 'bamlead_smtp_status';

const DEFAULT_CONFIG: SMTPConfig = {
  host: 'smtp.hostinger.com',
  port: '465',
  username: '',
  password: '',
  fromEmail: 'noreply@bamlead.com',
  fromName: 'BamLead',
  secure: true,
};

const DEFAULT_STATUS: SMTPStatus = {
  isConnected: false,
  isVerified: false,
};

// Custom event for cross-component sync
const SMTP_CHANGE_EVENT = 'bamlead_smtp_changed';
const CONNECTION_FIELDS: Array<keyof SMTPConfig> = ['host', 'port', 'username', 'password', 'secure'];

export function useSMTPConfig() {
  const [config, setConfig] = useState<SMTPConfig>(() => {
    try {
      // Try new key first, then legacy key
      let saved = localStorage.getItem(SMTP_CONFIG_KEY);
      if (!saved) {
        saved = localStorage.getItem('smtp_config');
      }
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_CONFIG;
  });

  const [status, setStatus] = useState<SMTPStatus>(() => {
    try {
      const saved = localStorage.getItem(SMTP_STATUS_KEY);
      if (saved) return JSON.parse(saved);
      
      // If no status but config exists, derive status from config
      let configSaved = localStorage.getItem(SMTP_CONFIG_KEY);
      if (!configSaved) configSaved = localStorage.getItem('smtp_config');
      if (configSaved) {
        const config = JSON.parse(configSaved);
        return {
          isConnected: Boolean(config.username && config.password),
          isVerified: false,
        };
      }
    } catch {}
    return DEFAULT_STATUS;
  });

  const [isTesting, setIsTesting] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);

  // Sync state from localStorage on mount and listen for changes
  useEffect(() => {
    // Sync on mount - ensures component picks up latest state
    const syncFromStorage = () => {
      try {
        let savedConfig = localStorage.getItem(SMTP_CONFIG_KEY);
        if (!savedConfig) {
          savedConfig = localStorage.getItem('smtp_config');
        }
        if (savedConfig) {
          const parsed = JSON.parse(savedConfig);
          setConfig(parsed);
        }
        
        const savedStatus = localStorage.getItem(SMTP_STATUS_KEY);
        if (savedStatus) {
          setStatus(JSON.parse(savedStatus));
        } else if (savedConfig) {
          // Derive status from config if no status saved
          const cfg = JSON.parse(savedConfig);
          const hasCredentials = Boolean(cfg.host && cfg.port && cfg.username && cfg.password);
          setStatus(prev => ({ ...prev, isConnected: hasCredentials }));
        }
      } catch {}
    };

    // Initial sync
    syncFromStorage();

    const handleStorageChange = (e: StorageEvent) => {
      if ((e.key === SMTP_CONFIG_KEY || e.key === 'smtp_config') && e.newValue) {
        try {
          setConfig(JSON.parse(e.newValue));
        } catch {}
      }
      if (e.key === SMTP_STATUS_KEY && e.newValue) {
        try {
          setStatus(JSON.parse(e.newValue));
        } catch {}
      }
    };

    const handleCustomEvent = () => {
      syncFromStorage();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener(SMTP_CHANGE_EVENT, handleCustomEvent);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener(SMTP_CHANGE_EVENT, handleCustomEvent);
    };
  }, []);

  const broadcastChange = useCallback(() => {
    window.dispatchEvent(new CustomEvent(SMTP_CHANGE_EVENT));
  }, []);

  const updateConfig = useCallback((newConfig: Partial<SMTPConfig>) => {
    setConfig(prev => {
      const updated = { ...prev, ...newConfig };
      const configData = JSON.stringify(updated);
      localStorage.setItem(SMTP_CONFIG_KEY, configData);
      localStorage.setItem('smtp_config', configData); // Legacy support

      const connectionChanged = CONNECTION_FIELDS.some((field) => (
        field in newConfig && prev[field] !== updated[field]
      ));
      if (connectionChanged) {
        const hasCredentials = Boolean(updated.host && updated.port && updated.username && updated.password);
        setStatus(prevStatus => {
          const nextStatus: SMTPStatus = {
            ...prevStatus,
            isConnected: hasCredentials,
            isVerified: false,
          };
          localStorage.setItem(SMTP_STATUS_KEY, JSON.stringify(nextStatus));
          return nextStatus;
        });
      }

      broadcastChange();
      return updated;
    });
  }, [broadcastChange]);

  const saveConfig = useCallback(() => {
    const configData = JSON.stringify(config);
    localStorage.setItem(SMTP_CONFIG_KEY, configData);
    localStorage.setItem('smtp_config', configData); // Legacy support
    
    // Mark as connected if credentials exist
    const hasCredentials = Boolean(config.host && config.port && config.username && config.password);
    const newStatus: SMTPStatus = { ...status, isConnected: hasCredentials };
    setStatus(newStatus);
    localStorage.setItem(SMTP_STATUS_KEY, JSON.stringify(newStatus));
    
    broadcastChange();
    return true;
  }, [config, status, broadcastChange]);

  const testConnection = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    if (!config.host || !config.port || !config.username || !config.password) {
      return { success: false, error: 'Please fill in all required SMTP fields' };
    }
    
    setIsTesting(true);
    
    try {
      // Save config first
      localStorage.setItem(SMTP_CONFIG_KEY, JSON.stringify(config));
      
      // Call real backend test
      const { testSMTPConnection } = await import('@/lib/emailService');
      const result = await testSMTPConnection(config);
      
      const newStatus: SMTPStatus = {
        isConnected: Boolean(result.success),
        isVerified: Boolean(result.success),
        lastTestDate: new Date().toISOString(),
      };
      setStatus(newStatus);
      localStorage.setItem(SMTP_STATUS_KEY, JSON.stringify(newStatus));
      broadcastChange();
      
      return { success: result.success, error: result.error };
    } catch (error: any) {
      const newStatus: SMTPStatus = {
        isConnected: false,
        isVerified: false,
        lastTestDate: new Date().toISOString(),
      };
      setStatus(newStatus);
      localStorage.setItem(SMTP_STATUS_KEY, JSON.stringify(newStatus));
      broadcastChange();
      
      return { success: false, error: error.message || 'Network error' };
    } finally {
      setIsTesting(false);
    }
  }, [config, broadcastChange]);

  const sendTestEmail = useCallback(async (toEmail: string): Promise<{ success: boolean; error?: string }> => {
    setIsSendingTest(true);
    
    try {
      const { sendTestEmail: sendTest } = await import('@/lib/emailService');
      const result = await sendTest(toEmail);
      return { success: result.success, error: result.error };
    } catch (error: any) {
      return { success: false, error: error.message || 'Network error' };
    } finally {
      setIsSendingTest(false);
    }
  }, []);

  const setConnected = useCallback((connected: boolean, verified: boolean = connected) => {
    const newStatus: SMTPStatus = {
      isConnected: connected,
      isVerified: verified,
      lastTestDate: new Date().toISOString(),
    };
    setStatus(newStatus);
    localStorage.setItem(SMTP_STATUS_KEY, JSON.stringify(newStatus));
    broadcastChange();
  }, [broadcastChange]);

  return {
    config,
    status,
    isTesting,
    isSendingTest,
    updateConfig,
    saveConfig,
    testConnection,
    sendTestEmail,
    setConnected,
  };
}

// Static helper to get status without hook (for header badges, etc.)
export function getSMTPStatus(): SMTPStatus {
  try {
    const saved = localStorage.getItem(SMTP_STATUS_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return DEFAULT_STATUS;
}

export function getSMTPConfig(): SMTPConfig {
  try {
    const saved = localStorage.getItem(SMTP_CONFIG_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return DEFAULT_CONFIG;
}
