import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Mail, 
  FileText, 
  Mic, 
  Video, 
  Settings as SettingsIcon,
  Copy,
  Download,
  Trash2,
  Check,
  RefreshCw,
  Play,
  Pause,
  Plus,
  AlertCircle,
  X,
  Volume2,
  VolumeX,
  Headphones
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import Markdown from 'react-markdown';
import { 
  generateContentPlan, 
  detectVariables, 
  generateText, 
  generateImage,
  generateSpeech
} from './services/geminiService';
import { ContentPlanItem, GeneratedContent, Settings } from './types';
import { Modal } from './components/Modal';
import { AudioSamples } from './components/AudioSamples';
import axios from 'axios';

const VOICES: Record<string, { id: string; name: Record<string, string>; gender: string }[]> = {
  gemini: [
    { id: 'Kore', name: { ru: 'Кора', en: 'Kore' }, gender: 'female' },
    { id: 'Zephyr', name: { ru: 'Зефир', en: 'Zephyr' }, gender: 'female' },
    { id: 'Puck', name: { ru: 'Пак', en: 'Puck' }, gender: 'male' },
    { id: 'Charon', name: { ru: 'Харон', en: 'Charon' }, gender: 'male' },
  ],
  elevenlabs: [
    { id: '21m00Tcm4TlvDq8ikWAM', name: { ru: 'Рэйчел', en: 'Rachel' }, gender: 'female' },
    { id: 'EXAVITQu4vr4xnSDx79L', name: { ru: 'Белла', en: 'Bella' }, gender: 'female' },
    { id: 'ErXwSpxjGco974Qp0pbf', name: { ru: 'Антони', en: 'Antony' }, gender: 'male' },
    { id: 'TxGEqnHW47o4jk9K5967', name: { ru: 'Джош', en: 'Josh' }, gender: 'male' },
  ],
  yandex: [
    { id: 'alena', name: { ru: 'Алёна', en: 'Alena' }, gender: 'female' },
    { id: 'jane', name: { ru: 'Джейн', en: 'Jane' }, gender: 'female' },
    { id: 'filipp', name: { ru: 'Филипп', en: 'Filipp' }, gender: 'male' },
    { id: 'ermil', name: { ru: 'Эрмиль', en: 'Ermil' }, gender: 'male' },
  ],
  heygen: [
    { id: '2d4a99785c894bc382054f16625bc26e', name: { ru: 'Дмитрий', en: 'Dmitry' }, gender: 'male' },
    { id: '001d5c79905d49179d282467699700ad', name: { ru: 'Светлана', en: 'Svetlana' }, gender: 'female' },
    { id: '070145e8470d4403883f7b1d271e90f0', name: { ru: 'Павел', en: 'Pavel' }, gender: 'male' },
    { id: '1bd001e1791a477ca53df554005154ad', name: { ru: 'Елена', en: 'Elena' }, gender: 'female' },
  ]
};

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ThemePreset {
  id: string;
  name: Record<string, string>;
  emoji: string;
  primary: string;
  secondary: string;
  bgGradient: string;
}

const THEME_PRESETS: Record<string, ThemePreset> = {
  default: {
    id: 'default',
    name: { ru: 'Индиго Flow', en: 'Indigo Flow' },
    emoji: '⚡',
    primary: '#6366f1',
    secondary: '#10b981',
    bgGradient: 'from-indigo-50/70 via-slate-50 to-emerald-50/50'
  },
  ocean: {
    id: 'ocean',
    name: { ru: 'Карибский Кокос', en: 'Caribbean Coconut' },
    emoji: '🌴',
    primary: '#0d9488',
    secondary: '#0ea5e9',
    bgGradient: 'from-teal-100/50 via-cyan-50/30 to-amber-100/40'
  },
  mountain: {
    id: 'mountain',
    name: { ru: 'Альпийский Снег', en: 'Alpine Snow' },
    emoji: '❄️',
    primary: '#475569',
    secondary: '#3b82f6',
    bgGradient: 'from-blue-100/50 via-slate-50 to-sky-100/40'
  },
  tech: {
    id: 'tech',
    name: { ru: 'Кибер Неон', en: 'Cyber Neon' },
    emoji: '👾',
    primary: '#8b5cf6',
    secondary: '#ec4899',
    bgGradient: 'from-purple-100/50 via-pink-50/40 to-violet-100/40'
  },
  nature: {
    id: 'nature',
    name: { ru: 'Зеленый Чай', en: 'Green Tea' },
    emoji: '🍃',
    primary: '#16a34a',
    secondary: '#84cc16',
    bgGradient: 'from-emerald-100/50 via-green-50/30 to-amber-100/30'
  },
  fitness: {
    id: 'fitness',
    name: { ru: 'Импульс Заката', en: 'Sunset Impulse' },
    emoji: '🔥',
    primary: '#ea580c',
    secondary: '#dc2626',
    bgGradient: 'from-orange-100/50 via-red-50/40 to-amber-100/20'
  },
  finance: {
    id: 'finance',
    name: { ru: 'Золотой Век', en: 'Golden Age' },
    emoji: '🪙',
    primary: '#d97706',
    secondary: '#1e293b',
    bgGradient: 'from-amber-100/40 via-stone-50/30 to-yellow-100/20'
  },
  beauty: {
    id: 'beauty',
    name: { ru: 'Розовая Вишня', en: 'Pink Cherry' },
    emoji: '🌸',
    primary: '#db2777',
    secondary: '#c084fc',
    bgGradient: 'from-pink-100/50 via-fuchsia-50/30 to-white'
  },
  food: {
    id: 'food',
    name: { ru: 'Пряный Трюфель', en: 'Spicy Truffle' },
    emoji: '🧁',
    primary: '#c2410c',
    secondary: '#f59e0b',
    bgGradient: 'from-amber-100/50 via-orange-50/40 to-stone-100/40'
  },
  art: {
    id: 'art',
    name: { ru: 'Поп-Арт', en: 'Pop Art' },
    emoji: '🎨',
    primary: '#be185d',
    secondary: '#06b6d4',
    bgGradient: 'from-pink-100/40 via-purple-50/30 to-sky-100/30'
  }
};

