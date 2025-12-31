import React, { useState, useEffect } from 'react';
import { getLogoUrl, getDarkLogoUrl } from '../services/logoService';
import { useTheme } from '../contexts/ThemeContext';

interface ZuluLogoProps {
  className?: string;
  showText?: boolean;
}

const ZuluLogo: React.FC<ZuluLogoProps> = ({ className = '', showText = true }) => {
  const { theme } = useTheme();
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoError, setLogoError] = useState(false);
  
  // Fallback paths for public folder (if Supabase logo not available)
  const fallbackPaths = [
    '/robot-logo.png',
    '/zulu-logo.png',
    '/zulu-logo.svg',
    '/robot-logo.svg',
    '/zulu-robot-logo.svg',
    '/zulu-robot-logo.png',
    '/logo-robot.svg',
    '/logo-robot.png',
    '/logo.svg'
  ];
  
  const [currentFallbackIndex, setCurrentFallbackIndex] = useState(0);

  useEffect(() => {
    // Try to get logo from Supabase first, with retry if Supabase isn't ready yet
    const loadLogo = () => {
      // Use dark logo if in dark mode, otherwise use regular logo
      const logoGetter = theme === 'dark' ? getDarkLogoUrl : getLogoUrl;
      const supabaseLogoUrl = logoGetter();
      if (supabaseLogoUrl && supabaseLogoUrl.startsWith('http')) {
        setLogoUrl(supabaseLogoUrl);
      } else {
        // If Supabase might not be ready yet, retry once after a short delay
        const checkSupabase = async () => {
          // Import supabase dynamically to check if it's available
          const { supabase } = await import('../services/supabaseClient');
          if (supabase && typeof supabase.storage !== 'undefined') {
            // Supabase is now available, try again
            const retryUrl = logoGetter();
            if (retryUrl && retryUrl.startsWith('http')) {
              setLogoUrl(retryUrl);
              return;
            }
          }
          // Fallback to public folder
          setLogoUrl(fallbackPaths[0] || null);
        };
        
        // Wait a bit for Supabase to initialize, then check
        setTimeout(checkSupabase, 100);
      }
    };
    
    loadLogo();
  }, [theme]);

  const handleLogoError = () => {
    if (logoUrl && logoUrl.startsWith('http')) {
      // Supabase logo failed, try fallback paths
      if (currentFallbackIndex < fallbackPaths.length - 1) {
        setCurrentFallbackIndex(currentFallbackIndex + 1);
        setLogoUrl(fallbackPaths[currentFallbackIndex + 1] || null);
      } else {
        setLogoError(true);
      }
    } else {
      // Public folder logo failed, try next fallback
      if (currentFallbackIndex < fallbackPaths.length - 1) {
        setCurrentFallbackIndex(currentFallbackIndex + 1);
        setLogoUrl(fallbackPaths[currentFallbackIndex + 1] || null);
      } else {
        setLogoError(true);
      }
    }
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Logo - Load from Supabase Storage first, fallback to public folder */}
      {!logoError && logoUrl ? (
        <img 
          key={logoUrl}
          src={logoUrl} 
          alt="The Zulu Method Logo" 
          className="h-10 w-auto flex-shrink-0"
          onError={handleLogoError}
          style={{ display: 'block' }}
        />
      ) : (
        <div className="h-10 w-10 bg-[#051A53] dark:bg-[#577AFF] rounded flex items-center justify-center flex-shrink-0">
          <span className="text-white text-xs font-bold">ZM</span>
        </div>
      )}
      
      {showText && (
        <div className="leading-tight">
          <div className="text-lg md:text-xl font-semibold text-[#051A53] dark:text-[#f3f4f6]">
            AI Customer Advisory Board
          </div>
        </div>
      )}
    </div>
  );
};

export default ZuluLogo;

