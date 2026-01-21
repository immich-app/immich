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
import 'package:immich_mobile/domain/models/store.model.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/extensions/translate_extensions.dart';
import 'package:immich_mobile/providers/auth.provider.dart';
import 'package:immich_mobile/providers/background_sync.provider.dart';
import 'package:immich_mobile/providers/backup/backup.provider.dart';
import 'package:immich_mobile/providers/gallery_permission.provider.dart';
import 'package:immich_mobile/providers/oauth.provider.dart';
import 'package:immich_mobile/providers/server_info.provider.dart';
import 'package:immich_mobile/providers/websocket.provider.dart';
import 'package:immich_mobile/repositories/local_files_manager.repository.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/utils/provider_utils.dart';
import 'package:immich_mobile/utils/url_helper.dart';
import 'package:immich_mobile/utils/version_compatibility.dart';
import 'package:immich_mobile/widgets/common/immich_logo.dart';
import 'package:immich_mobile/widgets/common/immich_title_text.dart';
import 'package:immich_mobile/widgets/common/immich_toast.dart';
import 'package:immich_ui/immich_ui.dart';
import 'package:logging/logging.dart';
import 'package:openapi/api.dart';
import 'package:package_info_plus/package_info_plus.dart';
import 'package:permission_handler/permission_handler.dart';

class LoginForm extends HookConsumerWidget {
  LoginForm({super.key});

  final log = Logger('LoginForm');

  String? _validateUrl(String? url) {
    if (url == null || url.isEmpty) return null;

    final parsedUrl = Uri.tryParse(url);
    if (parsedUrl == null || !parsedUrl.isAbsolute || !parsedUrl.scheme.startsWith("http") || parsedUrl.host.isEmpty) {
      return 'login_form_err_invalid_url'.tr();
    }

    return null;
  }

  String? _validateEmail(String? email) {
    if (email == null || email == '') return null;
    if (email.endsWith(' ')) return 'login_form_err_trailing_whitespace'.tr();
    if (email.startsWith(' ')) return 'login_form_err_leading_whitespace'.tr();
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
        final appVersion = packageInfo.version;
        final appMajorVersion = int.parse(appVersion.split('.')[0]);
        final appMinorVersion = int.parse(appVersion.split('.')[1]);
        final serverMajorVersion = serverInfo.serverVersion.major;
        final serverMinorVersion = serverInfo.serverVersion.minor;

        warningMessage.value = getVersionCompatibilityMessage(
          appMajorVersion,
          appMinorVersion,
          serverMajorVersion,
          serverMinorVersion,
        );
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

      await backgroundManager.syncLocal(full: true);
      await backgroundManager.syncRemote();
      await backgroundManager.hashAssets();

      if (Store.get(StoreKey.syncAlbums, false)) {
        await backgroundManager.syncLinkedAlbum();
      }
    }

