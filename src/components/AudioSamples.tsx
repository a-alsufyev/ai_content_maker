import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Headphones, Music, Globe, Volume2, User, Sparkles } from 'lucide-react';

export interface AudioSample {
  id: string;
  filename: string;
  voice: string;
  lang: 'ru' | 'en';
  title: Record<'ru' | 'en', string>;
  author: Record<'ru' | 'en', string>;
  textSnippet: string;
  fullText: string;
}

export const SELECTED_SAMPLES: AudioSample[] = [
  {
    id: "1779838943735",
    filename: "/audio_samples/sample_1779838943735_Puck_ru.wav",
    voice: "Puck",
    lang: "ru",
    title: {
      ru: "5 отделов бизнеса для интеграции ИИ",
      en: "5 business departments to integrate AI"
    },
    author: {
      ru: "Михаил, основатель ИИ-стартапа",
      en: "Mikhail, AI startup founder"
    },
    textSnippet: "Всем привет! На связи Михаил, основатель ИИ-стартапа. Сегодня разберем, как перестать сливать бюджеты и наконец-то внедрить нейросети...",
    fullText: "Всем привет! На связи Михаил, основатель ИИ-стартапа. Сегодня разберем, как перестать сливать бюджеты и наконец-то внедрить нейросети туда, где они реально принесут прибыль. Специально для вас мы упаковали это в сочную инфографику. Ловите пять ключевых отделов, которые нужно усилить искусственным интеллектом в первую очередь. Первый — маркетинг. ИИ за секунды генерирует гипотезы, тексты и креативы. Второй — отдел продаж. Умные боты мгновенно квалифицируют лиды двадцать четыре на семь. Третий — клиентская поддержка. Нейросети закроют до восьмидесяти процентов рутинных вопросов. Четвертый — отдел кадров. Скрининг резюме теперь занимает минуты, а не дни. И пятый — аналитика. Нейросети мгновенно находят скрытые тренды в куче цифр. Хотите увидеть, как это внедрить и обойти конкурентов? Переходите по ссылке прямо сейчас и забирайте нашу бесплатную инфографику. Действуйте!"
  },
  {
    id: "1779839321150",
    filename: "/audio_samples/sample_1779839321150_Zephyr_ru.wav",
    voice: "Zephyr",
    lang: "ru",
    title: {
      ru: "Продуктивность мозга в жесткий дедлайн",
      en: "Brain productivity during strict deadlines"
    },
    author: {
      ru: "Анна, бизнес-коуч",
      en: "Anna, business coach"
    },
    textSnippet: "Привет! На связи Анна, бизнес-коуч, и сегодня мы поговорим о том, как спастить свой мозг в момент жесткого дедлайна...",
    fullText: "Привет! На связи Анна, бизнес-коуч, и сегодня мы поговорим о том, как спасти свой мозг в момент жесткого дедлайна. Знакома ситуация, когда горят сроки, уровень стресса зашкаливает, а рука сама тянется к печенью или конфетам? Кажется, что сахар даст быструю энергию, но на самом деле это ловушка. Уже через полчаса уровень глюкозы в крови резко упадет, а вместе с ним исчезнут концентрация и последние силы. Чтобы ваш мозг работал на максимум, замените быстрые углеводы на правильные продукты для фокуса. Горсть грецких орехов или миндаля насытит клетки полезными жирами и подарит долгое чувство сытости. Несколько ягод черники или долька темного шоколада с содержанием какао от семидесяти процентов мгновенно активизируют когнитивные функции и улучшат память. И не забывайте про чистую воду, ведь даже легкое обезвоживание снижает вашу концентрацию на двадцать процентов. Хотите узнать больше секретов высокой продуктивности без стресса и выгорания? Специально для вас я подготовила бесплатную подборку лайфхаков, которая поможет вам легко справляться с любыми сложными задачами и держать фокус в течение всего дня. Ссылка ждет вас в описании подкаста. Переходите, скачивайте и побеждайте свои дедлайны с легкостью."
  },
  {
    id: "1779840331438",
    filename: "/audio_samples/sample_1779840331438_Puck_ru.wav",
    voice: "Puck",
    lang: "ru",
    title: {
      ru: "Вечерний ритуал разгрузки ума для крепкого сна",
      en: "Evening mind decluttering ritual for deep sleep"
    },
    author: {
      ru: "Иван, бизнес-коуч",
      en: "Ivan, business coach"
    },
    textSnippet: "Привет! На связи Иван, ваш бизнес-коуч. Знакома ли вам ситуация, когда вы ложитесь спать, но вместо долгожданного отдыха...",
    fullText: "Привет! На связи Иван, ваш бизнес-коуч. Знакома ли вам ситуация, когда вы ложитесь спать, но вместо долгожданного отдыха мозг начинает крутить бесконечные списки задач, а фоновая тревога мешает уснуть? В итоге утро начинается не с чашки кофе, а с судорожных попыток вспомнить, за что хвататься в первую очередь.\n\nВыход есть, и он займет всего десять минут вашего вечера. Это искусство разгрузки ума — простой ритуал планирования, который вернет вам контроль над своей жизнью и спасет ваше утро. Прямо перед сном возьмите блокнот и выпишите абсолютно все, что крутится в голове: задачи, идеи, страхи и мелкие заботы. Перенесите этот хаос на бумагу, буквально освобождая свой разум. Затем выберите из списка всего три главные задачи на завтра. \n\nСделав это, вы даете своему подсознанию четкий сигнал: все под контролем, можно безопасно отдыхать. Вы удивитесь, насколько глубоким станет ваш сон, и насколько уверенным, сфокусированным и продуктивным будет ваше следующее утро. Начните этот ритуал сегодня, сделайте первый шаг к спокойствию и вашим новым победам."
  },
  {
    id: "1779839595135",
    filename: "/audio_samples/sample_1779839595135_Charon_en.wav",
    voice: "Charon",
    lang: "en",
    title: {
      ru: "Сокращение операционных расходов на 30% с ИИ",
      en: "Cutting operational costs by 30% with AI"
    },
    author: {
      ru: "Джейкоб, менеджер AI-продуктов",
      en: "Jacob, AI Product Manager"
    },
    textSnippet: "Hi, I am Jacob, an AI product manager, and today I am going to show you how implementing artificial intelligence can cut your operational costs...",
    fullText: "Hi, I am Jacob, an AI product manager, and today I am going to show you how implementing artificial intelligence can cut your operational costs by up to thirty percent this very quarter. Most businesses waste hundreds of hours on repetitive tasks like manual data entry, customer support routing, and inventory forecasting. By deploying targeted AI agents and machine learning models, you can automate these bottlenecks overnight. Imagine shifting your customer support to conversational AI that resolves eighty percent of inquiries instantly, or using predictive algorithms to optimize your supply chain. This is not about replacing your team, it is about supercharging their efficiency. To get the step-by-step blueprint on how to launch your first AI cost-cutting pilot in just two weeks, visit the link in the show notes right now to download our free implementation guide. Let us make this quarter your most profitable one yet."
  },
  {
    id: "1779839845612",
    filename: "/audio_samples/sample_1779839845612_Kore_en.wav",
    voice: "Kore",
    lang: "en",
    title: {
      ru: "Полеты по Европе за 10 евро (ошибочные тарифы)",
      en: "Flying across Europe for €10 (Error fares)"
    },
    author: {
      ru: "Джессика, travel-менеджер",
      en: "Jessica, Travel Manager"
    },
    textSnippet: "Have you ever dreamed of jetting off to Paris or Rome for the price of a single cup of coffee? Hi, I am Jessica, a professional travel manager...",
    fullText: "Have you ever dreamed of jetting off to Paris or Rome for the price of a single cup of coffee? Hi, I am Jessica, a professional travel manager, and today I am revealing the ultimate insider secret to catching ten-euro flights across Europe using error fares. Error fares are massive pricing glitches made by airlines, like a misplaced decimal point turning a three-hundred-euro ticket into just thirty euros. To catch them before they get corrected, you must follow three golden rules. First, set up instant push notifications on platforms like Secret Flying or Flynous. Second, never call the airline to double-check the price, as this alerts them to the mistake. Just book it immediately. And third, wait a few days for the ticket to be officially issued before booking your hotels. Want my exact daily list of active error fares? Click the link in my bio right now to join my newsletter and start traveling the world for pennies."
  },
  {
    id: "1779840155003",
    filename: "/audio_samples/sample_1779840155003_Zephyr_en.wav",
    voice: "Zephyr",
    lang: "en",
    title: {
      ru: "Карта достижения свободного английского B2",
      en: "Roadmap to B2 English fluency in 12 months"
    },
    author: {
      ru: "Мелисса, преподаватель английского",
      en: "Melissa, English Teacher"
    },
    textSnippet: "Are you tired of feeling stuck at an intermediate level, constantly studying but forgetting everything by the weekend? I am Melissa, your English teacher...",
    fullText: "Are you tired of feeling stuck at an intermediate level, constantly studying but forgetting everything by the weekend? I am Melissa, your English teacher, and I am here to tell you that reaching B2 upper-intermediate fluency does not require burning yourself out over thick grammar books. The secret lies in a structured, twelve-month roadmap that works with your brain, not against it. Imagine structuring your week so you only study thirty minutes a day, focusing on one core skill on Monday, using active recall on Wednesday, and practicing real-world immersion on Friday. This high-retention, low-stress approach ensures you actually remember what you learn while keeping your sanity intact. To help you start this journey today, I have mapped out this exact system in my free step-by-step PDF guide. Click the link in the description right now to download your copy and let us unlock your fluent future together."
  }
];

