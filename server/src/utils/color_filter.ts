import { Matrix3x3 } from 'sharp';
import { FilterParameters } from 'src/dtos/editing.dto';

export function convertColorFilterToMatricies(filter: FilterParameters) {
  const biasMatrix: Matrix3x3 = [
    [filter.rrBias, filter.rgBias, filter.rbBias],
    [filter.grBias, filter.ggBias, filter.gbBias],
    [filter.brBias, filter.bgBias, filter.bbBias],
  ];

  const offsetMatrix = [filter.rOffset, filter.gOffset, filter.bOffset];

  return { biasMatrix, offsetMatrix };
}
