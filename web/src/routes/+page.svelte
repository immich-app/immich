<script lang="ts">
  import { goto } from '$app/navigation';
  import { AppRoute } from '$lib/constants';
  import { eventManager } from '$lib/managers/event-manager.svelte';
  import { featureFlagsManager } from '$lib/managers/feature-flags-manager.svelte';
  import { serverConfigManager } from '$lib/managers/server-config-manager.svelte';
  import { oauth } from '$lib/utils';
  import { getServerErrorMessage, handleError } from '$lib/utils/handle-error';
  import { login, type LoginResponseDto } from '@immich/sdk';
  import { onMount } from 'svelte';
  import { t } from 'svelte-i18n';

  let activeTab: 'signin' | 'join' | 'request' = $state('signin');
  let errorMessage = $state('');
  let loading = $state(false);
  let oauthLoading = $state(true);
  let oauthError = $state('');

  // Sign in form
  let signinEmail = $state('');
  let signinPassword = $state('');

  // Join form
  let inviteCode = $state('');
  let joinName = $state('');
  let joinEmail = $state('');
  let joinPassword = $state('');

  // Request form
  let requestEmail = $state('');
  let requestReason = $state('');

  const serverConfig = $derived(serverConfigManager.value);

  const onSuccess = async (user: LoginResponseDto) => {
    await goto(AppRoute.PHOTOS, { invalidateAll: true });
    eventManager.emit('AuthLogin', user);
  };

  const onFirstLogin = () => goto(AppRoute.AUTH_CHANGE_PASSWORD);
  const onOnboarding = () => goto(AppRoute.AUTH_ONBOARDING);

  onMount(async () => {
    if (!featureFlagsManager.value.oauth) {
      oauthLoading = false;
      return;
    }

    if (oauth.isCallback(globalThis.location)) {
      try {
        const user = await oauth.login(globalThis.location);
        if (!user.isOnboarded) {
          await onOnboarding();
          return;
        }
        await onSuccess(user);
        return;
      } catch (error) {
        console.error('Error [login-form] [oauth.callback]', error);
        oauthError = getServerErrorMessage(error) || $t('errors.unable_to_complete_oauth_login');
        oauthLoading = false;
        return;
      }
    }

    try {
      if (
        (featureFlagsManager.value.oauthAutoLaunch && !oauth.isAutoLaunchDisabled(globalThis.location)) ||
        oauth.isAutoLaunchEnabled(globalThis.location)
      ) {
        await goto(`${AppRoute.AUTH_LOGIN}?autoLaunch=0`, { replaceState: true });
        await oauth.authorize(globalThis.location);
        return;
      }
    } catch (error) {
      handleError(error, $t('errors.unable_to_connect'));
    }

    oauthLoading = false;
  });

  const handleSignIn = async () => {
    try {
      errorMessage = '';
      loading = true;
      const user = await login({ loginCredentialDto: { email: signinEmail, password: signinPassword } });

      if (user.isAdmin && !serverConfig.isOnboarded) {
        await onOnboarding();
        return;
      }

      if (!user.isAdmin && user.shouldChangePassword) {
        await onFirstLogin();
        return;
      }

      if (!user.isOnboarded) {
        await onOnboarding();
        return;
      }

      await onSuccess(user);
    } catch (error) {
      errorMessage = getServerErrorMessage(error) || $t('errors.incorrect_email_or_password');
      loading = false;
    }
  };

  const handleJoin = () => {
    // TODO: Implement invite code validation and registration
    console.log('Join with code:', inviteCode, joinName, joinEmail);
  };

  const handleRequest = () => {
    // TODO: Implement invite request
    console.log('Request invite:', requestEmail, requestReason);
  };

  const handleOAuthLogin = async () => {
    oauthLoading = true;
    oauthError = '';
    const success = await oauth.authorize(globalThis.location);
    if (!success) {
      oauthLoading = false;
      oauthError = $t('errors.unable_to_login_with_oauth');
    }
  };
</script>

<svelte:head>
  <link
    href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600&family=Inter:wght@400;500&display=swap"
    rel="stylesheet"
  />
  <title>tessera.pics - Your photos belong with people who matter</title>
</svelte:head>

