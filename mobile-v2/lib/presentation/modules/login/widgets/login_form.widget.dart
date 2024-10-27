import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:immich_mobile/i18n/strings.g.dart';
import 'package:immich_mobile/presentation/components/common/gap.widget.dart';
import 'package:immich_mobile/presentation/components/common/loading_indicator.widget.dart';
import 'package:immich_mobile/presentation/components/input/filled_button.widget.dart';
import 'package:immich_mobile/presentation/components/input/password_form_field.widget.dart';
import 'package:immich_mobile/presentation/components/input/text_button.widget.dart';
import 'package:immich_mobile/presentation/components/input/text_form_field.widget.dart';
import 'package:immich_mobile/presentation/modules/login/models/login_page.model.dart';
import 'package:immich_mobile/presentation/modules/login/states/login_page.state.dart';
import 'package:immich_mobile/presentation/states/server_info.state.dart';
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
          layoutBuilder: (current, previous) =>
              current ?? (previous.lastOrNull ?? const SizedBox.shrink()),
          child: isServerValidated
              ? _CredentialsForm(
                  emailController: emailController,
                  passwordController: passwordController,
                )
              : _ServerForm(controller: serverUrlController),
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
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            ImTextFormField(
              controller: widget.controller,
              validator: context.read<LoginPageCubit>().validateServerUrl,
              label: context.t.login.label.endpoint,
              autoFillHints: const [AutofillHints.url],
              keyboardType: TextInputType.url,
              textInputAction: TextInputAction.go,
              isDisabled: isValidationInProgress,
            ),
            const SizedGap.mh(),
            ImFilledButton(
              icon: Symbols.arrow_forward_rounded,
              onPressed: () => unawaited(_validateForm(context)),
              isDisabled: isValidationInProgress,
              label: context.t.login.label.next_button,
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
  final _passwordFocusNode = FocusNode();

  @override
  void dispose() {
    _passwordFocusNode.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return BlocSelector<LoginPageCubit, LoginPageState, bool>(
      selector: (model) => model.isValidationInProgress,
      builder: (_, isValidationInProgress) => isValidationInProgress
          ? const ImLoadingIndicator()
          : ValueListenableBuilder(
              valueListenable: di<ServerInfoProvider>(),
              builder: (_, state, __) => Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  if (state.features.hasPasswordLogin) ...[
                    ImTextFormField(
                      controller: widget.emailController,
                      label: context.t.login.label.email,
                      textInputAction: TextInputAction.next,
                      isDisabled: isValidationInProgress,
                      onSubmitted: (_) => _passwordFocusNode.requestFocus(),
                    ),
                    const SizedGap.mh(),
                    ImPasswordFormField(
                      controller: widget.passwordController,
                      focusNode: _passwordFocusNode,
                      label: context.t.login.label.password,
                      textInputAction: TextInputAction.go,
                      isDisabled: isValidationInProgress,
                    ),
                    const SizedGap.mh(),
                    ImFilledButton(
                      icon: Symbols.login_rounded,
                      onPressed: () => unawaited(
                        context.read<LoginPageCubit>().passwordLogin(
                              email: widget.emailController.text,
                              password: widget.passwordController.text,
                            ),
                      ),
                      label: context.t.login.label.login_button,
                    ),
                    // Divider when both password and oAuth login is enabled
                    if (state.features.hasOAuthLogin) const Divider(),
                  ],
                  if (state.features.hasOAuthLogin)
                    ImFilledButton(
                      icon: Symbols.pin_rounded,
                      onPressed: () => unawaited(
                        context.read<LoginPageCubit>().oAuthLogin(),
                      ),
                      label: state.config.oauthButtonText ??
                          context.t.login.label.oauth_button,
                    ),
                  if (!state.features.hasPasswordLogin &&
                      !state.features.hasOAuthLogin)
                    ImFilledButton(
                      isDisabled: true,
                      label: context.t.login.label.login_disabled,
                    ),
                  const SizedGap.sh(),
                  ImTextButton(
                    icon: Symbols.arrow_back_rounded,
                    onPressed:
                        context.read<LoginPageCubit>().resetServerValidation,
                    label: context.t.login.label.back_button,
                  ),
                ],
              ),
            ),
    );
  }
}
