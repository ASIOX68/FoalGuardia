import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Box {
  id: string;
  label: string;
  ip: string;
}

export interface Alert {
  id: string;
  timestamp: number;
  boxId: string;
  type: string; // e.g. "Jument couchée"
  message: string;
}

interface AppState {
  harasName: string;
  vetNumber: string;
  boxes: Box[];
  alerts: Alert[];
  
  setHarasName: (name: string) => void;
  setVetNumber: (number: string) => void;
  
  addBox: (box: Box) => void;
  removeBox: (boxId: string) => void;
  
  addAlert: (alert: Alert) => void;
  removeAlert: (id: string) => void;
  clearAlerts: () => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      harasName: 'Mon Écurie',
      vetNumber: '',
      boxes: [],
      alerts: [],

      setHarasName: (name) => set({ harasName: name }),
      
      setVetNumber: (number) => set({ vetNumber: number }),

      addBox: (box) =>
        set((state) => ({
          boxes: [...state.boxes, box],
        })),

      removeBox: (boxId) =>
        set((state) => ({
          boxes: state.boxes.filter((b) => b.id !== boxId),
          // Remove alerts related to this box just in case
          alerts: state.alerts.filter((a) => a.boxId !== boxId),
        })),

      addAlert: (alert) =>
        set((state) => ({
          alerts: [alert, ...state.alerts], // prepended
        })),

      removeAlert: (id) =>
        set((state) => ({
          alerts: state.alerts.filter((a) => a.id !== id),
        })),

      clearAlerts: () => set({ alerts: [] }),
    }),
    {
      name: 'stable-alert-storage-v2', // Changed storage key to avoid issues with old schema
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
