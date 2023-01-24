import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hive/hive.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/hive_box.dart';
import 'package:immich_mobile/modules/login/models/hive_saved_login_info.model.dart';
import 'package:immich_mobile/modules/login/providers/oauth.provider.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/shared/providers/api.provider.dart';
import 'package:immich_mobile/shared/providers/asset.provider.dart';
import 'package:immich_mobile/modules/login/providers/authentication.provider.dart';
import 'package:immich_mobile/modules/backup/providers/backup.provider.dart';
import 'package:immich_mobile/shared/ui/immich_toast.dart';
import 'package:immich_mobile/utils/url_helper.dart';
import 'package:openapi/api.dart';

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
    final serverEndpointFocusNode = useFocusNode();
    final isSaveLoginInfo = useState<bool>(false);
    final isLoading = useState<bool>(false);
    final isOauthEnable = useState<bool>(false);
    final oAuthButtonLabel = useState<String>('OAuth');

    getServeLoginConfig() async {
      if (!serverEndpointFocusNode.hasFocus) {
        var serverUrl = serverEndpointController.text.trim();

        try {
          if (serverUrl.isNotEmpty) {
            isLoading.value = true;
            final serverEndpoint =
                await apiService.resolveAndSetEndpoint(serverUrl.toString());

            var loginConfig = await apiService.oAuthApi.generateConfig(
              OAuthConfigDto(redirectUri: serverEndpoint),
            );

            if (loginConfig != null) {
              isOauthEnable.value = loginConfig.enabled;
              oAuthButtonLabel.value = loginConfig.buttonText ?? 'OAuth';
            } else {
              isOauthEnable.value = false;
            }

            isLoading.value = false;
          }
        } catch (_) {
          isLoading.value = false;
          isOauthEnable.value = false;
        }
      }
    }

    useEffect(
      () {
        serverEndpointFocusNode.addListener(getServeLoginConfig);

        var loginInfo = Hive.box<HiveSavedLoginInfo>(hiveLoginInfoBox)
            .get(savedLoginInfoKey);

        if (loginInfo != null) {
          usernameController.text = loginInfo.email;
          passwordController.text = loginInfo.password;
          serverEndpointController.text = loginInfo.serverUrl;
          isSaveLoginInfo.value = loginInfo.isSaveLogin;
        }

        getServeLoginConfig();
        return null;
      },
      [],
    );

    populateTestLoginInfo() {
      usernameController.text = 'testuser@email.com';
      passwordController.text = 'password';
      serverEndpointController.text = 'http://10.1.15.216:2283/api';
      isSaveLoginInfo.value = true;
    }

    return Center(
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 300),
        child: SingleChildScrollView(
          child: AutofillGroup(
            child: Wrap(
              spacing: 16,
              runSpacing: 16,
              alignment: WrapAlignment.center,
              children: [
                GestureDetector(
                  onDoubleTap: () => populateTestLoginInfo(),
                  child: const Image(
                    image: AssetImage('assets/immich-logo-no-outline.png'),
                    width: 100,
                    filterQuality: FilterQuality.high,
                  ),
                ),
                Text(
                  'IMMICH',
                  style: TextStyle(
                    fontFamily: 'SnowburstOne',
                    fontWeight: FontWeight.bold,
                    fontSize: 48,
                    color: Theme.of(context).primaryColor,
                  ),
                ),
                EmailInput(controller: usernameController),
                PasswordInput(controller: passwordController),
                ServerEndpointInput(
                  controller: serverEndpointController,
                  focusNode: serverEndpointFocusNode,
                ),
                CheckboxListTile(
                  activeColor: Theme.of(context).primaryColor,
                  contentPadding: const EdgeInsets.symmetric(horizontal: 8),
                  dense: true,
                  side: const BorderSide(color: Colors.grey, width: 1.5),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(5),
                  ),
                  enableFeedback: true,
                  title: const Text(
                    "login_form_save_login",
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: Colors.grey,
                    ),
                  ).tr(),
                  value: isSaveLoginInfo.value,
                  onChanged: (switchValue) {
                    if (switchValue != null) {
                      isSaveLoginInfo.value = switchValue;
                    }
                  },
                ),
                if (isLoading.value)
                  const SizedBox(
                    width: 24,
                    height: 24,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                    ),
                  ),
                if (!isLoading.value)
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      LoginButton(
                        emailController: usernameController,
                        passwordController: passwordController,
                        serverEndpointController: serverEndpointController,
                        isSavedLoginInfo: isSaveLoginInfo.value,
                      ),
                      if (isOauthEnable.value) ...[
                        Padding(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 16.0,
                          ),
                          child: Divider(
                            color:
                                Brightness.dark == Theme.of(context).brightness
                                    ? Colors.white
                                    : Colors.black,
                          ),
                        ),
                        OAuthLoginButton(
                          serverEndpointController: serverEndpointController,
                          isSavedLoginInfo: isSaveLoginInfo.value,
                          buttonLabel: oAuthButtonLabel.value,
                          isLoading: isLoading,
                          onLoginSuccess: () {
                            isLoading.value = false;
                            ref.watch(backupProvider.notifier).resumeBackup();
                            AutoRouter.of(context).replace(
                              const TabControllerRoute(),
                            );
                          },
                        ),
                      ],
                    ],
                  )
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class ServerEndpointInput extends StatelessWidget {
  final TextEditingController controller;
  final FocusNode focusNode;
  const ServerEndpointInput({
    Key? key,
    required this.controller,
    required this.focusNode,
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
        errorMaxLines: 4
      ),
      validator: _validateInput,
      autovalidateMode: AutovalidateMode.always,
      focusNode: focusNode,
      autofillHints: const [AutofillHints.url],
      keyboardType: TextInputType.url,
      autocorrect: false,
    );
  }
}

