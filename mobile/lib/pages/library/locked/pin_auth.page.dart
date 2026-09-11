import 'dart:async';

import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart' show useState;
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/generated/translations.g.dart';
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
      final isRegistered = await ref.read(localAuthProvider.notifier).registerBiometric(context, pinCode);

      if (!isRegistered || !context.mounted) {
        return;
      }

      context.showSnackBar(
        SnackBar(
          content: Text(context.t.biometric_auth_enabled, style: context.textTheme.labelLarge),
          duration: const Duration(seconds: 3),
          backgroundColor: context.colorScheme.primaryContainer,
        ),
      );

      unawaited(context.replaceRoute(const LockedFolderRoute()));
    }

    Future<void> enableBiometricAuth() {
      return showDialog(
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
                      description: context.t.enable_biometric_auth_description,
                      onSuccess: (pinCode) {
                        Navigator.pop(buildContext);
                        unawaited(registerBiometric(pinCode));
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
      appBar: AppBar(title: Text(context.t.locked_folder)),
      body: ListView(
        shrinkWrap: true,
        children: [
          Padding(
            padding: const EdgeInsets.only(top: 36.0),
            child: showPinRegistrationForm.value
                ? Center(child: PinRegistrationForm(onDone: () => showPinRegistrationForm.value = false))
                : Column(
                    children: [
                      Center(
                        child: PinVerificationForm(
                          autoFocus: true,
                          onSuccess: (_) {
                            unawaited(context.replaceRoute(const LockedFolderRoute()));
                          },
                        ),
                      ),
                      const SizedBox(height: 24),
                      if (localAuthState.canAuthenticate) ...[
                        Padding(
                          padding: const EdgeInsets.only(right: 16.0),
                          child: TextButton.icon(
                            icon: const Icon(Icons.fingerprint, size: 28),
                            onPressed: () => unawaited(enableBiometricAuth()),
                            label: Text(
                              context.t.use_biometric,
                              style: context.textTheme.labelLarge?.copyWith(color: context.primaryColor, fontSize: 18),
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
