import { useEffect, useState } from 'react';

// Returns `value`, but only after it has stopped changing for `delayMs`.
// Used for the search box, so we don't send a request on every keystroke.
export function useDebouncedValue(value, delayMs) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delayMs);
    // A new keystroke before the timer fires cancels it and starts a new one.
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debouncedValue;
}
