import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Locale = "en" | "uz" | "ru";

export const locales: { code: Locale; label: string; short: string }[] = [
  { code: "en", label: "English", short: "EN" },
  { code: "uz", label: "O'zbekcha", short: "UZ" },
  { code: "ru", label: "Русский", short: "RU" },
];

const dictionary = {
  en: {
    "nav.jobs": "Jobs",
    "nav.resume": "Resume",
    "nav.applications": "Applications",
    "nav.saved": "Saved",
    "nav.assistant": "Assistant",
    "nav.company": "For companies",
    "nav.admin": "Admin",
    "nav.settings": "Settings",
    "nav.signin": "Sign in",
    "nav.start": "Get started",
    "hero.badge": "Agentic hiring, live",
    "hero.title": "The recruitment console that reads resumes like a hiring manager.",
    "hero.sub":
      "AgentHire AI matches candidates to roles with explainable scoring, drafts the application, books the interview, and exposes every one of those actions as a tool your AI assistant can call.",
    "hero.cta": "Find matching roles",
    "hero.cta2": "Analyze my resume",
    "hero.search": "Role, skill or company",
    "hero.location": "Location",
    "hero.searchcta": "Search",
    "stats.jobs": "Open roles",
    "stats.companies": "Hiring teams",
    "stats.match": "Median match accuracy",
    "stats.time": "Median time to interview",
    "section.features": "Everything the hiring loop needs",
    "section.how": "How AgentHire works",
    "section.jobs": "Featured roles",
    "section.mcp": "Callable from your AI assistant",
    "section.pricing": "Pricing",
    "section.faq": "Questions",
    "cta.viewall": "View all roles",
    "cta.apply": "Apply now",
    "cta.save": "Save",
    "cta.saved": "Saved",
    "cta.details": "View role",
    "footer.rights": "All rights reserved.",
  },
  uz: {
    "nav.jobs": "Vakansiyalar",
    "nav.resume": "Rezyume",
    "nav.applications": "Arizalar",
    "nav.saved": "Saqlangan",
    "nav.assistant": "Yordamchi",
    "nav.company": "Kompaniyalar uchun",
    "nav.admin": "Admin",
    "nav.settings": "Sozlamalar",
    "nav.signin": "Kirish",
    "nav.start": "Boshlash",
    "hero.badge": "Agentli ishga olish",
    "hero.title": "Rezyumeni HR menejerdek o'qiydigan ishga olish konsoli.",
    "hero.sub":
      "AgentHire AI nomzodlarni tushunarli baholash bilan mos vakansiyalarga ulaydi, arizani tayyorlaydi, suhbatni belgilaydi va bularning barchasini AI yordamchingiz chaqira oladigan vositalar sifatida ochadi.",
    "hero.cta": "Mos ishlarni topish",
    "hero.cta2": "Rezyumemni tahlil qilish",
    "hero.search": "Lavozim, ko'nikma yoki kompaniya",
    "hero.location": "Joylashuv",
    "hero.searchcta": "Qidirish",
    "stats.jobs": "Ochiq lavozimlar",
    "stats.companies": "Ishga oluvchilar",
    "stats.match": "O'rtacha moslik aniqligi",
    "stats.time": "Suhbatgacha o'rtacha vaqt",
    "section.features": "Ishga olish jarayoni uchun hammasi",
    "section.how": "AgentHire qanday ishlaydi",
    "section.jobs": "Tanlangan vakansiyalar",
    "section.mcp": "AI yordamchingizdan chaqiriladi",
    "section.pricing": "Narxlar",
    "section.faq": "Savollar",
    "cta.viewall": "Barcha vakansiyalar",
    "cta.apply": "Ariza topshirish",
    "cta.save": "Saqlash",
    "cta.saved": "Saqlandi",
    "cta.details": "Batafsil",
    "footer.rights": "Barcha huquqlar himoyalangan.",
  },
  ru: {
    "nav.jobs": "Вакансии",
    "nav.resume": "Резюме",
    "nav.applications": "Заявки",
    "nav.saved": "Сохранённые",
    "nav.assistant": "Ассистент",
    "nav.company": "Для компаний",
    "nav.admin": "Админ",
    "nav.settings": "Настройки",
    "nav.signin": "Войти",
    "nav.start": "Начать",
    "hero.badge": "Агентный найм",
    "hero.title": "Консоль найма, которая читает резюме как нанимающий менеджер.",
    "hero.sub":
      "AgentHire AI подбирает кандидатов под роли с объяснимой оценкой, готовит заявку, назначает интервью — и открывает каждое из этих действий как инструмент для вашего AI-ассистента.",
    "hero.cta": "Найти подходящие роли",
    "hero.cta2": "Проанализировать резюме",
    "hero.search": "Роль, навык или компания",
    "hero.location": "Локация",
    "hero.searchcta": "Поиск",
    "stats.jobs": "Открытых ролей",
    "stats.companies": "Команд нанимает",
    "stats.match": "Точность подбора",
    "stats.time": "Среднее время до интервью",
    "section.features": "Всё для процесса найма",
    "section.how": "Как работает AgentHire",
    "section.jobs": "Избранные вакансии",
    "section.mcp": "Вызывается из вашего AI-ассистента",
    "section.pricing": "Тарифы",
    "section.faq": "Вопросы",
    "cta.viewall": "Все вакансии",
    "cta.apply": "Откликнуться",
    "cta.save": "Сохранить",
    "cta.saved": "Сохранено",
    "cta.details": "Подробнее",
    "footer.rights": "Все права защищены.",
  },
} as const;

export type TranslationKey = keyof (typeof dictionary)["en"];

const LocaleContext = createContext<{
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (k: TranslationKey) => string;
}>({ locale: "en", setLocale: () => {}, t: (k) => dictionary.en[k] });

const STORAGE_KEY = "agenthire.locale";

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY) as Locale | null;
    if (stored && locales.some((l) => l.code === stored)) setLocaleState(stored);
  }, []);

  const value = useMemo(
    () => ({
      locale,
      setLocale: (l: Locale) => {
        setLocaleState(l);
        window.localStorage.setItem(STORAGE_KEY, l);
      },
      t: (k: TranslationKey) => dictionary[locale][k] ?? dictionary.en[k],
    }),
    [locale],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useI18n() {
  return useContext(LocaleContext);
}
