import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Seed terminals
  const terminalLA = await prisma.terminal.upsert({
    where: { code: "TRAPAC-LA" },
    update: {},
    create: {
      code: "TRAPAC-LA",
      name: "TraPac Los Angeles",
      timezone: "America/Los_Angeles",
      status: "ACTIVE",
      address: "630 Terminal Way, San Pedro, CA 90731",
    },
  });

  const terminalOAK = await prisma.terminal.upsert({
    where: { code: "TRAPAC-OAK" },
    update: {},
    create: {
      code: "TRAPAC-OAK",
      name: "TraPac Oakland",
      timezone: "America/Los_Angeles",
      status: "ACTIVE",
      address: "1717 Middle Harbor Road, Oakland, CA 94607",
    },
  });

  // Seed trucking company
  const truckingCompany = await prisma.truckingCompany.upsert({
    where: { truckingCompanyId: "tc-test-001" },
    update: {},
    create: {
      truckingCompanyId: "tc-test-001",
      name: "Test Trucking Co",
      status: "ACTIVE",
      primaryContact: "John Doe",
    },
  });

  // Seed SCAC
  await prisma.scac.upsert({
    where: { scacCode: "TTCO" },
    update: {},
    create: {
      scacCode: "TTCO",
      truckingCompanyId: truckingCompany.truckingCompanyId,
      status: "ACTIVE",
    },
  });

  // Seed test user
  await prisma.user.upsert({
    where: { username: "testdispatcher" },
    update: {},
    create: {
      username: "testdispatcher",
      email: "dispatcher@testtruck.com",
      phone: "555-0100",
      userType: "DISPATCHER",
      status: "ACTIVE",
    },
  });

  console.log("Seed data created successfully");
  console.log("Terminals:", terminalLA.code, terminalOAK.code);
  console.log("Trucking Company:", truckingCompany.name);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
