import {
  PathOptionDatetimeDayFormatToken,
  PathOptionDatetimeMonthFormatToken,
  PathOptionDatetimeYearFormatToken,
} from '@app/storage/enums/path-option-datetime-token';
import { FolderPresetOptions } from '@app/storage/enums/path-preset-options';

export class SystemConfigTemplateStorageOptionDto {
  yearOptions!: string[];
  monthOptions!: string[];
  dayOptions!: string[];
  presetOptions!: string[];
}

export const storageTemplateOptions = {
  yearOptions: PathOptionDatetimeYearFormatToken,
  monthOptions: PathOptionDatetimeMonthFormatToken,
  dayOptions: PathOptionDatetimeDayFormatToken,
  presetOptions: FolderPresetOptions,
};