    getManageMediaPermission() async {
      final hasPermission = await ref.read(localFilesManagerRepositoryProvider).hasManageMediaPermission();
      if (!hasPermission) {
        await showDialog(
          context: context,
          builder: (BuildContext context) {
            return AlertDialog(
              shape: const RoundedRectangleBorder(borderRadius: BorderRadius.all(Radius.circular(10))),
              elevation: 5,
              title: Text(
                'manage_media_access_title',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: context.primaryColor),
              ).tr(),
              content: SingleChildScrollView(
                child: ListBody(
                  children: [
                    const Text('manage_media_access_subtitle', style: TextStyle(fontSize: 14)).tr(),
                    const SizedBox(height: 4),
                    const Text('manage_media_access_rationale', style: TextStyle(fontSize: 12)).tr(),
                  ],
                ),
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.of(context).pop(),
                  child: Text(
                    'cancel'.tr(),
                    style: TextStyle(fontWeight: FontWeight.w600, color: context.primaryColor),
                  ),
                ),
                TextButton(
                  onPressed: () {
                    ref.read(localFilesManagerRepositoryProvider).requestManageMediaPermission();
                    Navigator.of(context).pop();
                  },
                  child: Text(
                    'manage_media_access_settings'.tr(),
                    style: TextStyle(fontWeight: FontWeight.w600, color: context.primaryColor),
                  ),
                ),
              ],
            );
          },
        );
      }
    }

    bool isSyncRemoteDeletionsMode() => Platform.isAndroid && Store.get(StoreKey.manageLocalMediaAndroid, false);

    login() async {
      TextInput.finishAutofillContext();

      // Invalidate all api repository provider instance to take into account new access token
      invalidateAllApiRepositoryProviders(ref);

      try {
        final result = await ref.read(authProvider.notifier).login(emailController.text, passwordController.text);

        if (result.shouldChangePassword && !result.isAdmin) {
          unawaited(context.pushRoute(const ChangePasswordRoute()));
        } else {
          final isBeta = Store.isBetaTimelineEnabled;
          if (isBeta) {
            await ref.read(galleryPermissionNotifier.notifier).requestGalleryPermission();
            if (isSyncRemoteDeletionsMode()) {
              await getManageMediaPermission();
            }
            unawaited(handleSyncFlow());
            ref.read(websocketProvider.notifier).connect();
            unawaited(context.replaceRoute(const TabShellRoute()));
            return;
          }
          unawaited(context.replaceRoute(const TabControllerRoute()));
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
            final permission = ref.watch(galleryPermissionNotifier);
            final isBeta = Store.isBetaTimelineEnabled;
            if (!isBeta && (permission.isGranted || permission.isLimited)) {
              unawaited(ref.watch(backupProvider.notifier).resumeBackup());
            }
            if (isBeta) {
              await ref.read(galleryPermissionNotifier.notifier).requestGalleryPermission();
              if (isSyncRemoteDeletionsMode()) {
                await getManageMediaPermission();
              }
              unawaited(handleSyncFlow());
              unawaited(context.replaceRoute(const TabShellRoute()));
              return;
            }
            unawaited(context.replaceRoute(const TabControllerRoute()));
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
            color: context.isDarkTheme ? Colors.red.shade700 : Colors.red.shade100,
            borderRadius: const BorderRadius.all(Radius.circular(8)),
            border: Border.all(color: context.isDarkTheme ? Colors.red.shade900 : Colors.red[200]!),
          ),
          child: Text(warningMessage.value!, textAlign: TextAlign.center),
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
                  submitText: 'next'.t(context: context),
                  submitIcon: Icons.arrow_forward_rounded,
                  onSubmit: getServerAuthSettings,
                  child: ImmichTextInput(
                    controller: serverEndpointController,
                    label: 'login_form_endpoint_url'.t(context: context),
                    hintText: 'login_form_endpoint_hint'.t(context: context),
                    validator: _validateUrl,
                    keyboardAction: TextInputAction.next,
                    keyboardType: TextInputType.url,
                    autofillHints: const [AutofillHints.url],
                    onSubmit: (ctx, _) => ImmichForm.of(ctx).submit(),
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
                    submitText: 'login'.t(context: context),
                    submitIcon: Icons.login_rounded,
                    onSubmit: login,
                    child: Column(
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
                          onSubmit: (_, _) => passwordFocusNode.requestFocus(),
                        ),
                        ImmichPasswordInput(
                          controller: passwordController,
                          focusNode: passwordFocusNode,
                          label: 'password'.t(context: context),
                          hintText: 'login_form_password_hint'.t(context: context),
                          keyboardAction: TextInputAction.go,
                          onSubmit: (ctx, _) => ImmichForm.of(ctx).submit(),
                        ),
                      ],
                    ),
                  ),
                if (isOauthEnable.value)
                  ImmichForm(
                    submitText: oAuthButtonLabel.value,
                    submitIcon: Icons.pin_outlined,
                    onSubmit: oAuthLogin,
                    child: isPasswordLoginEnable.value
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
