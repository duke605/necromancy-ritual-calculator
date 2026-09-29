import { useSyncExternalStore } from "react";

const MOBILE_QUERY = "(max-width: 767px)";

/** Whether the screen is below the md breakpoint (768px). False on the server. */
export function useIsMobile() {
  return useSyncExternalStore(
    (onChange) => {
      const mql = matchMedia(MOBILE_QUERY);
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    },
    () => matchMedia(MOBILE_QUERY).matches,
    () => false,
  );
}
