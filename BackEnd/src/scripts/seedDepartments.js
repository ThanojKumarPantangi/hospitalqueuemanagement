import mongoose from "mongoose";
import Department from "../models/department.model.js"; 

const departments = [
  { name: "General Medicine", slotDurationMinutes: 10, consultationFee: 300, maxCounters: 2, isOpen: true },
  { name: "Cardiology", slotDurationMinutes: 15, consultationFee: 600, maxCounters: 1, isOpen: true },
  { name: "Dermatology", slotDurationMinutes: 10, consultationFee: 500, maxCounters: 1, isOpen: true },
  { name: "Orthopedics", slotDurationMinutes: 12, consultationFee: 550, maxCounters: 2, isOpen: true },
  { name: "Pediatrics", slotDurationMinutes: 10, consultationFee: 400, maxCounters: 2, isOpen: true },
  { name: "Gynecology", slotDurationMinutes: 12, consultationFee: 500, maxCounters: 1, isOpen: true },
  { name: "ENT", slotDurationMinutes: 10, consultationFee: 400, maxCounters: 1, isOpen: true },
  { name: "Ophthalmology", slotDurationMinutes: 10, consultationFee: 450, maxCounters: 1, isOpen: true },
  { name: "Neurology", slotDurationMinutes: 15, consultationFee: 700, maxCounters: 1, isOpen: true },
  { name: "Psychiatry", slotDurationMinutes: 15, consultationFee: 650, maxCounters: 1, isOpen: true },

  { name: "Urology", slotDurationMinutes: 12, consultationFee: 600, maxCounters: 1, isOpen: true },
  { name: "Nephrology", slotDurationMinutes: 15, consultationFee: 650, maxCounters: 1, isOpen: true },
  { name: "Gastroenterology", slotDurationMinutes: 15, consultationFee: 650, maxCounters: 1, isOpen: true },
  { name: "Pulmonology", slotDurationMinutes: 12, consultationFee: 600, maxCounters: 1, isOpen: true },
  { name: "Endocrinology", slotDurationMinutes: 12, consultationFee: 600, maxCounters: 1, isOpen: true },
  { name: "General Surgery", slotDurationMinutes: 15, consultationFee: 700, maxCounters: 2, isOpen: true },
  { name: "Oncology", slotDurationMinutes: 20, consultationFee: 800, maxCounters: 1, isOpen: true },
  { name: "Radiology", slotDurationMinutes: 10, consultationFee: 400, maxCounters: 1, isOpen: true },
  { name: "Physiotherapy", slotDurationMinutes: 20, consultationFee: 350, maxCounters: 2, isOpen: true },
  { name: "Dental", slotDurationMinutes: 15, consultationFee: 300, maxCounters: 1, isOpen: true },
];

const seedDepartments = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB Connected");

    await Department.deleteMany({});
    console.log("🗑️ Old departments removed");

    await Department.insertMany(departments);
    console.log("✅ Departments inserted successfully");

    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
};

seedDepartments();