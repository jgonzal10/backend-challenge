import { AppDataSource } from "../data-source";
import { Task } from "../models/Task";
import { Workflow } from "../models/Workflow";
import { Job } from "./Job";
export class ReportGenerationJob implements Job {
  async run(task: Task): Promise<string> {
    console.log(
      `Gernerating final Report for workflowId ${task.workflow.workflowId}...`
    );

    // TODO clean this code. 
    const taskRepository = AppDataSource.getRepository(Task);
    const workflowRepository =
      taskRepository.manager.getRepository(Workflow);
      const currentWorkflow = await workflowRepository.findOne({
        where: { workflowId: task.workflow.workflowId },
        relations: ["tasks"],
      });

    console.log(`The final Report is `);
    return JSON.stringify({
      workflowId: task.workflow.workflowId,
      tasks: currentWorkflow?.tasks,
      finalReport: "Aggregated data and results"
    }) ;
  }
}
