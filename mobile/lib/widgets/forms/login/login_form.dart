import 'dart:io';
import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_hooks/flutter_hooks.dart' hide Store;
import 'package:fluttertoast/fluttertoast.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/providers/oauth.provider.dart';
import 'package:immich_mobile/providers/gallery_permission.provider.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/providers/api.provider.dart';
import 'package:immich_mobile/providers/asset.provider.dart';
import 'package:immich_mobile/providers/authentication.provider.dart';
import 'package:immich_mobile/providers/backup/backup.provider.dart';
import 'package:immich_mobile/providers/server_info.provider.dart';
import 'package:immich_mobile/utils/provider_utils.dart';
import 'package:immich_mobile/utils/version_compatibility.dart';
import 'package:immich_mobile/widgets/common/immich_logo.dart';
import 'package:immich_mobile/widgets/common/immich_title_text.dart';
import 'package:immich_mobile/widgets/common/immich_toast.dart';
import 'package:immich_mobile/utils/url_helper.dart';
import 'package:immich_mobile/widgets/forms/login/email_input.dart';
import 'package:immich_mobile/widgets/forms/login/loading_icon.dart';
import 'package:immich_mobile/widgets/forms/login/login_button.dart';
import 'package:immich_mobile/widgets/forms/login/o_auth_login_button.dart';
import 'package:immich_mobile/widgets/forms/login/password_input.dart';
import 'package:immich_mobile/widgets/forms/login/server_endpoint_input.dart';
import 'package:logging/logging.dart';
import 'package:openapi/api.dart';
import 'package:package_info_plus/package_info_plus.dart';
import 'package:permission_handler/permission_handler.dart';

class LoginForm extends HookConsumerWidget {
  LoginForm({super.key});

  final log = Logger('LoginForm');

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final usernameController =
        useTextEditingController.fromValue(TextEditingValue.empty);
    final passwordController =
        useTextEditingController.fromValue(TextEditingValue.empty);
    final serverEndpointController =
        useTextEditingController.fromValue(TextEditingValue.empty);
    final apiService = ref.watch(apiServiceProvider);
    final emailFocusNode = useFocusNode();
    final passwordFocusNode = useFocusNode();
    final serverEndpointFocusNode = useFocusNode();
    final isLoading = useState<bool>(false);
    final isLoadingServer = useState<bool>(false);
    final isOauthEnable = useState<bool>(false);
    final isPasswordLoginEnable = useState<bool>(false);
    final oAuthButtonLabel = useState<String>('OAuth');
    final logoAnimationController = useAnimationController(
      duration: const Duration(seconds: 60),
    )..repeat();
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
    Future<bool> getServerLoginCredential() async {
      final serverUrl = sanitizeUrl(serverEndpointController.text);

      // Guard empty URL
      if (serverUrl.isEmpty) {
        ImmichToast.show(
          context: context,
          msg: "login_form_server_empty".tr(),
          toastType: ToastType.error,
        );

        return false;
      }

      try {
        isLoadingServer.value = true;
        final endpoint = await apiService.resolveAndSetEndpoint(serverUrl);

        // Fetch and load server config and features
        await ref.read(serverInfoProvider.notifier).getServerInfo();

        final serverInfo = ref.read(serverInfoProvider);
        final features = serverInfo.serverFeatures;
        final config = serverInfo.serverConfig;

        isOauthEnable.value = features.oauthEnabled;
        isPasswordLoginEnable.value = features.passwordLogin;
        oAuthButtonLabel.value = config.oauthButtonText.isNotEmpty
            ? config.oauthButtonText
            : 'OAuth';

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
        isLoadingServer.value = false;
        return false;
      } on HandshakeException {
        ImmichToast.show(
          context: context,
          msg: 'login_form_handshake_exception'.tr(),
          toastType: ToastType.error,
          gravity: ToastGravity.TOP,
        );
        isOauthEnable.value = false;
        isPasswordLoginEnable.value = true;
        isLoadingServer.value = false;
        return false;
      } catch (e) {
        ImmichToast.show(
          context: context,
          msg: 'login_form_server_error'.tr(),
          toastType: ToastType.error,
          gravity: ToastGravity.TOP,
        );
        isOauthEnable.value = false;
        isPasswordLoginEnable.value = true;
        isLoadingServer.value = false;
        return false;
      }

      isLoadingServer.value = false;
      return true;
    }

