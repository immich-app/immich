import { WorkflowTrigger } from '@immich/plugin-sdk';
import { WorkflowType } from 'src/enum';
import { isMethodCompatible } from 'src/utils/workflow';

const tests: Array<{ trigger: WorkflowTrigger; types: WorkflowType[]; expected: boolean }> = [
  {
    trigger: WorkflowTrigger.AssetCreate,
    types: [WorkflowType.AssetV1],
    expected: true,
  },
  // {
  //   trigger: WorkflowTrigger.AssetCreate,
  //   types: [WorkflowType.AssetPersonV1],
  //   expected: true,
  // },
  // {
  //   trigger: WorkflowTrigger.PersonRecognized,
  //   types: [WorkflowType.AssetPersonV1],
  //   expected: true,
  // },
  // {
  //   trigger: WorkflowTrigger.PersonRecognized,
  //   types: [WorkflowType.AssetV1],
  //   expected: false,
  // },
  // {
  //   trigger: WorkflowTrigger.PersonRecognized,
  //   types: [WorkflowType.AssetV1, WorkflowType.AssetPersonV1],
  //   expected: true,
  // },
];

describe(isMethodCompatible.name, () => {
  it.each(tests)('should return $expected for trigger $trigger with types $types', ({ trigger, types, expected }) => {
    expect(isMethodCompatible({ types }, trigger)).toBe(expected);
  });
});
