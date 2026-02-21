"use client";

import { useState, useEffect, useCallback } from "react";

/**
 * Debounces a value by the specified delay (default 400ms).
 * Useful for search inputs to avoid excessive Firestore queries.
 */
export function useDebounce<T>(value: T, delay = 400): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
