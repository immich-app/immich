import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/providers/auth.provider.dart';
import 'package:immich_mobile/widgets/forms/pin_input.dart';

class PinRegistrationForm extends HookConsumerWidget {
  final Function() onDone;

  const PinRegistrationForm({
    super.key,
    required this.onDone,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final hasError = useState(false);
    final newPinCodeController = useTextEditingController();
    final confirmPinCodeController = useTextEditingController();

    bool validatePinCode() {
      if (confirmPinCodeController.text.length != 6) {
        return false;
      }

      if (newPinCodeController.text != confirmPinCodeController.text) {
        return false;
      }

      return true;
    }

    createNewPinCode() async {
      final isValid = validatePinCode();
      if (!isValid) {
        hasError.value = true;
        return;
      }

      try {
        await ref.read(authProvider.notifier).setupPinCode(
              newPinCodeController.text,
            );

        onDone();
      } catch (error) {
        hasError.value = true;
        context.showSnackBar(
          SnackBar(content: Text(error.toString())),
        );
      }
    }

    return Form(
      child: Column(
        children: [
          Icon(
            Icons.pin_outlined,
            size: 64,
            color: context.primaryColor,
          ),
          const SizedBox(height: 32),
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
          const SizedBox(height: 32),
          PinInput(
            controller: newPinCodeController,
            label: 'new_pin_code'.tr(),
            length: 6,
            autoFocus: true,
            hasError: hasError.value,
            onChanged: (input) {
              if (input.length < 6) {
                hasError.value = false;
              }
            },
          ),
          const SizedBox(height: 32),
          PinInput(
            controller: confirmPinCodeController,
            label: 'confirm_new_pin_code'.tr(),
            length: 6,
            hasError: hasError.value,
            onChanged: (input) {
              if (input.length < 6) {
                hasError.value = false;
              }
            },
          ),
          const SizedBox(height: 48),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24.0),
            child: Row(
              children: [
                Expanded(
                  child: ElevatedButton(
                    onPressed: createNewPinCode,
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
