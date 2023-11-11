import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/modules/search/providers/people.provider.dart';

class PersonNameEditFormResult {
  final bool success;
  final String updatedName;

  PersonNameEditFormResult(this.success, this.updatedName);
}

class PersonNameEditForm extends HookConsumerWidget {
  final String personId;
  final String personName;

  const PersonNameEditForm({
    super.key,
    required this.personId,
    required this.personName,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final controller = useTextEditingController(text: personName);

    return AlertDialog(
      title: const Text(
        "Add a name",
        style: TextStyle(fontWeight: FontWeight.bold),
      ),
      content: SingleChildScrollView(
        child: TextFormField(
          controller: controller,
          autofocus: true,
          decoration: const InputDecoration(
            hintText: 'Name',
          ),
        ),
      ),
      actions: [
        TextButton(
          style: TextButton.styleFrom(),
          onPressed: () {
            Navigator.of(context, rootNavigator: true)
                .pop<PersonNameEditFormResult>(
              PersonNameEditFormResult(false, ''),
            );
          },
          child: Text(
            "Cancel",
            style: TextStyle(
              color: Colors.red[300],
              fontWeight: FontWeight.bold,
            ),
          ),
        ),
        TextButton(
          onPressed: () {
            ref.read(
              updatePersonNameProvider(
                UpdatePersonName(personId, controller.text),
              ),
            );

            Navigator.of(context, rootNavigator: true)
                .pop<PersonNameEditFormResult>(
              PersonNameEditFormResult(true, controller.text),
            );
          },
          child: Text(
            "Save",
            style: TextStyle(
              color: context.primaryColor,
              fontWeight: FontWeight.bold,
            ),
          ),
        ),
      ],
    );
  }
}
