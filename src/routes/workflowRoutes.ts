import { Router } from "express";
import { WorkflowController } from "../controllers/workflowController";
import { AppDataSource } from "../data-source";
import { Workflow } from "../models/Workflow";
import { Task } from "../models/Task";

const taskRepository = AppDataSource.getRepository(Task);
const workflowRepository = taskRepository.manager.getRepository(
    Workflow
  );
const workflowControler = new WorkflowController(workflowRepository);

const workflowRouter = Router();
workflowRouter.get("/:id/status",workflowControler.getWorkflowById.bind(workflowControler))
workflowRouter.get("/:id/results", workflowControler.getWorkflowResults.bind(workflowControler))

export default workflowRouter;
