import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const topics = [
  { keyword: "automated phone call reminders", audience: "general users", searchIntent: "informational", priority: 1 },
  { keyword: "medication reminder calls", audience: "patients and caregivers", searchIntent: "transactional", priority: 1 },
  { keyword: "wake up call reminders", audience: "heavy sleepers and students", searchIntent: "transactional", priority: 2 },
  { keyword: "reminder calls for elderly people", audience: "seniors and caregivers", searchIntent: "informational", priority: 1 },
  { keyword: "appointment reminder phone calls", audience: "small businesses and clinics", searchIntent: "transactional", priority: 2 },
  { keyword: "AI reminder calls", audience: "tech-savvy users", searchIntent: "informational", priority: 3 },
  { keyword: "voice reminders vs push notifications", audience: "productivity enthusiasts", searchIntent: "comparison", priority: 3 },
  { keyword: "daily reminder phone calls", audience: "general users", searchIntent: "informational", priority: 4 },
  { keyword: "reminder calls for students", audience: "students", searchIntent: "informational", priority: 2 },
  { keyword: "reminder calls for parents", audience: "parents", searchIntent: "informational", priority: 3 },
  { keyword: "reminder calls for small businesses", audience: "small business owners", searchIntent: "transactional", priority: 2 },
  { keyword: "reminder calls for clinics", audience: "healthcare providers", searchIntent: "transactional", priority: 2 },
  { keyword: "medication adherence reminder calls", audience: "patients and healthcare providers", searchIntent: "informational", priority: 3 },
  { keyword: "how phone reminder services work", audience: "general users", searchIntent: "informational", priority: 4 },
  { keyword: "why voice reminders work better than notifications", audience: "productivity enthusiasts", searchIntent: "informational", priority: 3 },
  { keyword: "reminder calls for ADHD users", audience: "ADHD community", searchIntent: "informational", priority: 2 },
  { keyword: "recurring reminder phone calls", audience: "general users", searchIntent: "informational", priority: 4 },
  { keyword: "personal call reminder service", audience: "general users", searchIntent: "transactional", priority: 3 },
  { keyword: "automated reminder calls for appointments", audience: "businesses", searchIntent: "transactional", priority: 3 },
  { keyword: "missed appointment reminder systems", audience: "healthcare and services", searchIntent: "informational", priority: 4 },
  { keyword: "senior-friendly phone reminders", audience: "seniors and caregivers", searchIntent: "informational", priority: 2 },
  { keyword: "reminder call service for routines", audience: "general users", searchIntent: "transactional", priority: 4 },
  { keyword: "wake-up phone call app alternatives", audience: "general users", searchIntent: "comparison", priority: 3 },
  { keyword: "voice-based reminders for productivity", audience: "professionals", searchIntent: "informational", priority: 4 },
  { keyword: "reminder call systems for healthcare", audience: "healthcare providers", searchIntent: "transactional", priority: 3 },
  { keyword: "phone reminders for busy professionals", audience: "professionals", searchIntent: "informational", priority: 3 },
  { keyword: "how to stop ignoring reminders", audience: "general users", searchIntent: "informational", priority: 4 },
  { keyword: "best reminder method for elderly parents", audience: "adult children of seniors", searchIntent: "informational", priority: 2 },
  { keyword: "AI phone assistant for reminders", audience: "tech-savvy users", searchIntent: "informational", priority: 4 },
  { keyword: "automated voice reminders for daily tasks", audience: "general users", searchIntent: "informational", priority: 5 },
];

async function main() {
  console.log("Seeding blog topics...");

  let created = 0;
  let skipped = 0;

  for (const topic of topics) {
    const existing = await prisma.blogTopic.findFirst({
      where: { keyword: topic.keyword },
    });

    if (existing) {
      skipped++;
      continue;
    }

    await prisma.blogTopic.create({ data: topic });
    created++;
  }

  console.log(`Done. Created: ${created}, Skipped (already exist): ${skipped}`);
}

main()
  .catch((err) => {
    console.error("Seed error:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
