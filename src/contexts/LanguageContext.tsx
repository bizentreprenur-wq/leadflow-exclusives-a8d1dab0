import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Language = 'en' | 'es' | 'pt' | 'fr';

interface Translations {
  [key: string]: {
    en: string;
    es: string;
    pt: string;
    fr: string;
  };
}

// Core translations for the app
export const translations: Translations = {
  // Navbar
  'nav.features': {
    en: 'Features',
    es: 'Características',
    pt: 'Recursos',
    fr: 'Fonctionnalités',
  },
  'nav.pricing': {
    en: 'Pricing',
    es: 'Precios',
    pt: 'Preços',
    fr: 'Tarifs',
  },
  'nav.reviews': {
    en: 'Reviews',
    es: 'Reseñas',
    pt: 'Avaliações',
    fr: 'Avis',
  },
  'nav.about': {
    en: 'About Us',
    es: 'Nosotros',
    pt: 'Sobre Nós',
    fr: 'À Propos',
  },
  'nav.contact': {
    en: 'Contact',
    es: 'Contacto',
    pt: 'Contato',
    fr: 'Contact',
  },
  'nav.closeloop': {
    en: 'CloseLoop™',
    es: 'CloseLoop™',
    pt: 'CloseLoop™',
    fr: 'CloseLoop™',
  },
  'nav.whatIs': {
    en: 'What Is Bamlead',
    es: 'Qué es Bamlead',
    pt: 'O que é Bamlead',
    fr: 'Qu\'est-ce que Bamlead',
  },
  'nav.useCases': {
    en: 'Use Cases',
    es: 'Casos de Uso',
    pt: 'Casos de Uso',
    fr: 'Cas d\'Usage',
  },
  'nav.comparisons': {
    en: 'Comparisons',
    es: 'Comparaciones',
    pt: 'Comparações',
    fr: 'Comparaisons',
  },
  'nav.presignup': {
    en: 'Pre-Signup',
    es: 'Pre-Registro',
    pt: 'Pré-Cadastro',
    fr: 'Pré-Inscription',
  },
  'nav.dashboard': {
    en: 'Dashboard',
    es: 'Panel',
    pt: 'Painel',
    fr: 'Tableau de bord',
  },
  'nav.signin': {
    en: 'Sign In',
    es: 'Iniciar Sesión',
    pt: 'Entrar',
    fr: 'Connexion',
  },
  'nav.startHere': {
    en: 'Start here',
    es: 'Comenzar',
    pt: 'Começar',
    fr: 'Commencer',
  },
  'nav.demoTour': {
    en: 'Demo Tour',
    es: 'Tour Demo',
    pt: 'Tour Demo',
    fr: 'Visite Guidée',
  },

  // Hero Section
  'hero.badge': {
    en: 'AI FEATURES NO ONE ELSE HAS',
    es: 'FUNCIONES DE IA QUE NADIE MÁS TIENE',
    pt: 'RECURSOS DE IA QUE NINGUÉM MAIS TEM',
    fr: 'FONCTIONNALITÉS IA EXCLUSIVES',
  },
  'hero.title1': {
    en: 'Predicts intent',
    es: 'Predice intención',
    pt: 'Prevê intenção',
    fr: 'Prédit l\'intention',
  },
  'hero.title2': {
    en: 'before they\'re ready',
    es: 'antes de que estén listos',
    pt: 'antes de estarem prontos',
    fr: 'avant qu\'ils soient prêts',
  },
  'hero.title3': {
    en: 'to convert',
    es: 'para convertir',
    pt: 'para converter',
    fr: 'à convertir',
  },
  'hero.subtitle': {
    en: 'The only B2B lead platform with Pre-Intent Detection, Emotional State AI, and Outcome Simulation. Find leads across any industry - sales, recruiting, marketing, consulting, and more.',
    es: 'La única plataforma de leads B2B con Detección Pre-Intención, IA de Estado Emocional y Simulación de Resultados. Encuentra leads en cualquier industria - ventas, reclutamiento, marketing, consultoría y más.',
    pt: 'A única plataforma de leads B2B com Detecção de Pré-Intenção, IA de Estado Emocional e Simulação de Resultados. Encontre leads em qualquer setor - vendas, recrutamento, marketing, consultoria e mais.',
    fr: 'La seule plateforme de leads B2B avec Détection de Pré-Intention, IA d\'État Émotionnel et Simulation de Résultats. Trouvez des leads dans tous les secteurs - ventes, recrutement, marketing, conseil et plus.',
  },
  'hero.cta': {
    en: 'Try Secret AI Features Free',
    es: 'Prueba Funciones IA Secretas Gratis',
    pt: 'Experimente Recursos de IA Secretos Grátis',
    fr: 'Essayez les Fonctionnalités IA Secrètes',
  },
  'hero.socialProof': {
    en: '2,847 teams using AI features no competitor has',
    es: '2,847 equipos usando funciones de IA que ningún competidor tiene',
    pt: '2.847 equipes usando recursos de IA que nenhum concorrente tem',
    fr: '2 847 équipes utilisant des fonctionnalités IA exclusives',
  },

  // Features
  'feature.preIntent': {
    en: 'Pre-Intent Detection',
    es: 'Detección Pre-Intención',
    pt: 'Detecção de Pré-Intenção',
    fr: 'Détection de Pré-Intention',
  },
  'feature.emotionalAI': {
    en: 'Emotional AI',
    es: 'IA Emocional',
    pt: 'IA Emocional',
    fr: 'IA Émotionnelle',
  },
  'feature.outcomeSimulator': {
    en: 'Outcome Simulator',
    es: 'Simulador de Resultados',
    pt: 'Simulador de Resultados',
    fr: 'Simulateur de Résultats',
  },
  'feature.psychProfiler': {
    en: 'Psychological Profiler',
    es: 'Perfilador Psicológico',
    pt: 'Analisador Psicológico',
    fr: 'Profileur Psychologique',
  },

  // Auto Search Feature
  'autoSearch.title': {
    en: 'Autopilot Lead Generation',
    es: 'Generación de Leads en Autopiloto',
    pt: 'Geração de Leads no Piloto Automático',
    fr: 'Génération de Leads en Autopilote',
  },
  'autoSearch.subtitle': {
    en: 'Set it and forget it. AI runs searches automatically and delivers fresh leads to your inbox as CSV.',
    es: 'Configúralo y olvídate. La IA ejecuta búsquedas automáticamente y entrega leads frescos a tu correo como CSV.',
    pt: 'Configure e esqueça. A IA executa buscas automaticamente e entrega leads frescos no seu email como CSV.',
    fr: 'Configurez et oubliez. L\'IA exécute des recherches automatiquement et livre des leads frais dans votre boîte mail en CSV.',
  },
  'autoSearch.badge': {
    en: 'PREMIUM FEATURE',
    es: 'FUNCIÓN PREMIUM',
    pt: 'RECURSO PREMIUM',
    fr: 'FONCTIONNALITÉ PREMIUM',
  },

  // Common
  'common.learnMore': {
    en: 'Learn More',
    es: 'Más Información',
    pt: 'Saiba Mais',
    fr: 'En Savoir Plus',
  },
  'common.getStarted': {
    en: 'Get Started',
    es: 'Comenzar',
    pt: 'Começar',
    fr: 'Commencer',
  },
  'common.upgrade': {
    en: 'Upgrade',
    es: 'Mejorar Plan',
    pt: 'Fazer Upgrade',
    fr: 'Mettre à Niveau',
  },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const LANGUAGE_KEY = 'bamlead_language';

export const languages: { code: Language; label: string; flag: string }[] = [
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'pt', label: 'Português', flag: '🇧🇷' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
];

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    const saved = localStorage.getItem(LANGUAGE_KEY) as Language;
    if (saved && languages.find(l => l.code === saved)) {
      setLanguageState(saved);
    } else {
      // Try to detect browser language
      const browserLang = navigator.language.split('-')[0] as Language;
      if (languages.find(l => l.code === browserLang)) {
        setLanguageState(browserLang);
      }
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem(LANGUAGE_KEY, lang);
  };

  const t = (key: string): string => {
    const translation = translations[key];
    if (!translation) {
      console.warn(`Missing translation for key: ${key}`);
      return key;
    }
    return translation[language] || translation.en || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
