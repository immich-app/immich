import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/translate_extensions.dart';

class PersonOptionSheet extends ConsumerWidget {
  const PersonOptionSheet({
    super.key,
    this.onEditName,
    this.onEditBirthday,
    this.onEditVisibility,
    this.birthdayExists = false,
    this.isHidden = false,
  });

  final VoidCallback? onEditName;
  final VoidCallback? onEditBirthday;
  final VoidCallback? onEditVisibility;
  final bool birthdayExists;
  final bool isHidden;

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
              title: Text('edit_name'.t(context: context), style: textStyle),
              onTap: onEditName,
            ),
            ListTile(
              leading: const Icon(Icons.cake),
              title: Text((birthdayExists ? 'edit_birthday' : "add_birthday").t(context: context), style: textStyle),
              onTap: onEditBirthday,
            ),
            ListTile(
              leading: Icon((isHidden ? Icons.visibility : Icons.visibility_off)),
              title: Text((isHidden ? "unhide_person" : 'hide_person').t(context: context), style: textStyle),
              onTap: onEditVisibility,
            ),
          ],
        ),
      ),
    );
  }
}
