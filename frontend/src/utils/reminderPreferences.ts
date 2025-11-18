import AsyncStorage from '@react-native-async-storage/async-storage';

export type ReminderPreferenceOption =
  | 'remind_next_time'
  | 'skip_until_change'
  | 'never';

export interface ReminderPreference {
  option: ReminderPreferenceOption;
  bookingHash?: string;
  updatedAt: string;
}

const REMINDER_PREF_KEY = 'travelReminderPreference';

export const getTravelReminderPreference = async (): Promise<ReminderPreference | null> => {
  try {
    const stored = await AsyncStorage.getItem(REMINDER_PREF_KEY);
    if (!stored) {
      return null;
    }
    return JSON.parse(stored);
  } catch (error) {
    console.warn('Failed to load reminder preference', error);
    return null;
  }
};

export const saveTravelReminderPreference = async (
  preference: ReminderPreference
): Promise<void> => {
  try {
    await AsyncStorage.setItem(REMINDER_PREF_KEY, JSON.stringify(preference));
  } catch (error) {
    console.warn('Failed to save reminder preference', error);
  }
};

export const clearTravelReminderPreference = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(REMINDER_PREF_KEY);
  } catch (error) {
    console.warn('Failed to clear reminder preference', error);
  }
};
