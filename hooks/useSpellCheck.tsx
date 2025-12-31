/**
 * useSpellCheck Hook
 * 
 * Provides spell check functionality for input fields with right-click context menu.
 * 
 * Features:
 * - Word detection at cursor position
 * - Context menu integration
 * - Suggestion selection and replacement
 * - Automatic cursor positioning
 * 
 * @module hooks/useSpellCheck
 */

import { useState, useCallback, useRef, ReactElement } from 'react';
import SpellCheckContextMenu from '../components/SpellCheckContextMenu';

/**
 * Spell check menu state
 */
interface SpellCheckState {
  /** Whether the context menu is visible */
  showMenu: boolean;
  /** The word being checked */
  word: string;
  /** Menu position coordinates */
  position: { x: number; y: number };
  /** Full text context */
  context: string;
  /** Index of the word in the text */
  wordIndex: number;
}

/**
 * Word position information
 */
interface WordPosition {
  /** The word text */
  word: string;
  /** Start index in the text */
  startIndex: number;
  /** End index in the text */
  endIndex: number;
}

/**
 * Spell check hook return type
 */
interface UseSpellCheckReturn {
  /** Ref to attach to input/textarea element */
  inputRef: React.RefObject<HTMLInputElement | HTMLTextAreaElement | null>;
  /** Context menu event handler */
  handleContextMenu: (e: React.MouseEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  /** Spell check context menu component */
  SpellCheckMenu: ReactElement | null;
  /** Whether spell check is enabled */
  spellCheckEnabled: boolean;
}

/**
 * useSpellCheck hook
 * 
 * Provides spell check functionality for text input fields.
 * 
 * @param text - Current text value (for context)
 * @returns Spell check utilities and context menu component
 * 
 * @example
 * ```typescript
 * const { inputRef, handleContextMenu, SpellCheckMenu } = useSpellCheck(text);
 * 
 * return (
 *   <>
 *     <textarea ref={inputRef} onContextMenu={handleContextMenu} />
 *     {SpellCheckMenu}
 *   </>
 * );
 * ```
 */
export const useSpellCheck = (_text: string): UseSpellCheckReturn => {
  const [spellCheckState, setSpellCheckState] = useState<SpellCheckState | null>(null);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  /**
   * Get word at cursor position
   * 
   * Finds the word boundaries around the cursor position.
   * 
   * @param text - Full text content
   * @param cursorPosition - Current cursor position
   * @returns Word information or null if no word found
   */
  const getWordAtPosition = useCallback((text: string, cursorPosition: number): WordPosition | null => {
    if (cursorPosition < 0 || cursorPosition > text.length) return null;

    // Find word boundaries
    let startIndex = cursorPosition;
    let endIndex = cursorPosition;

    // Move backwards to find start of word
    while (startIndex > 0) {
      const char = text[startIndex - 1];
      if (char === undefined || !/\S/.test(char)) break;
      startIndex--;
    }

    // Move forwards to find end of word
    while (endIndex < text.length) {
      const char = text[endIndex];
      if (char === undefined || !/\S/.test(char)) break;
      endIndex++;
    }

    const word = text.substring(startIndex, endIndex).trim();
    
    if (word.length === 0) return null;

    return { word, startIndex, endIndex };
  }, []);

  /**
   * Handle context menu event
   * 
   * Shows spell check menu when user right-clicks on a word.
   * 
   * @param e - Mouse event from context menu
   */
  const handleContextMenu = useCallback((e: React.MouseEvent<HTMLInputElement | HTMLTextAreaElement>): void => {
    e.preventDefault();
    
    const target = e.currentTarget;
    const textValue = target.value;
    const cursorPosition = target.selectionStart ?? 0;
    
    const wordInfo = getWordAtPosition(textValue, cursorPosition);
    
    if (!wordInfo || wordInfo.word.length === 0) {
      return; // No word selected
    }

    setSpellCheckState({
      showMenu: true,
      word: wordInfo.word,
      position: { x: e.clientX, y: e.clientY },
      context: textValue,
      wordIndex: wordInfo.startIndex
    });
  }, [getWordAtPosition]);

  /**
   * Handle suggestion selection
   * 
   * Replaces the word with the selected suggestion and updates the input.
   * 
   * @param suggestion - Selected suggestion text
   */
  const handleSuggestionSelect = useCallback((suggestion: string): void => {
    if (!spellCheckState || !inputRef.current) {
      return;
    }

    const target = inputRef.current;
    const textValue = target.value;
    const wordInfo = getWordAtPosition(textValue, spellCheckState.wordIndex);
    
    if (!wordInfo) {
      return;
    }

    // Replace the word with the suggestion
    const newText = 
      textValue.substring(0, wordInfo.startIndex) + 
      suggestion + 
      textValue.substring(wordInfo.endIndex);
    
    // Update the input value
    target.value = newText;
    
    // Trigger change event for React controlled components
    const event = new Event('input', { bubbles: true });
    target.dispatchEvent(event);
    
    // Set cursor position after the replaced word
    const newCursorPosition = wordInfo.startIndex + suggestion.length;
    target.setSelectionRange(newCursorPosition, newCursorPosition);
    
    setSpellCheckState(null);
  }, [spellCheckState, getWordAtPosition]);

  /**
   * Close the spell check menu
   */
  const closeMenu = useCallback((): void => {
    setSpellCheckState(null);
  }, []);

  const SpellCheckMenu = spellCheckState ? (
    <SpellCheckContextMenu
      word={spellCheckState.word}
      position={spellCheckState.position}
      context={spellCheckState.context}
      wordIndex={spellCheckState.wordIndex}
      onSelect={handleSuggestionSelect}
      onClose={closeMenu}
    />
  ) : null;

  return {
    inputRef,
    handleContextMenu,
    SpellCheckMenu,
    spellCheckEnabled: true
  };
};

