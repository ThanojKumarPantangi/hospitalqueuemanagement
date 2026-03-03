import express from "express";
import {
  createMedicine,
  searchMedicines,
  getMedicineById,
  updateMedicine,
  deleteMedicine,
  getAllMedicines,
} from "../controllers/medicine.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";
import roleMiddleware from "../middlewares/role.middleware.js";

const router = express.Router();

router.post("/",
    authMiddleware,
    roleMiddleware("ADMIN"),
    createMedicine
);

router.get("/search",
    authMiddleware,
    roleMiddleware("ADMIN","DOCTOR"),
    searchMedicines
);

router.get("/:id",
    authMiddleware,
    roleMiddleware("ADMIN","DOCTOR"),
    getMedicineById
);

router.put("/:id",
    authMiddleware,
    roleMiddleware("ADMIN"),
    updateMedicine
);

router.delete("/:id",
    authMiddleware,
    roleMiddleware("ADMIN"),
    deleteMedicine
);

router.get(
    "/",
    authMiddleware,
    roleMiddleware("ADMIN"),  
    getAllMedicines
);

export default router;