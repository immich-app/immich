import { EmailRenderRequest, EmailRepository, EmailTemplate } from 'src/repositories/email.repository.js';
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

    it('should escape user controlled values in a custom template', async () => {
      const request: EmailRenderRequest = {
        template: EmailTemplate.ALBUM_INVITE,
        data: {
          albumName: '</p><a href="https://example.com">Reset your password</a><p>',
          albumId: '123',
          senderName: '<script>alert(1)</script>',
          recipientName: "Tom & Jerry O'Brien",
          baseUrl: 'http://localhost',
        },
        customTemplate: '<p>Hey {recipientName}, {senderName} added you to {albumName}</p>',
      };

      const result = await sut.renderEmail(request);

      expect(result.html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
      expect(result.html).toContain('&lt;a href=&quot;https://example.com&quot;&gt;');
      expect(result.html).not.toContain('<script>alert(1)</script>');
      expect(result.html).not.toContain('<a href="https://example.com">');
      expect(result.html).toContain('<p>Hey Tom &amp; Jerry O&#39;Brien');
    });

    it('should render a standalone template without the Immich layout', async () => {
      const request: EmailRenderRequest = {
        template: EmailTemplate.WELCOME,
        data: {
          displayName: 'Alan Turing',
          username: 'alan@example.com',
          baseUrl: 'https://immich.example',
        },
        customTemplate:
          '<!doctype html><html><body><h1>Hello {displayName}</h1><a href="{baseUrl}">Open</a></body></html>',
        standalone: true,
      };

      const result = await sut.renderEmail(request);

      expect(result.html).toBe(
        '<!doctype html><html><body><h1>Hello Alan Turing</h1><a href="https://immich.example">Open</a></body></html>',
      );
      expect(result.html).not.toContain('immich-logo-inline-light.png');
      expect(result.html).not.toContain('Login');
      expect(result.text).toBe('Hello Alan Turing\nOpen');
    });

    it('should escape template variables in standalone templates', async () => {
      const request: EmailRenderRequest = {
        template: EmailTemplate.ALBUM_INVITE,
        data: {
          albumName: '<script>alert(1)</script>',
          albumId: '123',
          senderName: 'John',
          recipientName: 'Jane',
          baseUrl: 'https://immich.example',
        },
        customTemplate: '<html><body><p>{albumName}</p></body></html>',
        standalone: true,
      };

      const result = await sut.renderEmail(request);

      expect(result.html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
      expect(result.html).not.toContain('<script>alert(1)</script>');
    });

    it('should use the default email when standalone mode has no custom template', async () => {
      const request: EmailRenderRequest = {
        template: EmailTemplate.WELCOME,
        data: { displayName: 'Alan Turing', username: 'alan@example.com', baseUrl: 'https://immich.example' },
        customTemplate: '',
        standalone: true,
      };

      const result = await sut.renderEmail(request);

      expect(result.html).toContain('immich-logo-inline-light.png');
      expect(result.text).toContain('A new account has been created for you');
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
  });
});
