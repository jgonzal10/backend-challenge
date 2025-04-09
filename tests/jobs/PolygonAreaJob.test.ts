import { PolygonAreaJob } from "../../src/jobs/PolygonAreaJob";
import { Task } from "../../src/models/Task";
import area from "@turf/area";
jest.mock("@turf/area");

describe("PolygonAreaJob", () => {
  let job: PolygonAreaJob;
  let mockTask: Task;

  beforeEach(() => {
    job = new PolygonAreaJob();
    mockTask = {
      taskId: "fakeTast",
      geoJson: JSON.stringify({
        type: "Polygon",
        coordinates: [
          [
            [0, 0],
            [1, 0],
            [1, 1],
            [0, 1],
            [0, 0],
          ],
        ],
      }),
    } as Task;
    jest.clearAllMocks();
  });

  describe("run Polygon Area Job", () => {
    it("should calculate the area for a valid polygon", async () => {
      (area as jest.Mock).mockReturnValue(12345);

      const result = await job.run(mockTask);

      expect(area).toHaveBeenCalledTimes(1);
      expect(result).toBe(12345);
    });

    it("should throw an error when geoJson is missing", async () => {
      const invalidTask = {
        ...mockTask,
        geoJson: undefined,
      } as unknown as Task;
      const result = await job.run(invalidTask as Task);

      expect(result).toBeInstanceOf(Error);
      expect((result as Error).message).toBe(
        "Error while calculating Polygon Area"
      );
    });

    it("should throw an error when geoJson is invalid JSON", async () => {
      const invalidTask = { ...mockTask, geoJson: "invalid-json" };
      const result = await job.run(invalidTask);

      expect(result).toBeInstanceOf(Error);
      expect((result as Error).message).toBe(
        "Error while calculating Polygon Area"
      );
    });
  });
});
