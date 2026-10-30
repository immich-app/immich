import 'package:flutter/material.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/generated/translations.g.dart';
import 'package:immich_mobile/presentation/actions/action.widget.dart';
import 'package:immich_mobile/presentation/actions/passkey.action.dart';

class PasskeySettings extends StatelessWidget {
  const PasskeySettings({super.key});

  @override
  Widget build(BuildContext context) {
    return ListView(
      children: [
        Padding(
          padding: const .fromLTRB(16, 16, 16, 0),
          child: Text(context.t.passkeys_description, style: context.textTheme.bodyMedium),
        ),
        const Padding(
          padding: .all(16),
          child: ActionButton(action: PasskeyCreateAction(), variant: .filled),
        ),
      ],
    );
  }
}
