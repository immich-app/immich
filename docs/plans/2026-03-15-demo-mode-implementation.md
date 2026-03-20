# Demo Mode Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add an env-var-driven read-only demo mode with a "Try Demo" login button and server-side write protection.

**Architecture:** Three env vars (`IMMICH_DEMO_MODE`, `IMMICH_DEMO_USER_EMAIL`, `IMMICH_DEMO_USER_PASSWORD`) control the feature. A new `POST /auth/demo-login` endpoint creates sessions for the demo user. A global `DemoInterceptor` blocks mutating requests. The web UI hides write actions when `demoMode` is true.

**Tech Stack:** NestJS (server), Svelte 5 (web), Vitest (tests)

---

### Task 1: Add demo env vars to EnvDto and EnvData

**Files:**

- Modify: `server/src/dtos/env.dto.ts:162-163` (after `IMMICH_ALLOW_SETUP`)
- Modify: `server/src/repositories/config.repository.ts:96-98` (EnvData interface, after `setup`)
- Modify: `server/src/repositories/config.repository.ts:336-338` (getEnv() return, after `setup`)

**Step 1: Write the failing test**

Create file: `server/src/services/auth.service.demo.spec.ts`

```typescript
import { newTestService, ServiceMocks } from 'test/utils';
import { AuthService } from 'src/services/auth.service';

describe('AuthService (demo)', () => {
  let sut: AuthService;
  let mocks: ServiceMocks;

  beforeEach(() => {
    ({ sut, mocks } = newTestService(AuthService));
  });

  describe('demoLogin', () => {
    it('should throw if demo mode is not enabled', async () => {
      mocks.configRepository.getEnv.mockReturnValue({ demo: { enabled: false, email: '', password: '' } } as any);
      await expect(sut.demoLogin({} as any)).rejects.toThrow('Demo mode is not enabled');
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd server && pnpm test -- --run src/services/auth.service.demo.spec.ts`
Expected: FAIL — `demoLogin` does not exist on AuthService

**Step 3: Add env vars to EnvDto**

In `server/src/dtos/env.dto.ts`, after line 163 (`IMMICH_ALLOW_SETUP`), add:

```typescript
  @ValidateBoolean({ optional: true })
  IMMICH_DEMO_MODE?: boolean;

  @IsString()
  @Optional()
  IMMICH_DEMO_USER_EMAIL?: string;

  @IsString()
  @Optional()
  IMMICH_DEMO_USER_PASSWORD?: string;
```

**Step 4: Add demo to EnvData interface**

In `server/src/repositories/config.repository.ts`, after the `setup` block (line 98), add to the `EnvData` interface:

```typescript
demo: {
  enabled: boolean;
  email: string;
  password: string;
}
```

**Step 5: Add demo to getEnv() return**

In `server/src/repositories/config.repository.ts`, after the `setup` block in the return statement (after line 338), add:

```typescript
    demo: {
      enabled: dto.IMMICH_DEMO_MODE ?? false,
      email: dto.IMMICH_DEMO_USER_EMAIL ?? '',
      password: dto.IMMICH_DEMO_USER_PASSWORD ?? '',
    },
```

**Step 6: Commit**

```bash
git add server/src/dtos/env.dto.ts server/src/repositories/config.repository.ts server/src/services/auth.service.demo.spec.ts
git commit -m "feat(demo): add IMMICH_DEMO_MODE env vars to EnvDto and EnvData"
```

---

### Task 2: Add demoMode to ServerConfigDto and ServerFeaturesDto

**Files:**

- Modify: `server/src/dtos/server.dto.ts:205` (ServerConfigDto, before closing brace)
- Modify: `server/src/services/server.service.ts:121-140` (getSystemConfig)

**Step 1: Add demoMode field to ServerConfigDto**

In `server/src/dtos/server.dto.ts`, before the closing brace of `ServerConfigDto` (line 206), add:

