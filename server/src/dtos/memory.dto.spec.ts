import { mapMemory, MemoryCreateDto, MemoryResponseDto } from 'src/dtos/memory.dto';
import { MemoryType } from 'src/enum';
import { RuleMemoryData } from 'src/types';
import { MemoryFactory } from 'test/factories/memory.factory';
import { getForMemory } from 'test/mappers';
import { factory } from 'test/small.factory';

describe('Memory DTOs', () => {
  describe('MemoryCreateDto', () => {
    it('should accept generic rule memory data', () => {
      const result = MemoryCreateDto.schema.safeParse({
        type: MemoryType.Rule,
        data: {
          ruleId: 'birthday',
          dedupeKey: 'birthday:person-1:2026-04-23',
          title: 'Happy birthday, Alice',
          context: { personId: 'person-1' },
        } satisfies RuleMemoryData,
        memoryAt: new Date().toISOString(),
      });

      expect(result.success).toBe(true);
    });

    it('should preserve on-this-day validation', () => {
      const result = MemoryCreateDto.schema.safeParse({
        type: MemoryType.OnThisDay,
        data: {},
        memoryAt: new Date().toISOString(),
      });

      expect(result.success).toBe(false);
      expect(result.error?.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            message: 'Invalid input: expected number, received undefined',
            path: ['data', 'year'],
          }),
        ]),
      );
    });
  });

  describe('mapMemory', () => {
    it('should surface server-owned title and subtitle for rule memories', () => {
      const memory = MemoryFactory.create({
        type: MemoryType.Rule,
        data: {
          ruleId: 'birthday',
          dedupeKey: 'birthday:person-1:2026-04-23',
          title: 'Happy birthday, Alice',
          subtitle: 'Photos from different years',
        } satisfies RuleMemoryData,
      });

      const result = mapMemory(getForMemory(memory) as any, factory.auth());

      expect(result).toEqual(
        expect.objectContaining({
          type: MemoryType.Rule,
          data: memory.data,
          title: 'Happy birthday, Alice',
          subtitle: 'Photos from different years',
        }),
      );
      expect(MemoryResponseDto.schema.safeEncode(result).success).toBe(true);
    });

    it('should preserve on-this-day responses without server-owned titles', () => {
      const memory = MemoryFactory.create({ type: MemoryType.OnThisDay, data: { year: 2024 } });

      const result = mapMemory(getForMemory(memory) as any, factory.auth());

      expect(result).toEqual(
        expect.objectContaining({
          type: MemoryType.OnThisDay,
          data: { year: 2024 },
          title: undefined,
          subtitle: undefined,
        }),
      );
      expect(MemoryResponseDto.schema.safeEncode(result).success).toBe(true);
    });
  });
});
