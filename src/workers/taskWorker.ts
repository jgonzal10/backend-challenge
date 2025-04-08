import { In, Not } from "typeorm";
import { AppDataSource } from "../data-source";
import { Task } from "../models/Task";
import { TaskRunner, TaskStatus } from "./taskRunner";

export async function taskWorker() {
  const taskRepository = AppDataSource.getRepository(Task);
  const taskRunner = new TaskRunner(taskRepository);
  while (true) {
    const nonCompletedOrFailedTasks = await taskRepository.find({
      where: {
        taskType: Not("report"),
        status: Not(In([TaskStatus.Completed, TaskStatus.Failed])),
      },
      relations: ["workflow"],
    });

    const previousTaskInProgress = nonCompletedOrFailedTasks.length > 0; // Checking if there are task in progress
    let task = previousTaskInProgress
      ? await taskRepository.findOne({
          where: {
            status: In([TaskStatus.Queued, TaskStatus.InProgress]),
            taskType: Not("report"),
          },
          relations: ["workflow"],
        })
      : await taskRepository.findOne({
          where: { taskType: "report", status: Not(TaskStatus.Completed) },
          relations: ["workflow"],
        }); // Running for task that are in progress and at the end the report task

    if (task) {
      try {
        await taskRunner.run(task);
      } catch (error) {
        console.error(
          "Task execution failed. Task status has already been updated by TaskRunner."
        );
        console.error(error);
      }
    }

    // Wait before checking for the next task again
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }
}
