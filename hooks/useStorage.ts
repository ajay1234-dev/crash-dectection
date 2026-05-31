import { useState, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Persists state to AsyncStorage. Mirrors useState API.
 */
export function usePersistedState<T>(
  key: string,
  defaultValue: T
): [T, (value: T) => Promise<void>, boolean] {
  const [state, setState] = useState<T>(defaultValue);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(key).then((raw) => {
      if (raw !== null) {
        try {
          setState(JSON.parse(raw));
        } catch {
          setState(defaultValue);
        }
      }
      setLoaded(true);
    });
  }, [key]);

  const persist = useCallback(
    async (value: T) => {
      setState(value);
      await AsyncStorage.setItem(key, JSON.stringify(value));
    },
    [key]
  );

  return [state, persist, loaded];
}

/**
 * Simple interval hook — runs callback every `ms` milliseconds.
 */
export function useInterval(callback: () => void, ms: number | null) {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (ms === null) return;
    const id = setInterval(() => savedCallback.current(), ms);
    return () => clearInterval(id);
  }, [ms]);
}

/**
 * Returns true while the value has just changed (for 1 render cycle).
 */
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>();
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
}
