import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart' hide Store;
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/login/providers/oauth.provider.dart';
import 'package:immich_mobile/modules/onboarding/providers/gallery_permission.provider.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/shared/models/store.dart';
import 'package:immich_mobile/shared/providers/api.provider.dart';
import 'package:immich_mobile/shared/providers/asset.provider.dart';
import 'package:immich_mobile/modules/login/providers/authentication.provider.dart';
import 'package:immich_mobile/modules/backup/providers/backup.provider.dart';
import 'package:immich_mobile/shared/ui/immich_logo.dart';
import 'package:immich_mobile/shared/ui/immich_title_text.dart';
import 'package:immich_mobile/shared/ui/immich_toast.dart';
import 'package:immich_mobile/utils/url_helper.dart';
import 'package:openapi/api.dart';
import 'package:permission_handler/permission_handler.dart';

class LoginForm extends HookConsumerWidget {
  const LoginForm({Key? key}) : super(key: key);

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

    final ValueNotifier<String?> serverEndpoint = useState<String?>(null);

    /// Fetch the server login credential and enables oAuth login if necessary
    /// Returns true if successful, false otherwise
    Future<bool> getServerLoginCredential() async {
      final serverUrl = serverEndpointController.text.trim();

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

        final loginConfig = await apiService.oAuthApi.generateConfig(
          OAuthConfigDto(redirectUri: serverUrl),
        );

        if (loginConfig != null) {
          isOauthEnable.value = loginConfig.enabled;
          isPasswordLoginEnable.value = loginConfig.passwordLoginEnabled;
          oAuthButtonLabel.value = loginConfig.buttonText ?? 'OAuth';
        } else {
          isOauthEnable.value = false;
          isPasswordLoginEnable.value = true;
        }

        serverEndpoint.value = endpoint;
      } on ApiException catch (e) {
        ImmichToast.show(
          context: context,
          msg: e.message ?? 'login_form_api_exception'.tr(),
          toastType: ToastType.error,
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
      usernameController.text = 'testuser@email.com';
      passwordController.text = 'password';
      serverEndpointController.text = 'http://10.1.15.216:2283/api';
    }

    login() async {
      // Start loading
      isLoading.value = true;

      // This will remove current cache asset state of previous user login.
      ref.read(assetProvider.notifier).clearAllAsset();

      try {
        final isAuthenticated =
            await ref.read(authenticationProvider.notifier).login(
                  usernameController.text,
                  passwordController.text,
                  serverEndpointController.text.trim(),
                );
        if (isAuthenticated) {
          // Resume backup (if enable) then navigate
          if (ref.read(authenticationProvider).shouldChangePassword &&
              !ref.read(authenticationProvider).isAdmin) {
            AutoRouter.of(context).push(const ChangePasswordRoute());
          } else {
            final hasPermission = await ref
                .read(galleryPermissionNotifier.notifier)
                .hasPermission;
            if (hasPermission) {
              // Don't resume the backup until we have gallery permission
              ref.read(backupProvider.notifier).resumeBackup();
            }
            AutoRouter.of(context).replace(const TabControllerRoute());
          }
        } else {
          ImmichToast.show(
            context: context,
            msg: "login_form_failed_login".tr(),
            toastType: ToastType.error,
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
      OAuthConfigResponseDto? oAuthServerConfig;

      try {
        oAuthServerConfig = await oAuthService
            .getOAuthServerConfig(serverEndpointController.text);

        isLoading.value = true;
      } catch (e) {
        ImmichToast.show(
          context: context,
          msg: "login_form_failed_get_oauth_server_config".tr(),
          toastType: ToastType.error,
        );
        isLoading.value = false;
        return;
      }

      if (oAuthServerConfig != null && oAuthServerConfig.enabled) {
        var loginResponseDto =
            await oAuthService.oAuthLogin(oAuthServerConfig.url!);

        if (loginResponseDto != null) {
          var isSuccess = await ref
              .watch(authenticationProvider.notifier)
              .setSuccessLoginInfo(
                accessToken: loginResponseDto.accessToken,
                serverUrl: serverEndpointController.text,
              );

          if (isSuccess) {
            isLoading.value = false;
            final permission = ref.watch(galleryPermissionNotifier);
            if (permission.isGranted || permission.isLimited) {
              ref.watch(backupProvider.notifier).resumeBackup();
            }
            AutoRouter.of(context).replace(
              const TabControllerRoute(),
            );
          } else {
            ImmichToast.show(
              context: context,
              msg: "login_form_failed_login".tr(),
              toastType: ToastType.error,
            );
          }
        }

        isLoading.value = false;
      } else {
        ImmichToast.show(
          context: context,
          msg: "login_form_failed_get_oauth_server_disable".tr(),
          toastType: ToastType.info,
        );
        isLoading.value = false;
        return;
      }
    }

    buildSelectServer() {
      return Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          ServerEndpointInput(
            controller: serverEndpointController,
            focusNode: serverEndpointFocusNode,
            onSubmit: getServerLoginCredential,
          ),
          const SizedBox(height: 18),
          ElevatedButton.icon(
            style: ElevatedButton.styleFrom(
              padding: const EdgeInsets.symmetric(vertical: 12),
            ),
            onPressed: isLoadingServer.value ? null : getServerLoginCredential,
            icon: const Icon(Icons.arrow_forward_rounded),
            label: const Text(
              'login_form_next_button',
              style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold),
            ).tr(),
          ),
          if (isLoadingServer.value)
            const Padding(
              padding: EdgeInsets.only(top: 18.0),
              child: Center(
                child: CircularProgressIndicator(),
              ),
            ),
        ],
      );
    }

    buildLogin() {
      return AutofillGroup(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              serverEndpointController.text,
              style: Theme.of(context).textTheme.displaySmall,
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
                ? const Padding(
                    padding: EdgeInsets.only(top: 18.0),
                    child: SizedBox(
                      width: 24,
                      height: 24,
                      child: FittedBox(
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                        ),
                      ),
                    ),
                  )
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
                              color: Brightness.dark ==
                                      Theme.of(context).brightness
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
              label: const Text('Back'),
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
                        child: RotationTransition(
                          turns: logoAnimationController,
                          child: const ImmichLogo(
                            heroTag: 'logo',
                          ),
                        ),
                      ),
                      const ImmichTitleText(),
                    ],
                  ),
                  const SizedBox(height: 18),

                  // Note: This used to have an AnimatedSwitcher, but was removed
                  // because of https://github.com/flutter/flutter/issues/120874
                  serverSelectionOrLogin,
                ],
              ),
            ),
          ),
        );
      },
    );
  }
}

