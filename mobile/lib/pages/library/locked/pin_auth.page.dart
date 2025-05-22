import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/providers/local_auth.provider.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/widgets/forms/pin_registration_form.dart';
import 'package:immich_mobile/widgets/forms/pin_verification_form.dart';

@RoutePage()
class PinAuthPage extends HookConsumerWidget {
  final bool createPinCode;

  const PinAuthPage({super.key, this.createPinCode = false});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final localAuthState = ref.watch(localAuthProvider);
    final showPinRegistrationForm = useState(createPinCode);

    Future<void> registerBiometric(String pinCode) async {
      final isRegistered =
          await ref.read(localAuthProvider.notifier).registerBiometric(
                context,
                pinCode,
              );

      if (isRegistered) {
        context.showSnackBar(
          SnackBar(
            content: Text(
              'biometric_auth_enabled'.tr(),
              style: context.textTheme.labelLarge,
            ),
            duration: const Duration(seconds: 3),
            backgroundColor: context.colorScheme.primaryContainer,
          ),
        );

        context.replaceRoute(const LockedRoute());
      }
    }

    enableBiometricAuth() {
      showDialog(
        context: context,
        builder: (buildContext) {
          return SimpleDialog(
            children: [
              Container(
                padding: const EdgeInsets.all(16),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    PinVerificationForm(
                      description: 'enable_biometric_auth_description'.tr(),
                      onSuccess: (pinCode) {
                        Navigator.pop(buildContext);
                        registerBiometric(pinCode);
                      },
                      autoFocus: true,
                      icon: Icons.fingerprint_rounded,
                      successIcon: Icons.fingerprint_rounded,
                    ),
                  ],
                ),
              ),
            ],
          );
        },
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: Text('locked_folder'.tr()),
      ),
      body: ListView(
        shrinkWrap: true,
        children: [
          Padding(
            padding: const EdgeInsets.only(top: 36.0),
            child: showPinRegistrationForm.value
                ? Center(
                    child: PinRegistrationForm(
                      onDone: () => showPinRegistrationForm.value = false,
                    ),
                  )
                : Column(
                    children: [
                      Center(
                        child: PinVerificationForm(
                          autoFocus: true,
                          onSuccess: (_) =>
                              context.replaceRoute(const LockedRoute()),
                        ),
                      ),
                      const SizedBox(height: 24),
                      if (localAuthState.canAuthenticate) ...[
                        Padding(
                          padding: const EdgeInsets.only(right: 16.0),
                          child: TextButton.icon(
                            icon: const Icon(
                              Icons.fingerprint,
                              size: 28,
                            ),
                            onPressed: enableBiometricAuth,
                            label: Text(
                              'use_biometric'.tr(),
                              style: context.textTheme.labelLarge?.copyWith(
                                color: context.primaryColor,
                                fontSize: 18,
                              ),
                            ),
                          ),
                        ),
                      ],
                    ],
                  ),
          ),
        ],
      ),
    );
  }
}