```typescript
  @ApiProperty({ description: 'Whether demo mode is active' })
  demoMode!: boolean;
```

**Step 2: Return demoMode from getSystemConfig()**

In `server/src/services/server.service.ts`, modify `getSystemConfig()`. Change line 122 to destructure `demo`:

```typescript
const { setup, demo } = this.configRepository.getEnv();
```

And add `demoMode: demo.enabled,` after `maintenanceMode: false,` (line 138).

**Step 3: Verify TypeScript compiles**

Run: `cd server && npx tsc --noEmit`
Expected: No errors (or only pre-existing ones)

**Step 4: Commit**

```bash
git add server/src/dtos/server.dto.ts server/src/services/server.service.ts
git commit -m "feat(demo): expose demoMode in server config endpoint"
```

---

### Task 3: Add POST /auth/demo-login endpoint and service method

**Files:**

- Modify: `server/src/services/auth.service.ts:60-81` (add demoLogin method after login)
- Modify: `server/src/controllers/auth.controller.ts:50` (add demo-login endpoint after login)

**Step 1: Write the full test suite**

Update `server/src/services/auth.service.demo.spec.ts`:

```typescript
import { newTestService, ServiceMocks } from 'test/utils';
import { AuthService, LoginDetails } from 'src/services/auth.service';

describe('AuthService (demo)', () => {
  let sut: AuthService;
  let mocks: ServiceMocks;

  const loginDetails: LoginDetails = {
    clientIp: '127.0.0.1',
    isSecure: true,
    deviceType: 'browser',
    deviceOS: 'linux',
    appVersion: 'demo',
  };

  beforeEach(() => {
    ({ sut, mocks } = newTestService(AuthService));
  });

  describe('demoLogin', () => {
    it('should throw if demo mode is not enabled', async () => {
      mocks.configRepository.getEnv.mockReturnValue({ demo: { enabled: false, email: '', password: '' } } as any);
      await expect(sut.demoLogin(loginDetails)).rejects.toThrow('Demo mode is not enabled');
    });

    it('should throw if demo user is not found', async () => {
      mocks.configRepository.getEnv.mockReturnValue({
        demo: { enabled: true, email: 'demo@test.com', password: 'demo' },
      } as any);
      mocks.userRepository.getByEmail.mockResolvedValue(void 0);
      await expect(sut.demoLogin(loginDetails)).rejects.toThrow('Demo user not found');
    });

    it('should create a session and return login response', async () => {
      const demoUser = { id: 'demo-user-id', email: 'demo@test.com', name: 'Demo' };
      mocks.configRepository.getEnv.mockReturnValue({
        demo: { enabled: true, email: 'demo@test.com', password: 'demo' },
      } as any);
      mocks.userRepository.getByEmail.mockResolvedValue(demoUser as any);
      mocks.cryptoRepository.randomBytesAsText.mockReturnValue('token123');
      mocks.cryptoRepository.hashSha256.mockReturnValue('hashed-token');
      mocks.sessionRepository.create.mockResolvedValue(void 0);

      const result = await sut.demoLogin(loginDetails);

      expect(mocks.userRepository.getByEmail).toHaveBeenCalledWith('demo@test.com');
      expect(mocks.sessionRepository.create).toHaveBeenCalledWith(expect.objectContaining({ userId: 'demo-user-id' }));
      expect(result).toBeDefined();
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd server && pnpm test -- --run src/services/auth.service.demo.spec.ts`
Expected: FAIL — `demoLogin` does not exist

**Step 3: Add demoLogin() to AuthService**

In `server/src/services/auth.service.ts`, after the `login()` method (after line 81), add:

```typescript
  async demoLogin(details: LoginDetails) {
    const { demo } = this.configRepository.getEnv();
    if (!demo.enabled) {
      throw new UnauthorizedException('Demo mode is not enabled');
    }

    const user = await this.userRepository.getByEmail(demo.email);
    if (!user) {
      throw new UnauthorizedException('Demo user not found');
    }

    return this.createLoginResponse(user, details);
  }
```

