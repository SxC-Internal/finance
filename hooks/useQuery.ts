'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

// Module-level cache — survives component unmounts within the same page session.
const queryCache = new Map<string, unknown>();

interface UseQueryOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  enabled?: boolean;
}

export function useQuery<T>(
  key: string,
  fetcher: () => Promise<T>,
  options?: UseQueryOptions<T>
) {
  const cached = queryCache.get(key) as T | undefined;
  const [data, setData] = useState<T | null>(cached ?? null);
  const [error, setError] = useState<Error | null>(null);
  // Skip loading state if we already have cached data to show immediately.
  const [loading, setLoading] = useState(cached === undefined);

  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;
  const optionsRef = useRef(options);
  optionsRef.current = options;

  // Fire onSuccess with cached data on first mount so parent hooks populate their state.
  const firedCacheRef = useRef(false);
  useEffect(() => {
    if (cached !== undefined && !firedCacheRef.current) {
      firedCacheRef.current = true;
      optionsRef.current?.onSuccess?.(cached);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetcherRef.current();
      queryCache.set(key, result);
      setData(result);
      optionsRef.current?.onSuccess?.(result);
    } catch (err) {
      const e = err instanceof Error ? err : new Error(String(err));
      setError(e);
      optionsRef.current?.onError?.(e);
    } finally {
      setLoading(false);
    }
  }, [key]);

  useEffect(() => {
    if (optionsRef.current?.enabled !== false) {
      void refetch();
    }
    // key is the intentional trigger — fetcher/options are accessed via refs
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return { data, error, loading, refetch };
}
