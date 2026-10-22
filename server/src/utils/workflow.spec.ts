import { WorkflowTrigger } from '@immich/plugin-sdk';
import { WorkflowType } from 'src/enum.js';
import { isAllowedHost, isMethodCompatible } from 'src/utils/workflow.js';

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

describe(isAllowedHost.name, () => {
  it('should match an exact host', () => {
    expect(isAllowedHost('api.example.com', ['api.example.com'])).toBe(true);
    expect(isAllowedHost('API.Example.com', ['api.example.com'])).toBe(true);
  });

  it('should not match a host that merely contains the pattern', () => {
    expect(isAllowedHost('api.example.com.attacker.net', ['api.example.com'])).toBe(false);
    expect(isAllowedHost('notapi.example.com', ['api.example.com'])).toBe(false);
    expect(isAllowedHost('apixexample.com', ['api.example.com'])).toBe(false);
  });

  it('should support wildcards', () => {
    expect(isAllowedHost('a.example.com', ['*.example.com'])).toBe(true);
    expect(isAllowedHost('a.b.example.com', ['*.example.com'])).toBe(true);
    expect(isAllowedHost('example.com', ['*.example.com'])).toBe(false);
    expect(isAllowedHost('example.com.attacker.net', ['*.example.com'])).toBe(false);
    expect(isAllowedHost('anything.at.all', ['*'])).toBe(true);
  });

  it('should reject everything when no hosts are listed', () => {
    expect(isAllowedHost('example.com', [])).toBe(false);
  });
});