Add `UnauthorizedException` to imports if not already there (it should be — check existing imports).

**Step 4: Run test to verify it passes**

Run: `cd server && pnpm test -- --run src/services/auth.service.demo.spec.ts`
Expected: PASS

**Step 5: Add demo-login endpoint to AuthController**

In `server/src/controllers/auth.controller.ts`, after the `login()` endpoint (after line 50), add:

```typescript
  @Post('demo-login')
  @Endpoint({
    summary: 'Demo login',
    description: 'Login as the demo user. Only available when demo mode is enabled.',
    history: new HistoryBuilder().added('v1').beta('v1').stable('v2'),
  })
  async demoLogin(
    @Res({ passthrough: true }) res: Response,
    @GetLoginDetails() loginDetails: LoginDetails,
  ): Promise<LoginResponseDto> {
    const body = await this.service.demoLogin(loginDetails);
    return respondWithCookie(res, body, {
      isSecure: loginDetails.isSecure,
      values: [
        { key: ImmichCookie.AccessToken, value: body.accessToken },
        { key: ImmichCookie.AuthType, value: AuthType.Password },
        { key: ImmichCookie.IsAuthenticated, value: 'true' },
      ],
    });
  }
```

**Step 6: Commit**

```bash
git add server/src/services/auth.service.ts server/src/controllers/auth.controller.ts server/src/services/auth.service.demo.spec.ts
git commit -m "feat(demo): add POST /auth/demo-login endpoint"
```

---

### Task 4: Add DemoInterceptor for server-side write protection

**Files:**

- Create: `server/src/middleware/demo.interceptor.ts`
- Create: `server/src/middleware/demo.interceptor.spec.ts`
- Modify: `server/src/app.module.ts:49` (register interceptor in apiMiddleware)

**Step 1: Write the test**

Create `server/src/middleware/demo.interceptor.spec.ts`:

