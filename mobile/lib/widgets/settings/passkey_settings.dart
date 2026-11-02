import 'package:flutter/material.dart';
import 'package:immich_mobile/presentation/actions/action.widget.dart';
import 'package:immich_mobile/presentation/actions/passkey.action.dart';

class PasskeySettings extends StatelessWidget {
  const PasskeySettings({super.key});

  @override
  Widget build(BuildContext context) {
    return ListView(
      children: const [
        Padding(
          padding: .symmetric(horizontal: 20, vertical: 16),
          child: ActionButton(action: PasskeyCreateAction(), variant: .filled),
        ),
      ],
    );
  }
}
