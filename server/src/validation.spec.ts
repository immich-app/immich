import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { DateTime } from 'luxon';
import { IsDateStringFormat, MaxDateString } from 'src/validation';

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
});
