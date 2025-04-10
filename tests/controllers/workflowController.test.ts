import { WorkflowController } from '../../src/controllers/workflowController';
import { Workflow } from '../../src/models/Workflow';
import { WorkflowStatus } from '../../src/workflows/WorkflowFactory';
import { Request, Response } from 'express';
import { TaskStatus } from '../../src/workers/taskRunner';
import { createMockRepository } from '../utils/mockRepositories';

describe('WorkflowController', () => {
  let controller: WorkflowController;
  let mockWorkflowRepository: any;
  let req: Partial<Request>;
  let res: Partial<Response>;
  let json: jest.Mock;
  let status: jest.Mock;

  beforeEach(() => {
    mockWorkflowRepository = createMockRepository<Workflow>();
    
    controller = new WorkflowController(
      mockWorkflowRepository
    );
    
    json = jest.fn();
    status = jest.fn().mockReturnValue({ json });
    
    res = {
      status,
      json,
    };
    
    req = {
      params: { id: 'test-workflow' },
    };
  });

  describe('getWorkflowById', () => {
    it('should return workflow status with completed tasks count', async () => {
      const mockWorkflow = {
        workflowId: 'test-workflow',
        status: WorkflowStatus.InProgress,
        tasks: [
          { taskId: 'fakeTaskA', status: TaskStatus.Completed },
          { taskId: 'fakeTaskB', status: TaskStatus.InProgress },
        ],
      };
      
      mockWorkflowRepository.findOne.mockResolvedValue(mockWorkflow);
      
      await controller.getWorkflowById(req as Request, res as Response);
      
      expect(status).toHaveBeenCalledWith(202);
      expect(json).toHaveBeenCalledWith({
        workflowId: 'test-workflow',
        status: WorkflowStatus.InProgress,
        completedTasks: 1,
        totalTasks: 2,
      });
    });
    it('should return 404 when workflow not found', async () => {
      mockWorkflowRepository.findOne.mockResolvedValue(null);
      
      await controller.getWorkflowById(req as Request, res as Response);
      
      expect(status).toHaveBeenCalledWith(404);
      expect(json).toHaveBeenCalledWith({ message: "Workflow not found" });
    });

  });

  describe('getWorkflowResults', () => {
    it('should return workflow results when completed', async () => {
      const mockWorkflow = {
        workflowId: 'test-workflow',
        status: WorkflowStatus.Completed,
        finalResult: '{"result": "Agregated Data"}',
        tasks: [],
      };
      
      mockWorkflowRepository.findOne.mockResolvedValue(mockWorkflow);
      
      await controller.getWorkflowResults(req as Request, res as Response);
      
      expect(status).toHaveBeenCalledWith(202);
      expect(json).toHaveBeenCalledWith({
        workflowId: 'test-workflow',
        status: WorkflowStatus.Completed,
        finalResult: '{"result": "Agregated Data"}',
      });
    });
    it('should return 404 when workflow not found', async () => {
      mockWorkflowRepository.findOne.mockResolvedValue(null);
      
      await controller.getWorkflowResults(req as Request, res as Response);
      
      expect(status).toHaveBeenCalledWith(404);
      expect(json).toHaveBeenCalledWith({ message: "Workflow not found" });
    });

    it('should return 400 when workflow not completed', async () => {
      const mockWorkflow = {
        workflowId: 'test-workflow',
        status: WorkflowStatus.InProgress,
        tasks: [],
      };
      
      mockWorkflowRepository.findOne.mockResolvedValue(mockWorkflow);
      
      await controller.getWorkflowResults(req as Request, res as Response);
      
      expect(status).toHaveBeenCalledWith(400);
      expect(json).toHaveBeenCalledWith({ message: "Workflow not completed" });
    });


  });
});