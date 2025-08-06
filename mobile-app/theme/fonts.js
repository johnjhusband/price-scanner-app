// Font configuration for 2025 design
// This file contains font loading logic and fallbacks

export const loadFonts = () => {
  if (typeof window !== 'undefined' && window.document) {
    // Create link elements for Google Fonts
    const fontsToLoad = [
      'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap',
      'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&display=swap',
      'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&display=swap'
    ];

    fontsToLoad.forEach(fontUrl => {
      const existingLink = document.querySelector(`link[href="${fontUrl}"]`);
      if (!existingLink) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = fontUrl;
        document.head.appendChild(link);
      }
    });
  }
};

// Font stack configurations
export const fontStacks = {
  heading: '"Playfair Display", Georgia, "Times New Roman", serif',
  body: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  mono: '"JetBrains Mono", "SF Mono", Monaco, Consolas, monospace',
  
  // Fallback for existing code
  default: '"Inter", "Poppins", -apple-system, BlinkMacSystemFont, sans-serif'
};

// Font utilities
export const getFontFamily = (type = 'body') => {
  return fontStacks[type] || fontStacks.body;
};