import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, X } from 'lucide-react';
import { AutocompleteSuggestion } from '../services/autocompleteService';

interface AutocompleteInputProps {
  value: string;
  onChange: (value: string) => void;
  suggestions: AutocompleteSuggestion[];
  placeholder?: string;
  label?: string;
  helperText?: string;
  onHelperClick?: () => void;
  className?: string;
}

const AutocompleteInput: React.FC<AutocompleteInputProps> = ({
  value,
  onChange,
  suggestions,
  placeholder,
  label,
  helperText,
  onHelperClick,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState<AutocompleteSuggestion[]>(suggestions);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value) {
      const filtered = suggestions.filter(s =>
        s.label.toLowerCase().includes(value.toLowerCase()) &&
        s.value !== '' // Exclude helper suggestions
      );
      setFilteredSuggestions(filtered);
    } else {
      setFilteredSuggestions(suggestions.filter(s => s.value !== ''));
    }
  }, [value, suggestions]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
    setIsOpen(true);
    setHighlightedIndex(-1);
  };

  const handleSelect = (suggestion: AutocompleteSuggestion) => {
    if (suggestion.value) {
      onChange(suggestion.value);
      setIsOpen(false);
      inputRef.current?.blur();
    } else if (onHelperClick) {
      onHelperClick();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      setIsOpen(true);
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(prev =>
        prev < filteredSuggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === 'Enter' && highlightedIndex >= 0) {
      e.preventDefault();
      handleSelect(filteredSuggestions[highlightedIndex]);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setHighlightedIndex(-1);
    }
  };

  const groupedSuggestions = filteredSuggestions.reduce((acc, suggestion) => {
    const category = suggestion.category || 'Other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(suggestion);
    return acc;
  }, {} as Record<string, AutocompleteSuggestion[]>);

  return (
    <div className={`relative ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-[#221E1F] dark:text-[#f3f4f6] mb-2">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full px-4 py-2.5 border border-[#EEF2FF] dark:border-[#374151] dark:bg-[#0a0e1a] dark:text-[#f3f4f6] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#577AFF] focus:border-transparent"
        />
        {value && (
          <button
            type="button"
            onClick={() => {
              onChange('');
              inputRef.current?.focus();
            }}
            className="absolute right-10 top-1/2 transform -translate-y-1/2 text-[#595657] dark:text-[#9ca3af] hover:text-[#221E1F] dark:hover:text-[#f3f4f6]"
          >
            <X className="w-4 h-4" />
          </button>
        )}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 text-[#595657] dark:text-[#9ca3af]"
        >
          <ChevronDown className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {isOpen && filteredSuggestions.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-white dark:bg-[#111827] border border-[#EEF2FF] dark:border-[#374151] rounded-lg shadow-lg dark:shadow-[0_0_20px_rgba(87,122,255,0.3)] max-h-60 overflow-y-auto"
        >
          {Object.entries(groupedSuggestions).map(([category, categorySuggestions]) => (
            <div key={category}>
              {category !== 'Other' && (
                <div className="px-3 py-2 text-xs font-semibold text-[#595657] dark:text-[#9ca3af] uppercase tracking-wider bg-[#F9FAFD] dark:bg-[#1a1f2e] border-b border-[#EEF2FF] dark:border-[#374151]">
                  {category}
                </div>
              )}
              {categorySuggestions.map((suggestion, index) => {
                const globalIndex = filteredSuggestions.indexOf(suggestion);
                const isHighlighted = globalIndex === highlightedIndex;
                const isHelper = !suggestion.value;

                return (
                  <button
                    key={`${category}-${index}`}
                    type="button"
                    onClick={() => handleSelect(suggestion)}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                      isHighlighted
                        ? 'bg-[#EEF2FF] dark:bg-[#1a1f2e] text-[#577AFF] dark:text-[#93C5FD]'
                        : isHelper
                        ? 'text-[#595657] dark:text-[#9ca3af] hover:bg-[#F9FAFD] dark:hover:bg-[#1a1f2e]'
                        : 'text-[#221E1F] dark:text-[#f3f4f6] hover:bg-[#F9FAFD] dark:hover:bg-[#1a1f2e]'
                    }`}
                  >
                    {suggestion.label}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      )}

      {helperText && (
        <p className="mt-1 text-xs text-[#595657] dark:text-[#9ca3af]">
          {helperText}
        </p>
      )}
    </div>
  );
};

export default AutocompleteInput;

