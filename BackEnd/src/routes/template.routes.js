import express from "express";
import {
  createTemplate,
  getTemplates,
  updateTemplate,
  deleteTemplate,
  matchTemplateMedicine
} from "../controllers/medicine.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";
import roleMiddleware from "../middlewares/role.middleware.js";

const router = express.Router();

router.post("/",
    authMiddleware,
    roleMiddleware("DOCTOR"),
    createTemplate
);

router.get("/",
    authMiddleware,
    roleMiddleware("DOCTOR"),
    getTemplates
);

router.delete("/:id",
    authMiddleware,
    roleMiddleware("DOCTOR"),
    deleteTemplate
);

router.put("/:id",
    authMiddleware,
    roleMiddleware("DOCTOR"), 
    updateTemplate
);

router.get(
  "/match",
  authMiddleware,
  roleMiddleware("DOCTOR"),
  matchTemplateMedicine
);

export default router;