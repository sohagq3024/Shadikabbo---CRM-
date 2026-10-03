import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  CrmFieldSeedings,
  DEFAULT_FIELD_SEEDINGS,
  AgencySettings,
  DEFAULT_AGENCY_SETTINGS,
} from '../constants/defaultFieldSeedings';

interface CrmFieldsContextType {
  fields: CrmFieldSeedings;
  agencySettings: AgencySettings;
  isLoading: boolean;
  error: string | null;
  addFieldItem: (category: keyof CrmFieldSeedings, item: string) => Promise<boolean>;
  removeFieldItem: (category: keyof CrmFieldSeedings, item: string) => Promise<boolean>;
  updateFieldItem: (category: keyof CrmFieldSeedings, oldItem: string, newItem: string) => Promise<boolean>;
  reorderFieldItems: (category: keyof CrmFieldSeedings, newItems: string[]) => Promise<boolean>;
  resetCategoryToDefault: (category: keyof CrmFieldSeedings) => Promise<boolean>;
  resetAllToDefaults: () => Promise<boolean>;
  updatePackagePrice: (packageName: string, newPrice: number) => Promise<boolean>;
  addPackageWithPrice: (packageName: string, price: number) => Promise<boolean>;
  updateAgencySettings: (newSettings: Partial<AgencySettings>) => Promise<boolean>;
  refreshFields: () => Promise<void>;
}

const CrmFieldsContext = createContext<CrmFieldsContextType | undefined>(undefined);

