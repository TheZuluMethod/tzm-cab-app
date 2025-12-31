/**
 * Spell Check Context Menu Component
 * 
 * Displays a context menu with spelling and grammar suggestions when right-clicking
 * on a word in an input field.
 */

import React, { useState, useEffect, useRef } from 'react';
import { Check, X, Loader2 } from 'lucide-react';
import { checkSpellingAndGrammar, getWordSuggestions } from '../services/spellCheckService';

interface SpellCheckContextMenuProps {
  word: string;
  position: { x: number; y: number };
  context: string;
  wordIndex: number;
  onSelect: (suggestion: string) => void;
  onClose: () => void;
}

const SpellCheckContextMenu: React.FC<SpellCheckContextMenuProps> = ({
  word,
  position,
  context,
  wordIndex,
  onSelect,
  onClose
}) => {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load suggestions when menu opens
    const loadSuggestions = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // First try to get quick suggestions for the word
        const wordSuggestions = await getWordSuggestions(word, context);
        
        if (wordSuggestions.length > 0) {
          setSuggestions(wordSuggestions);
        } else {
          // Fallback: check full text and find suggestions for this word
          const result = await checkSpellingAndGrammar(context, word, wordIndex);
          const wordIssue = result.issues.find(
            issue => issue.word.toLowerCase() === word.toLowerCase() ||
                     context.substring(issue.startIndex, issue.endIndex).toLowerCase() === word.toLowerCase()
          );
          
          if (wordIssue && wordIssue.suggestions.length > 0) {
            setSuggestions(wordIssue.suggestions);
          } else {
            setError('No suggestions available');
          }
        }
      } catch (err) {
        console.error('Error loading suggestions:', err);
        setError('Failed to load suggestions');
      } finally {
        setIsLoading(false);
      }
    };

    loadSuggestions();
  }, [word, context, wordIndex]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  // Adjust position if menu goes off screen
  const [adjustedPosition, setAdjustedPosition] = useState(position);
  
  useEffect(() => {
    if (menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      let x = position.x;
      let y = position.y;
      
      // Adjust horizontal position
      if (x + rect.width > viewportWidth) {
        x = viewportWidth - rect.width - 10;
      }
      if (x < 0) x = 10;
      
      // Adjust vertical position
      if (y + rect.height > viewportHeight) {
        y = position.y - rect.height - 5;
      }
      if (y < 0) y = 10;
      
      setAdjustedPosition({ x, y });
    }
  }, [position]);

  return (
    <div
      ref={menuRef}
      className="fixed z-50 bg-white rounded-lg shadow-xl border border-[#D5DDFF] min-w-[200px] max-w-[300px]"
      style={{
        left: `${adjustedPosition.x}px`,
        top: `${adjustedPosition.y}px`,
      }}
    >
      <div className="p-2 border-b border-[#EEF2FF]">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-[#051A53]">Suggestions for "{word}"</span>
          <button
            onClick={onClose}
            className="text-[#595657] hover:text-[#221E1F] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      <div className="max-h-[300px] overflow-y-auto">
        {isLoading ? (
          <div className="p-4 flex items-center justify-center">
            <Loader2 className="w-5 h-5 animate-spin text-[#577AFF]" />
            <span className="ml-2 text-sm text-[#595657]">Checking...</span>
          </div>
        ) : error ? (
          <div className="p-4 text-sm text-red-600">{error}</div>
        ) : suggestions.length === 0 ? (
          <div className="p-4 text-sm text-[#595657]">No suggestions found</div>
        ) : (
          <div className="py-1">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => {
                  onSelect(suggestion);
                  onClose();
                }}
                className="w-full text-left px-4 py-2 hover:bg-[#F9FAFD] transition-colors flex items-center gap-2 group"
              >
                <Check className="w-4 h-4 text-[#577AFF] opacity-0 group-hover:opacity-100 transition-opacity" />
                <span className="text-sm text-[#221E1F] group-hover:text-[#577AFF] transition-colors">
                  {suggestion}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SpellCheckContextMenu;

