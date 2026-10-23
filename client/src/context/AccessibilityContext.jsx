import React, { createContext, useContext, useState, useEffect } from 'react';

const AccessibilityContext = createContext();

export function AccessibilityProvider({ children }) {
  const [fontSize, setFontSize] = useState(() => {
    return localStorage.getItem('connector_fontSize') || 'base';
  });

  const [easyRead, setEasyRead] = useState(() => {
    return localStorage.getItem('connector_easyRead') === 'true';
  });

  // Ensure dark/high-contrast mode is completely cleared for light mode only
  useEffect(() => {
    localStorage.removeItem('connector_highContrast');
    document.body.classList.remove('high-contrast');
  }, []);

  useEffect(() => {
    localStorage.setItem('connector_fontSize', fontSize);
    document.body.classList.remove('font-size-sm', 'font-size-base', 'font-size-lg', 'font-size-xl');
    document.body.classList.add(`font-size-${fontSize}`);
  }, [fontSize]);

  useEffect(() => {
    localStorage.setItem('connector_easyRead', easyRead);
  }, [easyRead]);

  const increaseFontSize = () => {
    if (fontSize === 'sm') setFontSize('base');
    else if (fontSize === 'base') setFontSize('lg');
    else if (fontSize === 'lg') setFontSize('xl');
  };

  const decreaseFontSize = () => {
    if (fontSize === 'xl') setFontSize('lg');
    else if (fontSize === 'lg') setFontSize('base');
    else if (fontSize === 'base') setFontSize('sm');
  };

  const resetFontSize = () => {
    setFontSize('base');
  };

  const toggleEasyRead = () => {
    setEasyRead(prev => !prev);
  };

  return (
    <AccessibilityContext.Provider
      value={{
        fontSize,
        setFontSize,
        increaseFontSize,
        decreaseFontSize,
        resetFontSize,
        easyRead,
        toggleEasyRead
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
}

export const useAccessibility = () => useContext(AccessibilityContext);
