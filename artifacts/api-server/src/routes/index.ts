import { Router, type IRouter } from "express";
import healthRouter from "./health";
import clientsRouter from "./clients";
import analyzeIssueRouter from "./analyzeIssue";
import suggestAssetsRouter from "./suggestAssets";
import incidentsRouter from "./incidents";
import whatsappRouter from "./whatsapp";
import incidentChatRouter from "./incidentChat";

const router: IRouter = Router();

router.use(healthRouter);
router.use(clientsRouter);
router.use(analyzeIssueRouter);
router.use(suggestAssetsRouter);
router.use(incidentsRouter);
router.use(whatsappRouter);
router.use(incidentChatRouter);

export default router;