<div class="tessera-page">
  <!-- Nav -->
  <nav class="nav">
    <div class="logo">tessera.pics</div>
    <div class="nav-links">
      <a href="#how-it-works">How it works</a>
      <a href="#privacy">Privacy</a>
    </div>
  </nav>

  <!-- Hero with Auth -->
  <section class="hero">
    <div class="hero-content">
      <h1>Your photos belong with people who matter</h1>
      <p>A private space for families to share memories. No strangers. No algorithms. Just your people.</p>
    </div>

    <div class="auth-card">
      <div class="auth-tabs">
        <button
          type="button"
          class="auth-tab"
          class:active={activeTab === 'signin'}
          onclick={() => (activeTab = 'signin')}
        >
          Sign in
        </button>
        <button type="button" class="auth-tab" class:active={activeTab === 'join'} onclick={() => (activeTab = 'join')}>
          Join
        </button>
        <button
          type="button"
          class="auth-tab"
          class:active={activeTab === 'request'}
          onclick={() => (activeTab = 'request')}
        >
          Request
        </button>
      </div>

      <!-- Sign In Form -->
      {#if activeTab === 'signin'}
        <form
          class="auth-form"
          onsubmit={(e) => {
            e.preventDefault();
            void handleSignIn();
          }}
        >
          {#if errorMessage}
            <div class="error-message">{errorMessage}</div>
          {/if}

          <div class="form-group">
            <label for="signin-email">Email</label>
            <input type="email" id="signin-email" placeholder="you@example.com" bind:value={signinEmail} required />
          </div>

          <div class="form-group">
            <label for="signin-password">Password</label>
            <input
              type="password"
              id="signin-password"
              placeholder="Your password"
              bind:value={signinPassword}
              required
            />
          </div>

          <button type="submit" class="btn" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign in'}
          </button>

          <div class="auth-footer">
            <a href="/auth/forgot-password">Forgot your password?</a>
          </div>

          {#if featureFlagsManager.value.oauth}
            <div class="divider">or</div>
            {#if oauthError}
              <div class="error-message">{oauthError}</div>
            {/if}
            <button
              type="button"
              class="btn btn-secondary"
              onclick={handleOAuthLogin}
              disabled={loading || oauthLoading}
            >
              {serverConfig.oauthButtonText || 'Sign in with OAuth'}
            </button>
          {/if}
        </form>
      {/if}

      <!-- Join Form -->
      {#if activeTab === 'join'}
        <form
          class="auth-form"
          onsubmit={(e) => {
            e.preventDefault();
            handleJoin();
          }}
        >
          <div class="invite-info">
            <strong>Have an invite code?</strong> Enter it below to create your account and join your family's album.
          </div>

          <div class="form-group">
            <label for="invite-code">Invite code</label>
            <input type="text" id="invite-code" placeholder="e.g. FAMILY-ABCD-1234" bind:value={inviteCode} required />
          </div>

          <div class="divider">then create your account</div>

          <div class="form-group">
            <label for="join-name">Your name</label>
            <input type="text" id="join-name" placeholder="What should we call you?" bind:value={joinName} required />
          </div>

          <div class="form-group">
            <label for="join-email">Email</label>
            <input type="email" id="join-email" placeholder="you@example.com" bind:value={joinEmail} required />
          </div>

          <div class="form-group">
            <label for="join-password">Password</label>
            <input
              type="password"
              id="join-password"
              placeholder="Create a password"
              bind:value={joinPassword}
              required
            />
          </div>

          <button type="submit" class="btn">Join your family</button>
        </form>
      {/if}

      <!-- Request Form -->
      {#if activeTab === 'request'}
        <form
          class="auth-form"
          onsubmit={(e) => {
            e.preventDefault();
            handleRequest();
          }}
        >
          <div class="invite-info">
            <strong>tessera is invite-only.</strong> Request access and we'll notify you when someone invites you or when
            spots open up.
          </div>

          <div class="form-group">
            <label for="request-email">Email</label>
            <input type="email" id="request-email" placeholder="you@example.com" bind:value={requestEmail} required />
          </div>

          <div class="form-group">
            <label for="request-reason">
              Why do you want to join?
              <span class="optional">(optional)</span>
            </label>
            <input
              type="text"
              id="request-reason"
              placeholder="e.g. My sister told me about it"
              bind:value={requestReason}
            />
          </div>

          <button type="submit" class="btn">Request an invite</button>

          <div class="auth-footer">
            Know someone on tessera? <button type="button" class="link-button" onclick={() => (activeTab = 'join')}
              >Ask them for an invite</button
            >
          </div>
        </form>
      {/if}
    </div>
  </section>

  <!-- How it works -->
  <section class="section" id="how-it-works">
    <h2 class="section-title">How it works</h2>
    <div class="cards">
      <div class="card">
        <div class="card-icon">1</div>
        <h3>Get invited</h3>
        <p>Someone you trust brings you in. No sign-up forms, no strangers. Just a personal invitation.</p>
      </div>
      <div class="card">
        <div class="card-icon">2</div>
        <h3>Share the space</h3>
        <p>Your whole family pools storage together. One plan, everyone shares. No per-person fees.</p>
      </div>
      <div class="card">
        <div class="card-icon">3</div>
        <h3>Invite others</h3>
        <p>Grow your circle at your own pace. You decide who joins your private album.</p>
      </div>
    </div>
  </section>

  <!-- Storage section -->
  <section class="storage-section">
    <div class="storage-content">
      <div class="storage-visual">
        <div class="vault"></div>
        <div class="avatars">
          <div class="avatar"></div>
          <div class="avatar"></div>
          <div class="avatar"></div>
          <div class="avatar"></div>
        </div>
        <p class="storage-caption">Everyone shares one family vault</p>
      </div>
      <div class="storage-text">
        <h2>One plan for everyone</h2>
        <p>Forget complicated per-user pricing. With tessera, your whole family shares a single storage pool.</p>
        <ul class="feature-list">
          <li>Invite as many family members as you want</li>
          <li>Everyone contributes to one shared space</li>
          <li>Upgrade storage when you need it, together</li>
          <li>No hidden fees, no per-seat charges</li>
        </ul>
      </div>
    </div>
  </section>

  <!-- Privacy section -->
  <section class="privacy-section" id="privacy">
    <h2>Your memories stay yours</h2>
    <p>No public profiles. No discovery features. No ads. No AI training. Just a private space for your family.</p>
    <div class="privacy-badges">
      <span class="badge">No public profiles</span>
      <span class="badge">No discovery</span>
      <span class="badge">No ads ever</span>
      <span class="badge">End-to-end private</span>
    </div>
  </section>

  <!-- Footer -->
  <footer class="footer">
    <div class="footer-content">
      <div>
        <div class="footer-logo">tessera.pics</div>
        <div class="footer-tagline">piece by piece, together</div>
      </div>
      <div class="footer-links">
        <a href="/about">About</a>
        <a href="/privacy">Privacy</a>
        <a href="/contact">Contact</a>
      </div>
    </div>
  </footer>
</div>

<style>
  .tessera-page {
    font-family:
      'Inter',
      -apple-system,
      BlinkMacSystemFont,
      sans-serif;
    background: #faf9f7;
    color: #3d3d3d;
    line-height: 1.6;
    min-height: 100dvh;
  }

  /* Nav */
  .nav {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem 5%;
    max-width: 1200px;
    margin: 0 auto;
  }

  .logo {
    font-family: 'Playfair Display', serif;
    font-size: 1.5rem;
    font-weight: 600;
    color: #3d3d3d;
  }

  .nav-links {
    display: flex;
    gap: 2rem;
    align-items: center;
  }

  .nav-links a {
    text-decoration: none;
    color: #6b6b6b;
    font-size: 0.95rem;
  }

  .nav-links a:hover {
    color: #3d3d3d;
  }

  /* Hero */
  .hero {
    max-width: 1200px;
    margin: 0 auto;
    padding: 3rem 5% 5rem;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 5rem;
    align-items: center;
  }

  .hero-content h1 {
    font-family: 'Playfair Display', serif;
    font-size: 3.2rem;
    line-height: 1.2;
    margin-bottom: 1.5rem;
    color: #2d2d2d;
  }

  .hero-content p {
    font-size: 1.15rem;
    color: #6b6b6b;
    max-width: 480px;
  }

  /* Auth Card */
  .auth-card {
    background: white;
    border-radius: 20px;
    padding: 2.5rem;
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
    border: 1px solid #e8e6e3;
  }

  .auth-tabs {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 2rem;
    background: #f5f4f2;
    padding: 4px;
    border-radius: 10px;
  }

  .auth-tab {
    flex: 1;
    padding: 0.75rem 1rem;
    border: none;
    background: transparent;
    font-family: 'Inter', sans-serif;
    font-size: 0.9rem;
    color: #6b6b6b;
    cursor: pointer;
    border-radius: 8px;
    transition: all 0.2s;
  }

  .auth-tab:hover {
    color: #3d3d3d;
  }

  .auth-tab.active {
    background: white;
    color: #3d3d3d;
    font-weight: 500;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  }

  .auth-form {
    display: flex;
    flex-direction: column;
  }

  .form-group {
    margin-bottom: 1.25rem;
  }

  .form-group label {
    display: block;
    font-size: 0.9rem;
    color: #4d4d4d;
    margin-bottom: 0.5rem;
    font-weight: 500;
  }

  .form-group .optional {
    font-weight: 400;
    color: #a0a0a0;
  }

  .form-group input {
    width: 100%;
    padding: 0.875rem 1rem;
    border: 1.5px solid #e8e6e3;
    border-radius: 10px;
    font-size: 1rem;
    font-family: 'Inter', sans-serif;
    transition:
      border-color 0.2s,
      box-shadow 0.2s;
    background: #fafaf9;
    box-sizing: border-box;
  }

  .form-group input:focus {
    outline: none;
    border-color: #6b7f59;
    box-shadow: 0 0 0 3px rgba(107, 127, 89, 0.1);
    background: white;
  }

  .form-group input::placeholder {
    color: #a0a0a0;
  }

  .btn {
    width: 100%;
    background: #6b7f59;
    color: white;
    padding: 0.875rem 1.5rem;
    border-radius: 10px;
    text-decoration: none;
    font-weight: 500;
    font-size: 1rem;
    border: none;
    cursor: pointer;
    transition:
      background 0.2s,
      transform 0.2s;
    font-family: 'Inter', sans-serif;
  }

  .btn:hover:not(:disabled) {
    background: #5a6d4a;
    transform: translateY(-1px);
  }

  .btn:active:not(:disabled) {
    transform: translateY(0);
  }

  .btn:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  .btn-secondary {
    background: transparent;
    border: 1.5px solid #6b7f59;
    color: #6b7f59;
  }

  .btn-secondary:hover:not(:disabled) {
    background: #6b7f59;
    color: white;
  }

  .error-message {
    background: #fee2e2;
    border: 1px solid #fecaca;
    color: #991b1b;
    padding: 0.75rem 1rem;
    border-radius: 8px;
    margin-bottom: 1rem;
    font-size: 0.9rem;
  }

  .auth-footer {
    margin-top: 1.5rem;
    text-align: center;
    font-size: 0.9rem;
    color: #6b6b6b;
  }

  .auth-footer a {
    color: #6b7f59;
    text-decoration: none;
    font-weight: 500;
  }

  .auth-footer a:hover {
    text-decoration: underline;
  }

  .link-button {
    background: none;
    border: none;
    padding: 0;
    font: inherit;
    color: #6b7f59;
    font-weight: 500;
    cursor: pointer;
  }

  .link-button:hover {
    text-decoration: underline;
  }

  .divider {
    display: flex;
    align-items: center;
    margin: 1.5rem 0;
    color: #a0a0a0;
    font-size: 0.85rem;
  }

  .divider::before,
  .divider::after {
    content: '';
    flex: 1;
    height: 1px;
    background: #e8e6e3;
  }

  .divider::before {
    margin-right: 1rem;
  }

  .divider::after {
    margin-left: 1rem;
  }

  .invite-info {
    background: #f5f4f2;
    border-radius: 10px;
    padding: 1rem 1.25rem;
    margin-bottom: 1.5rem;
    font-size: 0.9rem;
    color: #5a5a5a;
  }

  .invite-info strong {
    color: #3d3d3d;
  }

  /* Sections */
  .section {
    padding: 5rem 5%;
    max-width: 1200px;
    margin: 0 auto;
  }

  .section-title {
    font-family: 'Playfair Display', serif;
    font-size: 2.5rem;
    text-align: center;
    margin-bottom: 3rem;
  }

  .cards {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 2rem;
  }

  .card {
    background: white;
    padding: 2.5rem;
    border-radius: 16px;
    text-align: center;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
    border: 1px solid #e8e6e3;
  }

  .card-icon {
    width: 64px;
    height: 64px;
    background: #f0f2ed;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 1.5rem;
    font-size: 1.5rem;
    color: #6b7f59;
  }

  .card h3 {
    font-family: 'Playfair Display', serif;
    font-size: 1.4rem;
    margin-bottom: 0.75rem;
  }

  .card p {
    color: #6b6b6b;
    font-size: 0.95rem;
  }

  /* Storage section */
  .storage-section {
    background: white;
    padding: 5rem 5%;
    border-top: 1px solid #e8e6e3;
    border-bottom: 1px solid #e8e6e3;
  }

  .storage-content {
    max-width: 1200px;
    margin: 0 auto;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 4rem;
    align-items: center;
  }

  .storage-visual {
    background: #f5f4f2;
    border-radius: 24px;
    padding: 3rem;
    text-align: center;
  }

  .vault {
    width: 120px;
    height: 100px;
    background: #8b9a7e;
    border-radius: 12px;
    margin: 0 auto 2rem;
    position: relative;
  }

  .vault::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 30px;
    height: 30px;
    border: 3px solid white;
    border-radius: 50%;
  }

  .avatars {
    display: flex;
    justify-content: center;
  }

  .avatar {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    border: 3px solid white;
    margin-left: -12px;
  }

  .avatar:first-child {
    margin-left: 0;
  }

  .avatar:nth-child(1) {
    background: #6b7f59;
  }
  .avatar:nth-child(2) {
    background: #8b9a7e;
  }
  .avatar:nth-child(3) {
    background: #a8b5a0;
  }
  .avatar:nth-child(4) {
    background: #c9b8a8;
  }

  .storage-caption {
    margin-top: 1.5rem;
    color: #6b6b6b;
  }

  .storage-text h2 {
    font-family: 'Playfair Display', serif;
    font-size: 2.2rem;
    margin-bottom: 1rem;
  }

  .storage-text p {
    color: #6b6b6b;
    font-size: 1.1rem;
    margin-bottom: 1.5rem;
  }

  .feature-list {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .feature-list li {
    padding: 0.5rem 0;
    padding-left: 1.5rem;
    position: relative;
    color: #5a5a5a;
  }

  .feature-list li::before {
    content: '';
    position: absolute;
    left: 0;
    top: 50%;
    transform: translateY(-50%);
    width: 8px;
    height: 8px;
    background: #8b9a7e;
    border-radius: 50%;
  }

  /* Privacy section */
  .privacy-section {
    text-align: center;
    padding: 6rem 5%;
    background: #f5f4f2;
  }

  .privacy-section h2 {
    font-family: 'Playfair Display', serif;
    font-size: 2.5rem;
    margin-bottom: 1rem;
  }

  .privacy-section > p {
    color: #6b6b6b;
    font-size: 1.2rem;
    max-width: 600px;
    margin: 0 auto 2rem;
  }

  .privacy-badges {
    display: flex;
    justify-content: center;
    gap: 2rem;
    flex-wrap: wrap;
  }

  .badge {
    background: white;
    padding: 1rem 1.5rem;
    border-radius: 100px;
    font-size: 0.9rem;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
    border: 1px solid #e8e6e3;
    color: #5a5a5a;
  }

  /* Footer */
  .footer {
    background: #3d3d3d;
    color: #faf9f7;
    padding: 3rem 5%;
  }

  .footer-content {
    max-width: 1200px;
    margin: 0 auto;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .footer-logo {
    font-family: 'Playfair Display', serif;
    font-size: 1.3rem;
  }

  .footer-tagline {
    font-size: 0.85rem;
    opacity: 0.6;
    margin-top: 0.25rem;
  }

  .footer-links {
    display: flex;
    gap: 2rem;
  }

  .footer-links a {
    color: #faf9f7;
    text-decoration: none;
    font-size: 0.9rem;
    opacity: 0.7;
  }

  .footer-links a:hover {
    opacity: 1;
  }

  /* Responsive */
  @media (max-width: 900px) {
    .hero {
      grid-template-columns: 1fr;
      gap: 3rem;
    }

    .hero-content {
      text-align: center;
    }

    .hero-content h1 {
      font-size: 2.5rem;
    }

    .hero-content p {
      margin: 0 auto;
    }

    .cards {
      grid-template-columns: 1fr;
    }

    .storage-content {
      grid-template-columns: 1fr;
    }

    .auth-tabs {
      flex-direction: column;
    }

    .footer-content {
      flex-direction: column;
      gap: 1.5rem;
      text-align: center;
    }
  }
</style>
