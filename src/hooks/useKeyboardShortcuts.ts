import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface ShortcutOptions {
  onOpenCommand?: () => void;
  onNewApplication?: () => void;
  onEscape?: () => void;
  onFocusSearch?: () => void;
}

export function useKeyboardShortcuts(options: ShortcutOptions = {}) {
  const navigate = useNavigate();

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const isInput = 
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement ||
        (e.target as HTMLElement)?.isContentEditable;

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modKey = isMac ? e.metaKey : e.ctrlKey;

      // Escape key (always works even inside inputs)
      if (e.key === 'Escape') {
        if (options.onEscape) {
          options.onEscape();
        }
        return;
      }

      // Mod+K -> Command Palette
      if (modKey && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        options.onOpenCommand?.();
        return;
      }

      // If user is currently typing in an input field, do not trigger standard letter navigation
      if (isInput) return;

      // Mod+Shift+A -> Go to Applications
      if (modKey && e.shiftKey && (e.key === 'a' || e.key === 'A')) {
        e.preventDefault();
        navigate('/applications');
        return;
      }

      // Mod+N -> New Application
      if (modKey && (e.key === 'n' || e.key === 'N')) {
        e.preventDefault();
        options.onNewApplication?.();
        return;
      }

      // / -> Focus Search
      if (e.key === '/') {
        e.preventDefault();
        options.onFocusSearch?.();
        return;
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate, options]);
}
