import mongoose from "mongoose";

import dotenv from "dotenv";
import Medicine from "../models/medicine.model.js"; // adjust path if needed

dotenv.config({ path: "../.env" });

// Core Indian generics grouped by category
const GENERIC_MASTER = {
  "Analgesic / Antipyretic": [
    "Paracetamol",
    "Ibuprofen",
    "Diclofenac",
    "Aceclofenac",
    "Naproxen",
    "Tramadol",
    "Ketorolac",
    "Mefenamic Acid"
  ],

  "Antibiotic": [
    "Amoxicillin",
    "Azithromycin",
    "Ciprofloxacin",
    "Levofloxacin",
    "Doxycycline",
    "Cefixime",
    "Ceftriaxone",
    "Clarithromycin",
    "Metronidazole",
    "Linezolid"
  ],

  "Antidiabetic": [
    "Metformin",
    "Glimepiride",
    "Gliclazide",
    "Sitagliptin",
    "Vildagliptin",
    "Empagliflozin",
    "Insulin Regular",
    "Insulin Glargine"
  ],

  "Cardiovascular": [
    "Amlodipine",
    "Telmisartan",
    "Losartan",
    "Atorvastatin",
    "Rosuvastatin",
    "Clopidogrel",
    "Aspirin",
    "Metoprolol",
    "Carvedilol",
    "Furosemide"
  ],

  "Gastrointestinal": [
    "Omeprazole",
    "Pantoprazole",
    "Rabeprazole",
    "Ranitidine",
    "Domperidone",
    "Ondansetron",
    "Lactulose"
  ],

  "Respiratory": [
    "Salbutamol",
    "Budesonide",
    "Montelukast",
    "Levocetirizine",
    "Cetirizine",
    "Theophylline"
  ],

  "Psychiatric": [
    "Sertraline",
    "Fluoxetine",
    "Escitalopram",
    "Alprazolam",
    "Clonazepam",
    "Olanzapine",
    "Risperidone"
  ]
};

const COMMON_STRENGTHS = [
  "5 mg",
  "10 mg",
  "20 mg",
  "50 mg",
  "100 mg",
  "250 mg",
  "500 mg"
];

const COMMON_FORMS = ["Tablet", "Capsule", "Syrup", "Injection"];

function createVariants() {
  const variants = [];
  const count = 2 + Math.floor(Math.random() * 3);

  for (let i = 0; i < count; i++) {
    variants.push({
      form: COMMON_FORMS[Math.floor(Math.random() * COMMON_FORMS.length)],
      strength:
        COMMON_STRENGTHS[Math.floor(Math.random() * COMMON_STRENGTHS.length)],
    });
  }

  return variants;
}

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to DB");

  const docs = [];

  for (const category in GENERIC_MASTER) {
    for (const drug of GENERIC_MASTER[category]) {
      docs.push({
        name: drug,
        genericName: drug,
        category,
        variants: createVariants(),
        isActive: true,
      });
    }
  }

  await Medicine.insertMany(docs);
  console.log(`Inserted ${docs.length} medicines`);

  await mongoose.disconnect();
}

seed();