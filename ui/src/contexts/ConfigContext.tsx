import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { apiClient } from '@/lib/api';

interface AppConfig {
  rpName: string;
  rpSubtitle: string;
}

const ConfigContext = createContext<AppConfig | null>(null);

export const ConfigProvider = ({ children }: { children: ReactNode }) => {
  const [config, setConfig] = useState<AppConfig>({ rpName: 'Loading...', rpSubtitle: 'Loading...' });

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const data = await apiClient.get<AppConfig>('/config');
        setConfig(data);
      } catch (error) {
        console.error("Failed to fetch app config:", error);
        // 如果获取失败，提供一个默认标题
        setConfig({ rpName: 'Community Board', rpSubtitle: 'An opensource-friendly forum' });
      }
    };
    fetchConfig();
  }, []);

  return (
    <ConfigContext.Provider value={config}>
      {children}
    </ConfigContext.Provider>
  );
};

export const useConfig = () => {
  const context = useContext(ConfigContext);
  if (!context) {
    throw new Error('useConfig must be used within a ConfigProvider');
  }
  return context;
};
