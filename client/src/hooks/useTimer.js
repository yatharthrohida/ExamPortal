import { useState, useEffect, useRef, useCallback } from 'react';
import { ANTI_CHEAT_CONFIG } from '../utils/constants';

/**
 * High-precision countdown timer hook
 * @param {number} initialSeconds Total duration in seconds
 * @param {function} onTimeUp Callback invoked when timer reaches 0
 * @param {number|null} restoredSeconds Cached seconds from localStorage session recovery
 */
export function useTimer(initialSeconds, onTimeUp, restoredSeconds = null) {
  const [secondsLeft, setSecondsLeft] = useState(() => {
    if (restoredSeconds !== null && restoredSeconds !== undefined && restoredSeconds > 0) {
      return Math.min(restoredSeconds, initialSeconds);
    }
    return initialSeconds;
  });

  const [isRunning, setIsRunning] = useState(true);
  const onTimeUpRef = useRef(onTimeUp);
  onTimeUpRef.current = onTimeUp;

  // Track if time up was already triggered to prevent duplicate calls
  const hasTriggeredTimeUp = useRef(false);

  useEffect(() => {
    if (!isRunning || secondsLeft <= 0) return;

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          if (!hasTriggeredTimeUp.current) {
            hasTriggeredTimeUp.current = true;
            if (onTimeUpRef.current) {
              onTimeUpRef.current();
            }
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, secondsLeft]);

  const pause = useCallback(() => setIsRunning(false), []);
  const resume = useCallback(() => setIsRunning(true), []);
  const reset = useCallback((secs) => {
    setSecondsLeft(secs);
    hasTriggeredTimeUp.current = false;
    setIsRunning(true);
  }, []);

  const isWarning = secondsLeft <= ANTI_CHEAT_CONFIG.ALERT_REMAINING_SECS_WARNING && secondsLeft > ANTI_CHEAT_CONFIG.ALERT_REMAINING_SECS_CRITICAL;
  const isCritical = secondsLeft <= ANTI_CHEAT_CONFIG.ALERT_REMAINING_SECS_CRITICAL && secondsLeft > 0;

  return {
    secondsLeft,
    isRunning,
    isWarning,
    isCritical,
    pause,
    resume,
    reset,
  };
}

export default useTimer;

