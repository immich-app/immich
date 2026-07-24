import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/generated/translations.g.dart';

class PersonOptionSheet extends ConsumerWidget {
  const PersonOptionSheet({super.key, this.onEditName, this.onEditBirthday, this.onMerge, this.birthdayExists = false});

  final VoidCallback? onEditName;
  final VoidCallback? onEditBirthday;
  final VoidCallback? onMerge;
  final bool birthdayExists;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    TextStyle textStyle = Theme.of(context).textTheme.bodyLarge!.copyWith(fontWeight: FontWeight.w600);

    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 24.0),
        child: ListView(
          shrinkWrap: true,
          children: [
            ListTile(
              leading: const Icon(Icons.edit),
              title: Text(context.t.edit_name, style: textStyle),
              onTap: onEditName,
            ),
            ListTile(
              leading: const Icon(Icons.cake),
              title: Text((birthdayExists ? context.t.edit_birthday : context.t.add_birthday), style: textStyle),
              onTap: onEditBirthday,
            ),
            ListTile(
              leading: const Icon(Icons.merge_rounded),
              title: Text(context.t.merge_people, style: textStyle),
              onTap: onMerge,
            ),
          ],
        ),
      ),
    );
  }
}
