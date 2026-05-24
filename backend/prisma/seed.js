import prisma from "../src/lib/prisma.js";

const universities = [
  { name: "New York University", domain: "nyu.edu" },
  { name: "University of California, Berkeley", domain: "berkeley.edu" },
  { name: "University of Michigan", domain: "umich.edu" },
  { name: "Stanford University", domain: "stanford.edu" },
  { name: "Massachusetts Institute of Technology", domain: "mit.edu" },
  { name: "Harvard University", domain: "harvard.edu" },
  { name: "University of Texas at Austin", domain: "utexas.edu" },
  { name: "University of Washington", domain: "uw.edu" },
];

async function main() {
  for (const u of universities) {
    await prisma.university.upsert({
      where: { domain: u.domain },
      update: {},
      create: u,
    });
  }

  console.log(`Seeded ${universities.length} universities`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
