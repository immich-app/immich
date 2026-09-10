import {
  AdminConfigDto,
  defaults,
  mapPublicConfig,
  mapUserConfig,
  PublicConfigDto,
  UserConfigDto,
} from 'src/dtos/config.dto';
import { getKeysDeep } from 'src/utils/misc';
import z from 'zod';

const PUBLIC_PROPERTIES = [
  'oauth.autoLaunch',
  'oauth.buttonText',
  'oauth.enabled',
  'passwordLogin.enabled',
  'server.loginPageMessage',
  'theme.customCss',
];

describe('config visibility', () => {
  it('should expose every property to admins', () => {
    const paths = getKeysDeep(defaults);

    expect(paths).toEqual(expect.arrayContaining(PUBLIC_PROPERTIES));
    expect(paths).toContain('oauth.clientSecret');
    expect(paths.length).toBeGreaterThan(100);
  });

  it('should expose the public properties to everyone', () => {
    expect(getKeysDeep(mapPublicConfig(defaults)).sort()).toEqual(PUBLIC_PROPERTIES);
  });

  it('should expose everything public to logged in users as well', () => {
    expect(getKeysDeep(mapUserConfig(defaults))).toEqual(expect.arrayContaining(PUBLIC_PROPERTIES));
  });

  it('should accept the defaults with the admin schema', () => {
    expect(AdminConfigDto.schema.safeParse(defaults)).toEqual(expect.objectContaining({ success: true }));
  });

  it('should map the defaults onto the user and public schemas', () => {
    expect(UserConfigDto.schema.safeParse(mapUserConfig(defaults))).toEqual(expect.objectContaining({ success: true }));
    expect(PublicConfigDto.schema.safeParse(mapPublicConfig(defaults))).toEqual(
      expect.objectContaining({ success: true }),
    );
  });

  it('should not leak admin properties into the public config', () => {
    const config = mapPublicConfig(defaults) as Record<string, any>;

    expect(config.oauth).toEqual({
      autoLaunch: defaults.oauth.autoLaunch,
      buttonText: defaults.oauth.buttonText,
      enabled: defaults.oauth.enabled,
    });
    expect(config.job).toBeUndefined();
    expect(config.image).toBeUndefined();
    expect(config.notifications).toBeUndefined();
  });

  it('should keep the visibility metadata out of the schemas', () => {
    for (const schema of [AdminConfigDto.schema, UserConfigDto.schema, PublicConfigDto.schema]) {
      const json = JSON.stringify(z.toJSONSchema(schema, { io: 'input', unrepresentable: 'any' }));
      expect(json).not.toContain('visibility');
    }
  });
});
