import { useState, useCallback } from "react";

// Like useState for a tab name, but remembers the choice for this browser tab
// (sessionStorage), so coming BACK from another page returns to the same tab.
// `allowed` = list of valid tab ids; anything else falls back to `initial`.
export default function usePersistedTab(storageKey, initial, allowed) {
  const k = `vg_tab_${storageKey}`;
  const [tab, setTabState] = useState(() => {
    try {
      const v = sessionStorage.getItem(k);
      if (v && (!allowed || allowed.includes(v))) return v;
    } catch {}
    return initial;
  });
  const setTab = useCallback(
    (v) => {
      setTabState(v);
      try { sessionStorage.setItem(k, v); } catch {}
    },
    [k]
  );
  return [tab, setTab];
}
