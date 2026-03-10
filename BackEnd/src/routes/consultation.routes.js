import express from "express";
import {
  startConsultation,
  getConsultation,
  endConsultation
} from "../controllers/consultation.controller.js";

import authMiddleware from "../middlewares/auth.middleware.js";
import roleMiddleware from "../middlewares/role.middleware.js";


const router = express.Router();


router.post("/start", 
    authMiddleware, 
    roleMiddleware("DOCTOR"),
    startConsultation
);

router.get("/:tokenId",
    authMiddleware, 
    roleMiddleware("PATIENT","DOCTOR"),
    getConsultation
); 

router.post("/end",
    authMiddleware, 
    roleMiddleware("DOCTOR","PATIENT"),
    endConsultation
);

export default router;