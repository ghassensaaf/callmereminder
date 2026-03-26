import { Router } from "express";
import remindersRouter from "./reminders.js";
import templatesRouter from "./templates.js";
import statsRouter from "./stats.js";
import settingsRouter from "./settings.js";
import vapiServerRouter from "./vapi-server.js";
import vapiConfigsRouter from "./vapi-configs.js";
import publicV1Router from "./public-v1.js";
import publicApiKeysRouter from "./public-api-keys.js";
import blogRouter from "./blog.js";

const router = Router();

router.use("/vapi", vapiServerRouter);
router.use("/vapi-configs", vapiConfigsRouter);
router.use("/reminders", remindersRouter);
router.use("/templates", templatesRouter);
router.use("/stats", statsRouter);
router.use("/settings", settingsRouter);
router.use("/public/v1", publicV1Router);
router.use("/public-api-keys", publicApiKeysRouter);
router.use("/blog", blogRouter);

export default router;
