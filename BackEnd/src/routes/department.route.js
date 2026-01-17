import express from "express";
import { getAllDepartments } from "../controllers/department.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";
import roleMiddleware from "../middlewares/role.middleware.js";

const router = express.Router();

router.get("/",
    authMiddleware,
    roleMiddleware("ADMIN","PATIENT","DOCTOR"),
    getAllDepartments,
);



export default router;
