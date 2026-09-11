import 'package:flutter/material.dart';
import 'package:immich_mobile/generated/translations.g.dart';

class PersonOptionSheet extends StatelessWidget {
  const PersonOptionSheet({
    super.key,
    this.onEditName,
    this.onEditBirthday,
    this.onToggleHidden,
    this.birthdayExists = false,
    this.isHidden = false,
  });

  final VoidCallback? onEditName;
  final VoidCallback? onEditBirthday;
  final VoidCallback? onToggleHidden;
  final bool birthdayExists;
  final bool isHidden;

  @override
  Widget build(BuildContext context) {
    final TextStyle textStyle = Theme.of(context).textTheme.bodyLarge!.copyWith(fontWeight: FontWeight.w600);

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
              title: Text(birthdayExists ? context.t.edit_birthday : context.t.add_birthday, style: textStyle),
              onTap: onEditBirthday,
            ),
            ListTile(
              leading: Icon(isHidden ? Icons.visibility : Icons.visibility_off),
              title: Text(isHidden ? context.t.unhide_person : context.t.hide_person),
              onTap: onToggleHidden,
            ),
          ],
        ),
      ),
    );
  }
}
