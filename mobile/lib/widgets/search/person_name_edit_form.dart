import 'dart:typed_data';

import 'package:easy_localization/easy_localization.dart';
import 'package:fast_contacts/fast_contacts.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/providers/search/people.provider.dart';
import 'package:permission_handler/permission_handler.dart';

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
    final isError = useState(false);
    final contacts = useState<List<Contact>>([]);
    final filteredContacts = useState<List<Contact>>([]);
    final isLoading = useState(false);
    final isEditing = useState(true);

    useEffect(
      () {
        loadContacts() async {
          try {
            final status = await Permission.contacts.request();
            if (status.isGranted) {
              isLoading.value = true;
              contacts.value = await FastContacts.getAllContacts();
              isLoading.value = false;
            }
          } catch (e) {
            debugPrint('Failed to load contacts: $e');
          }
        }

        loadContacts();
        return null;
      },
      [],
    );

    useEffect(
      () {
        // Filter contacts based on the input name
        void filterContacts() {
          if (controller.text.isEmpty || !isEditing.value) {
            filteredContacts.value = [];
            return;
          }
          filteredContacts.value = contacts.value
              .where(
                (contact) =>
                    contact.displayName
                        .toLowerCase()
                        .contains(controller.text.toLowerCase()) &&
                    contact.displayName !=
                        controller
                            .text, // If contact 100% matches the input, also hide it
              )
              .toList();
        }

        controller.addListener(filterContacts);
        return () => controller.removeListener(filterContacts);
      },
      [contacts.value],
    );

    return AlertDialog(
      title: const Text(
        "search_page_person_add_name_dialog_title",
        style: TextStyle(fontWeight: FontWeight.bold),
      ).tr(),
      content: SizedBox(
        width: double.maxFinite,
        height: filteredContacts.value.isEmpty
            ? 80
            : MediaQuery.of(context).size.height * 0.4,
        child: Column(
          children: [
            TextFormField(
              controller: controller,
              autofocus: true,
              onTap: () {
                isEditing.value = true;
              },
              decoration: InputDecoration(
                hintText: 'search_page_person_add_name_dialog_hint'.tr(),
                border: const OutlineInputBorder(),
                errorText: isError.value ? 'Error occured' : null,
                suffixIcon: isLoading.value
                    ? const SizedBox(
                        width: 20,
                        height: 20,
                        child: Padding(
                          padding: EdgeInsets.all(10.0),
                          child: CircularProgressIndicator(),
                        ),
                      )
                    : null,
              ),
            ),
            const SizedBox(height: 8),
            Expanded(
              child: filteredContacts.value.isNotEmpty
                  ? ListView.builder(
                      itemCount: filteredContacts.value.length,
                      itemBuilder: (context, index) {
                        final contact = filteredContacts.value[index];
                        return ListTile(
                          leading: FutureBuilder<Uint8List?>(
                            future: FastContacts.getContactImage(contact.id),
                            builder: (context, snapshot) {
                              if (snapshot.hasData && snapshot.data != null) {
                                return CircleAvatar(
                                  radius: 16,
                                  backgroundImage: MemoryImage(snapshot.data!),
                                );
                              }
                              return const CircleAvatar(
                                radius: 16,
                                child: Icon(Icons.person, size: 20),
                              );
                            },
                          ),
                          dense: true,
                          title: Text(
                            contact.displayName,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                          onTap: () {
                            controller.text = contact.displayName;
                            filteredContacts.value = [];
                            isEditing.value = false;
                            FocusScope.of(context).unfocus();
                          },
                        );
                      },
                    )
                  : const SizedBox.shrink(),
            ),
          ],
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => context.pop(
            PersonNameEditFormResult(false, ''),
          ),
          child: Text(
            "search_page_person_add_name_dialog_cancel",
            style: TextStyle(
              color: Colors.red[300],
              fontWeight: FontWeight.bold,
            ),
          ).tr(),
        ),
        TextButton(
          onPressed: () async {
            isError.value = false;
            final result = await ref.read(
              updatePersonNameProvider(personId, controller.text).future,
            );
            isError.value = !result;
            if (result) {
              context.pop(PersonNameEditFormResult(true, controller.text));
            }
          },
          child: Text(
            "search_page_person_add_name_dialog_save",
            style: TextStyle(
              color: context.primaryColor,
              fontWeight: FontWeight.bold,
            ),
          ).tr(),
        ),
      ],
    );
  }
}
