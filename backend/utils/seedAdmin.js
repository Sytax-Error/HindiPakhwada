require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/User");

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);

  const email = process.env.ADMIN_EMAIL;
  const existing = await User.findOne({ email });
  if (existing) {
    console.log("Admin already exists:", email);
    process.exit(0);
  }

  await User.create({
    name: process.env.ADMIN_NAME || "Admin",
    employeeCode: process.env.ADMIN_EMPLOYEE_CODE || "000001",
    designation: "Rajbhasha Officer",
    office: "Delhi",
    email,
    password: process.env.ADMIN_PASSWORD,
    role: "admin",
  });

  console.log("Admin user created:", email);
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
