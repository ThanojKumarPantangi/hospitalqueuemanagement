import express from "express";
import { getAllDepartments } from "../controllers/department.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/",authMiddleware,getAllDepartments);

export default router;
