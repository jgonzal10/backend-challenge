import { Not, Repository } from "typeorm";
import { Task } from "../models/Task";
import { getJobForTaskType } from "../jobs/JobFactory";
import { WorkflowStatus } from "../workflows/WorkflowFactory";
import { Workflow } from "../models/Workflow";
import { Result } from "../models/Result";
import { WorkflowReport } from "../jobs/ReportGenerationJob";

export enum TaskStatus {
  Queued = "queued",
  InProgress = "in_progress",
  Completed = "completed",
  Failed = "failed",
}

export class TaskRunner {
  constructor(private taskRepository: Repository<Task>) {}

  /**
   * Runs the appropriate job based on the task's type, managing the task's status.
   * @param task - The task entity that determines which job to run.
   * @throws If the job fails, it rethrows the error.
   */
  async run(task: Task): Promise<void> {
    // Checking if task has a dependency and if yes, then run the dependency first
    const taskDependencyId = task.dependency;
    const dependency = await this.taskRepository.findOne({
      where: { stepNumber: taskDependencyId },
      relations: ["workflow"],
    });

    task.input = dependency?.output;

    if (task.dependency) {
      const dependencyNotCompleted = await this.findingNotCompletedDependency(
        task
      );
      if (dependencyNotCompleted) {
        task = dependencyNotCompleted;
      }
    }

    task.status = TaskStatus.InProgress;
    task.progress = "starting job...";
    await this.taskRepository.save(task);
    const job = getJobForTaskType(task.taskType);
    try {
      console.log(`Starting job ${task.taskType} for task ${task.taskId}...`);
      const resultRepository =
        this.taskRepository.manager.getRepository(Result);
      const taskResult = await job.run(task);
      if (taskResult instanceof Error) {
        throw new Error(`Job ${task.taskType} for task ${task.taskId} failed`);
      }

      console.log(
        `Job ${task.taskType} for task ${task.taskId} completed successfully.`
      );
      const result = new Result();
      result.taskId = task.taskId!;
      result.data = JSON.stringify(taskResult || {});
      await resultRepository.save(result);
      task.resultId = result.resultId!;

      task.output = result.data;
      task.status = TaskStatus.Completed;
      task.progress = null;
      task.input = null;
      await this.taskRepository.save(task);
    } catch (error: any) {
      console.error(
        `Error running job ${task.taskType} for task ${task.taskId}:`,
        error
      );

      task.status = TaskStatus.Failed;
      task.progress = null;
      task.output = error;
      await this.taskRepository.save(task);

      throw error;
    }

    const workflowRepository =
      this.taskRepository.manager.getRepository(Workflow);
    const currentWorkflow = await workflowRepository.findOne({
      where: { workflowId: task.workflow.workflowId },
      relations: ["tasks"],
    });

    if (currentWorkflow) {
      const allCompleted = currentWorkflow.tasks.every(
        (t) => t.status === TaskStatus.Completed
      );
      const anyFailed = currentWorkflow.tasks.some(
        (t) => t.status === TaskStatus.Failed
      );

      const finalResult = await this.generateWorkflowFinalResult(
        this.taskRepository
      );

      currentWorkflow.finalResult = JSON.stringify(finalResult);

      if (anyFailed) {
        currentWorkflow.status = WorkflowStatus.Failed;
      } else if (allCompleted) {
        currentWorkflow.status = WorkflowStatus.Completed;
      } else {
        currentWorkflow.status = WorkflowStatus.InProgress;
      }
      await workflowRepository.save(currentWorkflow);
    }
  }

  async findingNotCompletedDependency(
    task: Task
  ): Promise<Task | null | undefined> {
    const dependencyNotCompleted = await this.taskRepository.findOne({
      where: [
        {
          stepNumber: task.dependency,
          status: TaskStatus.Queued,
        },
        {
          stepNumber: task.dependency,
          status: TaskStatus.InProgress,
        },
      ],
      relations: ["workflow"],
    });
    return dependencyNotCompleted;
  }
  async generateWorkflowFinalResult(
    taskRepository: Repository<Task>
  ): Promise<WorkflowReport[] | undefined> {
    const completedTasks = await taskRepository.find({
      where: { taskType: Not("report") },
      relations: ["workflow"],
    });
    let aggregateResults: WorkflowReport[] = [];
    if (completedTasks) {
      completedTasks.forEach((task) => {
        aggregateResults.push({
          taskId: task.taskId,
          taskType: task.taskType,
          output: task.output || "",
        });
      });
      return aggregateResults;
    }
  }
}
