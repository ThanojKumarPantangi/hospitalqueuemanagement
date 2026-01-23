import express from "express";
import { testEmailController } from "../controllers/email.controller";

const router = express.Router();

router.post("/test-email", testEmailController);

export default router;
