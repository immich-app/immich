import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/data/store.dart';
import 'package:immich_mobile/domain/models/passkey.model.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/extensions/datetime_extensions.dart';
import 'package:immich_mobile/generated/translations.g.dart';
import 'package:immich_mobile/presentation/actions/action.widget.dart';
import 'package:immich_mobile/presentation/actions/passkey.action.dart';

class PasskeySettings extends ConsumerWidget {
  const PasskeySettings({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final passkeys = ref.watch(Store.passkeys.all()).valueOrNull;

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
        if (passkeys == null)
          const Center(child: CircularProgressIndicator())
        else
          for (final passkey in passkeys) _PasskeyTile(key: ValueKey(passkey.id), passkey: passkey),
      ],
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
