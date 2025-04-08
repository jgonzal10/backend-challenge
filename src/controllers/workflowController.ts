import { Request, Response } from 'express';
import { AppDataSource } from "../data-source";
import { Task } from "../models/Task";
import { Workflow } from "../models/Workflow";
import { TaskStatus } from '../workers/taskRunner';
import { WorkflowCurrentStatus } from '../workflows/WorkflowFactory';

export class WorkflowControler {
  private taskRepository = AppDataSource.getRepository(Task);

  async getWorkflowById(req:Request, res:Response) {
  try {
    const workflowId = (req.params as { id: string }).id;
    const workflowRepository = await this.taskRepository.manager.getRepository(
      Workflow
    );
    const workflow = await workflowRepository.findOne({
      where: { workflowId: workflowId },
      relations: ["tasks"],
    });
    if (workflow) {
      const completedTasks = workflow.tasks.filter(
        (t) => t.status === TaskStatus.Completed
      );
      const workflowStatus: WorkflowCurrentStatus = {
        workflowId: workflow.workflowId,
        status: workflow.status,
        completedTasks: completedTasks.length,
        totalTasks: workflow.tasks.length,
      };
      res.status(202).json(workflowStatus);
    } else {
      res.status(404).json({ message: "Workflow not found" });
    }
  } catch (error: any) {
    console.error("Error getting workflow:", error);
    res.status(500).json({ message: "Failed to get workflow status" });
  }
  }
}
