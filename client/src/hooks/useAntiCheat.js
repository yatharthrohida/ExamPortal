import { useState, useEffect, useCallback, useRef } from 'react';
import submissionService from '../services/submissionService';

/**
 * Enterprise client-side anti-cheat telemetry and security lock hook
 */
export function useAntiCheat({
  submissionId,
  maxStrikes = 3,
  onExceededStrikes,
  isEnabled = true,
}) {
  const [strikeCount, setStrikeCount] = useState(0);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [lastViolation, setLastViolation] = useState(null);

  const strikesRef = useRef(strikeCount);
  strikesRef.current = strikeCount;

  const onExceededRef = useRef(onExceededStrikes);
  onExceededRef.current = onExceededStrikes;

  const registerViolation = useCallback(
    (eventType, details) => {
      if (!isEnabled) return;

      const nextStrikes = strikesRef.current + 1;
      setStrikeCount(nextStrikes);
      setLastViolation({
        type: eventType,
        details,
        time: new Date().toLocaleTimeString(),
        strikeNumber: nextStrikes,
      });
      setShowWarningModal(true);

      // Async dispatch telemetry ping to backend
      if (submissionId) {
        submissionService.sendTelemetry(submissionId, {
          eventType,
          details,
          currentStrikes: nextStrikes,
        }).catch((err) => console.warn('[AntiCheat] Telemetry dispatch failed:', err));
      }

      if (nextStrikes >= maxStrikes) {
        if (onExceededRef.current) {
          onExceededRef.current(nextStrikes);
        }
      }
    },
    [isEnabled, maxStrikes, submissionId]
  );

  useEffect(() => {
    if (!isEnabled) return;

    // 1. Tab visibility state detection
    const handleVisibilityChange = () => {
      if (document.hidden) {
        registerViolation('TAB_SWITCH', 'Student switched browser tab or minimized window.');
      }
    };

    // 2. Window blur (alt-tab, inspector, outside click)
    const handleWindowBlur = () => {
      registerViolation('WINDOW_BLUR', 'Browser window lost active focus.');
    };

    // 3. Prevent right-click context menu
    const handleContextMenu = (e) => {
      e.preventDefault();
      return false;
    };

    // 4. Intercept clipboard copy, cut, paste
    const handleClipboard = (e) => {
      e.preventDefault();
    };

    // 5. Intercept developer tools and inspect shortcuts (F12, Ctrl+Shift+I, etc.)
    const handleKeyDown = (e) => {
      if (
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.key === 'C' || e.key === 'c' || e.key === 'J' || e.key === 'j')) ||
        (e.ctrlKey && (e.key === 'U' || e.key === 'u'))
      ) {
        e.preventDefault();
        registerViolation('DEV_TOOLS_ATTEMPT', `Attempted prohibited shortcut: ${e.key}`);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('copy', handleClipboard);
    document.addEventListener('paste', handleClipboard);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('copy', handleClipboard);
      document.removeEventListener('paste', handleClipboard);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isEnabled, registerViolation]);

  const dismissWarning = () => setShowWarningModal(false);

  return {
    strikeCount,
    maxStrikes,
    showWarningModal,
    lastViolation,
    dismissWarning,
    strikesLeft: Math.max(0, maxStrikes - strikeCount),
  };
}

export default useAntiCheat;

