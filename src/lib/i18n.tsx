import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type Locale = "en" | "uz" | "ru";

export const locales: {
  code: Locale;
  label: string;
  short: string;
}[] = [
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
    "hero.title":
      "The recruitment console that reads resumes like a hiring manager.",
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

    "home.platform": "Platform",
    "home.workflow": "Workflow",
    "home.liveRoles": "Live roles",
    "home.plans": "Plans",
    "home.faq": "FAQ",

    "feature.analysis.title": "Explainable resume analysis",
    "feature.analysis.body":
      "ATS scoring, strengths, gaps and rewrite suggestions — every number traceable to a specific line of the resume.",

    "feature.match.title": "Deterministic match scoring",
    "feature.match.body":
      "Skill coverage against each role's requirement set, with matched and missing skills listed side by side.",

    "feature.application.title": "One-action applications",
    "feature.application.body":
      "Generate a tailored cover note, attach the right resume version, and submit without leaving the role page.",

    "feature.interview.title": "Interview scheduling",
    "feature.interview.body":
      "Propose slots, confirm panels, and keep candidate and hiring team in one shared timeline.",

    "feature.languages.title": "English, Uzbek, Russian",
    "feature.languages.body":
      "The whole product surface speaks all three, so EU and CIS pipelines run on the same platform.",

    "feature.cloud.title": "Cloud-ready architecture",
    "feature.cloud.body":
      "A single typed query layer sits between the UI and the data, so a managed Postgres backend drops in without UI changes.",

    "how.step1.title": "Upload your resume",
    "how.step1.body":
      "Parsed into a structured profile: skills, seniority, languages, outcomes.",

    "how.step2.title": "Get scored matches",
    "how.step2.body":
      "Every open role ranked with a transparent coverage score.",

    "how.step3.title": "Apply in one action",
    "how.step3.body": "A tailored note is drafted; you approve and it ships.",

    "how.step4.title": "Track to offer",
    "how.step4.body":
      "Stage-by-stage status, interview slots, and recruiter notes.",

    "mcp.searchJobs":
      "Filter open roles by query, location, work mode, seniority and salary floor.",
    "mcp.matchResume":
      "Score a candidate skill set against a role and return matched vs missing skills.",
    "mcp.applyJob":
      "Submit an application with an optional cover note and return the application id.",
    "mcp.scheduleInterview":
      "Book an interview slot against an existing application.",
    "mcp.applicationStatus":
      "Read the current stage, match score and interview time.",

    "mcp.title": "Your assistant can run the whole loop without a browser.",
    "mcp.description":
      "AgentHire exposes its hiring actions over the Model Context Protocol. Connect the server from ChatGPT, Claude, Cursor or any MCP client and ask it to find roles, score your resume, apply and book the interview — the same functions the web console calls.",
    "mcp.http": "Streamable HTTP transport",
    "mcp.typed": "Typed, validated tool inputs",
    "mcp.sameData": "Same data as the web app",
    "mcp.openAssistant": "Open the AI assistant",

    "pricing.candidate": "Candidate",
    "pricing.candidatePrice": "Free",
    "pricing.candidateDesc": "Matching, applications and tracking.",
    "pricing.team": "Team",
    "pricing.teamPrice": "$99/mo",
    "pricing.teamDesc": "For hiring teams up to 20 seats.",
    "pricing.enterprise": "Enterprise",
    "pricing.enterprisePrice": "Custom",
    "pricing.enterpriseDesc": "Compliance, SSO and data residency.",

    "pricing.matching": "Unlimited matches",
    "pricing.resume": "Resume analysis",
    "pricing.tracker": "Application tracker",
    "pricing.dashboard": "Company dashboard",
    "pricing.analytics": "Pipeline analytics",
    "pricing.mcp": "MCP tools",
    "pricing.interview": "Interview scheduling",
    "pricing.sso": "SSO / SAML",
    "pricing.audit": "Audit logs",
    "pricing.support": "Dedicated support",
    "pricing.integrations": "Custom integrations",
    "pricing.getStarted": "Get started",

    "faq.matchQuestion": "How is the match score calculated?",
    "faq.matchAnswer":
      "Each role declares a requirement skill set. The score is the coverage of that set by your profile, normalised to a 38–99 band, so you always see which skills matched and which are missing rather than an opaque number.",

    "faq.dataQuestion": "Is my data stored anywhere?",
    "faq.dataAnswer":
      "Your profile, resume, jobs and applications are stored securely in Supabase. Access is controlled with authentication and row-level security policies.",

    "faq.languageQuestion": "Which languages are supported?",
    "faq.languageAnswer":
      "English, Uzbek and Russian across the entire interface, switchable from the header at any time.",

    "faq.aiQuestion": "Can an AI assistant use AgentHire directly?",
    "faq.aiAnswer":
      "Yes. The platform exposes search, matching, applying, scheduling and status checks as MCP tools over streamable HTTP.",

    "jobs.empty": "No vacancies available at the moment.",
    "jobs.emptyDescription":
      "New vacancies added from the admin panel will appear here.",
    "jobs.browse": "Browse all roles",
    "jobs.retry": "Try again",
    "jobs.error": "Failed to load vacancies.",

    "final.title": "Stop rewriting the same application eleven times.",
    "final.description":
      "Upload one resume. AgentHire handles the matching, the tailoring and the follow-up.",
    "final.resume": "Analyze my resume",
    "final.company": "Hire with AgentHire",

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
    "stats.companies": "Ishga oluvchi jamoalar",
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

    "home.platform": "Platforma",
    "home.workflow": "Jarayon",
    "home.liveRoles": "Faol vakansiyalar",
    "home.plans": "Tariflar",
    "home.faq": "FAQ",

    "feature.analysis.title": "Tushunarli rezyume tahlili",
    "feature.analysis.body":
      "ATS baholash, kuchli va zaif tomonlar hamda qayta yozish tavsiyalari — har bir raqam rezyumedagi aniq ma'lumotga asoslanadi.",

    "feature.match.title": "Aniq moslik baholashi",
    "feature.match.body":
      "Har bir vakansiya talablari bo'yicha ko'nikmalar qamrovi, mos va yetishmayotgan ko'nikmalar alohida ko'rsatiladi.",

    "feature.application.title": "Bir bosishda ariza",
    "feature.application.body":
      "Moslashtirilgan xat tayyorlang, kerakli rezyumeni biriktiring va vakansiya sahifasidan chiqmasdan ariza yuboring.",

    "feature.interview.title": "Suhbatni rejalashtirish",
    "feature.interview.body":
      "Vaqtlarni taklif qiling, suhbat ishtirokchilarini tasdiqlang va nomzod hamda ish beruvchini yagona jarayonda saqlang.",

    "feature.languages.title": "Ingliz, o'zbek, rus tillari",
    "feature.languages.body":
      "Butun platforma uchala tilda ishlaydi, shuning uchun barcha ishga olish jarayonlari yagona platformada boshqariladi.",

    "feature.cloud.title": "Bulutga tayyor arxitektura",
    "feature.cloud.body":
      "Interfeys va ma'lumotlar o'rtasida yagona tiplangan qatlam mavjud, shuning uchun boshqariladigan Postgres backendini UI'ni o'zgartirmasdan ulash mumkin.",

    "how.step1.title": "Rezyumeni yuklang",
    "how.step1.body":
      "Rezyume ko'nikmalar, daraja, tillar va natijalarni o'z ichiga olgan tuzilgan profilga aylantiriladi.",

    "how.step2.title": "Mos vakansiyalarni oling",
    "how.step2.body":
      "Har bir ochiq vakansiya shaffof moslik balli bilan baholanadi.",

    "how.step3.title": "Bir bosishda ariza yuboring",
    "how.step3.body":
      "Moslashtirilgan xat tayyorlanadi; siz tasdiqlaysiz va ariza yuboriladi.",

    "how.step4.title": "Taklifgacha kuzating",
    "how.step4.body":
      "Bosqichma-bosqich holat, suhbat vaqtlari va ish beruvchi izohlarini kuzating.",

    "mcp.searchJobs":
      "Vakansiyalarni so'rov, joylashuv, ish rejimi, daraja va minimal maosh bo'yicha filterlang.",
    "mcp.matchResume":
      "Nomzod ko'nikmalarini vakansiya bilan solishtirib, mos va yetishmayotgan ko'nikmalarni qaytaring.",
    "mcp.applyJob":
      "Ixtiyoriy motivatsion xat bilan ariza yuboring va ariza ID raqamini oling.",
    "mcp.scheduleInterview": "Mavjud ariza uchun suhbat vaqtini belgilang.",
    "mcp.applicationStatus":
      "Joriy bosqich, moslik balli va suhbat vaqtini ko'ring.",

    "mcp.title": "AI yordamchingiz butun jarayonni brauzersiz boshqara oladi.",
    "mcp.description":
      "AgentHire ishga olish amallarini Model Context Protocol orqali taqdim etadi. ChatGPT, Claude, Cursor yoki boshqa MCP mijozini ulang va vakansiya topish, rezyumeni baholash, ariza yuborish hamda suhbat belgilashni so'rang.",
    "mcp.http": "Streamable HTTP transport",
    "mcp.typed": "Tekshirilgan va tiplangan vosita parametrlari",
    "mcp.sameData": "Veb-ilovadagi ma'lumotlarning o'zi",
    "mcp.openAssistant": "AI yordamchini ochish",

    "pricing.candidate": "Nomzod",
    "pricing.candidatePrice": "Bepul",
    "pricing.candidateDesc": "Moslik, arizalar va kuzatuv.",
    "pricing.team": "Jamoa",
    "pricing.teamPrice": "$99/oy",
    "pricing.teamDesc":
      "20 tagacha xodimdan iborat ishga olish jamoalari uchun.",
    "pricing.enterprise": "Korporativ",
    "pricing.enterprisePrice": "Maxsus",
    "pricing.enterpriseDesc": "Compliance, SSO va ma'lumotlar joylashuvi.",

    "pricing.matching": "Cheksiz moslik",
    "pricing.resume": "Rezyume tahlili",
    "pricing.tracker": "Arizalarni kuzatish",
    "pricing.dashboard": "Kompaniya paneli",
    "pricing.analytics": "Jarayon tahlili",
    "pricing.mcp": "MCP vositalari",
    "pricing.interview": "Suhbatni rejalashtirish",
    "pricing.sso": "SSO / SAML",
    "pricing.audit": "Audit jurnallari",
    "pricing.support": "Maxsus yordam",
    "pricing.integrations": "Maxsus integratsiyalar",
    "pricing.getStarted": "Boshlash",

    "faq.matchQuestion": "Moslik balli qanday hisoblanadi?",
    "faq.matchAnswer":
      "Har bir vakansiya talab qilinadigan ko'nikmalar to'plamini belgilaydi. Ball profilingiz ushbu talablarni qanchalik qamrab olganiga qarab hisoblanadi va qaysi ko'nikmalar mos kelgani yoki yetishmayotgani ko'rsatiladi.",

    "faq.dataQuestion": "Mening ma'lumotlarim saqlanadimi?",
    "faq.dataAnswer":
      "Profilingiz, rezyumengiz, vakansiyalar va arizalaringiz Supabase'da xavfsiz saqlanadi. Kirish autentifikatsiya va Row Level Security siyosatlari orqali nazorat qilinadi.",

    "faq.languageQuestion": "Qaysi tillar qo'llab-quvvatlanadi?",
    "faq.languageAnswer":
      "Butun interfeys ingliz, o'zbek va rus tillarida ishlaydi. Tilni istalgan vaqtda header orqali almashtirish mumkin.",

    "faq.aiQuestion":
      "AI yordamchi AgentHire'dan to'g'ridan-to'g'ri foydalana oladimi?",
    "faq.aiAnswer":
      "Ha. Platforma qidirish, moslashtirish, ariza yuborish, suhbat belgilash va holatni tekshirish funksiyalarini MCP vositalari sifatida taqdim etadi.",

    "jobs.empty": "Hozircha vakansiyalar mavjud emas.",
    "jobs.emptyDescription":
      "Admin panel orqali yangi vakansiya qo'shilganda ular shu yerda ko'rinadi.",
    "jobs.browse": "Barcha vakansiyalarni ko'rish",
    "jobs.retry": "Qayta urinish",
    "jobs.error": "Vakansiyalarni yuklashda xatolik yuz berdi.",

    "final.title": "Bir xil arizani qayta-qayta yozishni to'xtating.",
    "final.description":
      "Bitta rezyume yuklang. AgentHire moslashtirish, tayyorlash va keyingi jarayonlarni boshqaradi.",
    "final.resume": "Rezyumemni tahlil qilish",
    "final.company": "AgentHire bilan ishga oling",

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
    "hero.title":
      "Консоль найма, которая читает резюме как нанимающий менеджер.",
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

    "home.platform": "Платформа",
    "home.workflow": "Процесс",
    "home.liveRoles": "Актуальные вакансии",
    "home.plans": "Тарифы",
    "home.faq": "FAQ",

    "feature.analysis.title": "Понятный анализ резюме",
    "feature.analysis.body":
      "ATS-оценка, сильные стороны, пробелы и рекомендации по редактированию — каждый показатель связан с конкретной частью резюме.",

    "feature.match.title": "Точная оценка соответствия",
    "feature.match.body":
      "Покрытие навыков по требованиям каждой роли с отдельным отображением совпадающих и недостающих навыков.",

    "feature.application.title": "Отклик в одно действие",
    "feature.application.body":
      "Создайте адаптированное сопроводительное письмо, прикрепите нужную версию резюме и отправьте заявку прямо со страницы вакансии.",

    "feature.interview.title": "Планирование интервью",
    "feature.interview.body":
      "Предлагайте время, подтверждайте участников и храните кандидата и команду найма в одном процессе.",

    "feature.languages.title": "Английский, узбекский, русский",
    "feature.languages.body":
      "Весь продукт доступен на трёх языках, поэтому процессы найма можно вести на одной платформе.",

    "feature.cloud.title": "Архитектура готова к облаку",
    "feature.cloud.body":
      "Единый типизированный слой находится между интерфейсом и данными, поэтому управляемый Postgres можно подключить без изменения UI.",

    "how.step1.title": "Загрузите резюме",
    "how.step1.body":
      "Оно преобразуется в структурированный профиль: навыки, уровень, языки и результаты.",

    "how.step2.title": "Получите подходящие вакансии",
    "how.step2.body":
      "Каждая открытая роль получает прозрачную оценку соответствия.",

    "how.step3.title": "Откликнитесь в одно действие",
    "how.step3.body":
      "Создаётся адаптированное письмо; вы подтверждаете и отправляете заявку.",

    "how.step4.title": "Отслеживайте до оффера",
    "how.step4.body":
      "Следите за этапами, временем интервью и заметками рекрутера.",

    "mcp.searchJobs":
      "Фильтруйте вакансии по запросу, локации, формату работы, уровню и минимальной зарплате.",
    "mcp.matchResume":
      "Сравнивайте навыки кандидата с вакансией и получайте совпадающие и недостающие навыки.",
    "mcp.applyJob":
      "Отправляйте заявку с дополнительным сопроводительным письмом и получайте ID заявки.",
    "mcp.scheduleInterview":
      "Назначайте время интервью для существующей заявки.",
    "mcp.applicationStatus":
      "Просматривайте текущий этап, оценку соответствия и время интервью.",

    "mcp.title":
      "Ваш AI-ассистент может управлять всем процессом без браузера.",
    "mcp.description":
      "AgentHire предоставляет действия по найму через Model Context Protocol. Подключите ChatGPT, Claude, Cursor или другой MCP-клиент и попросите найти вакансии, оценить резюме, отправить заявку или назначить интервью.",
    "mcp.http": "Streamable HTTP transport",
    "mcp.typed": "Типизированные и проверенные параметры",
    "mcp.sameData": "Те же данные, что и в веб-приложении",
    "mcp.openAssistant": "Открыть AI-ассистента",

    "pricing.candidate": "Кандидат",
    "pricing.candidatePrice": "Бесплатно",
    "pricing.candidateDesc": "Подбор, заявки и отслеживание.",
    "pricing.team": "Команда",
    "pricing.teamPrice": "$99/мес",
    "pricing.teamDesc": "Для команд найма до 20 сотрудников.",
    "pricing.enterprise": "Enterprise",
    "pricing.enterprisePrice": "Индивидуально",
    "pricing.enterpriseDesc": "Compliance, SSO и размещение данных.",

    "pricing.matching": "Неограниченный подбор",
    "pricing.resume": "Анализ резюме",
    "pricing.tracker": "Отслеживание заявок",
    "pricing.dashboard": "Панель компании",
    "pricing.analytics": "Аналитика процесса",
    "pricing.mcp": "MCP-инструменты",
    "pricing.interview": "Планирование интервью",
    "pricing.sso": "SSO / SAML",
    "pricing.audit": "Журналы аудита",
    "pricing.support": "Выделенная поддержка",
    "pricing.integrations": "Индивидуальные интеграции",
    "pricing.getStarted": "Начать",

    "faq.matchQuestion": "Как рассчитывается оценка соответствия?",
    "faq.matchAnswer":
      "Каждая вакансия содержит набор требуемых навыков. Оценка показывает, насколько ваш профиль покрывает эти требования, а также какие навыки совпадают и каких не хватает.",

    "faq.dataQuestion": "Мои данные где-то хранятся?",
    "faq.dataAnswer":
      "Ваш профиль, резюме, вакансии и заявки безопасно хранятся в Supabase. Доступ контролируется аутентификацией и политиками Row Level Security.",

    "faq.languageQuestion": "Какие языки поддерживаются?",
    "faq.languageAnswer":
      "Весь интерфейс доступен на английском, узбекском и русском языках. Переключить язык можно в любое время через header.",

    "faq.aiQuestion": "Может ли AI-ассистент напрямую использовать AgentHire?",
    "faq.aiAnswer":
      "Да. Платформа предоставляет поиск, подбор, отправку заявок, планирование интервью и проверку статуса как MCP-инструменты.",

    "jobs.empty": "Сейчас вакансий нет.",
    "jobs.emptyDescription":
      "Новые вакансии, добавленные через админ-панель, появятся здесь.",
    "jobs.browse": "Посмотреть все вакансии",
    "jobs.retry": "Повторить",
    "jobs.error": "Не удалось загрузить вакансии.",

    "final.title":
      "Перестаньте одиннадцать раз переписывать одну и ту же заявку.",
    "final.description":
      "Загрузите одно резюме. AgentHire займётся подбором, адаптацией и дальнейшим сопровождением.",
    "final.resume": "Проанализировать резюме",
    "final.company": "Нанимайте с AgentHire",

    "footer.rights": "Все права защищены.",
  },
} as const;

export type TranslationKey = keyof (typeof dictionary)["en"];

const LocaleContext = createContext<{
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (k: TranslationKey) => string;
}>({
  locale: "en",
  setLocale: () => {},
  t: (k) => dictionary.en[k],
});

const STORAGE_KEY = "agenthire.locale";

export function LocaleProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => {
    const stored = window.localStorage.getItem(
      STORAGE_KEY,
    ) as Locale | null;

    if (
      stored &&
      locales.some((l) => l.code === stored)
    ) {
      setLocaleState(stored);
    }
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

  return (
    <LocaleContext.Provider value={value}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useI18n() {
  return useContext(LocaleContext);
}
