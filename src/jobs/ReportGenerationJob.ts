import { AppDataSource } from "../data-source";
import { Task } from "../models/Task";
import { Workflow } from "../models/Workflow";
import { Job } from "./Job";
export interface WorkflowReport {
  taskId: string;
  taskType:string;
  output?: string;
  failureInfo?: string;
}
export class ReportGenerationJob implements Job {
  async run(task: Task): Promise<string> {
    console.log(
      `Gernerating final Report for workflowId ${task.workflow.workflowId}...`
    );

    // TODO clean this code. DI
    const taskRepository = AppDataSource.getRepository(Task);
    const workflowRepository = taskRepository.manager.getRepository(Workflow);


    const currentWorkflow = await workflowRepository.findOne({
      where: { workflowId: task.workflow.workflowId },
      relations: ["tasks"],
    });
    let aggregateResults: WorkflowReport[] = [];
    if(currentWorkflow){
      currentWorkflow?.tasks.forEach((task) => {
        aggregateResults.push({
          taskId: task.taskId,
          taskType: task.taskType,
          output: task.output || "",
        });
      });

      const report = JSON.stringify({
        workflowId: task.workflow.workflowId,
        tasks: currentWorkflow?.tasks,
        finalReport: aggregateResults,
      })
      console.log(`The Final Report is ${report}`);
      return report;
    }else{
      console.log("Workflow not found")
      throw new Error("Workflow not found")
    }

  }
}
