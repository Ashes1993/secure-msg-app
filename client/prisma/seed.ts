import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Start seeding mock users...");

  const mockUsers = [
    {
      username: "alice_signal",
      password: "mock_hashed_password_123",
      publicKey: "ex_pk_v1_alice_7f83bc1a2eef904c",
      encryptedPrivateKey: "ex_enc_sk_v1_alice_9z8y7x...",
    },
    {
      username: "bob_matrix",
      password: "mock_hashed_password_123",
      publicKey: "ex_pk_v1_bob_9a82cd3b4ffe815d",
      encryptedPrivateKey: "ex_enc_sk_v1_bob_8w7v6u...",
    },
    {
      username: "charlie_ghost",
      password: "mock_hashed_password_123",
      publicKey: "ex_pk_v1_charlie_1b23cd4e5f6a7b8c",
      encryptedPrivateKey: "ex_enc_sk_v1_charlie_7t6s5r...",
    },
    {
      username: "dana_vault",
      password: "mock_hashed_password_123",
      publicKey: "ex_pk_v1_dana_8e91fa2b3cc4dd5e",
      encryptedPrivateKey: "ex_enc_sk_v1_dana_6q5p4o...",
    },
    {
      username: "evan_shield",
      password: "mock_hashed_password_123",
      publicKey: "ex_pk_v1_evan_0f12ab34cd56ef78",
      encryptedPrivateKey: "ex_enc_sk_v1_evan_5n4m3l...",
    },
  ];

  for (const user of mockUsers) {
    const existingUser = await prisma.user.findFirst({
      where: { username: user.username },
    });

    if (!existingUser) {
      const created = await prisma.user.create({
        data: {
          username: user.username,
          password: user.password,
          publicKey: user.publicKey,
          encryptedPrivateKey: user.encryptedPrivateKey,
        },
      });
      console.log(`✅ Created mock user: ${created.username}`);
    } else {
      console.log(`箱 User "${user.username}" already exists, skipping.`);
    }
  }

  console.log("🏁 Seeding operation complete!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("❌ Error occurred during seeding:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
