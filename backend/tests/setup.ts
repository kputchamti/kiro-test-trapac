import { PrismaClient } from "@prisma/client";
import { execSync } from "child_process";
import path from "path";

const TEST_DB_PATH = path.resolve(__dirname, "../prisma/test.db");
const DATABASE_URL = `file:${TEST_DB_PATH}`;

// Override DATABASE_URL for all Prisma usage
process.env.DATABASE_URL = DATABASE_URL;

let prisma: PrismaClient | null = null;

export function getTestPrisma(): PrismaClient {
  if (!prisma) {
    prisma = new PrismaClient({
      datasources: {
        db: {
          url: DATABASE_URL,
        },
      },
    });
  }
  return prisma;
}

export async function setupTestDb(): Promise<void> {
  // Push schema to test database (creates/resets the test.db file)
  execSync("npx prisma db push --force-reset --skip-generate", {
    cwd: path.resolve(__dirname, ".."),
    env: {
      ...process.env,
      DATABASE_URL,
    },
    stdio: "pipe",
  });

  // Reconnect prisma after db reset
  if (prisma) {
    await prisma.$disconnect();
    prisma = null;
  }
}

export async function seedTestDb(): Promise<void> {
  const testPrisma = getTestPrisma();

  // Seed terminals (use upsert to avoid duplicates)
  await testPrisma.terminal.upsert({
    where: { code: "TRAPAC-LA" },
    update: {},
    create: {
      terminalId: "term-la-001",
      code: "TRAPAC-LA",
      name: "TraPac Los Angeles",
      timezone: "America/Los_Angeles",
      status: "ACTIVE",
      address: "630 Terminal Way, San Pedro, CA 90731",
    },
  });

  await testPrisma.terminal.upsert({
    where: { code: "TRAPAC-OAK" },
    update: {},
    create: {
      terminalId: "term-oak-001",
      code: "TRAPAC-OAK",
      name: "TraPac Oakland",
      timezone: "America/Los_Angeles",
      status: "ACTIVE",
      address: "1717 Middle Harbor Road, Oakland, CA 94607",
    },
  });

  // Seed trucking company
  await testPrisma.truckingCompany.upsert({
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
  await testPrisma.scac.upsert({
    where: { scacCode: "TTCO" },
    update: {},
    create: {
      scacCode: "TTCO",
      truckingCompanyId: "tc-test-001",
      status: "ACTIVE",
    },
  });

  // Seed test user
  await testPrisma.user.upsert({
    where: { username: "testdispatcher" },
    update: {},
    create: {
      userId: "user-test-001",
      username: "testdispatcher",
      email: "dispatcher@testtruck.com",
      phone: "555-0100",
      userType: "DISPATCHER",
      status: "ACTIVE",
    },
  });
}

export async function cleanupTestDb(): Promise<void> {
  const testPrisma = getTestPrisma();
  await testPrisma.auditLog.deleteMany();
  await testPrisma.appointmentTransaction.deleteMany();
  await testPrisma.appointment.deleteMany();
}

export async function teardownTestDb(): Promise<void> {
  if (prisma) {
    await prisma.$disconnect();
    prisma = null;
  }
}
