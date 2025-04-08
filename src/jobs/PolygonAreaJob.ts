import { Feature, Polygon } from "geojson";
import { Task } from "../models/Task";
import { Job } from "./Job";
import area from "@turf/area";
export class PolygonAreaJob implements Job {
  async run(task: Task, failedCounter?:number): Promise<number | string | Error> {
    
    try {
      console.log(
        `Calculating the polygon area from the geoJson field in the task for task ${task.taskId}...`
      );

      if(!task.geoJson){
        throw new Error("missing polygon coordinates");
      }
      const parsedGeoJson = JSON.parse(task.geoJson);
      if(!Array.isArray(parsedGeoJson?.coordinates)){
        throw new Error("missing polygon coordinates");
      }
  
      const inputGeometry: Feature<Polygon> = JSON.parse(task.geoJson);
      const areaInSquareMeters  = area(inputGeometry);
      console.log(`The area of the Polygon is ${areaInSquareMeters } Square Meters`);
      return areaInSquareMeters;
    } catch (error) {
      return new Error("Error while calculating Polygon Area")
    }

  }
}
 