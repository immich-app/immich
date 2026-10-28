import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:immich_mobile/generated/translations.g.dart';
import 'package:immich_mobile/presentation/actions/action.widget.dart';
import 'package:immich_mobile/presentation/actions/passkey.action.dart';

@RoutePage()
class PasskeysPage extends StatelessWidget {
  const PasskeysPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(context.t.passkeys(count: 2)), elevation: 0, centerTitle: false),
      body: ListView(
        children: const [
          Padding(
            padding: .all(16),
            child: ActionButton(action: PasskeyCreateAction(), variant: .filled),
          ),
        ],
      ),
    );
  }
}
