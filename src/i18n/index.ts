import i18next from 'i18next';

import errors from './errors.json';
import general from './general.json';
import commands from './commands.json';

const messages = {
  en: {
    translation: {
      errors: { ...errors.en },
      commands: { ...commands.en },
      general: { ...general.en }
    }
  },
  uk: {
    translation: {
      errors: { ...errors.uk },
      commands: { ...commands.uk },
      general: { ...general.uk }
    }
  }
};

i18next.init({
  lng: 'uk',
  fallbackLng: 'en',
  resources: messages
});

export const setLanguage = (lang: string) => i18next.changeLanguage(lang);
export const t = i18next.t.bind(i18next);