interface AudioSamplesProps {
  lang: 'ru' | 'en';
}

export function AudioSamples({ lang }: AudioSamplesProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'ru' | 'en'>(lang);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [durations, setDurations] = useState<Record<string, number>>({});
  const [currentTime, setCurrentTime] = useState<number>(0);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [progress, setProgress] = useState<number>(0);

  // Filters samples by language matching active filter
  const filteredSamples = SELECTED_SAMPLES.filter(sample => {
    if (activeTab === 'all') return true;
    return sample.lang === activeTab;
  });

  // Handle active language tab change
  useEffect(() => {
    setActiveTab(lang);
  }, [lang]);

  // Handle playing audio sequence
  const handlePlayToggle = (sample: AudioSample) => {
    if (playingId === sample.id) {
      if (audioRef.current) {
        if (audioRef.current.paused) {
          audioRef.current.play().catch(err => console.error("Audio play error:", err));
          setPlayingId(sample.id);
        } else {
          audioRef.current.pause();
          setPlayingId(null);
        }
      }
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      const newAudio = new Audio(sample.filename);
      audioRef.current = newAudio;
      setPlayingId(sample.id);
      setCurrentTime(0);
      setProgress(0);

      newAudio.addEventListener('timeupdate', () => {
        if (newAudio.duration) {
          setCurrentTime(newAudio.currentTime);
          setProgress((newAudio.currentTime / newAudio.duration) * 100);
        }
      });

      newAudio.addEventListener('loadedmetadata', () => {
        setDurations(prev => ({ ...prev, [sample.id]: newAudio.duration }));
      });

      newAudio.addEventListener('ended', () => {
        setPlayingId(null);
        setProgress(0);
        setCurrentTime(0);
      });

      newAudio.play().catch(err => {
        console.error("Audio play error:", err);
        setPlayingId(null);
      });
    }
  };

  // Stops playing audio if component unmounts
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  const formatDuration = (sec: number) => {
    if (isNaN(sec) || !isFinite(sec)) return "0:00";
    const minutes = Math.floor(sec / 60);
    const seconds = Math.floor(sec % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const currentPlayingSample = SELECTED_SAMPLES.find(s => s.id === playingId);

  return (
    <div className="w-full bg-slate-900 text-white rounded-3xl p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6 shadow-2xl relative overflow-hidden ring-1 ring-white/15">
      {/* Absolute background accents */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20"></div>

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
        <div className="space-y-1">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary/20 text-indigo-400 rounded-full text-xs font-bold border border-primary/30 uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            {lang === 'en' ? 'Showcase Library' : 'Библиотека Примеров'}
          </span>
          <h3 className="text-lg sm:text-xl md:text-2xl font-bold tracking-tight">
            {lang === 'en' ? 'High-Quality Podcast Examples' : 'Готовые примеры озвучки подкастов'}
          </h3>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl">
            {lang === 'en' 
              ? 'Listen to selected ready-made podcasts demonstrating professional AI voices' 
              : 'Прослушайте реальные готовые образцы озвучки, созданные с помощью наших голосов ИИ'}
          </p>
        </div>

        {/* Tab filters */}
        <div className="flex flex-wrap gap-1 bg-slate-800 p-1 rounded-2xl self-start lg:self-center border border-slate-705/50 max-w-full overflow-x-auto select-none no-scrollbar">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-[10px] sm:text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'all' 
                ? 'bg-slate-700 text-white shadow-md shadow-black/20' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {lang === 'en' ? 'All' : 'Все'}
          </button>
          <button
            onClick={() => setActiveTab('ru')}
            className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-[10px] sm:text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'ru' 
                ? 'bg-slate-700 text-white shadow-md shadow-black/20' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Globe className="w-3 h-3 text-slate-400" />
            {lang === 'en' ? 'Russian' : 'Русские'}
          </button>
          <button
            onClick={() => setActiveTab('en')}
            className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-[10px] sm:text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'en' 
                ? 'bg-slate-700 text-white shadow-md shadow-black/20' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Globe className="w-3 h-3 text-slate-400" />
            {lang === 'en' ? 'English' : 'Английские'}
          </button>
        </div>
      </div>

      {/* Playlist Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 relative z-10">
        {filteredSamples.map((sample) => {
          const isCurrent = playingId === sample.id;
          const sampleDuration = durations[sample.id] || 0;

          return (
            <div
              key={sample.id}
              className={`group flex flex-col justify-between p-4 sm:p-5 rounded-2xl transition-all border outline-none ${
                isCurrent
                  ? 'bg-slate-800/95 border-primary shadow-xl shadow-black/30'
                  : 'bg-slate-850/50 hover:bg-slate-800/50 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0 ${
                    sample.lang === 'ru' ? 'bg-indigo-500/10 text-indigo-400' : 'bg-amber-500/10 text-amber-400'
                  }`}>
                    {sample.lang === 'ru' ? 'RU 🇷🇺' : 'EN 🇺🇸'}
                  </span>
                  <span className="text-[11px] text-slate-450 font-medium flex items-center gap-1.5 shrink-0 max-w-full overflow-hidden">
                    <Headphones className="w-3.5 h-3.5 text-slate-500 group-hover:text-primary transition-colors shrink-0" />
                    <span className="opacity-80 truncate text-[10px]">
                      {lang === 'en' ? 'Voice:' : 'Голос:'}
                    </span> 
                    <strong className="text-white bg-slate-705 px-2 py-0.5 rounded font-bold capitalize text-[10px] truncate">{sample.voice}</strong>
                  </span>
                </div>

                <div className="space-y-1">
                  <h4 className="font-bold text-sm text-slate-100 line-clamp-2 leading-snug group-hover:text-white transition-colors">
                    {sample.title[lang]}
                  </h4>
                  <div className="flex items-center gap-1 text-xs text-slate-400 font-medium pt-1">
                    <User className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span className="truncate">{sample.author[lang]}</span>
                  </div>
                </div>

                <p className="text-xs text-slate-400/90 leading-relaxed line-clamp-3 italic pt-1 border-t border-slate-800/50">
                  "{sample.textSnippet}"
                </p>
              </div>

              <div className="pt-4 flex items-center justify-between mt-auto">
                <button
                  onClick={() => handlePlayToggle(sample)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-md ${
                    isCurrent
                      ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/20'
                      : 'bg-primary hover:bg-primary/95 text-white shadow-primary/20'
                  }`}
                >
                  {isCurrent ? (
                    <>
                      <Pause className="w-4 h-4 fill-white text-white" />
                      {lang === 'en' ? 'Pause' : 'Пауза'}
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-white text-white" />
                      {lang === 'en' ? 'Listen Sample' : 'Слушать'}
                    </>
                  )}
                </button>

                {sampleDuration > 0 && (
                  <span className="text-xs font-mono text-slate-400 font-bold bg-slate-800 px-2 py-1 rounded">
                    {formatDuration(sampleDuration)}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Global mini audio player footer inside the container if playing */}
      {playingId && currentPlayingSample && (
        <div className="p-3.5 sm:p-4 bg-slate-800/90 rounded-2xl border border-slate-700 flex flex-col xl:flex-row items-center justify-between gap-4 animate-fadeIn relative z-10 transition-all shadow-lg shadow-black/40">
          <div className="flex items-center gap-3 w-full xl:w-auto">
            <div className="p-2.5 bg-primary/20 border border-primary/30 rounded-xl text-primary animate-pulse flex-shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-slate-400 truncate">
                {lang === 'en' ? 'Now Playing Demo:' : 'Сейчас проигрывается демо:'}
              </div>
              <div className="font-bold text-sm text-slate-100 truncate mt-0.5">
                {currentPlayingSample.title[lang]}
              </div>
              <div className="text-xs text-slate-400 truncate mt-0.5 flex items-center gap-1">
                <span className="font-bold text-white bg-slate-700 px-1.5 py-0.2 rounded text-[10px] uppercase">
                  {currentPlayingSample.voice}
                </span>
                • {currentPlayingSample.author[lang]}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full xl:flex-1 xl:max-w-md">
            <span className="text-[10px] font-mono text-slate-400 w-10 text-right shrink-0">
              {formatDuration(currentTime)}
            </span>
            <div className="flex-1 bg-slate-700 h-1.5 rounded-full overflow-hidden relative cursor-pointer group">
              <div 
                className="bg-primary h-full rounded-full transition-all duration-100 relative"
                style={{ width: `${progress}%` }}
              >
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full group-hover:scale-125 transition-transform shadow-md shadow-black/40"></div>
              </div>
            </div>
            <span className="text-[10px] font-mono text-slate-400 w-10 shrink-0">
              {durations[playingId] ? formatDuration(durations[playingId]) : "0:00"}
            </span>
          </div>

          <button
            onClick={() => handlePlayToggle(currentPlayingSample)}
            className="p-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white transition-colors shadow-md shadow-rose-500/10 flex-shrink-0 self-end xl:self-auto"
            title={lang === 'en' ? "Stop playing" : "Остановить"}
          >
            <Pause className="w-4 h-4 fill-white text-white" />
          </button>
        </div>
      )}
    </div>
  );
}
