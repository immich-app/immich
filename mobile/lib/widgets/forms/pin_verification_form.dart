import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/providers/auth.provider.dart';
import 'package:immich_mobile/widgets/forms/pin_input.dart';

class PinVerificationForm extends HookConsumerWidget {
  final Function(String) onSuccess;
  final VoidCallback? onError;
  final bool? autoFocus;
  final String? description;
  final IconData? icon;
  final IconData? successIcon;

  const PinVerificationForm({
    super.key,
    required this.onSuccess,
    this.onError,
    this.autoFocus,
    this.description,
    this.icon,
    this.successIcon,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final hasError = useState(false);
    final isVerified = useState(false);

    verifyPin(String pinCode) async {
      final isUnlocked =
          await ref.read(authProvider.notifier).unlockPinCode(pinCode);

      if (isUnlocked) {
        isVerified.value = true;

        await Future.delayed(const Duration(seconds: 1));
        onSuccess(pinCode);
      } else {
        hasError.value = true;
        onError?.call();
      }
    }

    return Form(
      child: Column(
        children: [
          AnimatedSwitcher(
            duration: const Duration(milliseconds: 200),
            child: isVerified.value
                ? Icon(
                    successIcon ?? Icons.lock_open_rounded,
                    size: 64,
                    color: Colors.green[300],
                  )
                : Icon(
                    icon ?? Icons.lock_outline_rounded,
                    size: 64,
                    color: hasError.value
                        ? context.colorScheme.error
                        : context.primaryColor,
                  ),
          ),
          const SizedBox(height: 36),
          SizedBox(
            width: context.width * 0.7,
            child: Text(
              description ?? 'enter_your_pin_code_subtitle'.tr(),
              style: context.textTheme.labelLarge!.copyWith(
                fontSize: 18,
              ),
              textAlign: TextAlign.center,
            ),
          ),
          const SizedBox(height: 18),
          PinInput(
            obscureText: true,
            autoFocus: autoFocus,
            hasError: hasError.value,
            length: 6,
            onChanged: (pinCode) {
              if (pinCode.length < 6) {
                hasError.value = false;
              }
            },
            onCompleted: verifyPin,
          ),
        ],
      ),
    );
  }
}
