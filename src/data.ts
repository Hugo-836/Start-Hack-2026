// src/lib/mockData.ts

const BASE_RAW_URL =
  "https://raw.githubusercontent.com/MichaBrugger/start-hack-2026-studyond/main/mock-data";

export const MOCK_DATA_URLS = {
  companies: `${BASE_RAW_URL}/companies.json`,
  experts: `${BASE_RAW_URL}/experts.json`,
  fields: `${BASE_RAW_URL}/fields.json`,
  projects: `${BASE_RAW_URL}/projects.json`,
  students: `${BASE_RAW_URL}/students.json`,
  studyPrograms: `${BASE_RAW_URL}/study-programs.json`,
  supervisors: `${BASE_RAW_URL}/supervisors.json`,
  topics: `${BASE_RAW_URL}/topics.json`,
  universities: `${BASE_RAW_URL}/universities.json`,

  // utile en référence, pas forcément à charger au runtime
  types: `${BASE_RAW_URL}/types.ts`,
} as const;

export type MockDataKey = keyof typeof MOCK_DATA_URLS;

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Erreur HTTP ${response.status} pour ${url}`);
  }

  return response.json() as Promise<T>;
}

// Charge un seul fichier
export async function loadMockData<T>(key: Exclude<MockDataKey, "types">): Promise<T> {
  return fetchJson<T>(MOCK_DATA_URLS[key]);
}

// Charge toutes les données JSON
export async function loadAllMockData() {
  const [
    companies,
    experts,
    fields,
    projects,
    students,
    studyPrograms,
    supervisors,
    topics,
    universities,
  ] = await Promise.all([
    fetchJson(MOCK_DATA_URLS.companies),
    fetchJson(MOCK_DATA_URLS.experts),
    fetchJson(MOCK_DATA_URLS.fields),
    fetchJson(MOCK_DATA_URLS.projects),
    fetchJson(MOCK_DATA_URLS.students),
    fetchJson(MOCK_DATA_URLS.studyPrograms),
    fetchJson(MOCK_DATA_URLS.supervisors),
    fetchJson(MOCK_DATA_URLS.topics),
    fetchJson(MOCK_DATA_URLS.universities),
  ]);

  return {
    companies,
    experts,
    fields,
    projects,
    students,
    studyPrograms,
    supervisors,
    topics,
    universities,
  };
}