```typescript
import { CallHandler, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { of } from 'rxjs';
import { DemoInterceptor } from 'src/middleware/demo.interceptor';
import { ConfigRepository } from 'src/repositories/config.repository';

describe('DemoInterceptor', () => {
  let interceptor: DemoInterceptor;
  let configRepository: { getEnv: ReturnType<typeof vi.fn> };
  let callHandler: CallHandler;

  beforeEach(() => {
    configRepository = { getEnv: vi.fn() };
    callHandler = { handle: vi.fn().mockReturnValue(of({})) };
    interceptor = new DemoInterceptor(configRepository as unknown as ConfigRepository);
  });

  const createContext = (method: string, path: string, userEmail?: string) => {
    const request = {
      method,
      path,
      user: userEmail ? { user: { email: userEmail } } : undefined,
    };
    return {
      switchToHttp: () => ({ getRequest: () => request }),
    } as unknown as ExecutionContext;
  };

  it('should allow all requests when demo mode is off', () => {
    configRepository.getEnv.mockReturnValue({ demo: { enabled: false, email: '', password: '' } });
    const context = createContext('DELETE', '/api/assets', 'demo@test.com');
    interceptor.intercept(context, callHandler);
    expect(callHandler.handle).toHaveBeenCalled();
  });

  it('should allow all requests for non-demo users', () => {
    configRepository.getEnv.mockReturnValue({ demo: { enabled: true, email: 'demo@test.com', password: '' } });
    const context = createContext('DELETE', '/api/assets', 'admin@test.com');
    interceptor.intercept(context, callHandler);
    expect(callHandler.handle).toHaveBeenCalled();
  });

  it('should allow GET requests for demo user', () => {
    configRepository.getEnv.mockReturnValue({ demo: { enabled: true, email: 'demo@test.com', password: '' } });
    const context = createContext('GET', '/api/assets', 'demo@test.com');
    interceptor.intercept(context, callHandler);
    expect(callHandler.handle).toHaveBeenCalled();
  });

  it('should allow POST /search/metadata for demo user', () => {
    configRepository.getEnv.mockReturnValue({ demo: { enabled: true, email: 'demo@test.com', password: '' } });
    const context = createContext('POST', '/api/search/metadata', 'demo@test.com');
    interceptor.intercept(context, callHandler);
    expect(callHandler.handle).toHaveBeenCalled();
  });

  it('should block POST /assets for demo user', () => {
    configRepository.getEnv.mockReturnValue({ demo: { enabled: true, email: 'demo@test.com', password: '' } });
    const context = createContext('POST', '/api/assets', 'demo@test.com');
    expect(() => interceptor.intercept(context, callHandler)).toThrow(ForbiddenException);
  });

  it('should block DELETE requests for demo user', () => {
    configRepository.getEnv.mockReturnValue({ demo: { enabled: true, email: 'demo@test.com', password: '' } });
    const context = createContext('DELETE', '/api/assets', 'demo@test.com');
    expect(() => interceptor.intercept(context, callHandler)).toThrow(ForbiddenException);
  });

  it('should block PUT requests for demo user', () => {
    configRepository.getEnv.mockReturnValue({ demo: { enabled: true, email: 'demo@test.com', password: '' } });
    const context = createContext('PUT', '/api/assets', 'demo@test.com');
    expect(() => interceptor.intercept(context, callHandler)).toThrow(ForbiddenException);
  });

  it('should allow POST /download/info for demo user', () => {
    configRepository.getEnv.mockReturnValue({ demo: { enabled: true, email: 'demo@test.com', password: '' } });
    const context = createContext('POST', '/api/download/info', 'demo@test.com');
    interceptor.intercept(context, callHandler);
    expect(callHandler.handle).toHaveBeenCalled();
  });

  it('should allow POST /auth/logout for demo user', () => {
    configRepository.getEnv.mockReturnValue({ demo: { enabled: true, email: 'demo@test.com', password: '' } });
    const context = createContext('POST', '/api/auth/logout', 'demo@test.com');
    interceptor.intercept(context, callHandler);
    expect(callHandler.handle).toHaveBeenCalled();
  });

  it('should allow POST /auth/validateToken for demo user', () => {
    configRepository.getEnv.mockReturnValue({ demo: { enabled: true, email: 'demo@test.com', password: '' } });
    const context = createContext('POST', '/api/auth/validateToken', 'demo@test.com');
    interceptor.intercept(context, callHandler);
    expect(callHandler.handle).toHaveBeenCalled();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd server && pnpm test -- --run src/middleware/demo.interceptor.spec.ts`
Expected: FAIL — module not found

**Step 3: Implement DemoInterceptor**

Create `server/src/middleware/demo.interceptor.ts`:

```typescript
import { CallHandler, ExecutionContext, ForbiddenException, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { ConfigRepository } from 'src/repositories/config.repository';
import { AuthRequest } from 'src/middleware/auth.guard';

const SAFE_POST_PREFIXES = [
  '/api/search/',
  '/api/download/',
  '/api/auth/logout',
  '/api/auth/validateToken',
  '/api/auth/demo-login',
];

@Injectable()
export class DemoInterceptor implements NestInterceptor {
  constructor(private configRepository: ConfigRepository) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const { demo } = this.configRepository.getEnv();
    if (!demo.enabled) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<AuthRequest>();
    const userEmail = request.user?.user?.email;
    if (!userEmail || userEmail !== demo.email) {
      return next.handle();
    }

    const method = request.method;
    if (method === 'GET') {
      return next.handle();
    }

    if (method === 'POST' && SAFE_POST_PREFIXES.some((prefix) => request.path.startsWith(prefix))) {
      return next.handle();
    }

    throw new ForbiddenException('This action is not available in demo mode');
  }
}
```

**Step 4: Run test to verify it passes**

Run: `cd server && pnpm test -- --run src/middleware/demo.interceptor.spec.ts`
Expected: PASS

