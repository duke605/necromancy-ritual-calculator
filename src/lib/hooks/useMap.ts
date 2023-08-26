import { useCallback, useEffect, useMemo, useState } from 'react';

export const useMap = <T, R>(initialState?: Map<T, R> | (() => Map<T, R>), onChange: (map: Map<T, R>) => void = () => {}): Map<T, R> => {
  const [ map, setMap ] = useState(initialState ?? new Map<T, R>());

  useEffect(() => {
    onChange(map);
  }, [map]);

  const set = useCallback((key: T, value: R) => {
    setMap(map => (new Map(map)).set(key, value));
  }, []);

  const remove = useCallback((key: T) => {
    setMap(map => {
      const copy = new Map(map);
      copy.delete(key);
      return copy;
    });
  }, []);

  const clear = useCallback(() => {
    setMap(new Map());
  }, []);

  return useMemo(() => new Proxy(map, {
    get(target, key) {
      if (key === 'set') {
        return set;
      } else if (key === 'remove') {
        return remove;
      } else if (key === 'clear') {
        return clear;
      } else if (key in target) {
        return (target as any)[key].bind(target);
      }
    }
  }), [map]);
}