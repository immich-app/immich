import 'dart:async';

import 'package:flutter/material.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/person.model.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/generated/translations.g.dart';
import 'package:immich_mobile/pages/common/large_leading_tile.dart';
import 'package:immich_mobile/presentation/widgets/people/person_tile.widget.dart';
import 'package:immich_mobile/providers/infrastructure/people.provider.dart';
import 'package:immich_mobile/utils/debug_print.dart';
import 'package:immich_mobile/utils/people.utils.dart';
import 'package:immich_mobile/widgets/common/immich_toast.dart';
import 'package:logging/logging.dart';

class PersonNameEditForm extends ConsumerStatefulWidget {
  final Person person;

  const PersonNameEditForm({super.key, required this.person});

  @override
  ConsumerState<PersonNameEditForm> createState() => _PersonNameEditFormState();
}

class _PersonNameEditFormState extends ConsumerState<PersonNameEditForm> {
  late TextEditingController _formController;
  List<Person> _filteredPeople = [];

  @override
  void initState() {
    super.initState();
    _formController = TextEditingController(text: widget.person.name);
  }

  @override
  void dispose() {
    _formController.dispose();
    super.dispose();
  }

  Future<void> onMerge({required BuildContext context, required Person person, required Person mergeTarget}) async {
    final Person? response = await showMergeModal(context, person, mergeTarget);
    if (response != null && mounted) {
      this.context.pop<Person?>(response);
    }
  }

  Future<void> onEdit(Person person, String newName) async {
    try {
      final result = await ref.read(peopleServiceProvider).updateName(person.id, newName);
      if (result != 0) {
        ref.invalidate(getAllPeopleProvider);
        if (mounted) {
          context.pop<Person>(person);
        }
      }
    } catch (error) {
      dPrint(() => 'Error updating name: $error');

      if (!mounted) {
        return;
      }

      ImmichToast.show(
        context: context,
        msg: context.t.scaffold_body_error_occurred,
        gravity: ToastGravity.BOTTOM,
        toastType: ToastType.error,
      );
    }
  }

  // TODO: Add diacritic filtering?
  void _filterPeople(List<Person> people, String query) {
    final queryParts = query.toLowerCase().split(' ').where((e) => e.isNotEmpty).toList();

    final startsWithMatches = <Person>[];
    final containsMatches = <Person>[];

    for (final p in people) {
      if (p.id == widget.person.id) {
        continue;
      }

      final nameParts = p.name.toLowerCase().split(' ').where((e) => e.isNotEmpty).toList();

      final allStart = queryParts.every((q) => nameParts.any((n) => n.startsWith(q)));
      final allContain = queryParts.every((q) => nameParts.any((n) => n.contains(q)));

      if (allStart) {
        // Prioritize names (first or surname) that start with the query
        startsWithMatches.add(p);
      } else if (allContain) {
        containsMatches.add(p);
      }
    }

    if (!mounted) {
      return;
    }

    setState(() {
      // TODO:  What happens if there are more than 3 matches with the exact same name?
      _filteredPeople = query.isEmpty ? [] : (startsWithMatches + containsMatches).take(3).toList();
    });
  }

  @override
  Widget build(BuildContext context) {
    final curatedPeople = ref.watch(getAllPeopleProvider);
    List<Person> people = [];

    return AlertDialog(
      title: Text(context.t.edit_name, style: const TextStyle(fontWeight: FontWeight.bold)),
      content: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextFormField(
              autofocus: true,
              controller: _formController,
              textCapitalization: TextCapitalization.words,
              decoration: InputDecoration(
                hintText: context.t.add_a_name,
                border: const OutlineInputBorder(borderRadius: BorderRadius.all(Radius.circular(8))),
              ),
              onChanged: (value) => _filterPeople(people, value),
              onTapOutside: (event) => FocusScope.of(context).unfocus(),
            ),
            curatedPeople.when(
              data: (p) {
                people = p;
                return AnimatedSize(
                  duration: const Duration(milliseconds: 200),
                  child: SizedBox(
                    width: double.infinity,
                    child: _filteredPeople.isEmpty
                        // Tile instead of a blank space to avoid horizontal layout shift
                        ? LargeLeadingTile(
                            leading: const SizedBox.shrink(),
                            onTap: () {},
                            title: const SizedBox.shrink(),
                            disabled: true,
                          )
                        : Container(
                            margin: const EdgeInsets.only(top: 8),
                            decoration: const BoxDecoration(borderRadius: BorderRadius.all(Radius.circular(8))),
                            child: Column(
                              mainAxisSize: MainAxisSize.min,
                              children: _filteredPeople.map((person) {
                                return PersonTile(
                                  isSelected: false,
                                  onTap: () {
                                    if (!mounted) {
                                      return;
                                    }
                                    setState(() {
                                      _formController.text = person.name;
                                    });
                                    _formController.selection = TextSelection.fromPosition(
                                      TextPosition(offset: _formController.text.length),
                                    );
                                    unawaited(onMerge(context: context, person: widget.person, mergeTarget: person));
                                  },
                                  person: person,
                                );
                              }).toList(),
                            ),
                          ),
                  ),
                );
              },
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (err, stack) {
                Logger('PersonEditNameModal').warning('Error loading people for name edit modal', err, stack);
                return Center(child: Text('Error loading people for name edit modal: $err'));
              },
            ),
          ],
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => context.pop(null),
          child: Text(
            context.t.cancel,
            style: TextStyle(color: Colors.red[300], fontWeight: FontWeight.bold),
          ),
        ),
        TextButton(
          onPressed: () => unawaited(onEdit(widget.person, _formController.text)),
          child: Text(
            context.t.save,
            style: TextStyle(color: context.primaryColor, fontWeight: FontWeight.bold),
          ),
        ),
      ],
    );
  }
}
