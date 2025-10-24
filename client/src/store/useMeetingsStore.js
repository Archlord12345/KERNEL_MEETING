import { create } from 'zustand';

const RECENTS_KEY = 'km_recent_meetings';
const HISTORY_KEY = 'km_search_history';

const readStorage = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch (error) {
    console.error('Erreur lecture storage', error);
    return fallback;
  }
};

const writeStorage = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('Erreur écriture storage', error);
  }
};

export const useMeetingsStore = create((set, get) => ({
  recentMeetings: [],
  searchHistory: [],
  initialize: () => {
    const recents = readStorage(RECENTS_KEY, []);
    const history = readStorage(HISTORY_KEY, []);
    set({ recentMeetings: recents, searchHistory: history });
  },
  addRecentMeeting: (meeting) => {
    const meetings = [meeting, ...get().recentMeetings]
      .filter((value, index, self) => index === self.findIndex((item) => item.id === value.id))
      .slice(0, 6);
    set({ recentMeetings: meetings });
    writeStorage(RECENTS_KEY, meetings);
  },
  addSearchHistory: (entry) => {
    const history = [entry, ...get().searchHistory]
      .filter((value, index, self) => index === self.findIndex((item) => item.code === value.code))
      .slice(0, 10);
    set({ searchHistory: history });
    writeStorage(HISTORY_KEY, history);
  },
}));
