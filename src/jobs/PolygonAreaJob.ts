import { Feature, Polygon } from "geojson";
import { Task } from "../models/Task";
import { Job } from "./Job";
import area from "@turf/area";

export class PolygonAreaJob implements Job {
  async run(task: Task): Promise<number> {
    console.log(
      `Calculating the polygon area from the geoJson field in the task for task ${task.taskId}...`
    );
    // TODO validate task.geoJson if not valid mark as failed
    const inputGeometry: Feature<Polygon> = JSON.parse(task.geoJson);

    const areaInSquareMeters  = area(inputGeometry);
    console.log(`The area of the Polygon is ${areaInSquareMeters } Square Meters`);
    return areaInSquareMeters ;
  }
}
