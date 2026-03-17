"use client";

import { createContext, useContext } from "react";

export interface UserPreferencesData {
  measurementUnit: string;
  defaultServings: number;
  timeFormat: string;
  defaultViewMode: string;
}

const defaults: UserPreferencesData = {
  measurementUnit: "imperial",
  defaultServings: 4,
  timeFormat: "12",
  defaultViewMode: "grid",
};

const PreferencesContext = createContext<UserPreferencesData>(defaults);

export function PreferencesProvider({
  value,
  children,
}: {
  value: Partial<UserPreferencesData> | null;
  children: React.ReactNode;
}) {
  const merged: UserPreferencesData = {
    measurementUnit: value?.measurementUnit || defaults.measurementUnit,
    defaultServings: value?.defaultServings || defaults.defaultServings,
    timeFormat: value?.timeFormat || defaults.timeFormat,
    defaultViewMode: value?.defaultViewMode || defaults.defaultViewMode,
  };

  return (
    <PreferencesContext.Provider value={merged}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences(): UserPreferencesData {
  return useContext(PreferencesContext);
}
