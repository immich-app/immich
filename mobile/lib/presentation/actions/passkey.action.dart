import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/data/store.dart';
import 'package:immich_mobile/domain/models/passkey.model.dart';
import 'package:immich_mobile/generated/translations.g.dart';
import 'package:immich_mobile/presentation/actions/action.dart';
import 'package:immich_mobile/providers/infrastructure/toast.provider.dart';
import 'package:immich_mobile/utils/error_handler.dart';
import 'package:immich_ui/immich_ui.dart';

class PasskeyCreateAction extends ActionBuilder {
  const PasskeyCreateAction();

  @override
  ActionItem create(BuildContext context, WidgetRef ref) =>
      ActionItem(icon: Icons.add_rounded, label: context.t.new_passkey, onAction: () => _create(context, ref));

  Future<void> _create(BuildContext context, WidgetRef ref) async {
    final message = context.t.passkey_added;
    final passkeys = ref.read(Store.passkeys);
    final toastService = ref.read(toastServiceProvider);

    try {
      if (await passkeys.create() case final passkey?) {
        toastService.success(message);
        if (context.mounted) {
          ref.invalidate(Store.passkeys.all());
          await _rename(context, ref, passkey);
        }
      }
    } catch (error, stack) {
      handleError(error, stack: stack, description: "Failed to create a passkey");
    }
  }
}

class PasskeyRenameAction extends ActionBuilder {
  const PasskeyRenameAction({required this.passkey});

  final Passkey passkey;

  @override
  ActionItem create(BuildContext context, WidgetRef ref) => ActionItem(
    icon: Icons.edit_outlined,
    label: context.t.edit_passkey,
    onAction: () => _rename(context, ref, passkey),
  );
}

Future<void> _rename(BuildContext context, WidgetRef ref, Passkey passkey) async {
  final passkeys = ref.read(Store.passkeys);
  final name = await showDialog<String>(
    context: context,
    builder: (_) => _PasskeyNameDialog(name: passkey.name),
  );
  if (name == null) {
    return;
  }

  try {
    await passkeys.rename(passkey.id, name.isEmpty ? null : name);
    if (context.mounted) {
      ref.invalidate(Store.passkeys.all());
    }
  } catch (error, stack) {
    handleError(error, stack: stack, description: "Failed to rename a passkey");
  }
}

class _PasskeyNameDialog extends StatefulWidget {
  const _PasskeyNameDialog({required this.name});

  final String? name;

  @override
  State<_PasskeyNameDialog> createState() => _PasskeyNameDialogState();
}

class _PasskeyNameDialogState extends State<_PasskeyNameDialog> {
  late final _controller = TextEditingController(text: widget.name);

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _save() => Navigator.pop(context, _controller.text.trim());

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      scrollable: true,
      title: Text(context.t.passkeys(count: 1)),
      content: ImmichTextInput(
        controller: _controller,
        label: context.t.name,
        autofocus: true,
        keyboardAction: .done,
        onSubmit: (_) => _save(),
      ),
      actions: [
        TextButton(onPressed: () => Navigator.pop(context), child: Text(context.t.cancel)),
        TextButton(onPressed: _save, child: Text(context.t.save)),
      ],
    );
  }
}
