import { IntegrityService } from 'src/services/integrity.service';
import { newTestService, ServiceMocks } from 'test/utils';

describe(IntegrityService.name, () => {
  let sut: IntegrityService;
  // impl. pending
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let mocks: ServiceMocks;

  beforeEach(() => {
    ({ sut, mocks } = newTestService(IntegrityService));
  });

  it('should work', () => {
    expect(sut).toBeDefined();
  });

  describe.skip('getIntegrityReportSummary'); // just calls repository
  describe.skip('getIntegrityReport'); // just calls repository
  describe.skip('getIntegrityReportCsv'); // just calls repository

  describe.todo('getIntegrityReportFile');
  describe.todo('deleteIntegrityReport');
});