**Step 5: Register DemoInterceptor in app.module.ts**

In `server/src/app.module.ts`, add import:

```typescript
import { DemoInterceptor } from 'src/middleware/demo.interceptor';
```

Modify the `apiMiddleware` array (line 49) to include the interceptor:

```typescript
const apiMiddleware = [
  FileUploadInterceptor,
  ...commonMiddleware,
  { provide: APP_GUARD, useClass: AuthGuard },
  { provide: APP_INTERCEPTOR, useClass: DemoInterceptor },
];
```

**Step 6: Commit**

```bash
git add server/src/middleware/demo.interceptor.ts server/src/middleware/demo.interceptor.spec.ts server/src/app.module.ts
git commit -m "feat(demo): add DemoInterceptor to block writes for demo user"
```

---

### Task 5: Regenerate OpenAPI SDK

The new `POST /auth/demo-login` endpoint and `demoMode` field in `ServerConfigDto` need to be reflected in the TypeScript SDK.

**Step 1: Build server and regenerate**

```bash
cd server && pnpm build
pnpm sync:open-api
cd .. && make open-api-typescript
```

**Step 2: Verify the SDK has the new endpoint**

Run: `grep -r 'demoLogin\|demo-login\|demoMode' open-api/typescript-sdk/src/`
Expected: Should find `demoLogin` function and `demoMode` field

**Step 3: Commit**

```bash
git add open-api/ server/immich-openapi-specs.json
git commit -m "chore: regenerate OpenAPI SDK with demo mode endpoints"
```

---

### Task 6: Add "Try Demo" button to login page

**Files:**

- Modify: `web/src/routes/auth/login/+page.svelte`

**Step 1: Add demo login handler and button**

In `web/src/routes/auth/login/+page.svelte`:

Add to imports (line 10): import the new `demoLogin` function from `@immich/sdk` (or call it via fetch if the SDK function name differs — check the generated SDK after Task 5).

Add a new handler after `handleOAuthLogin` (after line 121):

```typescript
let demoLoading = $state(false);

const handleDemoLogin = async () => {
  try {
    demoLoading = true;
    errorMessage = '';
    const user = await demoLogin();
    await onSuccess(user);
  } catch (error) {
    errorMessage = getServerErrorMessage(error) || 'Unable to start demo';
    demoLoading = false;
  }
};
```

Add the button in the template, after the OAuth section (after line 181), before the "login disabled" warning:

```svelte
    {#if serverConfig.demoMode}
      <div class="inline-flex w-full items-center justify-center my-4">
        <hr class="my-4 h-px w-3/4 border-0 bg-gray-200 dark:bg-gray-600" />
        <span
          class="absolute start-1/2 -translate-x-1/2 bg-gray-50 px-3 font-medium text-gray-900 dark:bg-neutral-900 dark:text-white uppercase"
        >
          {$t('or')}
        </span>
      </div>
      <Button
        shape="round"
        size="large"
        fullWidth
        color="secondary"
        loading={demoLoading}
        disabled={demoLoading}
        onclick={handleDemoLogin}
      >
        {$t('try_demo')}
      </Button>
    {/if}
```

**Step 2: Add i18n key**

Search for where i18n keys are defined and add `try_demo: 'Try Demo'` to the English locale file. Check `web/src/lib/i18n/` or similar.

**Step 3: Verify by building**

Run: `cd web && npx svelte-check --tsconfig ./tsconfig.json`
Expected: No errors related to demo changes

**Step 4: Commit**

```bash
git add web/src/routes/auth/login/+page.svelte
git commit -m "feat(demo): add Try Demo button to login page"
```

---

### Task 7: Add isDemo flag to AuthManager and hide write actions

**Files:**

