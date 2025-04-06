import { Not } from "typeorm";
import { AppDataSource } from "../data-source";
import { Task } from "../models/Task";
import { TaskRunner, TaskStatus } from "./taskRunner";

export async function taskWorker() {
  const taskRepository = AppDataSource.getRepository(Task);
  const taskRunner = new TaskRunner(taskRepository);
  while (true) {
    const nonCompletedTasks = await taskRepository.find({
      where: { taskType: Not("report"), status: Not(TaskStatus.Completed) },
      relations: ["workflow"],
    });

    const previousTaskInProgress = nonCompletedTasks.length > 0;

    let task = previousTaskInProgress
      ? await taskRepository.findOne({
          where: { status: TaskStatus.Queued, taskType: Not("report") },
          relations: ["workflow"], // Ensure workflow is loaded
        })
      : await taskRepository.findOne({
          where: { taskType: "report" },
          relations: ["workflow"],
        });

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
