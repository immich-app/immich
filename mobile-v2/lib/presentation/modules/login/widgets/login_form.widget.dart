import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:immich_mobile/domain/models/server-info/server_feature_config.model.dart';
import 'package:immich_mobile/i18n/strings.g.dart';
import 'package:immich_mobile/presentation/components/common/gap.widget.dart';
import 'package:immich_mobile/presentation/components/common/loading_indicator.widget.dart';
import 'package:immich_mobile/presentation/components/input/filled_button.widget.dart';
import 'package:immich_mobile/presentation/components/input/password_form_field.widget.dart';
import 'package:immich_mobile/presentation/components/input/text_button.widget.dart';
import 'package:immich_mobile/presentation/components/input/text_form_field.widget.dart';
import 'package:immich_mobile/presentation/modules/common/states/server_info/server_feature_config.state.dart';
import 'package:immich_mobile/presentation/modules/login/models/login_page.model.dart';
import 'package:immich_mobile/presentation/modules/login/states/login_page.state.dart';
import 'package:immich_mobile/service_locator.dart';
import 'package:material_symbols_icons/symbols.dart';

class LoginForm extends StatelessWidget {
  final TextEditingController serverUrlController;
  final TextEditingController emailController;
  final TextEditingController passwordController;

  const LoginForm({
    super.key,
    required this.serverUrlController,
    required this.emailController,
    required this.passwordController,
  });

  @override
  Widget build(BuildContext context) {
    return BlocSelector<LoginPageCubit, LoginPageState, bool>(
      selector: (model) => model.isServerValidated,
      builder: (_, isServerValidated) => SingleChildScrollView(
        child: AnimatedSwitcher(
          duration: Durations.medium1,
          child: isServerValidated
              ? _CredentialsForm(
                  emailController: emailController,
                  passwordController: passwordController,
                )
              : _ServerForm(controller: serverUrlController),
          layoutBuilder: (current, previous) =>
              current ?? (previous.lastOrNull ?? const SizedBox.shrink()),
        ),
      ),
    );
  }
}

class _ServerForm extends StatefulWidget {
  final TextEditingController controller;

  const _ServerForm({required this.controller});

  @override
  State createState() => _ServerFormState();
}

class _ServerFormState extends State<_ServerForm> {
  final GlobalKey<FormState> _formKey = GlobalKey();

  Future<void> _validateForm(BuildContext context) async {
    if (_formKey.currentState?.validate() == true) {
      await context
          .read<LoginPageCubit>()
          .validateServer(widget.controller.text);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Form(
      key: _formKey,
      child: BlocSelector<LoginPageCubit, LoginPageState, bool>(
        selector: (model) => model.isValidationInProgress,
        builder: (_, isValidationInProgress) => Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          mainAxisSize: MainAxisSize.min,
          children: [
            ImTextFormField(
              controller: widget.controller,
              label: context.t.login.label.endpoint,
              validator: context.read<LoginPageCubit>().validateServerUrl,
              autoFillHints: const [AutofillHints.url],
              keyboardType: TextInputType.url,
              textInputAction: TextInputAction.go,
              isDisabled: isValidationInProgress,
            ),
            const SizedGap.mh(),
            ImFilledButton(
              label: context.t.login.label.next_button,
              icon: Symbols.arrow_forward_rounded,
              onPressed: () => unawaited(_validateForm(context)),
              isDisabled: isValidationInProgress,
            ),
            const SizedGap.mh(),
            if (isValidationInProgress) const ImLoadingIndicator(),
          ],
        ),
      ),
    );
  }
}

class _CredentialsForm extends StatefulWidget {
  final TextEditingController emailController;
  final TextEditingController passwordController;

  const _CredentialsForm({
    required this.emailController,
    required this.passwordController,
  });

  @override
  State<_CredentialsForm> createState() => _CredentialsFormState();
}

class _CredentialsFormState extends State<_CredentialsForm> {
  final passwordFocusNode = FocusNode();

  @override
  void dispose() {
    passwordFocusNode.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return BlocSelector<LoginPageCubit, LoginPageState, bool>(
      selector: (model) => model.isValidationInProgress,
      builder: (_, isValidationInProgress) => isValidationInProgress
          ? const ImLoadingIndicator()
          : BlocBuilder<ServerFeatureConfigCubit, ServerFeatureConfig>(
              bloc: di(),
              builder: (_, state) => Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                mainAxisSize: MainAxisSize.min,
                children: [
                  if (state.features.hasPasswordLogin) ...[
                    ImTextFormField(
                      controller: widget.emailController,
                      label: context.t.login.label.email,
                      isDisabled: isValidationInProgress,
                      textInputAction: TextInputAction.next,
                      onSubmitted: (_) => passwordFocusNode.requestFocus(),
                    ),
                    const SizedGap.mh(),
                    ImPasswordFormField(
                      controller: widget.passwordController,
                      label: context.t.login.label.password,
                      focusNode: passwordFocusNode,
                      isDisabled: isValidationInProgress,
                      textInputAction: TextInputAction.go,
                    ),
                    const SizedGap.mh(),
                    ImFilledButton(
                      label: context.t.login.label.login_button,
                      icon: Symbols.login_rounded,
                      onPressed: () => unawaited(
                        context.read<LoginPageCubit>().passwordLogin(
                              email: widget.emailController.text,
                              password: widget.passwordController.text,
                            ),
                      ),
                    ),
                    // Divider when both password and oAuth login is enabled
                    if (state.features.hasOAuthLogin) const Divider(),
                  ],
                  if (state.features.hasOAuthLogin)
                    ImFilledButton(
                      label: state.config.oauthButtonText ??
                          context.t.login.label.oauth_button,
                      icon: Symbols.pin_rounded,
                      onPressed: () => unawaited(
                        context.read<LoginPageCubit>().oAuthLogin(),
                      ),
                    ),
                  if (!state.features.hasPasswordLogin &&
                      !state.features.hasOAuthLogin)
                    ImFilledButton(
                      label: context.t.login.label.login_disabled,
                      isDisabled: true,
                    ),
                  const SizedGap.sh(),
                  ImTextButton(
                    label: context.t.login.label.back_button,
                    icon: Symbols.arrow_back_rounded,
                    onPressed:
                        context.read<LoginPageCubit>().resetServerValidation,
                  ),
                ],
              ),
            ),
    );
  }
}
