import { In, Not } from "typeorm";
import { AppDataSource } from "../data-source";
import { Task } from "../models/Task";
import { TaskRunner, TaskStatus } from "./taskRunner";

export async function taskWorker() {
  const taskRepository = AppDataSource.getRepository(Task);
  const taskRunner = new TaskRunner(taskRepository);

  const arePreviousTaskCompleted= async (
  ) : Promise<Boolean> => {
  const nonCompletedOrFailedTasks = await taskRepository.find({
    where: {
      taskType: Not("report"),
      status: Not(In([TaskStatus.Completed, TaskStatus.Failed])),
    },
    relations: ["workflow"],
  });
  
  return nonCompletedOrFailedTasks.length > 0; // Checking if there are task in progress
  }


  while (true) {
    const missingTaks= await arePreviousTaskCompleted()
    let task = missingTaks
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


