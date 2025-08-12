import { useEffect, useState } from 'react';
import { Languages } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const languages = {
  en: 'English',
  hi: 'हिन्दी',
  bn: 'বাংলা',
  te: 'తెలుగు',
  mr: 'मराठी',
  ta: 'தமிழ்',
  gu: 'ગુજરાતી',
  kn: 'ಕನ್ನಡ',
  ml: 'മലയാളം',
  pa: 'ਪੰਜਾਬੀ',
  ur: 'اردو',
  or: 'ଓଡ଼ିଆ',
  as: 'অসমীয়া',
};

const LanguageSwitcher = () => {
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);

  const handleLanguageChange = (langCode: string) => {
    // Set the cookie that Google Translate uses
    document.cookie = `googtrans=/en/${langCode};path=/`;
    // Reload the page to apply the translation
    window.location.reload();
  };

  useEffect(() => {
    // Check if the script already exists
    if (document.getElementById('google-translate-script')) {
      return;
    }

    (window as any).googleTranslateElementInit = () => {
      new (window as any).google.translate.TranslateElement(
        {
          pageLanguage: 'en',
          includedLanguages: Object.keys(languages).join(','),
          layout: (window as any).google.translate.TranslateElement.InlineLayout.SIMPLE,
          autoDisplay: false,
        },
        'google_translate_element'
      );
      // Hide the original dropdown
      const selectElement = document.querySelector('.goog-te-combo');
      if (selectElement && selectElement.parentElement) {
        selectElement.parentElement.style.display = 'none';
      }
    };

    const addScript = document.createElement('script');
    addScript.id = 'google-translate-script';
    addScript.src = `//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit`;
    addScript.async = true;
    document.body.appendChild(addScript);

    // Cleanup function to remove the script and the widget
    return () => {
      const widget = document.querySelector('.skiptranslate');
      if (widget) {
        widget.remove();
      }
      const scripts = document.querySelectorAll('script[src*="translate.google.com"]');
      scripts.forEach(s => s.remove());
      delete (window as any).google;
      delete (window as any).googleTranslateElementInit;
    };
  }, []);

  return (
    <div>
      <div id="google_translate_element" style={{ display: 'none' }}></div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="flex items-center gap-2">
            <Languages className="h-4 w-4" />
            <span className="hidden sm:inline">Language</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {Object.entries(languages).map(([code, name]) => (
            <DropdownMenuItem key={code} onSelect={() => handleLanguageChange(code)}>
              {name}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default LanguageSwitcher;
