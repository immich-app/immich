import { EmailRenderRequest, EmailRepository, EmailTemplate } from 'src/repositories/email.repository.js';
import { IntegrityReport } from 'src/enum.js';
import { LoggingRepository } from 'src/repositories/logging.repository.js';
import { automock } from 'test/utils.js';

describe(EmailRepository.name, () => {
  let sut: EmailRepository;

  beforeEach(() => {
    // eslint-disable-next-line no-sparse-arrays
    sut = new EmailRepository(automock(LoggingRepository, { args: [, { getEnv: () => ({}) }], strict: false }));
  });

  describe('renderEmail', () => {
    it('should render the email correctly for TEST_EMAIL template', async () => {
      const request: EmailRenderRequest = {
        template: EmailTemplate.TEST_EMAIL,
        data: { displayName: 'Alen Turing', baseUrl: 'http://localhost' },
        customTemplate: '',
      };

      const result = await sut.renderEmail(request);

      expect(result.html).toContain('<!DOCTYPE html PUBLIC');
      expect(result.text).toContain('test email');
    });

    it('should render the email correctly for WELCOME template', async () => {
      const request: EmailRenderRequest = {
        template: EmailTemplate.WELCOME,
        data: { displayName: 'Alen Turing', username: 'turing', baseUrl: 'http://localhost' },
        customTemplate: '',
      };

      const result = await sut.renderEmail(request);

      expect(result.html).toContain('<!DOCTYPE html PUBLIC');
      expect(result.text).toContain('A new account has been created for you');
    });

    it('should render the email correctly for ALBUM_INVITE template', async () => {
      const request: EmailRenderRequest = {
        template: EmailTemplate.ALBUM_INVITE,
        data: {
          albumName: 'Vacation',
          albumId: '123',
          senderName: 'John',
          recipientName: 'Jane',
          baseUrl: 'http://localhost',
        },
        customTemplate: '',
      };

      const result = await sut.renderEmail(request);

      expect(result.html).toContain('<!DOCTYPE html PUBLIC');
      expect(result.text).toContain('Vacation');
    });

    it('should render the email correctly for ALBUM_UPDATE template', async () => {
      const request: EmailRenderRequest = {
        template: EmailTemplate.ALBUM_UPDATE,
        data: { albumName: 'Holiday', albumId: '123', recipientName: 'Jane', baseUrl: 'http://localhost' },
        customTemplate: '',
      };

      const result = await sut.renderEmail(request);

      expect(result.html).toContain('<!DOCTYPE html PUBLIC');
      expect(result.text).toContain('Holiday');
    });

    it('should render the email correctly for INTEGRITY_ERRORS template', async () => {
      const request: EmailRenderRequest = {
        template: EmailTemplate.INTEGRITY_ERRORS,
        data: {
          recipientName: 'Jane',
          baseUrl: 'http://localhost',
          checkType: IntegrityReport.MissingFile,
          checkName: 'Missing files',
          count: 3,
        },
        customTemplate: '',
      };

      const result = await sut.renderEmail(request);

      expect(result.html).toContain('<!DOCTYPE html PUBLIC');
      expect(result.html).toContain('Review Integrity Report');
      expect(result.html).toContain('/admin/maintenance/integrity-report/missing_file');
      expect(result.text).toContain('integrity check found');
    });

    it('should render the INTEGRITY_ERRORS template with a custom template', async () => {
      const request: EmailRenderRequest = {
        template: EmailTemplate.INTEGRITY_ERRORS,
        data: {
          recipientName: 'Jane',
          baseUrl: 'http://localhost',
          checkType: IntegrityReport.MissingFile,
          checkName: 'Missing files',
          count: 3,
        },
        customTemplate: '<p>Hello {recipientName}, {count} {checkName} found.</p>',
      };

      const result = await sut.renderEmail(request);

      expect(result.html).toContain('<!DOCTYPE html PUBLIC');
      expect(result.html).toContain('Hello Jane, 3 Missing files found.');
    });
  });
});
