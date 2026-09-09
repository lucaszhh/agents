import { Test, TestingModule } from '@nestjs/testing';
import { HttpException } from '@nestjs/common';
import { [Feature]Service } from './[feature].service';
import { I[Feature]Repository } from '../data/interfaces/i-[feature].repository';
import { Result } from 'src/common/errors/result.mapper';
import { NotFound } from 'src/common/errors/types/not-found.error';

describe('[Feature]Service', () => {
  let service: [Feature]Service;
  let mockRepository: jest.Mocked<I[Feature]Repository>;

  const mockInput = {
    attribute: 'valor-valido',
  };

  const mockEntity = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    attribute: 'valor-valido',
    createdAt: new Date(),
  };

  beforeEach(async () => {
    mockRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
    } as unknown as jest.Mocked<I[Feature]Repository>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        [Feature]Service,
        {
          provide: I[Feature]Repository,
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<[Feature]Service>([Feature]Service);
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('debe retornar Result.ok con la entidad creada cuando los datos son válidos (Camino Feliz)', async () => {
      // Arrange
      mockRepository.save.mockResolvedValue(mockEntity);

      // Act
      const result = await service.execute(mockInput);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.getValue()).toEqual(mockEntity);
      expect(mockRepository.save).toHaveBeenCalledTimes(1);
      expect(mockRepository.save).toHaveBeenCalledWith(expect.objectContaining({ attribute: 'valor-valido' }));
    });

    it('debe retornar Result.fail(NotFound) cuando el registro dependiente no existe (Camino de Falla)', async () => {
      // Arrange
      mockRepository.save.mockResolvedValue(null);

      // Act
      const result = await service.execute(mockInput);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.getError()).toBeInstanceOf(NotFound);
      expect(mockRepository.save).toHaveBeenCalledTimes(1);
    });
  });
});
