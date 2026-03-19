import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { getDefaultSupervisorId } from "@/lib/mentorProfiles";

type MentorSelectionContextValue = {
  selectedSupervisorId: string;
  setSelectedSupervisorId: (value: string) => void;
};

const STORAGE_KEY = "studyond-selected-supervisor";

const MentorSelectionContext = createContext<MentorSelectionContextValue | null>(null);

function readInitialSupervisorId() {
  if (typeof window === "undefined") {
    return getDefaultSupervisorId();
  }

  return window.localStorage.getItem(STORAGE_KEY) || getDefaultSupervisorId();
}

export function MentorSelectionProvider({ children }: { children: ReactNode }) {
  const [selectedSupervisorId, setSelectedSupervisorIdState] = useState(readInitialSupervisorId);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, selectedSupervisorId);
  }, [selectedSupervisorId]);

  return (
    <MentorSelectionContext.Provider
      value={{
        selectedSupervisorId,
        setSelectedSupervisorId: setSelectedSupervisorIdState,
      }}
    >
      {children}
    </MentorSelectionContext.Provider>
  );
}

export function useMentorSelection() {
  const context = useContext(MentorSelectionContext);

  if (!context) {
    throw new Error("useMentorSelection must be used within a MentorSelectionProvider.");
  }

  return context;
}