const i18n = {
  ru: {
    title: "AI Контент",
    subtitle: "Мастерская",
    themeLabel: "Стиль Интерфейса",
    // Tabs
    tabPlan: "Контент-план",
    tabMail: "Рассылки",
    tabLong: "Лонгриды",
    tabPod: "Подкасты",
    tabVid: "Видео-аватар",
    tabSettings: "Настройки",
    
    // Niche Selection & Content plan input
    nicheLabel: "Тема, ниша или проект",
    nicheSelectorDesc: "Выберите вашу сферу или тему (напр., Программирование, Йога, Дизайн, Кафе)",
    detailsLabel: "Детали и особенности",
    detailsPlaceholder: "Опишите уникальность, целевую аудиторию или особенности...",
    periodLabel: "Период планирования",
    channelsLabel: "Каналы распространения",
    generatePlanBtn: "Составить контент-план",
    generating: "Создаем...",
    
    // Tone
    toneFriendly: "Дружелюбный",
    toneProfessional: "Профессиональный",
    tonePlayful: "Игровой",
    toneInspiring: "Вдохновляющий",
    
    // Audio options
    durationLabel: "Продолжительность",
    styleLabel: "Стиль сценария",
    formatLabel: "Формат подкаста",
    genderLabel: "Пол голоса",
    speedLabel: "Скорость",
    qualityLabel: "Качество",
    emotionLabel: "Эмоция",
    female: "Женский",
    male: "Мужской",
    
    // Video Avatar options
    avatarLabel: "Выберите аватара HeyGen",
    videoVoiceLabel: "Голос HeyGen для видео",
    videoDurationLabel: "Длина видеоролика",
    noHeyGenKey: "Для работы с аватарами укажите HeyGen API Key в Настройках.",
    
    // Actions & buttons
    chooseTopicAlert: "Пожалуйста, сначала выберите тему из контент-плана.",
    generateContentBtn: "Сгенерировать контент",
    regenerateSpeechBtn: "Обновить озвучку",
    copyBtn: "Копировать",
    downloadBtn: "Скачать",
    tryAgain: "Повторить попытку",
    saveSettings: "Сохранить настройки",
    saved: "Настройки сохранены!",
    
    // Errors
    keyRequiredError: "GEMINI_API_KEY не обнаружен. Пожалуйста, добавьте его в Settings -> Secrets.",
    quotaExceeded: "Превышена квота запросов (Quota Exceeded). Пожалуйста, подождите минуту и попробуйте снова.",
    internalError: "Внутренняя ошибка сервера или проблема с подключением к Gemini API. Мы автоматически пробуем повторить запрос.",
    apiKeyError: "Ошибка API ключа. Пожалуйста, проверьте, что GEMINI_API_KEY установлен в настройках Secrets.",
    genericError: "Произошла ошибка при генерации. Пожалуйста, попробуйте позже.",
    emptySpeech: "Текст для озвучки пуст после очистки",
    missingApiKey: "Пожалуйста, введите API ключ в настройках для выбранного провайдера",
    
    // Form titles & card sections
    selectedTopicLabel: "Выбранная тема",
    additionalDataLabel: "Дополнительные данные (для интеграции)",
    senderLabel: "От чьего имени писать текст (автор)",
    offerLabel: "Наше предложение пользователю (оффер)",
    linkLabel: "Ссылка для перехода",
    toneLabel: "Тональность текста",
    voiceSettingsLabel: "Настройки озвучки текста",
    voiceSelectLabel: "Выберите голос",
    previewVoice: "Прослушать демо",
    
    // Variable Modal
    modalTitle: "Требуются дополнительные данные",
    modalIntro: "В шаблоне обнаружены неразрешенные переменные. Пожалуйста, заполните их для более точной и персонализированной генерации:",
    modalGenerate: "Применить и сгенерировать",
    
    // Fallback images description or generated text label
    textTabTitle: "Текст публикации",
    audioTabTitle: "Аудиозапись подкаста",
    imageTabTitle: "Иллюстрация к записи",
    statusGeneratingText: "Генерируем вовлекающий текст по теме...",
    statusGeneratingSpeech: "Озвучиваем текст...",
    statusProcessing: "Обработка...",
    
    // Periods options
    onToday: "На сегодня",
    onTomorrow: "На завтра",
    on3days: "На 3 дня",
    on5days: "На 5 дней",
    onWeek: "На неделю",

    // Placeholders
    senderPlaceholder: "Например: Михаил, основатель проекта",
    offerPlaceholder: "Например: Скидка 15% по промокоду SPRING",
    linkPlaceholder: "Например: https://myproject.ru/start",

    // Podcast Option options
    podStyleConversational: "Разговорный стиль",
    podStyleFriendly: "Доверительный / Дружеский",
    podStyleInspiring: "Мотивирующий / Вдохновляющий",
    podStyleEducational: "Информационный / Лекционный",
    podStyleStorytelling: "Сторителлинг",
    podFormatMonologue: "Монолог",
    podFormatDialogue: "Экспертный разбор",
  },
  en: {
    title: "AI Content",
    subtitle: "Workshop",
    themeLabel: "Theme Style",
    // Tabs
    tabPlan: "Content Plan",
    tabMail: "Newsletters",
    tabLong: "Longreads",
    tabPod: "Podcasts",
    tabVid: "Video Avatar",
    tabSettings: "Settings",
    
    // Niche Selection & Content plan input
    nicheLabel: "Topic, Niche or Project",
    nicheSelectorDesc: "Choose your business sphere or topic (e.g. Programming, Yoga, Coffee shop)",
    detailsLabel: "Details & Target Audience",
    detailsPlaceholder: "Describe uniqueness, target audience, or key features...",
    periodLabel: "Planning Period",
    channelsLabel: "Distribution Channels",
    generatePlanBtn: "Create Content Plan",
    generating: "Generating...",
    
    // Tone
    toneFriendly: "Friendly",
    toneProfessional: "Professional",
    tonePlayful: "Playful",
    toneInspiring: "Inspirational",
    
    // Audio options
    durationLabel: "Duration",
    styleLabel: "Script Style",
    formatLabel: "Podcast Format",
    genderLabel: "Voice Gender",
    speedLabel: "Speed",
    qualityLabel: "Quality",
    emotionLabel: "Emotion",
    female: "Female",
    male: "Male",
    
    // Video Avatar options
    avatarLabel: "Choose HeyGen Avatar",
    videoVoiceLabel: "HeyGen Video Voice",
    videoDurationLabel: "Video Duration",
    noHeyGenKey: "To use avatars, please set your HeyGen API Key in Nстройки (Settings).",
    
    // Actions & buttons
    chooseTopicAlert: "Please select a topic from your Content Plan first.",
    generateContentBtn: "Generate Content",
    regenerateSpeechBtn: "Regenerate Speech",
    copyBtn: "Copy",
    downloadBtn: "Download",
    tryAgain: "Retry",
    saveSettings: "Save Settings",
    saved: "Settings Saved!",
    
    // Errors
    keyRequiredError: "GEMINI_API_KEY is not detected. Please add it to Settings -> Secrets.",
    quotaExceeded: "Quota Exceeded (429). Please wait for a minute and try again.",
    internalError: "Internal server error or Gemini API connectivity problem. We are automatically retrying.",
    apiKeyError: "API Key Error. Please ensure GEMINI_API_KEY is configured in Secrets.",
    genericError: "An error occurred during generation. Please try again later.",
    emptySpeech: "Text for speech synthesis is empty after formatting",
    missingApiKey: "Please input the API key in settings for the chosen provider",
    
    // Form titles & card sections
    selectedTopicLabel: "Selected Topic",
    additionalDataLabel: "Additional Context (for integration)",
    senderLabel: "Author / Sender Name",
    offerLabel: "Promotion / Offer to integrate",
    linkLabel: "Call-to-Action Link",
    toneLabel: "Writing Tone",
    voiceSettingsLabel: "Speech Synthesis Settings",
    voiceSelectLabel: "Choose Voice",
    previewVoice: "Preview Voice",
    
    // Variable Modal
    modalTitle: "Additional Data Required",
    modalIntro: "We detected unresolved template parameters. Please fill them out to ensure a high-quality personalized output:",
    modalGenerate: "Apply and Generate",
    
    // Fallback images description or generated text label
    textTabTitle: "Generated Text",
    audioTabTitle: "Podcast Audio",
    imageTabTitle: "Article Illustration",
    statusGeneratingText: "Generating engaging copy...",
    statusGeneratingSpeech: "Performing speech synthesis...",
    statusProcessing: "Processing...",
    
    // Periods options
    onToday: "Today",
    onTomorrow: "Tomorrow",
    on3days: "3 Days",
    on5days: "5 Days",
    onWeek: "1 Week",

    // Placeholders
    senderPlaceholder: "E.g., Michael, project founder",
    offerPlaceholder: "E.g., 15% discount code SPRING",
    linkPlaceholder: "E.g., https://myproject.com/start",

    // Podcast Option options
    podStyleConversational: "Conversational Style",
    podStyleFriendly: "Trusting / Friendly",
    podStyleInspiring: "Motivating / Inspiring",
    podStyleEducational: "Informational / Editorial",
    podStyleStorytelling: "Storytelling",
    podFormatMonologue: "Monologue",
    podFormatDialogue: "Expert Discussion",
  }
};

const periodLabelMap: Record<string, { ru: string; en: string }> = {
  'На сегодня': { ru: 'На сегодня', en: 'Today' },
  'На завтра': { ru: 'На завтра', en: 'Tomorrow' },
  'На 3 дня': { ru: 'На 3 дня', en: '3 Days' },
  'На 5 дней': { ru: 'На 5 дней', en: '5 Days' },
  'На неделю': { ru: 'На неделю', en: '1 Week' },
};

function detectThemeFromNiche(niche: string, detail: string): string {
  const text = `${niche} ${detail}`.toLowerCase();
  
  if (
    text.includes('горы') || text.includes('альпы') || text.includes('лыжи') || text.includes('сноуборд') || 
    text.includes('снег') || text.includes('зима') || text.includes('альпинизм') || text.includes('туризм') ||
    text.includes('поход') || text.includes('вершин') || text.includes('горнолыж') || text.includes('outdoor') ||
    text.includes('фигурн') || text.includes('коньк') || text.includes('лед') || text.includes('ледовый')
  ) {
    return 'mountain';
  }

  if (
    text.includes('море') || text.includes('океан') || text.includes('пляж') || text.includes('серфинг') || 
    text.includes('карибы') || text.includes('плавание') || text.includes('вода') || text.includes('яхт') ||
    text.includes('дайвинг') || text.includes('морск') || text.includes('остров') || text.includes('круиз') ||
    text.includes('курорт') || text.includes('пальм')
  ) {
    return 'ocean';
  }

  if (
    text.includes('экология') || text.includes('растения') || text.includes('сад') || text.includes('цветы') || 
    text.includes('зелен') || text.includes('природ') || text.includes('ферма') || text.includes('лес') ||
    text.includes('дерев') || text.includes('дача') || text.includes('органик') || text.includes('веган') ||
    text.includes('эко')
  ) {
    return 'nature';
  }

  if (
    text.includes('it') || text.includes('программи') || text.includes('разработ') || text.includes('технолог') || 
    text.includes('веб') || text.includes('ии') || text.includes('ai') || text.includes('crypto') ||
    text.includes('блокчейн') || text.includes('смартфон') || text.includes('компьютер') || text.includes('код') ||
    text.includes('программист') || text.includes('кибер')
  ) {
    return 'tech';
  }

  if (
    text.includes('спорт') || text.includes('фитнес') || text.includes('трениров') || text.includes('бег') || 
    text.includes('йога') || text.includes('кроссфит') || text.includes('мышцы') || text.includes('похудение') ||
    text.includes('здоровье') || text.includes('зож') || text.includes('зарядка') || text.includes('гимнаст')
  ) {
    return 'fitness';
  }

  if (
    text.includes('бизнес') || text.includes('финанс') || text.includes('крипта') || text.includes('инвест') || 
    text.includes('деньги') || text.includes('акции') || text.includes('банк') || text.includes('маркетинг') ||
    text.includes('продажи') || text.includes('стартап') || text.includes('доход') || text.includes('экономика')
  ) {
    return 'finance';
  }

  if (
    text.includes('косметик') || text.includes('красот') || text.includes('салон') || text.includes('стиль') || 
    text.includes('макияж') || text.includes('мода') || text.includes('волосы') || text.includes('маникюр') ||
    text.includes('спа') || text.includes('wellness') || text.includes('парфюм') || text.includes('одежда')
  ) {
    return 'beauty';
  }

  if (
    text.includes('еда') || text.includes('ресторан') || text.includes('кафе') || text.includes('кулинар') || 
    text.includes('выпеч') || text.includes('кухня') || text.includes('повар') || text.includes('шеф') ||
    text.includes('кофе') || text.includes('рецепт') || text.includes('кондитер') || text.includes('чай')
  ) {
    return 'food';
  }

  if (
    text.includes('арт') || text.includes('фото') || text.includes('дизайн') || text.includes('рисование') || 
    text.includes('музык') || text.includes('кино') || text.includes('театр') || text.includes('творчеств') ||
    text.includes('живопись') || text.includes('актер') || text.includes('книги') || text.includes('литератур')
  ) {
    return 'art';
  }

  return 'default';
}

type Tab = 'plan' | 'newsletter' | 'longread' | 'podcast' | 'video' | 'settings';

