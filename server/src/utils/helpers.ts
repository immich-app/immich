type NumericEnum = Record<string, string | number>;

export const asIntegerEnum = (type: NumericEnum) => {
  return {
    type: 'integer',
    'x-enum-varnames': asIntegerEnumVarNames(type),
  };
};

const asIntegerEnumVarNames = (type: NumericEnum) => Object.keys(type).filter((key) => Number.isNaN(Number(key)));
