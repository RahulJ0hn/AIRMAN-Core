import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Admin
  const adminPassword = await bcrypt.hash("admin123!", 10);
  const admin = await prisma.user.upsert({
    where: { email: "admin@airman.dev" },
    update: {},
    create: {
      email: "admin@airman.dev",
      password: adminPassword,
      name: "Air Admin",
      role: Role.ADMIN,
      approved: true,
    },
  });

  // Instructor
  const instructorPassword = await bcrypt.hash("instructor123!", 10);
  const instructor = await prisma.user.upsert({
    where: { email: "maverick@airman.dev" },
    update: {},
    create: {
      email: "maverick@airman.dev",
      password: instructorPassword,
      name: "Pete Mitchell",
      role: Role.INSTRUCTOR,
      approved: true,
    },
  });

  // Student
  const studentPassword = await bcrypt.hash("student123!", 10);
  await prisma.user.upsert({
    where: { email: "rooster@airman.dev" },
    update: {},
    create: {
      email: "rooster@airman.dev",
      password: studentPassword,
      name: "Bradley Bradshaw",
      role: Role.STUDENT,
      approved: true,
    },
  });

  // Sample course
  const course = await prisma.course.upsert({
    where: { id: "seed-course-001" },
    update: {},
    create: {
      id: "seed-course-001",
      title: "Introduction to Flight Fundamentals",
      description: "Master the basics of aviation theory and practice.",
      createdById: instructor.id,
      modules: {
        create: [
          {
            title: "Aerodynamics Basics",
            order: 1,
            lessons: {
              create: [
                {
                  title: "Lift and Drag Explained",
                  type: "TEXT",
                  order: 1,
                  content:
                    "# Lift and Drag\n\nLift is the aerodynamic force that directly opposes the weight of an aircraft...",
                },
                {
                  title: "Aerodynamics Quiz",
                  type: "MCQ_QUIZ",
                  order: 2,
                  questions: {
                    create: [
                      {
                        text: "What force directly opposes gravity on an aircraft?",
                        options: JSON.stringify(["Drag", "Thrust", "Lift", "Weight"]),
                        correctIndex: 2,
                        explanation: "Lift counteracts the weight of the aircraft.",
                        order: 1,
                      },
                      {
                        text: "Which control surface controls pitch?",
                        options: JSON.stringify(["Ailerons", "Rudder", "Elevator", "Flaps"]),
                        correctIndex: 2,
                        explanation: "The elevator controls pitch (nose up/down).",
                        order: 2,
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  });

  // Seed availability
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(9, 0, 0, 0);

  const dayAfter = new Date(tomorrow);
  dayAfter.setHours(17, 0, 0, 0);

  await prisma.availability.upsert({
    where: { id: "seed-avail-001" },
    update: {},
    create: {
      id: "seed-avail-001",
      instructorId: instructor.id,
      startTime: tomorrow,
      endTime: dayAfter,
    },
  });

  console.log("✅ Seed complete!");
  console.log(`  Admin:      admin@airman.dev / admin123!`);
  console.log(`  Instructor: maverick@airman.dev / instructor123!`);
  console.log(`  Student:    rooster@airman.dev / student123!`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
