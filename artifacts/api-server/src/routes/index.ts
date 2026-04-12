import { Router, type IRouter } from "express";
import healthRouter from "./health";
import clientsRouter from "./clients";
import analyzeIssueRouter from "./analyzeIssue";
import transcribeVoiceRouter from "./transcribeVoice";
import suggestAssetsRouter from "./suggestAssets";
import incidentsRouter from "./incidents";
import whatsappRouter from "./whatsapp";
import incidentChatRouter from "./incidentChat";
import pushRouter from "./push";
import copilotChatRouter from "./copilotChat";
import shareReportRouter from "./shareReport";
import devRouter from "./dev";

const router: IRouter = Router();

router.use(healthRouter);
router.use(clientsRouter);
router.use(analyzeIssueRouter);
router.use(transcribeVoiceRouter);
router.use(suggestAssetsRouter);
router.use(incidentsRouter);
router.use(whatsappRouter);
router.use(incidentChatRouter);
router.use(pushRouter);
router.use(copilotChatRouter);
router.use(shareReportRouter);
router.use(devRouter);

export default router;