export const CrmFieldsProvider: React.FC<{ children: React.ReactNode; token?: string | null }> = ({
  children,
  token,
}) => {
  const [fields, setFields] = useState<CrmFieldSeedings>(DEFAULT_FIELD_SEEDINGS);
  const [agencySettings, setAgencySettings] = useState<AgencySettings>(DEFAULT_AGENCY_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/settings/fields', { headers });
      if (res.ok) {
        const data = await res.json();
        if (data.fields) {
          setFields({
            ...DEFAULT_FIELD_SEEDINGS,
            ...data.fields,
          });
        }
        if (data.agencySettings) {
          setAgencySettings({
            ...DEFAULT_AGENCY_SETTINGS,
            ...data.agencySettings,
          });
        }
      }
    } catch (err: any) {
      console.warn('Using default seedings due to network/server response:', err);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const saveFieldsToServer = async (newFields: CrmFieldSeedings): Promise<boolean> => {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/settings/fields', {
        method: 'PUT',
        headers,
        body: JSON.stringify({ fields: newFields }),
      });

      if (!res.ok) throw new Error('Failed to save field settings');
      setFields(newFields);
      return true;
    } catch (err: any) {
      setError(err.message || 'Error saving fields');
      // Local optimistic fallback
      setFields(newFields);
      return false;
    }
  };

  const addFieldItem = async (category: keyof CrmFieldSeedings, item: string): Promise<boolean> => {
    const trimmed = item.trim();
    if (!trimmed) return false;

    const currentList = fields[category] || [];
    if (currentList.some((existing) => existing.toLowerCase() === trimmed.toLowerCase())) {
      return false; // Avoid duplicates
    }

    const updatedList = [...currentList, trimmed];
    const newFields = {
      ...fields,
      [category]: updatedList,
    };
    return saveFieldsToServer(newFields);
  };

  const removeFieldItem = async (category: keyof CrmFieldSeedings, item: string): Promise<boolean> => {
    const currentList = (fields[category] as string[]) || [];
    const updatedList = currentList.filter((x) => x !== item);
    const newFields: CrmFieldSeedings = {
      ...fields,
      [category]: updatedList,
    };
    if (category === 'packages' && newFields.packagePrices) {
      const updatedPrices = { ...newFields.packagePrices };
      delete updatedPrices[item];
      newFields.packagePrices = updatedPrices;
    }
    return saveFieldsToServer(newFields);
  };

  const updateFieldItem = async (
    category: keyof CrmFieldSeedings,
    oldItem: string,
    newItem: string
  ): Promise<boolean> => {
    const trimmed = newItem.trim();
    if (!trimmed) return false;

    const currentList = (fields[category] as string[]) || [];
    const updatedList = currentList.map((x) => (x === oldItem ? trimmed : x));
    const newFields: CrmFieldSeedings = {
      ...fields,
      [category]: updatedList,
    };
    if (category === 'packages') {
      const currentPrices = {
        ...(DEFAULT_FIELD_SEEDINGS.packagePrices || {}),
        ...(fields.packagePrices || {}),
      };
      if (currentPrices[oldItem] !== undefined) {
        currentPrices[trimmed] = currentPrices[oldItem];
        if (trimmed !== oldItem) delete currentPrices[oldItem];
      }
      newFields.packagePrices = currentPrices;
    }
    return saveFieldsToServer(newFields);
  };

  const reorderFieldItems = async (category: keyof CrmFieldSeedings, newItems: string[]): Promise<boolean> => {
    const newFields = {
      ...fields,
      [category]: newItems,
    };
    return saveFieldsToServer(newFields);
  };

  const updatePackagePrice = async (packageName: string, newPrice: number): Promise<boolean> => {
    const currentPrices = {
      ...(DEFAULT_FIELD_SEEDINGS.packagePrices || {}),
      ...(fields.packagePrices || {}),
    };
    currentPrices[packageName] = Math.max(0, newPrice);
    const newFields: CrmFieldSeedings = {
      ...fields,
      packagePrices: currentPrices,
    };
    return saveFieldsToServer(newFields);
  };

  const addPackageWithPrice = async (packageName: string, price: number): Promise<boolean> => {
    const trimmed = packageName.trim();
    if (!trimmed) return false;

    const currentList = fields.packages || [];
    const updatedList = currentList.some((p) => p.toLowerCase() === trimmed.toLowerCase())
      ? currentList
      : [...currentList, trimmed];

    const currentPrices = {
      ...(DEFAULT_FIELD_SEEDINGS.packagePrices || {}),
      ...(fields.packagePrices || {}),
    };
    currentPrices[trimmed] = Math.max(0, price);

    const newFields: CrmFieldSeedings = {
      ...fields,
      packages: updatedList,
      packagePrices: currentPrices,
    };
    return saveFieldsToServer(newFields);
  };

  const resetCategoryToDefault = async (category: keyof CrmFieldSeedings): Promise<boolean> => {
    const defaultItems = DEFAULT_FIELD_SEEDINGS[category] || [];
    const newFields: CrmFieldSeedings = {
      ...fields,
      [category]: Array.isArray(defaultItems) ? [...defaultItems] : defaultItems,
    };
    if (category === 'packages') {
      newFields.packagePrices = { ...(DEFAULT_FIELD_SEEDINGS.packagePrices || {}) };
    }
    return saveFieldsToServer(newFields);
  };

  const resetAllToDefaults = async (): Promise<boolean> => {
    return saveFieldsToServer({ ...DEFAULT_FIELD_SEEDINGS });
  };

  const updateAgencySettings = async (newSettings: Partial<AgencySettings>): Promise<boolean> => {
    const updated = {
      ...agencySettings,
      ...newSettings,
    };
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/settings/agency', {
        method: 'PUT',
        headers,
        body: JSON.stringify({ agencySettings: updated }),
      });

      if (!res.ok) throw new Error('Failed to save agency settings');
      setAgencySettings(updated);
      return true;
    } catch (err: any) {
      setError(err.message || 'Error saving agency settings');
      setAgencySettings(updated);
      return false;
    }
  };

  return (
    <CrmFieldsContext.Provider
      value={{
        fields,
        agencySettings,
        isLoading,
        error,
        addFieldItem,
        removeFieldItem,
        updateFieldItem,
        reorderFieldItems,
        resetCategoryToDefault,
        resetAllToDefaults,
        updatePackagePrice,
        addPackageWithPrice,
        updateAgencySettings,
        refreshFields: fetchSettings,
      }}
    >
      {children}
    </CrmFieldsContext.Provider>
  );
};

export const useCrmFields = (): CrmFieldsContextType => {
  const context = useContext(CrmFieldsContext);
  if (!context) {
    throw new Error('useCrmFields must be used within a CrmFieldsProvider');
  }
  return context;
};
