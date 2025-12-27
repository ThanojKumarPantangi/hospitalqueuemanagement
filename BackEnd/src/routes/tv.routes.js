import express from "express";
import {
  getDepartmentQueueStatus,
  getAllDepartmentsStatus,
} from "../controllers/tv.controller.js";

const router = express.Router();

router.get(
  "/department/:departmentId",
  getDepartmentQueueStatus
);

router.get(
  "/departments",
  getAllDepartmentsStatus
);

export default router;