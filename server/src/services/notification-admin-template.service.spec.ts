import { SystemConfig, defaults } from 'src/dtos/config.dto.js';
import { EmailTemplate } from 'src/repositories/email.repository.js';
import { NotificationAdminService } from 'src/services/notification-admin.service.js';
import { ServiceMocks, newTestService } from 'test/utils.js';

describe(NotificationAdminService.name, () => {
  let sut: NotificationAdminService;
  let mocks: ServiceMocks;

  beforeEach(() => {
    ({ sut, mocks } = newTestService(NotificationAdminService));
  });

  it('should pass an empty update template and standalone mode to the renderer', async () => {
    const config = structuredClone(defaults) as SystemConfig;
    config.templates.email.albumInviteTemplate = '<p>Invite template</p>';
    mocks.systemMetadata.get.mockResolvedValue(config);
    mocks.email.renderEmail.mockResolvedValue({ html: '<p>Default update</p>', text: '' });

    await sut.getTemplate(EmailTemplate.ALBUM_UPDATE, '', true);

    expect(mocks.email.renderEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        template: EmailTemplate.ALBUM_UPDATE,
        customTemplate: '',
        standalone: true,
      }),
    );
  });
});
