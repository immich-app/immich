import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { DateTime } from 'luxon';
import { IsDateStringFormat, IsNotSiblingOf, MaxDateString, Optional } from 'src/validation';
import { describe } from 'vitest';

describe('Validation', () => {
  describe('MaxDateString', () => {
    const maxDate = DateTime.fromISO('2000-01-01', { zone: 'utc' });

    class MyDto {
      @MaxDateString(maxDate)
      date!: string;
    }

    it('passes when date is before maxDate', async () => {
      const dto = plainToInstance(MyDto, { date: '1999-12-31' });
      await expect(validate(dto)).resolves.toHaveLength(0);
    });

    it('passes when date is equal to maxDate', async () => {
      const dto = plainToInstance(MyDto, { date: '2000-01-01' });
      await expect(validate(dto)).resolves.toHaveLength(0);
    });

    it('fails when date is after maxDate', async () => {
      const dto = plainToInstance(MyDto, { date: '2010-01-01' });
      await expect(validate(dto)).resolves.toHaveLength(1);
    });
  });

  describe('IsDateStringFormat', () => {
    class MyDto {
      @IsDateStringFormat('yyyy-MM-dd')
      date!: string;
    }

    it('passes when date is valid', async () => {
      const dto = plainToInstance(MyDto, { date: '1999-12-31' });
      await expect(validate(dto)).resolves.toHaveLength(0);
    });

    it('fails when date has invalid format', async () => {
      const dto = plainToInstance(MyDto, { date: '2000-01-01T00:00:00Z' });
      await expect(validate(dto)).resolves.toHaveLength(1);
    });

    it('fails when empty string', async () => {
      const dto = plainToInstance(MyDto, { date: '' });
      await expect(validate(dto)).resolves.toHaveLength(1);
    });

    it('fails when undefined', async () => {
      const dto = plainToInstance(MyDto, {});
      await expect(validate(dto)).resolves.toHaveLength(1);
    });
  });

  describe('IsNotSiblingOf', () => {
    class MyDto {
      @IsNotSiblingOf(['attribute2'])
      @Optional()
      attribute1?: string;

      @IsNotSiblingOf(['attribute1', 'attribute3'])
      @Optional()
      attribute2?: string;

      @IsNotSiblingOf(['attribute2'])
      @Optional()
      attribute3?: string;

      @Optional()
      unrelatedAttribute?: string;
    }

    it('passes when only one attribute is present', async () => {
      const dto = plainToInstance(MyDto, { attribute1: 'value1', unrelatedAttribute: 'value2' });
      await expect(validate(dto)).resolves.toHaveLength(0);
    });

    it('fails when colliding attributes are present', async () => {
      const dto = plainToInstance(MyDto, { attribute1: 'value1', attribute2: 'value2' });
      await expect(validate(dto)).resolves.toHaveLength(2);
    });

    it('passes when no colliding attributes are present', async () => {
      const dto = plainToInstance(MyDto, { attribute1: 'value1', attribute3: 'value2' });
      await expect(validate(dto)).resolves.toHaveLength(0);
    });
  });
});
