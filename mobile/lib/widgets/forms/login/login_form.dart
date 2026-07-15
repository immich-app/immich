import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'dart:math';

import 'package:auto_route/auto_route.dart';
import 'package:crypto/crypto.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_hooks/flutter_hooks.dart' hide Store;
import 'package:fluttertoast/fluttertoast.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/extensions/platform_extensions.dart';
import 'package:immich_mobile/extensions/translate_extensions.dart';
import 'package:immich_mobile/generated/translations.g.dart';
import 'package:immich_mobile/infrastructure/repositories/settings.repository.dart';
import 'package:immich_mobile/providers/auth.provider.dart';
import 'package:immich_mobile/providers/background_sync.provider.dart';
import 'package:immich_mobile/providers/feature_message.provider.dart';
import 'package:immich_mobile/providers/gallery_permission.provider.dart';
import 'package:immich_mobile/providers/infrastructure/settings.provider.dart';
import 'package:immich_mobile/providers/oauth.provider.dart';
import 'package:immich_mobile/providers/server_info.provider.dart';
import 'package:immich_mobile/providers/view_intent/view_intent_handler.provider.dart';
import 'package:immich_mobile/providers/websocket.provider.dart';
import 'package:immich_mobile/repositories/permission.repository.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/utils/provider_utils.dart';
import 'package:immich_mobile/utils/semver.dart';
import 'package:immich_mobile/utils/url_helper.dart';
import 'package:immich_mobile/utils/version_compatibility.dart';
import 'package:immich_mobile/widgets/common/immich_logo.dart';
import 'package:immich_mobile/widgets/common/immich_title_text.dart';
import 'package:immich_mobile/widgets/common/immich_toast.dart';
import 'package:immich_ui/immich_ui.dart';
import 'package:logging/logging.dart';
import 'package:openapi/api.dart';
import 'package:package_info_plus/package_info_plus.dart';

class LoginForm extends HookConsumerWidget {
  LoginForm({super.key});

  final log = Logger('LoginForm');

  String? _validateUrl(String? url) {
    if (url == null || url.isEmpty) {
      return null;
    }

    final parsedUrl = Uri.tryParse(url);
    if (parsedUrl == null || !parsedUrl.isAbsolute || !parsedUrl.scheme.startsWith("http") || parsedUrl.host.isEmpty) {
      return 'login_form_err_invalid_url'.tr();
    }

    return null;
  }

