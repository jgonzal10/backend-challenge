import { Request, Response } from 'express';
import { Workflow } from "../models/Workflow";
import { TaskStatus } from '../workers/taskRunner';
import { WorkflowCurrentStatus, WorkflowResults, WorkflowStatus } from '../workflows/WorkflowFactory';
import { Repository } from 'typeorm';

export class WorkflowController {
  constructor(
    private workflowRepository: Repository<Workflow>
  ) {}

  async getWorkflowById(req:Request, res:Response) {
  try {
    const workflowId = (req.params as { id: string }).id;
    const workflow = await this.workflowRepository.findOne({
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

  async getWorkflowResults(req:Request, res:Response){
    try {
      const workflowId = (req.params as { id: string }).id;
      const workflow = await this.workflowRepository.findOne({
        where: { workflowId: workflowId },
        relations: ["tasks"],
      });
  
      if (!workflow) {
        res.status(404).json({ message: "Workflow not found" });
      }
      if (workflow!.status !== WorkflowStatus.Completed) {
        res.status(400).json({ message: "Workflow not completed" });
      }
      const workflowResult: WorkflowResults = {
        workflowId: workflow!.workflowId,
        status: workflow!.status,
        finalResult: workflow!.finalResult,
      };
      res.status(202).json(workflowResult);
    } catch (error: any) {
      console.error("Error getting workflow results:", error);
      res.status(500);
    }
  }
}