class ServerEndpointInput extends StatelessWidget {
  final TextEditingController controller;
  final FocusNode focusNode;
  final Function()? onSubmit;

  const ServerEndpointInput({
    Key? key,
    required this.controller,
    required this.focusNode,
    this.onSubmit,
  }) : super(key: key);

  String? _validateInput(String? url) {
    if (url == null || url.isEmpty) return null;

    final parsedUrl = Uri.tryParse(sanitizeUrl(url));
    if (parsedUrl == null ||
        !parsedUrl.isAbsolute ||
        !parsedUrl.scheme.startsWith("http") ||
        parsedUrl.host.isEmpty) {
      return 'login_form_err_invalid_url'.tr();
    }

    return null;
  }

  @override
  Widget build(BuildContext context) {
    return TextFormField(
      controller: controller,
      decoration: InputDecoration(
        labelText: 'login_form_endpoint_url'.tr(),
        border: const OutlineInputBorder(),
        hintText: 'login_form_endpoint_hint'.tr(),
        errorMaxLines: 4,
      ),
      validator: _validateInput,
      autovalidateMode: AutovalidateMode.always,
      focusNode: focusNode,
      autofillHints: const [AutofillHints.url],
      keyboardType: TextInputType.url,
      autocorrect: false,
      onFieldSubmitted: (_) => onSubmit?.call(),
      textInputAction: TextInputAction.go,
    );
  }
}

