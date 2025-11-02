import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import './LanguageSwitcher.css';

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  
  const languages = [
    { code: 'en', name: 'English', nativeName: 'English', displayCode: 'EN', flag: '🇬🇧' },
    { code: 'hi', name: 'Hindi', nativeName: 'हिंदी', displayCode: 'HI', flag: '🇮🇳' },
    { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', displayCode: 'TE', flag: '🇮🇳' },
    { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', displayCode: 'TA', flag: '🇮🇳' },
    { code: 'mr', name: 'Marathi', nativeName: 'मराठी', displayCode: 'MR', flag: '🇮🇳' }
  ];

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];

  const handleLanguageChange = (langCode) => {
    i18n.changeLanguage(langCode);
    localStorage.setItem('i18nextLng', langCode);
    setIsOpen(false);
    
    // Update HTML lang attribute for accessibility
    document.documentElement.setAttribute('lang', langCode);
  };

  // Set initial lang attribute
  useEffect(() => {
    document.documentElement.setAttribute('lang', i18n.language);
  }, [i18n.language]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isOpen && !event.target.closest('.language-switcher')) {
        setIsOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isOpen]);

  return (
    <div className="language-switcher">
      {/* Dropdown Button */}
      <button
        className="language-switcher-button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Select language"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <svg 
          className="translate-icon" 
          width="20" 
          height="20" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10"/>
          <line x1="2" y1="12" x2="22" y2="12"/>
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
        </svg>
        <span className="language-code">{currentLanguage.displayCode}</span>
        <span className="language-full-name">{currentLanguage.nativeName}</span>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="language-dropdown" role="menu">
          {languages.map((lang) => (
            <button
              key={lang.code}
              className={`language-option ${i18n.language === lang.code ? 'active' : ''}`}
              onClick={() => handleLanguageChange(lang.code)}
              role="menuitem"
              aria-label={`Switch to ${lang.name}`}
            >
              <span className="language-flag">{lang.flag}</span>
              <div className="language-info">
                <span className="language-native">{lang.nativeName}</span>
                <span className="language-english">{lang.name}</span>
              </div>
              {i18n.language === lang.code && (
                <svg 
                  className="language-check"
                  width="16" 
                  height="16" 
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="3 8 6 11 13 4" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LanguageSwitcher;
