import { supabase } from "../src/integrations/supabase/client";
import type { MentorParams } from "./mentors";

import { loadMockData } from "./data";


type University = {
  id: string;
  name: string;
  country: string;
  domains: string[];
  about: string;
};

export async function getMentorUniversity(
  mentor: MentorParams
): Promise<string | null> {
  if (!mentor.institution) {
    return null;
  }

  const universities = await loadMockData<University[]>("universities");

  return universities.find((uni) => uni.id === mentor.institution)?.name ?? null;
}