import { useCallback, useRef, useState } from "react";

export function useRefLatest<T>(value: T) {
  const ref = useRef(value);
  ref.current = value;
  return ref;
}

export function useStateRef<T>(initialValue: T) {
  const [state, setState] = useState(initialValue);
  const ref = useRef(state);
  const set = useCallback((value: T) => {
    ref.current = value;
    setState(value);
  }, []);
  return [state, set, ref] as const;
}