    useEffect(
      () {
        final serverUrl = Store.tryGet(StoreKey.serverUrl);
        if (serverUrl != null) {
          serverEndpointController.text = serverUrl;
        }
        return null;
      },
      [],
    );

    populateTestLoginInfo() {
      usernameController.text = 'demo@immich.app';
      passwordController.text = 'demo';
      serverEndpointController.text = 'https://demo.immich.app';
    }

    populateTestLoginInfo1() {
      usernameController.text = 'testuser@email.com';
      passwordController.text = 'password';
      serverEndpointController.text = 'http://192.168.1.118:2283/api';
    }

    login() async {
      TextInput.finishAutofillContext();
      // Start loading
      isLoading.value = true;

      // This will remove current cache asset state of previous user login.
      ref.read(assetProvider.notifier).clearAllAsset();

      // Invalidate all api repository provider instance to take into account new access token
      invalidateAllApiRepositoryProviders(ref);

      try {
        final isAuthenticated =
            await ref.read(authenticationProvider.notifier).login(
                  usernameController.text,
                  passwordController.text,
                  sanitizeUrl(serverEndpointController.text),
                );
        if (isAuthenticated) {
          // Resume backup (if enable) then navigate
          if (ref.read(authenticationProvider).shouldChangePassword &&
              !ref.read(authenticationProvider).isAdmin) {
            context.pushRoute(const ChangePasswordRoute());
          } else {
            final hasPermission = await ref
                .read(galleryPermissionNotifier.notifier)
                .hasPermission;
            if (hasPermission) {
              // Don't resume the backup until we have gallery permission
              ref.read(backupProvider.notifier).resumeBackup();
            }
            context.replaceRoute(const TabControllerRoute());
          }
        } else {
          ImmichToast.show(
            context: context,
            msg: "login_form_failed_login".tr(),
            toastType: ToastType.error,
            gravity: ToastGravity.TOP,
          );
        }
      } finally {
        // Make sure we stop loading
        isLoading.value = false;
      }
    }

    oAuthLogin() async {
      var oAuthService = ref.watch(oAuthServiceProvider);
      ref.watch(assetProvider.notifier).clearAllAsset();
      String? oAuthServerUrl;

      try {
        oAuthServerUrl = await oAuthService
            .getOAuthServerUrl(sanitizeUrl(serverEndpointController.text));

        isLoading.value = true;
      } catch (error, stack) {
        log.severe('Error getting OAuth server Url: $error', stack);

        ImmichToast.show(
          context: context,
          msg: "login_form_failed_get_oauth_server_config".tr(),
          toastType: ToastType.error,
          gravity: ToastGravity.TOP,
        );
        isLoading.value = false;
        return;
      }

      if (oAuthServerUrl != null) {
        try {
          final loginResponseDto =
              await oAuthService.oAuthLogin(oAuthServerUrl);

          if (loginResponseDto == null) {
            return;
          }

          log.info(
            "Finished OAuth login with response: ${loginResponseDto.userEmail}",
          );

          final isSuccess = await ref
              .watch(authenticationProvider.notifier)
              .setSuccessLoginInfo(
                accessToken: loginResponseDto.accessToken,
                serverUrl: sanitizeUrl(serverEndpointController.text),
              );

          if (isSuccess) {
            isLoading.value = false;
            final permission = ref.watch(galleryPermissionNotifier);
            if (permission.isGranted || permission.isLimited) {
              ref.watch(backupProvider.notifier).resumeBackup();
            }
            context.replaceRoute(const TabControllerRoute());
          }
        } catch (error, stack) {
          log.severe('Error logging in with OAuth: $error', stack);

          ImmichToast.show(
            context: context,
            msg: error.toString(),
            toastType: ToastType.error,
            gravity: ToastGravity.TOP,
          );
        } finally {
          isLoading.value = false;
        }
      } else {
        ImmichToast.show(
          context: context,
          msg: "login_form_failed_get_oauth_server_disable".tr(),
          toastType: ToastType.info,
          gravity: ToastGravity.TOP,
        );
        isLoading.value = false;
        return;
      }
    }

