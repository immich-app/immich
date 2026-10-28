import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/data/store.dart';
import 'package:immich_mobile/domain/models/passkey.model.dart';
import 'package:immich_mobile/extensions/datetime_extensions.dart';
import 'package:immich_mobile/generated/translations.g.dart';
import 'package:immich_mobile/presentation/actions/action.widget.dart';
import 'package:immich_mobile/presentation/actions/passkey.action.dart';

@RoutePage()
class PasskeysPage extends ConsumerWidget {
  const PasskeysPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final passkeys = ref.watch(Store.passkeys.all()).valueOrNull;

    return Scaffold(
      appBar: AppBar(title: Text(context.t.passkeys(count: 2)), elevation: 0, centerTitle: false),
      body: ListView(
        children: [
          const Padding(
            padding: .all(16),
            child: ActionButton(action: PasskeyCreateAction(), variant: .filled),
          ),
          if (passkeys == null)
            const Center(child: CircularProgressIndicator())
          else
            for (final passkey in passkeys) _PasskeyTile(key: ValueKey(passkey.id), passkey: passkey),
        ],
      ),
    );
  }
}

class _PasskeyTile extends StatelessWidget {
  const _PasskeyTile({super.key, required this.passkey});

  final Passkey passkey;

  @override
  Widget build(BuildContext context) {
    final created = passkey.createdAt.toLocal().formatDate();
    final lastUsed = passkey.usedAt?.toLocal().formatDate() ?? context.t.never;

    return ListTile(
      title: Text(passkey.name ?? context.t.passkeys(count: 1)),
      subtitle: Text('${context.t.created} $created • ${context.t.last_used} $lastUsed'),
    );
  }
}
