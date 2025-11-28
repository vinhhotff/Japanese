import { useTranslation } from 'react-i18next';
import '../App.css';

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'vi' ? 'en' : 'vi';
    i18n.changeLanguage(newLang);
    localStorage.setItem('language', newLang);
  };

  return (
    <button
      onClick={toggleLanguage}
      className="language-switcher"
      aria-label={i18n.language === 'vi' ? 'Switch to English' : 'Chuyển sang tiếng Việt'}
      title={i18n.language === 'vi' ? 'Switch to English' : 'Chuyển sang tiếng Việt'}
    >
      <span className="language-flag">
        {i18n.language === 'vi' ? '🇻🇳' : '🇺🇸'}
      </span>
      <span className="language-code">
        {i18n.language === 'vi' ? 'VI' : 'EN'}
      </span>
    </button>
  );
};

export default LanguageSwitcher;

