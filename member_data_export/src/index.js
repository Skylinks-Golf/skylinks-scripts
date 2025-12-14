import { initializeDatabase } from "./db.js";
import {
  getAllMembers,
  getMemberByNumber,
  insertMember,
} from "./members.js";
import { loadPhotoAsBlob } from "./photo.js";

async function seedSampleMember() {
  const samplePhotoPath = process.env.SAMPLE_PHOTO;
  const photoBlob = samplePhotoPath ? loadPhotoAsBlob(samplePhotoPath) : null;

  try {
    await insertMember({
      member_number: "M001",
      first_name: "Sample",
      email: "sample@example.com",
      photo: photoBlob,
    });
    console.log("Inserted sample member M001.");
  } catch (err) {
    if (err.message.includes("UNIQUE constraint failed")) {
      console.log("Sample member already exists, skipping insert.");
    } else {
      throw err;
    }
  }
}

async function main() {
  await initializeDatabase();
  await seedSampleMember();

  const member = await getMemberByNumber("M001");
  console.log("Fetched member by member_number:", member);

  const members = await getAllMembers();
  console.log(`Total members: ${members.length}`);
}

main().catch((err) => {
  console.error("Error running demo:", err);
  process.exitCode = 1;
});
