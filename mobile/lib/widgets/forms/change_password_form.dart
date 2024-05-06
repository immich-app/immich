import 'package:easy_localization/easy_localization.dart';
import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/providers/backup/backup.provider.dart';
import 'package:immich_mobile/providers/backup/manual_upload.provider.dart';
import 'package:immich_mobile/providers/authentication.provider.dart';
import 'package:immich_mobile/providers/asset.provider.dart';
import 'package:immich_mobile/providers/websocket.provider.dart';
import 'package:immich_mobile/widgets/common/immich_toast.dart';

class ChangePasswordForm extends HookConsumerWidget {
  const ChangePasswordForm({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final passwordController =
        useTextEditingController.fromValue(TextEditingValue.empty);
    final confirmPasswordController =
        useTextEditingController.fromValue(TextEditingValue.empty);
    final authState = ref.watch(authenticationProvider);
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
                'common_change_password'.tr(),
                style: TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                  color: context.primaryColor,
                ),
              ),
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 24.0),
                child: Text(
                  'change_password_form_description'.tr(
                    namedArgs: {
                      'name': authState.name,
                    },
                  ),
                  style: TextStyle(
                    fontSize: 14,
                    color: Colors.grey[700],
                    fontWeight: FontWeight.w600,
                  ),
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
                          var isSuccess = await ref
                              .read(authenticationProvider.notifier)
                              .changePassword(passwordController.value.text);

                          if (isSuccess) {
                            await ref
                                .read(authenticationProvider.notifier)
                                .logout();

                            ref
                                .read(manualUploadProvider.notifier)
                                .cancelBackup();
                            ref.read(backupProvider.notifier).cancelBackup();
                            await ref
                                .read(assetProvider.notifier)
                                .clearAllAsset();
                            ref.read(websocketProvider.notifier).disconnect();

                            AutoRouter.of(context).back();

                            ImmichToast.show(
                              context: context,
                              msg: "login_password_changed_success".tr(),
                              toastType: ToastType.success,
                              gravity: ToastGravity.TOP,
                            );
                          } else {
                            ImmichToast.show(
                              context: context,
                              msg: "login_password_changed_error".tr(),
                              toastType: ToastType.error,
                              gravity: ToastGravity.TOP,
                            );
                          }
                        }
                      },
                    ),
                    TextButton.icon(
                      icon: const Icon(Icons.arrow_back),
                      onPressed: () => AutoRouter.of(context).back(),
                      label: const Text('action_common_back').tr(),
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
        labelText: 'change_password_form_new_password'.tr(),
        border: const OutlineInputBorder(),
        hintText: 'change_password_form_new_password'.tr(),
      ),
    );
  }
}

class ConfirmPasswordInput extends StatelessWidget {
  final TextEditingController originalController;
  final TextEditingController confirmController;

  const ConfirmPasswordInput({
    super.key,
    required this.originalController,
    required this.confirmController,
  });

  String? _validateInput(String? email) {
    if (confirmController.value != originalController.value) {
      return 'change_password_form_password_mismatch'.tr();
    }
    return null;
  }

  @override
  Widget build(BuildContext context) {
    return TextFormField(
      obscureText: true,
      controller: confirmController,
      decoration: InputDecoration(
        labelText: 'change_password_form_confirm_password'.tr(),
        hintText: 'change_password_form_reenter_new_password'.tr(),
        border: const OutlineInputBorder(),
      ),
      validator: _validateInput,
      autovalidateMode: AutovalidateMode.always,
    );
  }
}

class ChangePasswordButton extends ConsumerWidget {
  final TextEditingController passwordController;
  final VoidCallback onPressed;
  const ChangePasswordButton({
    super.key,
    required this.passwordController,
    required this.onPressed,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return ElevatedButton(
      style: ElevatedButton.styleFrom(
        visualDensity: VisualDensity.standard,
        backgroundColor: context.primaryColor,
        foregroundColor: Colors.grey[50],
        elevation: 2,
        padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 25),
      ),
      onPressed: onPressed,
      child: Text(
        'common_change_password'.tr(),
        style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold),
      ),
    );
  }
}
