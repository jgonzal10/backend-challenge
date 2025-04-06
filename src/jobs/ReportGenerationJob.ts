import { Task } from "../models/Task";
import { Workflow } from "../models/Workflow";
import { Job } from "./Job";

interface WorkflowReport {
    workflowId:string,
    tasks: Task[],
    finalReport:string

}

export class ReportGenerationJob implements Job {
  async run(task: Task): Promise<string> {
    console.log(
      `Gernerating final Report for workflowId ${task.workflow.workflowId}...`
    );

    console.log(`The final Report is `);
    return JSON.stringify({
      workflowId: task.workflow.workflowId,
      tasks: [],
      finalReport: "Aggregated data and results"
    }) ;
  }
}
