import { Router } from "express";
import { AppDataSource } from "../data-source";
import { Task } from "../models/Task";
import { Workflow } from "../models/Workflow";
import { TaskStatus } from "../workers/taskRunner";
import {
  WorkflowCurrentStatus,
  WorkflowResults,
  WorkflowStatus,
} from "../workflows/WorkflowFactory";
import { WorkflowControler } from "../controllers/workflowController";
const workflowControler = new WorkflowControler();

const workflowRouter = Router();
workflowRouter.get("/:id/status",workflowControler.getWorkflowById.bind(workflowControler))
workflowRouter.get("/:id/results", workflowControler.getWorkflowResults.bind(workflowControler))

// workflowRouter.get("/:id/results", async (req, res) => {
//   try {
//     const workflowId = (req.params as { id: string }).id;
//     const taskRepository = AppDataSource.getRepository(Task);
//     const workflowRepository = await taskRepository.manager.getRepository(
//       Workflow
//     );
//     const workflow = await workflowRepository.findOne({
//       where: { workflowId: workflowId },
//       relations: ["tasks"],
//     });

//     if (!workflow) {
//       res.status(404).json({ message: "Workflow not found" });
//     }
//     if (workflow!.status !== WorkflowStatus.Completed) {
//       res.status(400).json({ message: "Workflow not completed" });
//     }
//     const workflowResult: WorkflowResults = {
//       workflowId: workflow!.workflowId,
//       status: workflow!.status,
//       finalResult: workflow!.finalResult,
//     };
//     res.status(202).json(workflowResult);
//   } catch (error: any) {
//     console.error("Error getting workflow results:", error);
//     res.status(500);
//   }
// });

export default workflowRouter;
