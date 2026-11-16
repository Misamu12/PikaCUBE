import { useEffect, useState } from "react";
import { onStoreChange } from "./store";

/** Reads a localStorage-backed value after hydration and re-reads on every store change. */
export function useStoreValue<T>(read: () => T, initial: T): [T, boolean] {
  const [v, setV] = useState<T>(initial);
  const [ready, setReady] = useState(false);
  useEffect(() => { setV(read()); setReady(true); return onStoreChange(() => setV(read())); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return [v, ready];
}
