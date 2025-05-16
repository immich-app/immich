import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/providers/auth.provider.dart';
import 'package:immich_mobile/widgets/forms/pin_input.dart';
import 'package:pinput/pinput.dart';

class PinRegistrationForm extends HookConsumerWidget {
  final Function() onDone;

  const PinRegistrationForm({
    super.key,
    required this.onDone,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final hasError = useState(false);

    createNewPinCode(String pinCode) async {}

    return Form(
      child: Column(
        children: [
          Icon(
            Icons.pin_outlined,
            size: 64,
            color: context.primaryColor,
          ),
          const SizedBox(height: 36),
          SizedBox(
            width: context.width * 0.7,
            child: Text(
              'setup_pin_code'.tr(),
              style: context.textTheme.labelLarge!.copyWith(
                fontSize: 24,
              ),
              textAlign: TextAlign.center,
            ),
          ),
          SizedBox(
            width: context.width * 0.8,
            child: Text(
              'new_pin_code_subtitle'.tr(),
              style: context.textTheme.bodyLarge!.copyWith(
                fontSize: 16,
              ),
              textAlign: TextAlign.center,
            ),
          ),
          const SizedBox(height: 16),
          PinInput(
            label: 'new_pin_code'.tr(),
            length: 6,
            autoFocus: true,
          ),
          const SizedBox(height: 32),
          PinInput(
            label: 'confirm_new_pin_code'.tr(),
            length: 6,
          ),
          const SizedBox(height: 48),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24.0),
            child: Row(
              children: [
                Expanded(
                  child: ElevatedButton(
                    onPressed: () {},
                    child: Text('create'.tr()),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
