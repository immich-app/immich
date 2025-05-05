import { ColumnValue } from 'src/sql-tools/from-code/decorators/column.decorator';
import { register } from 'src/sql-tools/from-code/register';
import { ParameterScope } from 'src/sql-tools/types';

export type ConfigurationParameterOptions = {
  name: string;
  value: ColumnValue;
  scope: ParameterScope;
  synchronize?: boolean;
};
export const ConfigurationParameter = (options: ConfigurationParameterOptions): ClassDecorator => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  return (object: Function) => void register({ type: 'configurationParameter', item: { object, options } });
};
