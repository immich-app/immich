import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/generated/translations.g.dart';
import 'package:immich_mobile/providers/auth.provider.dart';
import 'package:immich_mobile/providers/websocket.provider.dart';
import 'package:immich_mobile/widgets/common/immich_toast.dart';

class ChangePasswordForm extends HookConsumerWidget {
  const ChangePasswordForm({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final passwordController = useTextEditingController.fromValue(TextEditingValue.empty);
    final confirmPasswordController = useTextEditingController.fromValue(TextEditingValue.empty);
    final authState = ref.watch(authProvider);
    final formKey = GlobalKey<FormState>();

    return Center(
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 300),
        child: SingleChildScrollView(
          child: Wrap(
            spacing: 16,
            runSpacing: 16,
            alignment: WrapAlignment.start,
            children: [
              Text(
                context.t.change_password,
                style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: context.primaryColor),
              ),
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 24.0),
                child: Text(
                  context.t.change_password_form_description(name: authState.name),
                  style: TextStyle(fontSize: 14, color: context.colorScheme.onSurface, fontWeight: FontWeight.w600),
                ),
              ),
              Form(
                key: formKey,
                child: Column(
                  children: [
                    PasswordInput(controller: passwordController),
                    Padding(
                      padding: const EdgeInsets.symmetric(vertical: 16.0),
                      child: ConfirmPasswordInput(
                        originalController: passwordController,
                        confirmController: confirmPasswordController,
                      ),
                    ),
                    ChangePasswordButton(
                      passwordController: passwordController,
                      onPressed: () async {
                        if (formKey.currentState!.validate()) {
                          final isSuccess = await ref
                              .read(authProvider.notifier)
                              .changePassword(passwordController.value.text);

                          if (!isSuccess && context.mounted) {
                            ImmichToast.show(
                              context: context,
                              msg: context.t.login_password_changed_error,
                              toastType: ToastType.error,
                              gravity: ToastGravity.TOP,
                            );
                            return;
                          }

                          if (!context.mounted) {
                            return;
                          }

                          await ref.read(authProvider.notifier).logout();
                          if (!context.mounted) {
                            return;
                          }

                          ref.read(websocketProvider.notifier).disconnect();
                          AutoRouter.of(context).back();
                          ImmichToast.show(
                            context: context,
                            msg: context.t.login_password_changed_success,
                            toastType: ToastType.success,
                            gravity: ToastGravity.TOP,
                          );
                        }
                      },
                    ),
                    TextButton.icon(
                      icon: const Icon(Icons.arrow_back),
                      onPressed: () => AutoRouter.of(context).back(),
                      label: Text(context.t.back),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class PasswordInput extends StatelessWidget {
  final TextEditingController controller;

  const PasswordInput({super.key, required this.controller});

  @override
  Widget build(BuildContext context) {
    return TextFormField(
      obscureText: true,
      controller: controller,
      decoration: InputDecoration(
        labelText: context.t.change_password_form_new_password,
        border: const OutlineInputBorder(),
        hintText: context.t.change_password_form_new_password,
      ),
    );
  }
}

class ConfirmPasswordInput extends StatelessWidget {
  final TextEditingController originalController;
  final TextEditingController confirmController;

  const ConfirmPasswordInput({super.key, required this.originalController, required this.confirmController});

  String? _validateInput(String? email) {
    if (confirmController.value != originalController.value) {
      return StaticTranslations.instance.change_password_form_password_mismatch;
    }
    return null;
  }

  @override
  Widget build(BuildContext context) {
    return TextFormField(
      obscureText: true,
      controller: confirmController,
      decoration: InputDecoration(
        labelText: context.t.change_password_form_confirm_password,
        hintText: context.t.change_password_form_reenter_new_password,
        border: const OutlineInputBorder(),
      ),
      validator: _validateInput,
      autovalidateMode: AutovalidateMode.always,
    );
  }
}

class ChangePasswordButton extends StatelessWidget {
  final TextEditingController passwordController;
  final VoidCallback onPressed;
  const ChangePasswordButton({super.key, required this.passwordController, required this.onPressed});

  @override
  Widget build(BuildContext context) {
    return ElevatedButton(
      style: ElevatedButton.styleFrom(
        visualDensity: VisualDensity.standard,
        padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 25),
      ),
      onPressed: onPressed,
      child: Text(context.t.change_password, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
    );
  }
}