class EmailInput extends StatelessWidget {
  final TextEditingController controller;
  final FocusNode? focusNode;
  final Function()? onSubmit;

  const EmailInput({
    Key? key,
    required this.controller,
    this.focusNode,
    this.onSubmit,
  }) : super(key: key);

  String? _validateInput(String? email) {
    if (email == null || email == '') return null;
    if (email.endsWith(' ')) return 'login_form_err_trailing_whitespace'.tr();
    if (email.startsWith(' ')) return 'login_form_err_leading_whitespace'.tr();
    if (email.contains(' ') || !email.contains('@')) {
      return 'login_form_err_invalid_email'.tr();
    }
    return null;
  }

  @override
  Widget build(BuildContext context) {
    return TextFormField(
      autofocus: true,
      controller: controller,
      decoration: InputDecoration(
        labelText: 'login_form_label_email'.tr(),
        border: const OutlineInputBorder(),
        hintText: 'login_form_email_hint'.tr(),
        hintStyle: const TextStyle(
          fontWeight: FontWeight.normal,
          fontSize: 14,
        ),
      ),
      validator: _validateInput,
      autovalidateMode: AutovalidateMode.always,
      autofillHints: const [AutofillHints.email],
      keyboardType: TextInputType.emailAddress,
      onFieldSubmitted: (_) => onSubmit?.call(),
      focusNode: focusNode,
      textInputAction: TextInputAction.next,
    );
  }
}

class PasswordInput extends StatelessWidget {
  final TextEditingController controller;
  final FocusNode? focusNode;
  final Function()? onSubmit;

  const PasswordInput({
    Key? key,
    required this.controller,
    this.focusNode,
    this.onSubmit,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return TextFormField(
      obscureText: true,
      controller: controller,
      decoration: InputDecoration(
        labelText: 'login_form_label_password'.tr(),
        border: const OutlineInputBorder(),
        hintText: 'login_form_password_hint'.tr(),
        hintStyle: const TextStyle(
          fontWeight: FontWeight.normal,
          fontSize: 14,
        ),
      ),
      autofillHints: const [AutofillHints.password],
      keyboardType: TextInputType.text,
      onFieldSubmitted: (_) => onSubmit?.call(),
      focusNode: focusNode,
      textInputAction: TextInputAction.go,
    );
  }
}

class LoginButton extends ConsumerWidget {
  final Function() onPressed;

  const LoginButton({
    Key? key,
    required this.onPressed,
  }) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return ElevatedButton.icon(
      style: ElevatedButton.styleFrom(
        padding: const EdgeInsets.symmetric(vertical: 12),
      ),
      onPressed: onPressed,
      icon: const Icon(Icons.login_rounded),
      label: const Text(
        "login_form_button_text",
        style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold),
      ).tr(),
    );
  }
}

class OAuthLoginButton extends ConsumerWidget {
  final TextEditingController serverEndpointController;
  final ValueNotifier<bool> isLoading;
  final String buttonLabel;
  final Function() onPressed;

  const OAuthLoginButton({
    Key? key,
    required this.serverEndpointController,
    required this.isLoading,
    required this.buttonLabel,
    required this.onPressed,
  }) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return ElevatedButton.icon(
      style: ElevatedButton.styleFrom(
        backgroundColor: Theme.of(context).primaryColor.withAlpha(230),
        padding: const EdgeInsets.symmetric(vertical: 12),
      ),
      onPressed: onPressed,
      icon: const Icon(Icons.pin_rounded),
      label: Text(
        buttonLabel,
        style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold),
      ),
    );
  }
}
