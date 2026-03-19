import { loadAllMockData, MOCK_DATA_URLS } from "./data";

function getSize(data: unknown): number | string {
  if (Array.isArray(data)) {
    return data.length;
  }

  if (data && typeof data === "object") {
    return Object.keys(data as Record<string, unknown>).length;
  }

  return "format inconnu";
}

async function testSingleFile(name: string, url: string) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Erreur HTTP ${response.status} pour ${name} -> ${url}`);
  }

  const json = await response.json();

  console.log(`OK ${name} : accès réussi (${getSize(json)} éléments)`);
}

async function main() {
  console.log("Test d'accès aux données distantes...\n");

  await testSingleFile("companies", MOCK_DATA_URLS.companies);
  await testSingleFile("experts", MOCK_DATA_URLS.experts);
  await testSingleFile("fields", MOCK_DATA_URLS.fields);
  await testSingleFile("mentors", MOCK_DATA_URLS.mentors);
  await testSingleFile("projects", MOCK_DATA_URLS.projects);
  await testSingleFile("students", MOCK_DATA_URLS.students);
  await testSingleFile("studyPrograms", MOCK_DATA_URLS.studyPrograms);
  await testSingleFile("supervisors", MOCK_DATA_URLS.supervisors);
  await testSingleFile("topics", MOCK_DATA_URLS.topics);
  await testSingleFile("universities", MOCK_DATA_URLS.universities);

  console.log("\nTest du chargement global...\n");

  const allData = await loadAllMockData();

  console.log("Chargement global réussi :");
  console.log({
    companies: getSize(allData.companies),
    experts: getSize(allData.experts),
    fields: getSize(allData.fields),
    mentors: getSize(allData.mentors),
    projects: getSize(allData.projects),
    students: getSize(allData.students),
    studyPrograms: getSize(allData.studyPrograms),
    supervisors: getSize(allData.supervisors),
    topics: getSize(allData.topics),
    universities: getSize(allData.universities),
  });

  console.log("\nTout fonctionne.");
}

main().catch((error) => {
  console.error("\nLe test a échoué.");
  console.error(error);
});