  String? _validateEmail(String? email) {
    if (email == null || email == '') {
      return null;
    }
    if (email.endsWith(' ')) {
      return 'login_form_err_trailing_whitespace'.tr();
    }
    if (email.startsWith(' ')) {
      return 'login_form_err_leading_whitespace'.tr();
    }
    if (email.contains(' ') || !email.contains('@')) {
      return 'login_form_err_invalid_email'.tr();
    }
    return null;
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final emailController = useTextEditingController.fromValue(TextEditingValue.empty);
    final passwordController = useTextEditingController.fromValue(TextEditingValue.empty);
    final serverEndpointController = useTextEditingController.fromValue(TextEditingValue.empty);
    final passwordFocusNode = useFocusNode();
    final isOauthEnable = useState<bool>(false);
    final isPasswordLoginEnable = useState<bool>(false);
    final oAuthButtonLabel = useState<String>('OAuth');
    final logoAnimationController = useAnimationController(duration: const Duration(seconds: 60))..repeat();
    final serverInfo = ref.watch(serverInfoProvider);
    final warningMessage = useState<String?>(null);
    final loginFormKey = GlobalKey<FormState>();
    final ValueNotifier<String?> serverEndpoint = useState<String?>(null);

    checkVersionMismatch() async {
      try {
        final packageInfo = await PackageInfo.fromPlatform();
        final appSemVer = SemVer.fromString(packageInfo.version);
        final serverSemVer = serverInfo.serverVersion;
        warningMessage.value = getVersionCompatibilityMessage(serverVersion: serverSemVer, appVersion: appSemVer);
      } catch (error) {
        warningMessage.value = 'Error checking version compatibility';
      }
    }

    /// Fetch the server login credential and enables oAuth login if necessary
    /// Returns true if successful, false otherwise
    Future<void> getServerAuthSettings() async {
      final sanitizeServerUrl = sanitizeUrl(serverEndpointController.text);
      final serverUrl = punycodeEncodeUrl(sanitizeServerUrl);

      // Guard empty URL
      if (serverUrl.isEmpty) {
        ImmichToast.show(context: context, msg: "login_form_server_empty".tr(), toastType: ToastType.error);
      }

      try {
        final endpoint = await ref.read(authProvider.notifier).validateServerUrl(serverUrl);

        // Fetch and load server config and features
        await ref.read(serverInfoProvider.notifier).getServerInfo();

        final serverInfo = ref.read(serverInfoProvider);
        final features = serverInfo.serverFeatures;
        final config = serverInfo.serverConfig;

        isOauthEnable.value = features.oauthEnabled;
        isPasswordLoginEnable.value = features.passwordLogin;
        oAuthButtonLabel.value = config.oauthButtonText.isNotEmpty ? config.oauthButtonText : 'OAuth';

        serverEndpoint.value = endpoint;
      } on ApiException catch (e) {
        ImmichToast.show(
          context: context,
          msg: e.message ?? 'login_form_api_exception'.tr(),
          toastType: ToastType.error,
          gravity: ToastGravity.TOP,
        );
        isOauthEnable.value = false;
        isPasswordLoginEnable.value = true;
      } on HandshakeException {
        ImmichToast.show(
          context: context,
          msg: 'login_form_handshake_exception'.tr(),
          toastType: ToastType.error,
          gravity: ToastGravity.TOP,
        );
        isOauthEnable.value = false;
        isPasswordLoginEnable.value = true;
      } catch (e) {
        ImmichToast.show(
          context: context,
          msg: 'login_form_server_error'.tr(),
          toastType: ToastType.error,
          gravity: ToastGravity.TOP,
        );
        isOauthEnable.value = false;
        isPasswordLoginEnable.value = true;
      }
    }

    useEffect(() {
      final serverUrl = getServerUrl();
      if (serverUrl != null) {
        serverEndpointController.text = serverUrl;
      }
      return null;
    }, []);

    populateTestLoginInfo() {
      emailController.text = 'demo@immich.app';
      passwordController.text = 'demo';
      serverEndpointController.text = 'https://demo.immich.app';
    }

    populateTestLoginInfo1() {
      emailController.text = 'testuser@email.com';
      passwordController.text = 'password';
      serverEndpointController.text = 'http://10.1.15.216:2283/api';
    }

    Future<void> handleSyncFlow() async {
      final backgroundManager = ref.read(backgroundSyncProvider);
      final viewIntentHandler = ref.read(viewIntentHandlerProvider);

      await backgroundManager.syncLocal(full: true);
      final syncSuccess = await backgroundManager.syncRemote();
      await viewIntentHandler.flushDeferredViewIntent();
      await backgroundManager.hashAssets();
      if (syncSuccess) {
        await backgroundManager.syncTrash();
      }

      if (SettingsRepository.instance.appConfig.backup.syncAlbums) {
        await backgroundManager.syncLinkedAlbum();
      }
    }

    Future<void> promptManageMediaIfNeeded() async {
      if (!CurrentPlatform.isAndroid || !ref.read(appConfigProvider).trashSyncEnabled) {
        return;
      }

      final permission = ref.read(permissionRepositoryProvider);
      if (await permission.hasManageMediaPermission() || !context.mounted) {
        return;
      }

      await showDialog(
        context: context,
        builder: (BuildContext context) {
          return AlertDialog(
            shape: const RoundedRectangleBorder(borderRadius: .all(.circular(10))),
            elevation: 5,
            title: Text(
              context.t.manage_media_access_title,
              style: .new(fontSize: 16, fontWeight: .bold, color: context.primaryColor),
            ),
            content: SingleChildScrollView(
              child: ListBody(
                children: [
                  Text(context.t.manage_media_access_subtitle, style: const .new(fontSize: 14)),
                  const SizedBox(height: 4),
                  Text(context.t.manage_media_access_rationale, style: const .new(fontSize: 12)),
                ],
              ),
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.of(context).pop(),
                child: Text(
                  context.t.cancel,
                  style: .new(fontWeight: .w600, color: context.primaryColor),
                ),
              ),
              TextButton(
                onPressed: () {
                  unawaited(permission.requestManageMediaPermission());
                  Navigator.of(context).pop();
                },
                child: Text(
                  context.t.manage_media_access_settings,
                  style: .new(fontWeight: .w600, color: context.primaryColor),
                ),
              ),
            ],
          );
        },
      );
    }

