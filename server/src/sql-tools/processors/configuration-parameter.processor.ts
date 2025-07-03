import { fromColumnValue } from 'src/sql-tools/helpers';
import { Processor } from 'src/sql-tools/types';

export const processConfigurationParameters: Processor = (builder, items) => {
  for (const {
    item: { options },
  } of items.filter((item) => item.type === 'configurationParameter')) {
    builder.parameters.push({
      databaseName: builder.databaseName,
      name: options.name,
      value: fromColumnValue(options.value),
      scope: options.scope,
      synchronize: options.synchronize ?? true,
    });
  }
};
