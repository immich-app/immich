import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/providers/auth.provider.dart';
import 'package:pinput/pinput.dart';

class PinVerificationForm extends HookConsumerWidget {
  final Function() onSuccess;

  const PinVerificationForm({
    super.key,
    required this.onSuccess,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final hasError = useState(false);

    final defaultPinTheme = PinTheme(
      width: 60,
      height: 64,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(19),
        border: Border.all(color: context.colorScheme.surfaceBright),
        color: context.colorScheme.surfaceContainerHigh,
      ),
    );

    verifyPin(String pinCode) async {
      final isVerified =
          await ref.read(authProvider.notifier).verifyPinCode(pinCode);

      if (isVerified) {
        onSuccess();
      } else {
        hasError.value = true;
      }
    }

    return Form(
      child: Column(
        children: [
          Icon(
            Icons.lock,
            size: 64,
            color: hasError.value
                ? Colors.red[400]
                : context.colorScheme.onSurface.withAlpha(100),
          ),
          const SizedBox(height: 54),
          SizedBox(
            width: context.width * 0.7,
            child: Text(
              'pin_verification_subtitle'.tr(),
              style: context.textTheme.labelLarge!.copyWith(
                fontSize: 18,
              ),
              textAlign: TextAlign.center,
            ),
          ),
          const SizedBox(height: 16),
          Pinput(
            forceErrorState: hasError.value,
            errorText: hasError.value ? 'wrong_pin_code'.tr() : null,
            autofocus: true,
            obscureText: true,
            obscuringWidget: Icon(
              Icons.vpn_key_rounded,
              color: context.primaryColor,
              size: 20,
            ),
            separatorBuilder: (index) => const SizedBox(
              height: 64,
              width: 3,
            ),
            cursor: Column(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                Container(
                  margin: const EdgeInsets.only(bottom: 9),
                  width: 18,
                  height: 2,
                  color: context.primaryColor,
                ),
              ],
            ),
            defaultPinTheme: defaultPinTheme,
            focusedPinTheme: defaultPinTheme.copyWith(
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(19),
                border: Border.all(
                  color: context.primaryColor.withValues(alpha: 0.25),
                ),
                color: context.colorScheme.surfaceContainerHigh,
              ),
            ),
            pinputAutovalidateMode: PinputAutovalidateMode.onSubmit,
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