    login() async {
      TextInput.finishAutofillContext();

      // Invalidate all api repository provider instance to take into account new access token
      invalidateAllApiRepositoryProviders(ref);

      try {
        final result = await ref.read(authProvider.notifier).login(emailController.text, passwordController.text);

        if (result.shouldChangePassword && !result.isAdmin) {
          unawaited(context.pushRoute(const ChangePasswordRoute()));
        } else {
          await ref.read(galleryPermissionNotifier.notifier).requestGalleryPermission();
          await promptManageMediaIfNeeded();
          unawaited(handleSyncFlow());
          ref.read(websocketProvider.notifier).connect();
          unawaited(ref.read(featureMessageServiceProvider).markSeen());
          unawaited(context.router.replaceAll([const TabShellRoute()]));
          return;
        }
      } catch (error) {
        ImmichToast.show(
          context: context,
          msg: "login_form_failed_login".tr(),
          toastType: ToastType.error,
          gravity: ToastGravity.TOP,
        );
      }
    }

    String generateRandomString(int length) {
      const chars = 'AaBbCcDdEeFfGgHhIiJjKkLlMmNnOoPpQqRrSsTtUuVvWwXxYyZz1234567890';
      final random = Random.secure();
      return String.fromCharCodes(Iterable.generate(length, (_) => chars.codeUnitAt(random.nextInt(chars.length))));
    }

    List<int> randomBytes(int length) {
      final random = Random.secure();
      return List<int>.generate(length, (i) => random.nextInt(256));
    }

    /// Per specification, the code verifier must be 43-128 characters long
    /// and consist of characters [A-Z, a-z, 0-9, "-", ".", "_", "~"]
    /// https://datatracker.ietf.org/doc/html/rfc7636#section-4.1
    String randomCodeVerifier() {
      return base64Url.encode(randomBytes(42));
    }

    Future<String> generatePKCECodeChallenge(String codeVerifier) async {
      var bytes = utf8.encode(codeVerifier);
      var digest = sha256.convert(bytes);
      return base64Url.encode(digest.bytes).replaceAll('=', '');
    }

    oAuthLogin() async {
      var oAuthService = ref.watch(oAuthServiceProvider);
      String? oAuthServerUrl;

      final state = generateRandomString(32);

      final codeVerifier = randomCodeVerifier();
      final codeChallenge = await generatePKCECodeChallenge(codeVerifier);

      try {
        oAuthServerUrl = await oAuthService.getOAuthServerUrl(
          sanitizeUrl(serverEndpointController.text),
          state,
          codeChallenge,
        );

        // Invalidate all api repository provider instance to take into account new access token
        invalidateAllApiRepositoryProviders(ref);
      } catch (error, stack) {
        log.severe('Error getting OAuth server Url: $error', stack);

        ImmichToast.show(
          context: context,
          msg: "login_form_failed_get_oauth_server_config".tr(),
          toastType: ToastType.error,
          gravity: ToastGravity.TOP,
        );
        return;
      }

      if (oAuthServerUrl != null) {
        try {
          final loginResponseDto = await oAuthService.oAuthLogin(oAuthServerUrl, state, codeVerifier);

          if (loginResponseDto == null) {
            return;
          }

          log.info("Finished OAuth login with response: ${loginResponseDto.userEmail}");

          final isSuccess = await ref
              .watch(authProvider.notifier)
              .saveAuthInfo(accessToken: loginResponseDto.accessToken);

          if (isSuccess) {
            await ref.read(galleryPermissionNotifier.notifier).requestGalleryPermission();
            await promptManageMediaIfNeeded();
            unawaited(handleSyncFlow());
            unawaited(ref.read(featureMessageServiceProvider).markSeen());
            unawaited(context.router.replaceAll([const TabShellRoute()]));
            return;
          }
        } catch (error, stack) {
          log.severe('Error logging in with OAuth: $error', stack);

          ImmichToast.show(
            context: context,
            msg: error.toString(),
            toastType: ToastType.error,
            gravity: ToastGravity.TOP,
          );
        } finally {}
      } else {
        ImmichToast.show(
          context: context,
          msg: "login_form_failed_get_oauth_server_disable".tr(),
          toastType: ToastType.info,
          gravity: ToastGravity.TOP,
        );
        return;
      }
    }

