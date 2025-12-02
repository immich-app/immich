import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/utils/url_helper.dart';
import 'package:immich_mobile/widgets/forms/login/email_input.dart';
import 'package:immich_mobile/widgets/forms/login/loading_icon.dart';
import 'package:immich_mobile/widgets/forms/login/login_button.dart';
import 'package:immich_mobile/widgets/forms/login/o_auth_login_button.dart';
import 'package:immich_mobile/widgets/forms/login/password_input.dart';
import 'package:immich_mobile/widgets/forms/login/version_compatibility_warning.dart';

class LoginCredentialsForm extends StatelessWidget {
  final TextEditingController emailController;
  final TextEditingController passwordController;
  final TextEditingController serverEndpointController;
  final FocusNode emailFocusNode;
  final FocusNode passwordFocusNode;
  final bool isLoading;
  final bool isOAuthEnabled;
  final bool isPasswordLoginEnabled;
  final String oAuthButtonLabel;
  final String? warningMessage;
  final VoidCallback onLogin;
  final VoidCallback onOAuthLogin;
  final VoidCallback onBack;

  const LoginCredentialsForm({
    super.key,
    required this.emailController,
    required this.passwordController,
    required this.serverEndpointController,
    required this.emailFocusNode,
    required this.passwordFocusNode,
    required this.isLoading,
    required this.isOAuthEnabled,
    required this.isPasswordLoginEnabled,
    required this.oAuthButtonLabel,
    required this.warningMessage,
    required this.onLogin,
    required this.onOAuthLogin,
    required this.onBack,
  });

  @override
  Widget build(BuildContext context) {
    return AutofillGroup(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          if (warningMessage != null) VersionCompatibilityWarning(message: warningMessage!),
          Text(
            sanitizeUrl(serverEndpointController.text),
            style: context.textTheme.displaySmall,
            textAlign: TextAlign.center,
          ),
          if (isPasswordLoginEnabled) ...[
            const SizedBox(height: 18),
            EmailInput(
              controller: emailController,
              focusNode: emailFocusNode,
              onSubmit: passwordFocusNode.requestFocus,
            ),
            const SizedBox(height: 8),
            PasswordInput(controller: passwordController, focusNode: passwordFocusNode, onSubmit: onLogin),
          ],
          isLoading
              ? const LoadingIcon()
              : Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const SizedBox(height: 18),
                    if (isPasswordLoginEnabled) LoginButton(onPressed: onLogin),
                    if (isOAuthEnabled) ...[
                      if (isPasswordLoginEnabled)
                        Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 16.0),
                          child: Divider(color: context.isDarkTheme ? Colors.white : Colors.black),
                        ),
                      OAuthLoginButton(
                        serverEndpointController: serverEndpointController,
                        buttonLabel: oAuthButtonLabel,
                        onPressed: onOAuthLogin,
                      ),
                    ],
                  ],
                ),
          if (!isOAuthEnabled && !isPasswordLoginEnabled) Center(child: const Text('login_disabled').tr()),
          const SizedBox(height: 12),
          TextButton.icon(icon: const Icon(Icons.arrow_back), onPressed: onBack, label: const Text('back').tr()),
        ],
      ),
    );
  }
}
