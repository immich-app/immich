import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/providers/auth.provider.dart';
import 'package:immich_mobile/widgets/forms/pin_verification_form.dart';
import 'package:pinput/pinput.dart';

@RoutePage()
class PinCodePage extends HookConsumerWidget {
  final bool createPinCode;

  const PinCodePage({super.key, this.createPinCode = false});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    onCompleted(String pinCode) async {
      // final isVerified =
      //     await ref.read(authProvider.notifier).verifyPinCode(pinCode);

      // print("isVerified: $isVerified");
    }

    return LayoutBuilder(
      builder: (context, constraints) {
        return Scaffold(
          appBar: AppBar(
            title: Text('locked_folder'.tr()),
          ),
          body: Padding(
            padding: const EdgeInsets.only(top: 64.0),
            child: Column(
              children: [
                Center(
                  child: PinVerificationForm(
                    onCompleted: onCompleted,
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}
