import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/widgets/forms/pin_registration_form.dart';
import 'package:immich_mobile/widgets/forms/pin_verification_form.dart';

@RoutePage()
class PinCodePage extends HookConsumerWidget {
  final bool createPinCode;

  const PinCodePage({super.key, this.createPinCode = false});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
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
                  child: createPinCode
                      ? PinRegistrationForm(
                          onDone: () =>
                              context.replaceRoute(const LockedRoute()),
                        )
                      : PinVerificationForm(
                          onSuccess: () =>
                              context.replaceRoute(const LockedRoute()),
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