    buildSelectServer() {
      const buttonRadius = 25.0;
      return Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          ServerEndpointInput(
            controller: serverEndpointController,
            focusNode: serverEndpointFocusNode,
            onSubmit: getServerLoginCredential,
          ),
          const SizedBox(height: 18),
          Row(
            children: [
              Expanded(
                child: ElevatedButton.icon(
                  style: ElevatedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    shape: const RoundedRectangleBorder(
                      borderRadius: BorderRadius.only(
                        topLeft: Radius.circular(buttonRadius),
                        bottomLeft: Radius.circular(buttonRadius),
                      ),
                    ),
                  ),
                  onPressed: () => context.pushRoute(const SettingsRoute()),
                  icon: const Icon(Icons.settings_rounded),
                  label: const SizedBox.shrink(),
                ),
              ),
              const SizedBox(width: 1),
              Expanded(
                flex: 3,
                child: ElevatedButton.icon(
                  style: ElevatedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    shape: const RoundedRectangleBorder(
                      borderRadius: BorderRadius.only(
                        topRight: Radius.circular(buttonRadius),
                        bottomRight: Radius.circular(buttonRadius),
                      ),
                    ),
                  ),
                  onPressed:
                      isLoadingServer.value ? null : getServerLoginCredential,
                  icon: const Icon(Icons.arrow_forward_rounded),
                  label: const Text(
                    'login_form_next_button',
                    style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold),
                  ).tr(),
                ),
              ),
            ],
          ),
          const SizedBox(height: 18),
          if (isLoadingServer.value) const LoadingIcon(),
        ],
      );
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
            color:
                context.isDarkTheme ? Colors.red.shade700 : Colors.red.shade100,
            borderRadius: BorderRadius.circular(8),
            border: Border.all(
              color:
                  context.isDarkTheme ? Colors.red.shade900 : Colors.red[200]!,
            ),
          ),
          child: Text(
            warningMessage.value!,
            textAlign: TextAlign.center,
          ),
        ),
      );
    }

    buildLogin() {
      return AutofillGroup(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            buildVersionCompatWarning(),
            Text(
              sanitizeUrl(serverEndpointController.text),
              style: context.textTheme.displaySmall,
              textAlign: TextAlign.center,
            ),
            if (isPasswordLoginEnable.value) ...[
              const SizedBox(height: 18),
              EmailInput(
                controller: usernameController,
                focusNode: emailFocusNode,
                onSubmit: passwordFocusNode.requestFocus,
              ),
              const SizedBox(height: 8),
              PasswordInput(
                controller: passwordController,
                focusNode: passwordFocusNode,
                onSubmit: login,
              ),
            ],

            // Note: This used to have an AnimatedSwitcher, but was removed
            // because of https://github.com/flutter/flutter/issues/120874
            isLoading.value
                ? const LoadingIcon()
                : Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const SizedBox(height: 18),
                      if (isPasswordLoginEnable.value)
                        LoginButton(onPressed: login),
                      if (isOauthEnable.value) ...[
                        if (isPasswordLoginEnable.value)
                          Padding(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 16.0,
                            ),
                            child: Divider(
                              color: context.isDarkTheme
                                  ? Colors.white
                                  : Colors.black,
                            ),
                          ),
                        OAuthLoginButton(
                          serverEndpointController: serverEndpointController,
                          buttonLabel: oAuthButtonLabel.value,
                          isLoading: isLoading,
                          onPressed: oAuthLogin,
                        ),
                      ],
                    ],
                  ),
            if (!isOauthEnable.value && !isPasswordLoginEnable.value)
              Center(
                child: const Text('login_disabled').tr(),
              ),
            const SizedBox(height: 12),
            TextButton.icon(
              icon: const Icon(Icons.arrow_back),
              onPressed: () => serverEndpoint.value = null,
              label: const Text('login_form_back_button_text').tr(),
            ),
          ],
        ),
      );
    }

    final serverSelectionOrLogin =
        serverEndpoint.value == null ? buildSelectServer() : buildLogin();

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
                  SizedBox(
                    height: constraints.maxHeight / 5,
                  ),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.center,
                    mainAxisAlignment: MainAxisAlignment.end,
                    children: [
                      GestureDetector(
                        onDoubleTap: () => populateTestLoginInfo(),
                        onLongPress: () => populateTestLoginInfo1(),
                        child: RotationTransition(
                          turns: logoAnimationController,
                          child: const ImmichLogo(
                            heroTag: 'logo',
                          ),
                        ),
                      ),
                      const Padding(
                        padding: EdgeInsets.only(top: 8.0, bottom: 16),
                        child: ImmichTitleText(),
                      ),
                    ],
                  ),

                  // Note: This used to have an AnimatedSwitcher, but was removed
                  // because of https://github.com/flutter/flutter/issues/120874
                  Form(
                    key: loginFormKey,
                    child: serverSelectionOrLogin,
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }
}
