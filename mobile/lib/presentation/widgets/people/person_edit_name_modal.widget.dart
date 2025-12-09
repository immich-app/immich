import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/person.model.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/extensions/translate_extensions.dart';
import 'package:immich_mobile/providers/infrastructure/people.provider.dart';
import 'package:immich_mobile/widgets/common/immich_toast.dart';
import 'package:immich_mobile/utils/debug_print.dart';

class DriftPersonNameEditForm extends ConsumerStatefulWidget {
  final DriftPerson person;

  const DriftPersonNameEditForm({super.key, required this.person});

  @override
  ConsumerState<DriftPersonNameEditForm> createState() => _DriftPersonNameEditFormState();
}

class _DriftPersonNameEditFormState extends ConsumerState<DriftPersonNameEditForm> {
  late TextEditingController _formController;

  @override
  void initState() {
    super.initState();
    _formController = TextEditingController(text: widget.person.name);
  }

  void onEdit(String personId, String newName) async {
    try {
      final result = await ref.read(driftPeopleServiceProvider).updateName(personId, newName);
      if (result != 0) {
        ref.invalidate(driftGetAllPeopleProvider);
        context.pop<String>(newName);
      }
    } catch (error) {
      dPrint(() => 'Error updating name: $error');

      if (!context.mounted) {
        return;
      }

      ImmichToast.show(
        context: context,
        msg: 'scaffold_body_error_occurred'.t(context: context),
        gravity: ToastGravity.BOTTOM,
        toastType: ToastType.error,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text("edit_name", style: TextStyle(fontWeight: FontWeight.bold)).tr(),
      content: SingleChildScrollView(
        child: TextFormField(
          controller: _formController,
          textCapitalization: TextCapitalization.words,
          autofocus: true,
          decoration: InputDecoration(hintText: 'name'.tr(), border: const OutlineInputBorder()),
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => context.pop(null),
          child: Text(
            "cancel",
            style: TextStyle(color: Colors.red[300], fontWeight: FontWeight.bold),
          ).tr(),
        ),
        TextButton(
          onPressed: () => onEdit(widget.person.id, _formController.text),
          child: Text(
            "save",
            style: TextStyle(color: context.primaryColor, fontWeight: FontWeight.bold),
          ).tr(),
        ),
      ],
    );
  }
}
