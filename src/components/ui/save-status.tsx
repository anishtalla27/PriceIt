import { useEffect, useState } from "react";
import { useAppState } from "@/context/AppStateContext";

export function SaveStatus() {
  const { lastSavedAt } = useAppState();
  const [label, setLabel] = useState("Progress saved on this device");

  useEffect(() => {
    if (!lastSavedAt) return;
    const showId = window.setTimeout(() => setLabel("Saved just now ✓"), 0);
    const resetId = window.setTimeout(() => setLabel("Progress saved on this device"), 2500);
    return () => {
      window.clearTimeout(showId);
      window.clearTimeout(resetId);
    };
  }, [lastSavedAt]);

  return (
    <p className="text-center text-[11px] text-[#84999E] mt-2 select-none transition-all duration-300">
      {label}
    </p>
  );
}
