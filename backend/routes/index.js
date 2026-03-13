import { Router } from "express";
import remindersRouter from "./reminders.js";
import statsRouter from "./stats.js";
import settingsRouter from "./settings.js";

const router = Router();

router.use("/reminders", remindersRouter);
router.use("/stats", statsRouter);
router.use("/settings", settingsRouter);

export default router;