- Modify: `web/src/lib/managers/auth-manager.svelte.ts` — add `isDemo` state
- Modify: `web/src/routes/auth/login/+page.svelte` — set `isDemo` on demo login
- Modify: `web/src/lib/components/shared-components/navigation-bar/navigation-bar.svelte` — hide upload button
- Modify: `web/src/lib/components/shared-components/side-bar/user-sidebar.svelte` — hide write-only items
- Modify: `web/src/lib/components/layouts/user-page-layout.svelte` — conditionally hide upload in layout

**Step 1: Add isDemo to AuthManager**

In `web/src/lib/managers/auth-manager.svelte.ts`, add to the class:

```typescript
isDemo = $state(false);
```

And in the `logout()` method, after `this.isPurchased = false;` (line 52), add:

```typescript
this.isDemo = false;
```

**Step 2: Set isDemo on demo login**

In `web/src/routes/auth/login/+page.svelte`, in `handleDemoLogin`, before `await onSuccess(user);`, add:

```typescript
authManager.isDemo = true;
```

Import `authManager` at top if not already imported:

```typescript
import { authManager } from '$lib/managers/auth-manager.svelte';
```

**Step 3: Hide upload button in navigation bar**

In `web/src/lib/components/shared-components/navigation-bar/navigation-bar.svelte`, wrap the upload buttons (lines 107-128) with a demo check. Change line 107 from:

```svelte
        {#if !page.url.pathname.includes('/admin') && onUploadClick}
```

to:

```svelte
        {#if !page.url.pathname.includes('/admin') && onUploadClick && !authManager.isDemo}
```

Add `authManager` import at top:

```typescript
import { authManager } from '$lib/managers/auth-manager.svelte';
```

**Step 4: Hide write-only sidebar items**

In `web/src/lib/components/shared-components/side-bar/user-sidebar.svelte`, wrap these items with `{#if !authManager.isDemo}`:

- Shared links (line 57-59)
- Import (line 97)
- Trash (line 108-110)

Add import:

```typescript
import { authManager } from '$lib/managers/auth-manager.svelte';
```

**Step 5: Hide upload in user-page-layout**

In `web/src/lib/components/layouts/user-page-layout.svelte`, change line 53 from:

```svelte
    <NavigationBar onUploadClick={() => openFileUploadDialog()} />
```

to:

```svelte
    <NavigationBar onUploadClick={authManager.isDemo ? undefined : () => openFileUploadDialog()} />
```

Add import:

```typescript
import { authManager } from '$lib/managers/auth-manager.svelte';
```

**Step 6: Verify by building**

Run: `cd web && npx svelte-check --tsconfig ./tsconfig.json`
Expected: No errors

**Step 7: Commit**

```bash
git add web/src/lib/managers/auth-manager.svelte.ts web/src/routes/auth/login/+page.svelte web/src/lib/components/shared-components/navigation-bar/navigation-bar.svelte web/src/lib/components/shared-components/side-bar/user-sidebar.svelte web/src/lib/components/layouts/user-page-layout.svelte
git commit -m "feat(demo): hide write actions in UI for demo user"
```

---

### Task 8: Run full test suite and fix any issues

**Step 1: Run server tests**

Run: `cd server && pnpm test -- --run`
Expected: All tests pass

**Step 2: Run web tests**

Run: `cd web && pnpm test -- --run`
Expected: All tests pass

**Step 3: Run linting**

Run: `cd server && pnpm lint && cd ../web && pnpm lint`
Expected: No errors

**Step 4: Run type checks**

Run: `cd server && npx tsc --noEmit && cd ../web && npx svelte-check --tsconfig ./tsconfig.json`
Expected: No errors

**Step 5: Fix any issues found**

Address any test failures, lint errors, or type errors.

**Step 6: Final commit if fixes were needed**

```bash
git add -A
git commit -m "fix(demo): address test and lint issues"
```

---

### Task 9: Format and final verification

**Step 1: Run formatters**

```bash
make format-server && make format-web
```

**Step 2: Run full check**

```bash
make check-server && make check-web
```

**Step 3: Commit formatting changes if any**

```bash
git add -A
git commit -m "style: format demo mode changes"
```
