import { BaseOptionsDto } from 'src/cores/dto/base-options-dto';

export const CLI_BASE_OPTIONS: BaseOptionsDto = { config: '/tmp/immich/' };

export const spyOnConsole = () => jest.spyOn(console, 'log').mockImplementation();
