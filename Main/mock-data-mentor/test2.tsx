import { getMentorUniversity } from "./fonctiontest";
import type { MentorParams } from "./mentors";

async function main() {
  const mentor: MentorParams = {
    id: "mentor-test",
    user_id: "user-test",
    full_name: "Test Mentor",
    email: "test@test.com",
    institution: "uni-01",
    expertise: ["finance"],
    bio: null,
  };

  const university = await getMentorUniversity(mentor);

  
  const universityName = await getMentorUniversity(mentor);
  console.log("Nom :", universityName);
}

main().catch((error) => {
  console.error("Erreur pendant le test :", error);
});