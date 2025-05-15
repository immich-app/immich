import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:pinput/pinput.dart';

class PinVerificationForm extends HookConsumerWidget {
  final Function(String) onCompleted;

  const PinVerificationForm({super.key, required this.onCompleted});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final defaultPinTheme = PinTheme(
      width: 60,
      height: 64,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(19),
        border: Border.all(color: context.colorScheme.surfaceBright),
        color: context.colorScheme.surfaceContainerHigh,
      ),
    );

    pinCodeValidator(String? pinCode) {}

    return Form(
      child: Column(
        children: [
          Icon(
            Icons.lock,
            size: 64,
            color: context.colorScheme.onSurface.withAlpha(100),
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
            validator: pinCodeValidator,
            pinputAutovalidateMode: PinputAutovalidateMode.onSubmit,
            length: 6,
            onCompleted: (pin) => onCompleted.call(pin),
          ),
        ],
      ),
    );
  }
}
