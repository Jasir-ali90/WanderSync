import React, { createContext, useContext, useEffect, useState } from "react";

export type Language = "en" | "ur" | "roman";

export interface Translations {
  navHome: string;
  navDashboard: string;
  navPlanner: string;
  navTrips: string;
  navExplore: string;
  navProfile: string;
  navCommunity: string;
  navWorld: string;
  planTrip: string;
  voicePlanner: string;
  experienceTrip: string;
  groupVoting: string;
  splitBills: string;
  packingList: string;
  travelJournal: string;
  safetyCenter: string;
  carbonFootprint: string;
  gamificationXP: string;
}

const DICTIONARY: Record<Language, Translations> = {
  en: {
    navHome: "Home",
    navDashboard: "Dashboard",
    navPlanner: "AI Planner",
    navTrips: "My Trips",
    navExplore: "Explore Spots",
    navProfile: "Profile",
    navCommunity: "Community",
    navWorld: "Travel World",
    planTrip: "Plan a Trip",
    voicePlanner: "Voice Planner",
    experienceTrip: "Experience My Trip",
    groupVoting: "Group Polls",
    splitBills: "Split Bills",
    packingList: "AI Packing",
    travelJournal: "AI Journal",
    safetyCenter: "Safety SOS",
    carbonFootprint: "CO2 Impact",
    gamificationXP: "XP Level",
  },
  ur: {
    navHome: "ہوم",
    navDashboard: "ڈیش بورڈ",
    navPlanner: "AI پلانر",
    navTrips: "میرے سفر",
    navExplore: "مقامات دریافت کریں",
    navProfile: "پروفائل",
    navCommunity: "کمیونٹی",
    navWorld: "ورلڈ میپ",
    planTrip: "سفر کا منصوبہ بنائیں",
    voicePlanner: "وائس پلانر",
    experienceTrip: "سفر کا جائزہ لیں",
    groupVoting: "گروپ ووٹنگ",
    splitBills: "اخراجات کی تقسیم",
    packingList: "پیکنگ کی فہرست",
    travelJournal: "سفر کی ڈائری",
    safetyCenter: "حفاظتی مرکز",
    carbonFootprint: "کاربن کا اثر",
    gamificationXP: "XP لیول",
  },
  roman: {
    navHome: "Home",
    navDashboard: "Dashboard",
    navPlanner: "AI Planner",
    navTrips: "Mere Trips",
    navExplore: "Spots Dekhein",
    navProfile: "Profile",
    navCommunity: "Community",
    navWorld: "Travel World",
    planTrip: "Trip Banayein",
    voicePlanner: "Awaaz Se Plan Karein",
    experienceTrip: "Trip Experience Karein",
    groupVoting: "Group Voting",
    splitBills: "Kharcha Distribute Karein",
    packingList: "Saman Packing",
    travelJournal: "Safarnama Journal",
    safetyCenter: "Hifazati Center",
    carbonFootprint: "CO2 Impact",
    gamificationXP: "XP Level",
  },
};

interface I18nContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: Translations;
}

const I18nContext = createContext<I18nContextType>({
  lang: "en",
  setLang: () => {},
  t: DICTIONARY.en,
});

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Language>(() => {
    const saved = localStorage.getItem("ws_lang") as Language;
    return saved || "en";
  });

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    localStorage.setItem("ws_lang", newLang);
  };

  useEffect(() => {
    document.documentElement.dir = lang === "ur" ? "rtl" : "ltr";
  }, [lang]);

  return (
    <I18nContext.Provider value={{ lang, setLang, t: DICTIONARY[lang] }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = () => useContext(I18nContext);
