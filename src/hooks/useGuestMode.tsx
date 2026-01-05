import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';

const GUEST_ID_KEY = 'profit_pathway_guest_id';
const GUEST_DATA_KEY = 'profit_pathway_guest_data';

interface GuestData {
  savedProjections: SavedProjection[];
  watchlist: string[];
  preferences: {
    theme?: 'light' | 'dark';
    defaultCapital?: number;
    defaultStrategy?: string;
  };
}

export interface SavedProjection {
  id: string;
  name: string;
  initialCapital: number;
  timeHorizon: string;
  strategy: string;
  createdAt: string;
  monteCarloEnabled: boolean;
  simulations: number;
}

const defaultGuestData: GuestData = {
  savedProjections: [],
  watchlist: [],
  preferences: {
    defaultCapital: 1000,
    defaultStrategy: 'moderate'
  }
};

export const useGuestMode = () => {
  const [guestId, setGuestId] = useState<string | null>(null);
  const [guestData, setGuestData] = useState<GuestData>(defaultGuestData);
  const [isGuest, setIsGuest] = useState(false);

  // Initialize guest mode from localStorage
  useEffect(() => {
    try {
      let storedGuestId = localStorage.getItem(GUEST_ID_KEY);
      
      if (!storedGuestId) {
        // Generate new guest ID
        storedGuestId = `guest_${uuidv4()}`;
        localStorage.setItem(GUEST_ID_KEY, storedGuestId);
      }
      
      setGuestId(storedGuestId);
      setIsGuest(true);

      // Load guest data
      const storedData = localStorage.getItem(GUEST_DATA_KEY);
      if (storedData) {
        try {
          const parsed = JSON.parse(storedData);
          setGuestData({ ...defaultGuestData, ...parsed });
        } catch {
          setGuestData(defaultGuestData);
        }
      }
    } catch (error) {
      console.error('Error initializing guest mode:', error);
    }
  }, []);

  // Persist guest data to localStorage
  const saveGuestData = useCallback((data: GuestData) => {
    try {
      localStorage.setItem(GUEST_DATA_KEY, JSON.stringify(data));
      setGuestData(data);
    } catch (error) {
      console.error('Error saving guest data:', error);
    }
  }, []);

  // Save a new projection
  const saveProjection = useCallback((projection: Omit<SavedProjection, 'id' | 'createdAt'>) => {
    const newProjection: SavedProjection = {
      ...projection,
      id: uuidv4(),
      createdAt: new Date().toISOString()
    };

    const updatedData = {
      ...guestData,
      savedProjections: [...guestData.savedProjections, newProjection]
    };

    saveGuestData(updatedData);
    return newProjection;
  }, [guestData, saveGuestData]);

  // Delete a projection
  const deleteProjection = useCallback((projectionId: string) => {
    const updatedData = {
      ...guestData,
      savedProjections: guestData.savedProjections.filter(p => p.id !== projectionId)
    };

    saveGuestData(updatedData);
  }, [guestData, saveGuestData]);

  // Load a projection
  const loadProjection = useCallback((projectionId: string): SavedProjection | null => {
    return guestData.savedProjections.find(p => p.id === projectionId) || null;
  }, [guestData]);

  // Update preferences
  const updatePreferences = useCallback((preferences: Partial<GuestData['preferences']>) => {
    const updatedData = {
      ...guestData,
      preferences: { ...guestData.preferences, ...preferences }
    };

    saveGuestData(updatedData);
  }, [guestData, saveGuestData]);

  // Clear guest data (for when user logs in)
  const clearGuestData = useCallback(() => {
    try {
      localStorage.removeItem(GUEST_DATA_KEY);
      setGuestData(defaultGuestData);
    } catch (error) {
      console.error('Error clearing guest data:', error);
    }
  }, []);

  return {
    guestId,
    isGuest,
    guestData,
    savedProjections: guestData.savedProjections,
    preferences: guestData.preferences,
    saveProjection,
    deleteProjection,
    loadProjection,
    updatePreferences,
    clearGuestData
  };
};