export default function App() {
  const [lang, setLang] = useState<'ru' | 'en'>(() => {
    const saved = localStorage.getItem('ai_content_maker_lang');
    if (saved === 'en' || saved === 'ru') return saved;
    return 'ru';
  });

  useEffect(() => {
    localStorage.setItem('ai_content_maker_lang', lang);
  }, [lang]);

  const t = i18n[lang];

  // Column Width States and handlers for resizability
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem('ai_content_sidebar_width');
    return saved ? parseInt(saved, 10) : 288;
  });
  const [centralWidth, setCentralWidth] = useState(() => {
    const saved = localStorage.getItem('ai_content_central_width');
    return saved ? parseInt(saved, 10) : 450;
  });
  const [isDraggingSidebar, setIsDraggingSidebar] = useState(false);
  const [isDraggingCentral, setIsDraggingCentral] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const checkDesktop = () => setIsDesktop(window.innerWidth >= 1024);
    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);

  const startResizingSidebar = (mouseDownEvent: React.MouseEvent) => {
    mouseDownEvent.preventDefault();
    setIsDraggingSidebar(true);
  };

  const startResizingCentral = (mouseDownEvent: React.MouseEvent) => {
    mouseDownEvent.preventDefault();
    setIsDraggingCentral(true);
  };

  useEffect(() => {
    if (!isDraggingSidebar && !isDraggingCentral) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingSidebar) {
        const newWidth = Math.max(180, Math.min(450, e.clientX));
        setSidebarWidth(newWidth);
      } else if (isDraggingCentral) {
        const newWidth = Math.max(300, Math.min(700, e.clientX - sidebarWidth));
        setCentralWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsDraggingSidebar(false);
      setIsDraggingCentral(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingSidebar, isDraggingCentral, sidebarWidth, centralWidth]);

  useEffect(() => {
    localStorage.setItem('ai_content_sidebar_width', String(sidebarWidth));
    localStorage.setItem('ai_content_central_width', String(centralWidth));
  }, [sidebarWidth, centralWidth]);

  const [activeTab, setActiveTab] = useState<Tab>('plan');

  useEffect(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsBrowserTtsPlaying(false);
    }
  }, [activeTab]);
  const [currentTheme, setCurrentTheme] = useState<string>('default');
  const [settings, setSettings] = useState<Settings>(() => {
    const saved = localStorage.getItem('ai_content_maker_settings');
    return saved ? JSON.parse(saved) : {
      heygenApiKey: '',
      ttsProvider: 'gemini',
      ttsApiKey: ''
    };
  });

  // Content Plan State
  const [niche, setNiche] = useState('');
  const [nicheDetail, setNicheDetail] = useState('');
  const [focusedNicheField, setFocusedNicheField] = useState<string | null>(null);
  const [showValidationErrors, setShowValidationErrors] = useState(false);
  const [channels, setChannels] = useState<string[]>(['Email', 'Telegram']);
  const [period, setPeriod] = useState(() => {
    const curHour = new Date().getHours();
    return curHour >= 19 ? 'На завтра' : 'На сегодня';
  });
  const [plan, setPlan] = useState<ContentPlanItem[]>([]);
  const [isLoadingPlan, setIsLoadingPlan] = useState(false);

  // Newsletter & Longread State
  const [selectedTopic, setSelectedTopic] = useState('');
  const [senderName, setSenderName] = useState('');
  const [offer, setOffer] = useState('');
  const [transitionLink, setTransitionLink] = useState('');
  const [tone, setTone] = useState('Friendly');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, GeneratedContent | null>>({
    newsletter: null,
    longread: null,
    podcast: null,
    video: null
  });

  const currentResult = results[activeTab] || null;

  // Variable Modal State
  const [isVarModalOpen, setIsVarModalOpen] = useState(false);
  const [isEditingResult, setIsEditingResult] = useState(false);
  const [detectedVars, setDetectedVars] = useState<any[]>([]);
  const [varValues, setVarValues] = useState<Record<string, string>>({});
  const [generationContext, setGenerationContext] = useState<{
    type: 'newsletter' | 'longread' | 'podcast' | 'video';
    basePrompt: string;
    topic: string;
  } | null>(null);

  // Podcast State
  const [duration, setDuration] = useState('1 мин');
  const [podcastStyle, setPodcastStyle] = useState('conversational');
  const [podcastFormat, setPodcastFormat] = useState('monologue');
  const [audioSettings, setAudioSettings] = useState({
    gender: 'Female',
    speed: 1.0,
    quality: 'High',
    emotion: 'Friendly'
  });
  const [isAudioGenerating, setIsAudioGenerating] = useState(false);
  const [isBrowserTtsPlaying, setIsBrowserTtsPlaying] = useState(false);

  // Video State
  const [avatars, setAvatars] = useState<any[]>([]);
  const [selectedAvatar, setSelectedAvatar] = useState('');
  const [videoDuration, setVideoDuration] = useState('30 сек');
  const [selectedVideoVoiceId, setSelectedVideoVoiceId] = useState('');
  const [selectedVoiceId, setSelectedVoiceId] = useState('');
  const [isPreviewing, setIsPreviewing] = useState<string | null>(null);
  const [isVideoGenerating, setIsVideoGenerating] = useState(false);
  const [videoProgress, setVideoProgress] = useState<number | null>(null);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [validatingKeys, setValidatingKeys] = useState<Record<string, 'loading' | 'success' | 'error' | null>>({});

  const [isSettingsSaved, setIsSettingsSaved] = useState(false);

  useEffect(() => {
    localStorage.setItem('ai_content_maker_settings', JSON.stringify(settings));
  }, [settings]);

  const handleSaveSettings = () => {
    setIsSettingsSaved(true);
    setTimeout(() => setIsSettingsSaved(false), 3000);
  };

  useEffect(() => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'undefined' || apiKey === '') {
      setError(lang === 'en' ? "GEMINI_API_KEY is not detected. Please add it to Settings -> Secrets." : "GEMINI_API_KEY не обнаружен. Пожалуйста, добавьте его в Settings -> Secrets.");
    } else {
      setError(null);
    }
  }, [lang]);

  useEffect(() => {
    if (activeTab === 'video' && settings.heygenApiKey && avatars.length === 0) {
      fetchAvatars();
    }
  }, [activeTab, settings.heygenApiKey]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const getErrorMessage = (err: any) => {
    const msg = (err?.message || '').toLowerCase();
    
    if (msg.includes('модель озвучки') || msg.includes('speech model') || msg.includes('not supported by the audioout model')) {
      return lang === 'en'
        ? "The speech model could not process this text. It may be too long or contain unsupported characters. Try shortening it."
        : "Модель озвучки не смогла обработать этот текст. Возможно, он слишком длинный или содержит неподдерживаемые символы. Попробуйте сократить текст или изменить его.";
    }

    if (msg.includes('429') || msg.includes('resource_exhausted') || msg.includes('quota')) {
      return lang === 'en'
        ? "Quota exceeded for Gemini API requests (Quota Exceeded). Please wait a minute and try again."
        : "Превышена квота запросов (Quota Exceeded). Пожалуйста, подождите минуту и попробуйте снова.";
    }
    
    if (
      msg.includes('500') || 
      msg.includes('internal') || 
      msg.includes('failed to call the gemini api') || 
      msg.includes('please try again') ||
      msg.includes('service unavailable') ||
      msg.includes('deadline exceeded')
    ) {
      return lang === 'en'
        ? "Internal server error or connection issue with Gemini API. We are auto-retrying. If it persists, please try again in a moment."
        : "Внутренняя ошибка сервера или проблема с подключением к Gemini API. Мы автоматически пробуем повторить запрос. Если ошибка сохраняется, попробуйте еще раз через несколько секунд.";
    }
    
    if (msg.includes('api key')) {
      return lang === 'en'
        ? "API Key error. Please verify GEMINI_API_KEY is set in Settings secrets."
        : "Ошибка API ключа. Пожалуйста, проверьте, что GEMINI_API_KEY установлен в настройках Secrets.";
    }

    if (err?.message && err.message.length < 150 && !err.message.includes('{')) {
      return lang === 'en' ? `Error: ${err.message}` : `Ошибка: ${err.message}`;
    }

    return lang === 'en' ? "An error occurred during generation. Please try again later." : "Произошла ошибка при генерации. Пожалуйста, попробуйте позже.";
  };

  const handleUpdateResultText = (newText: string) => {
    if (currentResult) {
      setResults(prev => ({
        ...prev,
        [activeTab]: { ...currentResult, text: newText }
      }));
    }
  };

  const handleDownload = (content: GeneratedContent) => {
    const element = document.createElement("a");
    const file = new Blob([content.text], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `${content.title}.txt`;
    document.body.appendChild(element);
    element.click();
  };

  const handleGeneratePlan = async () => {
    if (!niche.trim() || !nicheDetail.trim()) {
      setShowValidationErrors(true);
      return;
    }
    setShowValidationErrors(false);
    setIsLoadingPlan(true);
    setError(null);
    try {
      const detected = detectThemeFromNiche(niche, nicheDetail);
      setCurrentTheme(detected);

      const fullNiche = niche + (nicheDetail ? `: ${nicheDetail}` : '');
      const data = await generateContentPlan(fullNiche, channels, period, lang);
      setPlan(data.map((item: any, idx: number) => ({ ...item, id: Math.random().toString(36).substr(2, 9) })));
    } catch (error) {
      console.error(error);
      setError(getErrorMessage(error));
    } finally {
      setIsLoadingPlan(false);
    }
  };

  const startGeneration = async (type: 'newsletter' | 'longread' | 'podcast' | 'video') => {
    if (!selectedTopic) {
      setError(lang === 'en' ? "Please select a topic from your content plan first." : "Пожалуйста, сначала выберите тему из контент-плана.");
      return;
    }
    const topic = selectedTopic;
    let basePrompt = "";
    
    // Build context about the optional fields
    let extraContext = "";
    if (senderName.trim()) {
      extraContext += lang === 'en'
        ? `\n- On whose behalf to write (author): ${senderName.trim()}`
        : `\n- От чьего имени писать текст (автор): ${senderName.trim()}`;
    }
    if (offer.trim()) {
      extraContext += lang === 'en'
        ? `\n- Our offer / promo to the user (offer): ${offer.trim()}`
        : `\n- Наше предложение пользователю (оффер): ${offer.trim()}`;
    }
    if (transitionLink.trim()) {
      extraContext += lang === 'en'
        ? `\n- Link for action: ${transitionLink.trim()}`
        : `\n- Ссылка для перехода: ${transitionLink.trim()}`;
    }

    if (type === 'newsletter') {
      basePrompt = lang === 'en'
        ? `You are a professional content maker who knows everything about creating high-quality content for newsletters and social media. Create an English email newsletter content on the topic: "${topic}". Tone: ${tone}.
        CRITICAL: The text must be concise and short (about half of a standard newsletter, around 150-200 words).
        Create the text and a subject line that drives maximum traffic. The subject line should be catchy and compel the user to open the email.${extraContext ? `\n\nAdditional data to integrate into the text:${extraContext}` : ""}`
        : `Ты – профессиональный контент-мейкер, знаешь всё про создание качественного контента для рассылок и социальных сетей. Создай русский текст письма для e-mail-рассылки на тему: "${topic}". Тон: ${tone}. 
        ВАЖНО: Текст должен быть лаконичным и коротким (примерно в 2 раза короче стандартного письма, около 150-200 слов). 
        Создай текст и заголовок письма такими, чтобы привлечь максимальный трафик, включая заголовок письма, который должен привлекать внимание и заставлять пользователя открыть письмо.${extraContext ? `\n\nДополнительные данные для интеграции в текст:${extraContext}` : ""}`;
    } else if (type === 'longread') {
      basePrompt = lang === 'en'
        ? `You are a professional content maker who knows everything about creating high-quality content for newsletters and social media. Create an English longread (detailed article) of about 400-500 words on the topic: "${topic}". Tone: ${tone}. Create the longread to drive maximum traffic.${extraContext ? `\n\nAdditional data to integrate into the longread:${extraContext}` : ""}`
        : `Ты – профессиональный контент-мейкер, знаешь всё про создание качественного контента для рассылок и социальных сетей. Создай лонгрид (длинный текст на русском языке) примерно на 400-500 слов на тему: "${topic}". Тон: ${tone}. Создай лонгрид таким, чтобы привлечь максимальный трафик.${extraContext ? `\n\nДополнительные данные для интеграции в лонгрид:${extraContext}` : ""}`;
    } else if (type === 'podcast') {
      basePrompt = lang === 'en'
        ? `You are a professional content maker who knows everything about creating high-quality content for weddings, education, newsletters, and social media. Create an English podcast script on the topic: "${topic}". Duration: ${duration}. Style: ${podcastStyle}. Format: ${podcastFormat}. Create the script to drive maximum traffic.
        CRITICAL: The generated script must contain ONLY the actual text that should be spoken out loud by the speaker. Do NOT include ANY stage directions, parenthetical instructions, sound effects, intro/outro descriptions, music cues (like [Sound of music], [Intro starts], 🎙️ [Upbeat music playing], etc.), emojis inside the text, or formatting labels like "Speaker 1:" or "Host:". Output ONLY the direct, continuous spoken monologue or dialogue lines. Anything inside square/round brackets is strictly forbidden.${extraContext ? `\n\nAdditional data to integrate into the podcast script:${extraContext}` : ""}`
        : `Ты – профессиональный контент-мейкер, знаешь всё про создание качественного контента для рассылок и социальных сетей. Создай русский сценарий текста подкаста на тему: "${topic}". Длительность: ${duration}. Стиль: ${podcastStyle}. Формат: ${podcastFormat}. Создай текст таким, чтобы привлечь максимальный трафик.
        ВАЖНО: Готовый сценарий должен содержать ТОЛЬКО непосредственно произносимый диктором текст. Категорически ЗАПРЕЩЕНО включать любые режиссерские ремарки, звуковые эффекты, описание музыки, заставок (например: [Звучит музыка], [Вступление], 🎙️ [Звучит динамичная заставка], и т.д.), смайлики/эмодзи внутри текста или пометки ролей типа "Диктор:" или "Ведущий:". Выводи только чистую непрерывную речь, которую диктор озвучит слово в слово. Любые скобки [ ] или ( ) с пояснениями строго запрещены.${extraContext ? `\n\nДополнительные данные для интеграции в текст подкаста:${extraContext}` : ""}`;
    } else if (type === 'video') {
      basePrompt = lang === 'en'
        ? `You are a professional content maker who knows everything about creating high-quality content for newsletters and social media. Create an English video avatar script on the topic: "${topic}". Video duration: ${videoDuration}. Create the script to drive maximum traffic.${extraContext ? `\n\nAdditional data to integrate into the video avatar script:${extraContext}` : ""}`
        : `Ты – профессиональный контент-мейкер, знаешь всё про создание качественного контента для рассылок и социальных сетей. Создай сценарий текста на русском языке для озвучивания с помощью видео-аватара на тему: "${topic}". Длительность видео: ${videoDuration}. Создай текст таким, чтобы привлечь максимальный трафик.${extraContext ? `\n\nДополнительные данные для интеграции в текст видео-аватара:${extraContext}` : ""}`;
    }

    setIsGenerating(true);
    setIsEditingResult(false);
    setError(null);
    try {
      const text = await generateText(basePrompt, {}, lang);
      let imageUrl: string | undefined = undefined;
      
      if (type === 'newsletter' || type === 'longread') {
        try {
          imageUrl = await generateImage(topic, "1:1", lang) || undefined;
        } catch (imgError) {
          console.warn("Failed to generate image, using text only:", imgError);
        }
      }

      setResults(prev => ({
        ...prev,
        [type]: {
          id: Date.now().toString(),
          type,
          title: topic,
          text,
          imageUrl,
          timestamp: Date.now()
        }
      }));
    } catch (error) {
      console.error(error);
      setError(getErrorMessage(error));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleContinueGeneration = async () => {
    if (!generationContext) return;
    setIsGenerating(true);
    setError(null);
    try {
      const { type, basePrompt, topic } = generationContext;
      const text = await generateText(basePrompt, varValues, lang);
      let imageUrl: string | undefined = undefined;

      if (type === 'newsletter' || type === 'longread') {
        try {
          imageUrl = await generateImage(topic, "1:1", lang) || undefined;
        } catch (imgError) {
          console.warn("Failed to generate image in continuation, using text only:", imgError);
        }
      }

      setResults(prev => ({
        ...prev,
        [type]: {
          id: Date.now().toString(),
          type,
          title: topic,
          text,
          imageUrl,
          timestamp: Date.now()
        }
      }));
      setIsVarModalOpen(false);
      setGenerationContext(null);
    } catch (error) {
      console.error(error);
      setError(getErrorMessage(error));
    } finally {
      setIsGenerating(false);
    }
  };

  const validateApiKey = async (type: 'heygen' | 'tts') => {
    setValidatingKeys(prev => ({ ...prev, [type]: 'loading' }));
    try {
      const key = type === 'heygen' ? settings.heygenApiKey : settings.ttsApiKey;
      if (!key) throw new Error(lang === 'en' ? 'Key not entered' : 'Ключ не введен');

      if (type === 'heygen') {
        const res = await fetch('/api/heygen/validate', {
          headers: { 'x-api-key': key }
        });
        if (!res.ok) throw new Error(lang === 'en' ? 'Invalid key' : 'Неверный ключ');
      } else if (type === 'tts') {
        if (settings.ttsProvider === 'elevenlabs') {
          const res = await fetch('/api/tts/elevenlabs/validate', {
            headers: { 'x-api-key': key }
          });
          if (!res.ok) throw new Error(lang === 'en' ? 'Invalid key' : 'Неверный ключ');
        } else {
          // For other providers, we just simulate success for now or add specific checks
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      setValidatingKeys(prev => ({ ...prev, [type]: 'success' }));
      setTimeout(() => setValidatingKeys(prev => ({ ...prev, [type]: null })), 3000);
    } catch (err: any) {
      console.error(err);
      setValidatingKeys(prev => ({ ...prev, [type]: 'error' }));
      setTimeout(() => setValidatingKeys(prev => ({ ...prev, [type]: null })), 3000);
    }
  };

  const handleTts = async (overrideText?: string, overrideVoice?: string) => {
    const textToSpeak = overrideText || currentResult?.text;
    if (!textToSpeak) return;
    
    // Automatically trim if too long, instead of blocking confirm()
    if (textToSpeak.length > 3000 && !overrideText) {
      console.warn('Text is too long for TTS, will be trimmed by the service.');
    }
    
    const provider = settings.ttsProvider;
    const voiceId = overrideVoice || selectedVoiceId || VOICES[provider][0].id;

    if (provider !== 'gemini' && !settings.ttsApiKey) {
      setError(lang === 'en' ? 'Please enter the API key in the settings for the selected provider' : 'Пожалуйста, введите API ключ в настройках для выбранного провайдера');
      return;
    }
    
    if (!overrideText) setIsAudioGenerating(true);
    try {
      if (provider === 'gemini') {
        const audioUrl = await generateSpeech(textToSpeak, voiceId, lang);
        if (audioUrl) {
          if (overrideText) return audioUrl;
          setResults(prev => ({
            ...prev,
            [activeTab]: { ...currentResult!, audioUrl }
          }));
        }
      } else if (provider === 'elevenlabs') {
        const response = await axios.post('/api/tts/elevenlabs', {
          text: textToSpeak,
          voiceId: voiceId,
          settings: {
            stability: 0.5,
            similarity_boost: 0.5,
            speed: audioSettings.speed
          }
        }, {
          headers: { 'x-api-key': settings.ttsApiKey },
          responseType: 'blob'
        });
        const url = URL.createObjectURL(response.data);
        if (overrideText) return url;
        setResults(prev => ({
          ...prev,
          [activeTab]: { ...currentResult!, audioUrl: url }
        }));
      }
    } catch (error: any) {
      console.error(error);
      const isInternalError = 
        error?.message?.includes("500") || 
        error?.status === "INTERNAL" || 
        error?.message?.includes("Internal error") ||
        error?.message?.includes("Failed to call the Gemini API") ||
        error?.message?.includes("Please try again");
      const message = isInternalError 
        ? (lang === 'en' ? "Internal Gemini server error. Please try again in a few seconds or choose another voice." : "Внутренняя ошибка сервера Gemini. Пожалуйста, попробуйте еще раз через несколько секунд или выберите другой голос.")
        : (lang === 'en' ? `Speech synthesis error: ${error?.message || 'Unknown error'}` : `Ошибка озвучки: ${error?.message || 'Неизвестная ошибка'}`);
      setError(message);
    } finally {
      if (!overrideText) setIsAudioGenerating(false);
    }
  };

  const speakWithBrowserTTS = (text: string) => {
    if (!('speechSynthesis' in window)) {
      setError(lang === 'en' ? 'Web Speech API is not supported in this browser' : 'Ваш браузер не поддерживает встроенный синтез речи');
      return;
    }

    if (isBrowserTtsPlaying) {
      window.speechSynthesis.cancel();
      setIsBrowserTtsPlaying(false);
      return;
    }

    window.speechSynthesis.cancel();

    // Clean text
    const cleanedText = text
      .substring(0, 3000)
      .replace(/[#*`_~>]/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/\{[^\}]+\}/g, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanedText);
    utterance.lang = lang === 'en' ? 'en-US' : 'ru-RU';
    utterance.rate = audioSettings.speed || 1.0;

    const voices = window.speechSynthesis.getVoices();
    const currentVoiceObj = VOICES[settings.ttsProvider]?.find(v => v.id === selectedVoiceId);
    const isFemale = currentVoiceObj?.gender === 'female';

    const matchingVoice = voices.find(v => {
      const matchesLang = lang === 'en' ? v.lang.startsWith('en') : v.lang.startsWith('ru');
      if (!matchesLang) return false;
      const lowerName = v.name.toLowerCase();
      if (isFemale) {
        return lowerName.includes('female') || lowerName.includes('zira') || lowerName.includes('irina') || lowerName.includes('google') || lowerName.includes('alena');
      } else {
        return lowerName.includes('male') || lowerName.includes('david') || lowerName.includes('pavel') || lowerName.includes('dmitry');
      }
    }) || voices.find(v => lang === 'en' ? v.lang.startsWith('en') : v.lang.startsWith('ru'));

    if (matchingVoice) {
      utterance.voice = matchingVoice;
    }

    utterance.onend = () => {
      setIsBrowserTtsPlaying(false);
    };

    utterance.onerror = () => {
      setIsBrowserTtsPlaying(false);
    };

    setIsBrowserTtsPlaying(true);
    window.speechSynthesis.speak(utterance);
  };

  const handlePreviewVoice = async (voiceId: string) => {
    setIsPreviewing(voiceId);
    try {
      const previewText = lang === 'en' ? "Hello! This is an example of my voice. How do you like it?" : "Привет! Это пример моего голоса. Как я тебе?";
      const previewUrl = await handleTts(previewText, voiceId);
      if (previewUrl) {
        const audio = new Audio(previewUrl as string);
        audio.play();
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsPreviewing(null);
    }
  };

  const fetchAvatars = async () => {
    if (!settings.heygenApiKey) return;
    try {
      const response = await axios.get('/api/heygen/avatars', {
        headers: { 'x-api-key': settings.heygenApiKey }
      });
      setAvatars(response.data.data.avatars);
    } catch (error) {
      console.error(error);
    }
  };

  const translateHeyGenError = (error: any): string => {
    if (typeof error === 'string') {
      if (error.toLowerCase().includes('insufficient_credits')) return lang === 'en' ? "Insufficient credits on your HeyGen balance." : "Недостаточно кредитов на балансе HeyGen.";
      if (error.toLowerCase().includes('invalid_api_key')) return lang === 'en' ? "Invalid HeyGen API key." : "Неверный API ключ HeyGen.";
      if (error.toLowerCase().includes('limit exceeded')) return lang === 'en' ? "Request limit exceeded." : "Превышен лимит запросов.";
      return error;
    }

    const status = error.response?.status;
    const message = error.response?.data?.error?.message || error.message || "";
    const code = error.response?.data?.error?.code;

    if (status === 401 || code === 'invalid_api_key' || message.toLowerCase().includes('unauthorized')) {
      return lang === 'en' ? "Invalid HeyGen API key. Please verify your settings." : "Неверный API ключ HeyGen. Пожалуйста, проверьте настройки.";
    }
    if (status === 402 || message.toLowerCase().includes('credit') || message.toLowerCase().includes('insufficient')) {
      return lang === 'en' ? "Insufficient credits on HeyGen balance to create this video." : "Недостаточно кредитов на балансе HeyGen для создания видео.";
    }
    if (status === 429) {
      return lang === 'en' ? "Too many requests to HeyGen. Please wait a little bit." : "Слишком много запросов к HeyGen. Пожалуйста, подождите немного.";
    }
    if (status === 404) {
      return lang === 'en' ? "HeyGen resource not found (404). Selected avatar/voice might be unavailable." : "Ресурс HeyGen не найден (404). Возможно, выбранный аватар или голос недоступны.";
    }
    if (status >= 500) {
      return lang === 'en' ? "Internal HeyGen server error. Please try again later." : "Внутренняя ошибка сервера HeyGen. Попробуйте повторить попытку позже.";
    }
    if (message.includes('Network Error') || message.includes('ECONNREFUSED')) {
      return lang === 'en' ? "Network error. Failed to reach HeyGen servers." : "Ошибка сети. Не удалось связаться с серверами HeyGen.";
    }

    return message || (lang === 'en' ? "An unknown error occurred while communicating with HeyGen." : "Произошла неизвестная ошибка при работе с HeyGen.");
  };

  const createHeyGenVideo = async () => {
    const videoResult = results['video'];
    if (!videoResult || !settings.heygenApiKey || !selectedAvatar) return;
    setIsVideoGenerating(true);
    setVideoProgress(0);
    setVideoError(null);
    try {
      const response = await axios.post('/api/heygen/video', {
        video_inputs: [
          {
            character: {
              type: "avatar",
              avatar_id: selectedAvatar,
              avatar_style: "normal"
            },
            input_text: videoResult.text,
            voice: {
              type: "text",
              input_text: videoResult.text,
              voice_id: selectedVideoVoiceId || "2d4a99785c894bc382054f16625bc26e" // Default Russian
            }
          }
        ],
        dimension: { width: 1280, height: 720 }
      }, {
        headers: { 'x-api-key': settings.heygenApiKey }
      });
      
      const videoId = response.data.data.video_id;
      // Poll for status
      const checkStatus = setInterval(async () => {
        try {
          const statusRes = await axios.get(`/api/heygen/video/${videoId}`, {
            headers: { 'x-api-key': settings.heygenApiKey }
          });
          
          const { status, progress, error } = statusRes.data.data;
          
          if (progress !== undefined) {
            setVideoProgress(progress);
          }

          if (status === 'completed') {
            clearInterval(checkStatus);
            setResults(prev => ({
              ...prev,
              video: prev.video ? { ...prev.video, videoUrl: statusRes.data.data.video_url } : null
            }));
            setIsVideoGenerating(false);
            setVideoProgress(null);
          } else if (status === 'failed') {
            clearInterval(checkStatus);
            setIsVideoGenerating(false);
            setVideoProgress(null);
            setVideoError(translateHeyGenError(error?.message || "Ошибка генерации видео в HeyGen"));
          }
        } catch (pollError: any) {
          clearInterval(checkStatus);
          setIsVideoGenerating(false);
          setVideoProgress(null);
          setVideoError(translateHeyGenError(pollError));
        }
      }, 5000);
    } catch (error: any) {
      console.error(error);
      setIsVideoGenerating(false);
      setVideoProgress(null);
      setVideoError(translateHeyGenError(error));
    }
  };

  const navItems = [
    { id: 'plan', label: t.tabPlan, icon: LayoutDashboard },
    { id: 'newsletter', label: t.tabMail, icon: Mail },
    { id: 'longread', label: t.tabLong, icon: FileText },
    { id: 'podcast', label: t.tabPod, icon: Mic },
    { id: 'video', label: t.tabVid, icon: Video },
  ];

  const activeTheme = THEME_PRESETS[currentTheme] || THEME_PRESETS.default;

  return (
    <div 
      className={cn(
        "flex flex-col lg:flex-row h-screen lg:overflow-hidden overflow-y-auto lg:overflow-y-hidden transition-all duration-1000 bg-gradient-to-br relative", 
        activeTheme.bgGradient,
        (isDraggingSidebar || isDraggingCentral) && "select-none"
      )}
      style={{
        '--color-primary': activeTheme.primary,
        '--color-secondary': activeTheme.secondary,
      } as React.CSSProperties}
    >
      {/* Interactive background ambient neon blobs */}
      <div 
        className="absolute top-[10%] right-[15%] w-[450px] h-[450px] rounded-full bg-primary/15 blur-[130px] pointer-events-none animate-pulse-slow z-0 transition-all duration-1000" 
      />
      <div 
        className="absolute bottom-[10%] left-[25%] w-[350px] h-[350px] rounded-full bg-secondary/10 blur-[110px] pointer-events-none animate-pulse-slow z-0 transition-all duration-1000" 
        style={{ animationDelay: '2s' }}
      />

      {/* Sidebar */}
      <aside 
        style={{ width: isDesktop ? `${sidebarWidth}px` : undefined }}
        className="w-full bg-white/80 backdrop-blur-xl border-b lg:border-b-0 flex flex-col shrink-0 shadow-[1px_0_10px_rgba(0,0,0,0.01)] relative z-10"
      >
        <div className="p-5 sm:p-8 flex flex-row lg:flex-col justify-between items-center lg:items-start gap-4 shrink-0">
          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl font-bold font-display flex items-center gap-2">
              <RefreshCw className="w-5 h-5 sm:w-6 sm:h-6 animate-spin-slow text-primary shrink-0" />
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">{t.title}</span>
            </h1>
            <p className="text-[9px] text-slate-400 uppercase tracking-widest font-extrabold hidden sm:block">{t.subtitle}</p>
          </div>
          
          {/* Language Switcher */}
          <div className="flex items-center gap-0.5 p-0.5 bg-slate-100 border border-slate-200/40 rounded-lg shrink-0">
            <button
              onClick={() => setLang('ru')}
              className={cn("px-1.5 py-0.5 text-[9px] font-bold rounded transition-all", lang === 'ru' ? "bg-white text-slate-800 shadow-[0_1px_2px_rgba(0,0,0,0.05)]" : "text-slate-400 hover:text-slate-600")}
            >
              RU
            </button>
            <button
              onClick={() => setLang('en')}
              className={cn("px-1.5 py-0.5 text-[9px] font-bold rounded transition-all", lang === 'en' ? "bg-white text-slate-800 shadow-[0_1px_2px_rgba(0,0,0,0.05)]" : "text-slate-400 hover:text-slate-600")}
            >
              EN
            </button>
          </div>
        </div>

        <nav className="flex-1 px-4 pb-4 lg:pb-0 flex flex-row lg:flex-col gap-1.5 overflow-x-auto lg:overflow-x-visible no-scrollbar shrink-0">
          {navItems.map((item) => (
            <button
               key={item.id}
               onClick={() => setActiveTab(item.id as Tab)}
               className={cn(
                 "sidebar-item whitespace-nowrap lg:w-full py-2.5 sm:py-3",
                 activeTab === item.id && "active"
               )}
            >
              <item.icon className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
              <span className="font-semibold text-xs sm:text-sm">{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Desktop Theme Banner & Settings */}
        {currentTheme !== 'default' && (
          <div className="px-4 hidden lg:block pb-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: -5 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="p-3 rounded-2xl border bg-primary/5 border-primary/10 flex items-center gap-3 shadow-sm"
            >
              <span className="text-xl animate-bounce shrink-0">{activeTheme.emoji}</span>
              <div className="overflow-hidden">
                <p className="text-[8px] uppercase tracking-widest text-slate-400 font-bold leading-none mb-1">{t.themeLabel}</p>
                <p className="text-xs font-bold text-primary truncate leading-none">{activeTheme.name[lang] || activeTheme.name.ru}</p>
              </div>
            </motion.div>
          </div>
        )}
      </aside>

      {/* Resizer 1 (Sidebar - Content) */}
      <div
        className={cn(
          "hidden lg:block w-1 hover:w-1.5 active:w-1.5 bg-slate-300/30 hover:bg-primary/40 active:bg-primary/60 cursor-col-resize transition-all relative z-40 shrink-0",
          isDraggingSidebar && "bg-primary/50 w-1.5"
        )}
        onMouseDown={startResizingSidebar}
      />

      {/* Main Content */}
      <main className="flex-1 flex flex-col lg:flex-row lg:overflow-hidden relative z-10">
        {/* Central Panel */}
        <div 
          style={{ width: isDesktop ? `${centralWidth}px` : undefined }}
          className="w-full p-5 sm:p-8 lg:overflow-y-auto border-b lg:border-b-0 bg-white/40 backdrop-blur-xl shrink-0"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 15 }}
              transition={{ duration: 0.2 }}
              className="space-y-8"
            >
              <div>
                <h2 className="text-3xl font-bold font-display text-slate-900 tracking-tight">
                  {navItems.find(i => i.id === activeTab)?.label || t.tabSettings}
                </h2>
                <p className="text-slate-500 text-sm mt-1.5 leading-relaxed">
                  {lang === 'en' ? 'Configure settings for content generation' : 'Настройте параметры для генерации контента'}
                </p>
              </div>

              {activeTab === 'plan' && (
                <div className="space-y-6">
                  <div className="space-y-3">
                    <label className="text-sm font-semibold text-slate-700">{t.nicheLabel}</label>
                    <input 
                      type="text" 
                      placeholder={focusedNicheField === 'niche' ? '' : (lang === 'en' ? 'E.g. Programming, Yoga, Design' : 'Название')} 
                      value={niche} 
                      onChange={(e) => {
                        setNiche(e.target.value);
                        if (e.target.value.trim()) setShowValidationErrors(false);
                      }}
                      onFocus={() => setFocusedNicheField('niche')}
                      onBlur={() => setFocusedNicheField(null)}
                      className={cn(
                        "modern-input",
                        showValidationErrors && !niche.trim() && "border-red-500 focus:ring-red-500/10"
                      )}
                    />
                    <div className="relative">
                      <textarea 
                        rows={3}
                        maxLength={500}
                        placeholder={focusedNicheField === 'nicheDetail' ? '' : t.detailsPlaceholder} 
                        value={nicheDetail}
                        onChange={(e) => {
                          setNicheDetail(e.target.value);
                          if (e.target.value.trim()) setShowValidationErrors(false);
                        }}
                        onFocus={() => setFocusedNicheField('nicheDetail')}
                        onBlur={() => setFocusedNicheField(null)}
                        className={cn(
                          "modern-input resize-none",
                          showValidationErrors && !nicheDetail.trim() && "border-red-500 focus:ring-red-500/10"
                        )}
                      />
                      <div className="text-right text-[10px] text-slate-400 mt-1 font-medium italic">
                        {lang === 'en' ? `${nicheDetail.length} / 500 characters` : `${nicheDetail.length} / 500 символов`}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-sm font-semibold text-slate-700">{t.channelsLabel}</label>
                    <div className="flex flex-wrap gap-2.5">
                      {['Email', 'Telegram', 'ВКонтакте'].map(c => {
                        const channelLabel = c === 'ВКонтакте' && lang === 'en' ? 'VKontakte' : c;
                        return (
                          <button
                            key={c}
                            onClick={() => setChannels(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c])}
                            className={cn(
                              "px-5 py-2.5 rounded-full border text-sm font-semibold transition-all duration-300 hover:scale-[1.03] active:scale-[0.97]",
                              channels.includes(c) 
                                ? "bg-primary text-white border-primary shadow-lg shadow-primary/20" 
                                : "bg-white/80 backdrop-blur-sm text-slate-650 border-slate-200/80 hover:border-primary/40 hover:text-primary"
                            )}
                          >
                            {channelLabel}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-sm font-semibold text-slate-700">{t.periodLabel}</label>
                    <div className="grid grid-cols-2 gap-2.5">
                      {(() => {
                        const curHour = new Date().getHours();
                        const periods = curHour >= 19 
                          ? ['На завтра', 'На 3 дня', 'На 5 дней', 'На неделю']
                          : ['На сегодня', 'На 3 дня', 'На 5 дней', 'На неделю'];
                        return periods.map(p => (
                          <button
                            key={p}
                            onClick={() => setPeriod(p)}
                            className={cn(
                              "px-4 py-3 rounded-2xl border text-sm font-semibold transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]",
                              period === p 
                                ? "bg-primary text-white border-primary shadow-lg shadow-primary/20" 
                                : "bg-white/80 backdrop-blur-sm text-slate-650 border-slate-200/80 hover:border-primary/40 hover:text-primary"
                            )}
                          >
                            {periodLabelMap[p]?.[lang] || p}
                          </button>
                        ));
                      })()}
                    </div>
                  </div>

                  <button 
                    onClick={handleGeneratePlan}
                    disabled={isLoadingPlan}
                    className="w-full py-4 bg-primary text-white rounded-2xl font-bold transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2.5 hover:scale-[1.02] active:scale-[0.98]"
                    style={{
                      boxShadow: '0 12px 30px -10px var(--color-primary)'
                    }}
                  >
                    {isLoadingPlan ? <RefreshCw className="w-5 h-5 animate-spin" /> : <LayoutDashboard className="w-5 h-5" />}
                    {isLoadingPlan ? t.generating : t.generatePlanBtn}
                  </button>
                </div>
              )}

              {(activeTab === 'newsletter' || activeTab === 'longread' || activeTab === 'podcast' || activeTab === 'video') && (
                <div className="space-y-6">
                  {activeTab === 'longread' && (
                    <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-amber-805 text-sm flex items-start gap-2.5 shadow-sm">
                      <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-amber-900 leading-none">{lang === 'en' ? 'Demo Version' : 'Демо-версия'}</p>
                        <p className="text-xs text-amber-700/90 mt-1.5 leading-relaxed">
                          {lang === 'en' ? '"Longreads" tab is not available in the demo version of the application.' : 'Вкладка «Лонгриды» недоступна в демо-версии приложения.'}
                        </p>
                      </div>
                    </div>
                  )}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">
                      {lang === 'en' ? 'Topic' : 'Тема'}
                    </label>
                    <select 
                      value={selectedTopic} 
                      onChange={(e) => setSelectedTopic(e.target.value)}
                      disabled={activeTab === 'longread'}
                      className={cn(
                        "w-full p-3.5 rounded-2xl border bg-white/95 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all duration-300 text-sm font-semibold",
                        activeTab === 'longread' ? "border-slate-200 text-slate-400 bg-slate-50 cursor-not-allowed opacity-60" : "border-slate-200"
                      )}
                    >
                      <option value="">{lang === 'en' ? 'Choose public topic from content plan...' : 'Выберите тему из контент-плана...'}</option>
                      {plan.map(p => {
                        const capitalizedChannel = p.channel === 'ВКонтакте' && lang === 'en' ? 'VKontakte' : p.channel;
                        return (
                          <option key={p.id} value={p.topic}>{p.topic} ({capitalizedChannel})</option>
                        );
                      })}
                    </select>
                  </div>

                  {/* Дополнительные необязательные поля */}
                  <div className={cn(
                    "space-y-4 p-5 rounded-3xl border border-slate-200/40 shadow-sm",
                    activeTab === 'longread' ? "bg-slate-50 opacity-60" : "bg-white/80 backdrop-blur-sm"
                  )}>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                      {lang === 'en' ? 'Additional Settings (Optional)' : 'Дополнительные параметры (необязательно)'}
                    </div>
                    
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-650">{t.senderLabel}</label>
                      <input 
                        type="text"
                        placeholder={t.senderPlaceholder}
                        value={senderName}
                        onChange={(e) => setSenderName(e.target.value)}
                        disabled={activeTab === 'longread'}
                        className={cn(
                          "w-full p-3 rounded-xl border bg-white placeholder-slate-400 focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm",
                          activeTab === 'longread' ? "border-slate-205 bg-slate-100 cursor-not-allowed text-slate-400" : "border-slate-200"
                        )}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-650">{t.offerLabel}</label>
                      <input 
                        type="text"
                        placeholder={t.offerPlaceholder}
                        value={offer}
                        onChange={(e) => setOffer(e.target.value)}
                        disabled={activeTab === 'longread'}
                        className={cn(
                          "w-full p-3 rounded-xl border bg-white placeholder-slate-400 focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm",
                          activeTab === 'longread' ? "border-slate-205 bg-slate-100 cursor-not-allowed text-slate-400" : "border-slate-200"
                        )}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-650">{t.linkLabel}</label>
                      <input 
                        type="text"
                        placeholder={t.linkPlaceholder}
                        value={transitionLink}
                        onChange={(e) => setTransitionLink(e.target.value)}
                        disabled={activeTab === 'longread'}
                        className={cn(
                          "w-full p-3 rounded-xl border bg-white placeholder-slate-400 focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm",
                          activeTab === 'longread' ? "border-slate-205 bg-slate-100 cursor-not-allowed text-slate-400" : "border-slate-200"
                        )}
                      />
                    </div>
                  </div>

                  {(activeTab === 'newsletter' || activeTab === 'longread') && (
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700">{t.toneLabel}</label>
                      <select 
                        value={tone} 
                        onChange={(e) => setTone(e.target.value)}
                        disabled={activeTab === 'longread'}
                        className={cn(
                          "w-full p-3.5 rounded-2xl border bg-white/95 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all duration-300 text-sm font-semibold",
                          activeTab === 'longread' ? "border-slate-200 bg-slate-50 cursor-not-allowed text-slate-400" : "border-slate-200"
                        )}
                      >
                        <option value="Friendly">{t.toneFriendly}</option>
                        <option value="Professional">{t.toneProfessional}</option>
                        <option value="Playful">{t.tonePlayful}</option>
                        <option value="Inspiring">{t.toneInspiring}</option>
                      </select>
                    </div>
                  )}

                  {activeTab === 'podcast' && (
                    <>
                      <div className="space-y-3">
                        <label className="text-sm font-semibold text-slate-700">{t.durationLabel}</label>
                        <div className="grid grid-cols-2 gap-2.5">
                          {['1 мин', '3 мин', '5 мин', '8 мин'].map(d => {
                            const formattedD = lang === 'en' 
                              ? d.replace('мин', 'min').replace('сек', 'sec')
                              : d;
                            return (
                              <button
                                key={d}
                                disabled={d !== '1 мин'}
                                onClick={() => setDuration(d)}
                                className={cn(
                                  "px-4 py-2 rounded-xl border text-sm font-medium transition-all",
                                  duration === d 
                                    ? "bg-primary text-white border-primary" 
                                    : "bg-white text-slate-600 border-slate-200 hover:border-primary/50",
                                  d !== '1 мин' && "opacity-40 cursor-not-allowed bg-slate-50 border-slate-200 text-slate-400"
                                )}
                              >
                                {formattedD}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700">{t.styleLabel}</label>
                        <select 
                          value={podcastStyle} 
                          onChange={(e) => setPodcastStyle(e.target.value)}
                          className="w-full p-3 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                        >
                          <option value="conversational">{t.podStyleConversational}</option>
                          <option value="friendly">{t.podStyleFriendly}</option>
                          <option value="inspiring">{t.podStyleInspiring}</option>
                          <option value="educational">{t.podStyleEducational}</option>
                          <option value="storytelling">{t.podStyleStorytelling}</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700">{t.formatLabel}</label>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { id: 'monologue', label: t.podFormatMonologue },
                            { id: 'dialogue', label: t.podFormatDialogue }
                          ].map(formatItem => (
                            <button
                              key={formatItem.id}
                              onClick={() => setPodcastFormat(formatItem.id)}
                              className={cn(
                                "px-4 py-2 rounded-xl border text-sm font-medium transition-all",
                                podcastFormat === formatItem.id ? "bg-primary text-white border-primary" : "bg-white text-slate-600 border-slate-200 hover:border-primary/50"
                              )}
                            >
                              {formatItem.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  {activeTab === 'video' && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700">{t.videoDurationLabel}</label>
                        <div className="grid grid-cols-2 gap-2">
                          {['15 сек', '30 сек', '1 мин', '3 мин'].map(d => {
                            const formattedD = lang === 'en' 
                              ? d.replace('мин', 'min').replace('сек', 'sec')
                              : d;
                            return (
                              <button
                                key={d}
                                onClick={() => setVideoDuration(d)}
                                className={cn(
                                  "px-4 py-2 rounded-xl border text-sm font-medium transition-all",
                                  videoDuration === d ? "bg-primary text-white border-primary" : "bg-white text-slate-600 border-slate-200 hover:border-primary/50"
                                )}
                              >
                                {formattedD}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  <button 
                    onClick={() => startGeneration(activeTab as any)}
                    disabled={isGenerating || activeTab === 'longread'}
                    className={cn(
                      "w-full py-4 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/30 transition-all flex items-center justify-center gap-2",
                      activeTab === 'longread' 
                        ? "opacity-40 cursor-not-allowed bg-slate-400 hover:scale-100 active:scale-100 shadow-none" 
                        : "hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                    )}
                  >
                    {isGenerating ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                    {activeTab === 'longread' ? (lang === 'en' ? "Unavailable in demo" : "Недоступно в демо-версии") : (lang === 'en' ? "Generate script" : "Сгенерировать сценарий")}
                  </button>
                </div>
              )}

              {activeTab === 'settings' && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">
                      {lang === 'en' ? 'HeyGen API Key' : 'API ключ HeyGen'}
                    </label>
                    <div className="flex gap-2">
                      <input 
                        type="password" 
                        value={settings.heygenApiKey}
                        onChange={(e) => setSettings({ ...settings, heygenApiKey: e.target.value })}
                        className="flex-1 p-3 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                        placeholder={lang === 'en' ? "Enter key..." : "Введите ключ..."}
                      />
                      <button 
                        onClick={() => validateApiKey('heygen')}
                        disabled={validatingKeys['heygen'] === 'loading'}
                        className={cn(
                          "px-4 rounded-xl font-bold transition-all flex items-center justify-center min-w-[100px]",
                          validatingKeys['heygen'] === 'success' ? "bg-emerald-500 text-white" :
                          validatingKeys['heygen'] === 'error' ? "bg-red-500 text-white" :
                          "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        )}
                      >
                        {validatingKeys['heygen'] === 'loading' ? <RefreshCw className="w-4 h-4 animate-spin" /> :
                         validatingKeys['heygen'] === 'success' ? <Check className="w-4 h-4" /> :
                         validatingKeys['heygen'] === 'error' ? <X className="w-4 h-4" /> :
                         (lang === 'en' ? "Verify" : "Проверить")}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">
                      {lang === 'en' ? 'TTS Provider (Voiceover)' : 'Провайдер озвучки (TTS)'}
                    </label>
                    <select 
                      value={settings.ttsProvider}
                      onChange={(e) => setSettings({ ...settings, ttsProvider: e.target.value as any })}
                      className="w-full p-3 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    >
                      <option value="gemini">{lang === 'en' ? 'Google (Gemini TTS) - Free' : 'Google (Gemini TTS) - Бесплатно'}</option>
                      <option value="elevenlabs">ElevenLabs</option>
                      <option value="yandex">Yandex SpeechKit</option>
                    </select>
                  </div>

                  <div className="space-y-2 border-t border-slate-100 pt-4">
                    <label className="text-sm font-semibold text-slate-700">
                      {lang === 'en' ? 'Appearance (Color palette)' : 'Внешний вид (Цветовая гамма)'}
                    </label>
                    <select 
                      value={currentTheme}
                      onChange={(e) => setCurrentTheme(e.target.value)}
                      className="w-full p-3 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm font-medium text-slate-700"
                    >
                      {Object.values(THEME_PRESETS).map(theme => (
                        <option key={theme.id} value={theme.id}>
                          {theme.emoji} {theme.name[lang] || theme.name.ru}
                        </option>
                      ))}
                    </select>
                  </div>

                  {settings.ttsProvider !== 'gemini' && (
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700">
                        {lang === 'en' ? 'Voiceover API Key' : 'API ключ озвучки'}
                      </label>
                      <div className="flex gap-2">
                        <input 
                          type="password" 
                          value={settings.ttsApiKey}
                          onChange={(e) => setSettings({ ...settings, ttsApiKey: e.target.value })}
                          className="flex-1 p-3 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                          placeholder={lang === 'en' ? "Enter key..." : "Введите ключ..."}
                        />
                        <button 
                          onClick={() => validateApiKey('tts')}
                          disabled={validatingKeys['tts'] === 'loading'}
                          className={cn(
                            "px-4 rounded-xl font-bold transition-all flex items-center justify-center min-w-[100px]",
                            validatingKeys['tts'] === 'success' ? "bg-emerald-500 text-white" :
                            validatingKeys['tts'] === 'error' ? "bg-red-500 text-white" :
                            "bg-slate-100 text-slate-600 hover:bg-slate-200"
                          )}
                        >
                          {validatingKeys['tts'] === 'loading' ? <RefreshCw className="w-4 h-4 animate-spin" /> :
                           validatingKeys['tts'] === 'success' ? <Check className="w-4 h-4" /> :
                           validatingKeys['tts'] === 'error' ? <X className="w-4 h-4" /> :
                           (lang === 'en' ? "Verify" : "Проверить")}
                        </button>
                      </div>
                    </div>
                  )}

                  <button 
                    onClick={handleSaveSettings}
                    className={cn(
                      "w-full py-4 rounded-2xl font-bold shadow-lg transition-all",
                      isSettingsSaved ? "bg-emerald-500 text-white shadow-emerald-200" : "bg-secondary text-white shadow-secondary/30 hover:scale-[1.02] active:scale-[0.98]"
                    )}
                  >
                    {isSettingsSaved ? (lang === 'en' ? "Settings saved!" : "Настройки сохранены!") : (lang === 'en' ? "Save" : "Сохранить")}
                  </button>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Resizer 2 (Central - Right Results) */}
        <div
          className={cn(
            "hidden lg:block w-1 hover:w-1.5 active:w-1.5 bg-slate-300/30 hover:bg-primary/40 active:bg-primary/60 cursor-col-resize transition-all relative z-40 shrink-0",
            isDraggingCentral && "bg-primary/50 w-1.5"
          )}
          onMouseDown={startResizingCentral}
        />

        {/* Right Panel (Results) */}
        <div className="flex-1 p-4 sm:p-6 lg:p-8 lg:overflow-y-auto bg-slate-50">
          {error && (
            <motion.div 
               initial={{ opacity: 0, y: -20 }}
               animate={{ opacity: 1, y: 0 }}
               className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl flex items-center gap-3"
            >
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm font-medium">{error}</p>
              <button onClick={() => setError(null)} className="ml-auto p-1 hover:bg-red-100 rounded-lg transition-colors">
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}
          <AnimatePresence mode="wait">
            {activeTab === 'plan' ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="grid grid-cols-1 gap-4"
              >
                {plan.length > 0 ? (
                  plan.map((item) => (
                    <div 
                      key={item.id} 
                      className="bg-white/90 hover:bg-white border border-slate-100 hover:border-primary/20 shadow-sm hover:shadow-md rounded-2xl p-6 flex items-center justify-between group transition-all duration-300 hover:-translate-y-0.5"
                    >
                      <div className="flex items-center gap-6">
                        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex flex-col items-center justify-center text-primary font-display">
                          <span className="text-xs font-bold uppercase tracking-wider">{(item.channel === 'ВКонтакте' && lang === 'en' ? 'VKontakte' : item.channel).substring(0, 2)}</span>
                          <span className="text-lg font-bold">{item.time}</span>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                            {(() => {
                              try {
                                const d = new Date(item.date);
                                if (isNaN(d.getTime())) return item.date;
                                return d.toLocaleDateString(lang === 'en' ? 'en-US' : 'ru-RU', { day: 'numeric', month: 'long' });
                              } catch {
                                return item.date;
                              }
                            })()}
                          </p>
                          <h4 className="text-lg font-semibold text-slate-800 mt-1">{item.topic}</h4>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleCopy(item.topic)}
                        className="p-3 hover:bg-slate-100 rounded-xl transition-all opacity-0 group-hover:opacity-100 text-slate-400 hover:text-primary active:scale-95"
                      >
                        <Copy className="w-5 h-5" />
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4 py-20">
                    <LayoutDashboard className="w-16 h-16 opacity-20" />
                    <p>{lang === 'en' ? 'Generate a content plan to see it here' : 'Сгенерируйте контент-план, чтобы увидеть его здесь'}</p>
                  </div>
                )}
              </motion.div>
            ) : currentResult ? (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6 max-w-3xl mx-auto"
              >
                <div className="glass-card overflow-hidden">
                  {currentResult.imageUrl && (
                    <div className="aspect-video w-full overflow-hidden relative group">
                      <img src={currentResult.imageUrl} alt="Generated" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      <button 
                        onClick={async () => {
                          const img = await generateImage(currentResult.title);
                          if (img) {
                            setResults(prev => ({
                              ...prev,
                              [activeTab]: prev[activeTab] ? { ...prev[activeTab]!, imageUrl: img } : null
                            }));
                          }
                        }}
                        className="absolute top-4 right-4 p-2 bg-white/80 backdrop-blur-md rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                  
                  <div className="p-8 space-y-6">
                    <div className="flex items-center justify-between">
                       <h3 className="text-2xl font-bold font-display">{currentResult.title}</h3>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => setIsEditingResult(!isEditingResult)} 
                          className={cn(
                            "p-2 rounded-lg transition-colors",
                            isEditingResult ? "bg-primary text-white" : "hover:bg-slate-100 text-slate-500"
                          )}
                          title={isEditingResult ? (lang === 'en' ? "Save" : "Сохранить") : (lang === 'en' ? "Edit" : "Редактировать")}
                        >
                          <FileText className="w-5 h-5" />
                        </button>
                        <button onClick={() => handleCopy(currentResult.text)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500"><Copy className="w-5 h-5" /></button>
                        <button onClick={() => handleDownload(currentResult)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500"><Download className="w-5 h-5" /></button>
                        <button onClick={() => setResults(prev => ({ ...prev, [activeTab]: null }))} className="p-2 hover:bg-slate-100 rounded-lg text-red-500"><Trash2 className="w-5 h-5" /></button>
                      </div>
                    </div>

                    <div className="prose prose-slate max-w-none text-slate-700 leading-relaxed">
                      {isEditingResult ? (
                        <textarea
                          value={currentResult.text}
                          onChange={(e) => handleUpdateResultText(e.target.value)}
                          className="w-full h-[400px] p-4 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-primary/20 outline-none transition-all font-mono text-sm"
                        />
                      ) : (
                        <Markdown>{currentResult.text}</Markdown>
                      )}
                    </div>

                    {currentResult.type === 'podcast' && (
                      <div className="pt-6 border-t border-slate-100 space-y-6">
                        <div className="p-5 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-start gap-3.5 shadow-sm">
                          <div className="p-2 bg-indigo-500/10 text-indigo-600 rounded-xl">
                            <Headphones className="w-5 h-5 text-indigo-500" />
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-800 text-sm">
                              {lang === 'en' ? 'Audio Generation Limit' : 'Ограничение генерации аудио'}
                            </h4>
                            <p className="text-xs text-slate-600 leading-relaxed mt-1">
                              {lang === 'en' 
                                ? 'In the demo version, it is impossible to generate audio, you can only listen to pre-generated examples below.' 
                                : 'В демо-версии невозможно сгенерировать аудио, можно только послушать заранее сгенерированные примеры в нашей библиотеке ниже.'}
                            </p>
                          </div>
                        </div>

                        <div className="pt-2">
                          <AudioSamples lang={lang} />
                        </div>
                      </div>
                    )}

                    {currentResult.type === 'video' && (
                      <div className="pt-6 border-t border-slate-100 space-y-6">
                        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-6">
                          <div className="flex items-center justify-between">
                            <h4 className="font-bold text-slate-900 flex items-center gap-2">
                              <Video className="w-5 h-5 text-primary" />
                              {lang === 'en' ? 'Step 2: Video Avatar Settings' : 'Шаг 2: Настройка видео-аватара'}
                            </h4>
                            <button 
                              onClick={fetchAvatars}
                              className="text-[10px] text-primary font-bold hover:underline flex items-center gap-1"
                            >
                              <RefreshCw className="w-3 h-3" /> {lang === 'en' ? 'Refresh list' : 'Обновить список'}
                            </button>
                          </div>

                          <div className="space-y-4">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">{lang === 'en' ? 'Select avatar' : 'Выберите аватара'}</label>
                            <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                              {avatars.length > 0 ? (
                                avatars.map((avatar: any) => (
                                  <div 
                                    key={avatar.avatar_id}
                                    onClick={() => setSelectedAvatar(avatar.avatar_id)}
                                    className={cn(
                                      "relative aspect-[3/4] rounded-xl border-2 overflow-hidden cursor-pointer transition-all group",
                                      selectedAvatar === avatar.avatar_id ? "border-primary ring-2 ring-primary/20" : "border-slate-100 hover:border-slate-200"
                                    )}
                                  >
                                    <img 
                                      src={avatar.preview_image_url} 
                                      alt={avatar.avatar_name} 
                                      className="w-full h-full object-cover" 
                                      referrerPolicy="no-referrer" 
                                    />
                                    <div className={cn(
                                      "absolute inset-0 bg-primary/10 transition-opacity",
                                      selectedAvatar === avatar.avatar_id ? "opacity-100" : "opacity-0 group-hover:opacity-50"
                                    )} />
                                    {selectedAvatar === avatar.avatar_id && (
                                      <div className="absolute top-1 right-1 bg-primary text-white rounded-full p-0.5 shadow-sm">
                                        <Check className="w-3 h-3" />
                                      </div>
                                    )}
                                    <div className="absolute bottom-0 left-0 right-0 bg-black/40 backdrop-blur-[2px] p-1">
                                      <p className="text-[8px] text-white font-medium truncate text-center">{avatar.avatar_name}</p>
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <div className="col-span-5 py-8 text-center bg-white rounded-2xl border border-dashed border-slate-200">
                                  <Video className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                                  <p className="text-xs text-slate-400">
                                    {settings.heygenApiKey ? (lang === 'en' ? "Loading avatars..." : "Загрузка аватаров...") : (lang === 'en' ? "Enter API key in settings" : "Введите API ключ в настройках")}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="space-y-4">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">{lang === 'en' ? 'Select voice' : 'Выберите голос'}</label>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                              {VOICES.heygen.map((voice: any) => (
                                <div
                                  key={voice.id}
                                  onClick={() => setSelectedVideoVoiceId(voice.id)}
                                  className={cn(
                                    "p-3 rounded-xl border-2 transition-all text-left relative group cursor-pointer",
                                    selectedVideoVoiceId === voice.id || (!selectedVideoVoiceId && VOICES.heygen[0].id === voice.id)
                                      ? "border-primary bg-primary/5" 
                                      : "border-slate-100 hover:border-slate-200 bg-white"
                                  )}
                                >
                                  <div className="text-xs font-bold text-slate-900 truncate pr-6">{voice.name[lang] || voice.name.ru}</div>
                                  <div className="text-[10px] text-slate-400 capitalize">{voice.gender === 'female' ? (lang === 'en' ? 'Female' : 'Женский') : (lang === 'en' ? 'Male' : 'Мужской')}</div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {currentResult.videoUrl ? (
                            <div className="space-y-3">
                              <video controls src={currentResult.videoUrl} className="w-full rounded-xl shadow-lg" />
                              <p className="text-center text-xs text-slate-400">{lang === 'en' ? 'Your video is ready!' : 'Ваше видео готово!'}</p>
                            </div>
                          ) : (
                            <div className="space-y-4">
                              {isVideoGenerating && videoProgress !== null && (
                                <div className="space-y-2">
                                  <div className="flex justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
                                    <span>{lang === 'en' ? 'Generation Progress' : 'Прогресс генерации'}</span>
                                    <span>{videoProgress}%</span>
                                  </div>
                                  <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                                    <motion.div 
                                      initial={{ width: 0 }}
                                      animate={{ width: `${videoProgress}%` }}
                                      className="h-full bg-primary transition-all duration-500"
                                    />
                                  </div>
                                  <p className="text-[10px] text-slate-400 text-center italic">
                                    {lang === 'en' ? 'Generation usually takes a few minutes. Please do not close the tab.' : 'Генерация обычно занимает несколько минут. Пожалуйста, не закрывайте вкладку.'}
                                  </p>
                                </div>
                              )}

                              {videoError && (
                                <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-start gap-2 text-red-600">
                                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                  <div className="space-y-1">
                                    <p className="text-xs font-bold uppercase tracking-wider">{lang === 'en' ? 'HeyGen Error' : 'Ошибка HeyGen'}</p>
                                    <p className="text-xs">{videoError}</p>
                                  </div>
                                </div>
                              )}

                              <div className="relative group w-full">
                                <button 
                                  disabled={true}
                                  className="w-full py-4 bg-slate-200 text-slate-400 rounded-2xl font-bold flex items-center justify-center gap-3 transition-colors cursor-not-allowed opacity-60"
                                >
                                  <Play className="w-5 h-5 text-slate-400" />
                                  {lang === 'en' ? 'Generate video' : 'Сгенерировать видео'}
                                </button>
                                
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-xs p-3 bg-slate-900 text-white text-xs rounded-xl shadow-xl opacity-0 scale-95 pointer-events-none group-hover:opacity-100 group-hover:scale-100 transition-all duration-200 z-10 flex items-center gap-2 border border-slate-800">
                                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                                  <span className="font-medium text-slate-200">{lang === 'en' ? 'This feature is not available in the demo version' : 'Данная функция недоступна в демо-версии'}</span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4">
                <FileText className="w-16 h-16 opacity-20" />
                <p>{lang === 'en' ? 'Generation result will appear here' : 'Результат генерации появится здесь'}</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Variable Modal */}
      <Modal 
        isOpen={isVarModalOpen} 
        onClose={() => setIsVarModalOpen(false)} 
        title="Персонализация контента"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-500">Для создания качественного текста нам нужны дополнительные данные:</p>
          {detectedVars.map(v => (
            <div key={v.key} className="space-y-1">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">{v.label}</label>
              <input 
                type="text" 
                placeholder={v.placeholder || v.description || "Введите значение..."}
                value={varValues[v.key] || ''}
                onChange={(e) => setVarValues({ ...varValues, [v.key]: e.target.value })}
                className="w-full p-3 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-primary/20 outline-none transition-all"
              />
            </div>
          ))}
          <button 
            onClick={handleContinueGeneration}
            disabled={isGenerating}
            className="w-full py-4 bg-primary text-white rounded-2xl font-bold mt-4 flex items-center justify-center gap-2"
          >
            {isGenerating && <RefreshCw className="w-5 h-5 animate-spin" />}
            Продолжить генерацию
          </button>
        </div>
      </Modal>
    </div>
  );
}
