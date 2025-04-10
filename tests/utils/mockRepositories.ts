import { Repository, ObjectLiteral } from 'typeorm';

export const createMockRepository = <T extends ObjectLiteral>() => {
  return {
    findOne: jest.fn(),
    manager: {
      getRepository: jest.fn(),
    },
  } as unknown as Repository<T>;
};