class EmailInput extends StatelessWidget {
  final TextEditingController controller;

  const EmailInput({Key? key, required this.controller}) : super(key: key);

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
      controller: controller,
      decoration: InputDecoration(
        labelText: 'login_form_label_email'.tr(),
        border: const OutlineInputBorder(),
        hintText: 'login_form_email_hint'.tr(),
      ),
      validator: _validateInput,
      autovalidateMode: AutovalidateMode.always,
      autofillHints: const [AutofillHints.email],
      keyboardType: TextInputType.emailAddress,
    );
  }
}

class PasswordInput extends StatelessWidget {
  final TextEditingController controller;

  const PasswordInput({Key? key, required this.controller}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return TextFormField(
      obscureText: true,
      controller: controller,
      decoration: InputDecoration(
        labelText: 'login_form_label_password'.tr(),
        border: const OutlineInputBorder(),
        hintText: 'login_form_password_hint'.tr(),
      ),
      autofillHints: const [AutofillHints.password],
      keyboardType: TextInputType.text,
    );
  }
}

class LoginButton extends ConsumerWidget {
  final TextEditingController emailController;
  final TextEditingController passwordController;
  final TextEditingController serverEndpointController;
  final bool isSavedLoginInfo;

  const LoginButton({
    Key? key,
    required this.emailController,
    required this.passwordController,
    required this.serverEndpointController,
    required this.isSavedLoginInfo,
  }) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return ElevatedButton.icon(
      style: ElevatedButton.styleFrom(
        padding: const EdgeInsets.symmetric(vertical: 12),
      ),
      onPressed: () async {
        // This will remove current cache asset state of previous user login.
        ref.watch(assetProvider.notifier).clearAllAsset();

        var isAuthenticated =
            await ref.watch(authenticationProvider.notifier).login(
                  emailController.text,
                  passwordController.text,
                  serverEndpointController.text,
                  isSavedLoginInfo,
                );

        if (isAuthenticated) {
          // Resume backup (if enable) then navigate

          if (ref.watch(authenticationProvider).shouldChangePassword &&
              !ref.watch(authenticationProvider).isAdmin) {
            AutoRouter.of(context).push(const ChangePasswordRoute());
          } else {
            ref.watch(backupProvider.notifier).resumeBackup();
            AutoRouter.of(context).replace(const TabControllerRoute());
          }
        } else {
          ImmichToast.show(
            context: context,
            msg: "login_form_failed_login".tr(),
            toastType: ToastType.error,
          );
        }
      },
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
  final bool isSavedLoginInfo;
  final ValueNotifier<bool> isLoading;
  final VoidCallback onLoginSuccess;
  final String buttonLabel;

  const OAuthLoginButton({
    Key? key,
    required this.serverEndpointController,
    required this.isSavedLoginInfo,
    required this.isLoading,
    required this.onLoginSuccess,
    required this.buttonLabel,
  }) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    var oAuthService = ref.watch(oAuthServiceProvider);

    void performOAuthLogin() async {
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
                isSavedLoginInfo: isSavedLoginInfo,
                serverUrl: serverEndpointController.text,
              );

          if (isSuccess) {
            isLoading.value = false;
            onLoginSuccess();
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

    return ElevatedButton.icon(
      style: ElevatedButton.styleFrom(
        backgroundColor: Theme.of(context).primaryColor.withAlpha(230),
        padding: const EdgeInsets.symmetric(vertical: 12),
      ),
      onPressed: performOAuthLogin,
      icon: const Icon(Icons.pin_rounded),
      label: Text(
        buttonLabel,
        style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold),
      ),
    );
  }
}