    buildVersionCompatWarning() {
      checkVersionMismatch();

      if (warningMessage.value == null) {
        return const SizedBox.shrink();
      }

      return Padding(
        padding: const EdgeInsets.only(bottom: 8.0),
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: context.isDarkTheme ? Colors.amber.shade700 : Colors.amber.shade100,
            borderRadius: const BorderRadius.all(Radius.circular(12)),
            border: Border.all(color: context.isDarkTheme ? Colors.amber.shade800 : Colors.amber[200]!, width: 2),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Icon(Icons.warning_amber_rounded, color: Colors.amber.shade800),
              const SizedBox(width: 8),
              Expanded(
                child: Padding(padding: const EdgeInsets.only(top: 2), child: Text(warningMessage.value!)),
              ),
            ],
          ),
        ),
      );
    }

    final serverSelectionOrLogin = serverEndpoint.value == null
        ? Padding(
            padding: const EdgeInsets.only(top: ImmichSpacing.md),
            child: Column(
              mainAxisSize: MainAxisSize.max,
              children: [
                ImmichForm(
                  onSubmit: getServerAuthSettings,
                  submitText: 'next'.t(context: context),
                  submitIcon: Icons.arrow_forward_rounded,
                  builder: (_, form) => ImmichURLInput(
                    controller: serverEndpointController,
                    label: 'login_form_endpoint_url'.t(context: context),
                    hintText: 'login_form_endpoint_hint'.t(context: context),
                    validator: _validateUrl,
                    keyboardAction: .next,
                    onSubmit: (_) => form.submit(),
                  ),
                ),
                ImmichTextButton(
                  labelText: 'settings'.t(context: context),
                  icon: Icons.settings,
                  variant: ImmichVariant.ghost,
                  onPressed: () => context.pushRoute(const SettingsRoute()),
                ),
              ],
            ),
          )
        : AutofillGroup(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              mainAxisSize: MainAxisSize.max,
              children: [
                buildVersionCompatWarning(),
                Padding(
                  padding: const EdgeInsets.only(bottom: ImmichSpacing.md),
                  child: Text(
                    sanitizeUrl(serverEndpointController.text),
                    style: context.textTheme.displaySmall,
                    textAlign: TextAlign.center,
                  ),
                ),
                if (isPasswordLoginEnable.value)
                  ImmichForm(
                    onSubmit: login,
                    submitText: 'login'.t(context: context),
                    submitIcon: Icons.login_rounded,
                    builder: (context, form) => Column(
                      spacing: ImmichSpacing.md,
                      children: [
                        ImmichTextInput(
                          controller: emailController,
                          label: 'email'.t(context: context),
                          hintText: 'login_form_email_hint'.t(context: context),
                          validator: _validateEmail,
                          keyboardAction: TextInputAction.next,
                          keyboardType: TextInputType.emailAddress,
                          autofillHints: const [AutofillHints.email],
                          onSubmit: (_) => passwordFocusNode.requestFocus(),
                        ),
                        ImmichPasswordInput(
                          controller: passwordController,
                          focusNode: passwordFocusNode,
                          label: 'password'.t(context: context),
                          hintText: 'login_form_password_hint'.t(context: context),
                          keyboardAction: TextInputAction.go,
                          onSubmit: (_) => form.submit(),
                        ),
                      ],
                    ),
                  ),
                if (isOauthEnable.value)
                  ImmichForm(
                    onSubmit: oAuthLogin,
                    submitText: oAuthButtonLabel.value,
                    submitIcon: Icons.pin_outlined,
                    builder: (context, _) => isPasswordLoginEnable.value
                        ? Padding(
                            padding: const EdgeInsets.only(left: 18.0, right: 18.0, top: 12.0),
                            child: Divider(color: context.isDarkTheme ? Colors.white : Colors.black, height: 5),
                          )
                        : const SizedBox.shrink(),
                  ),
                if (!isOauthEnable.value && !isPasswordLoginEnable.value)
                  Center(child: const Text('login_disabled').tr()),
                ImmichTextButton(
                  labelText: 'back'.t(context: context),
                  icon: Icons.arrow_back,
                  variant: ImmichVariant.ghost,
                  onPressed: () => serverEndpoint.value = null,
                ),
              ],
            ),
          );

    return LayoutBuilder(
      builder: (context, constraints) {
        return SingleChildScrollView(
          child: Center(
            child: Container(
              constraints: const BoxConstraints(maxWidth: 300),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  SizedBox(height: constraints.maxHeight / 5),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.center,
                    mainAxisAlignment: MainAxisAlignment.end,
                    children: [
                      GestureDetector(
                        onDoubleTap: () => populateTestLoginInfo(),
                        onLongPress: () => populateTestLoginInfo1(),
                        child: RotationTransition(
                          turns: logoAnimationController,
                          child: const ImmichLogo(heroTag: 'logo'),
                        ),
                      ),
                      const Padding(padding: EdgeInsets.only(top: 8.0, bottom: 16), child: ImmichTitleText()),
                    ],
                  ),

                  // Note: This used to have an AnimatedSwitcher, but was removed
                  // because of https://github.com/flutter/flutter/issues/120874
                  Form(key: loginFormKey, child: serverSelectionOrLogin),
                ],
              ),
            ),
          ),
        );
      },
    );
  }
}
