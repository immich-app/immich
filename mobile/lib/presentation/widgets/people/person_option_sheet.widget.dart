import 'package:flutter/material.dart';
import 'package:immich_mobile/generated/translations.g.dart';

class PersonOptionSheet extends StatelessWidget {
  const PersonOptionSheet({super.key, this.onEditName, this.onEditBirthday, this.birthdayExists = false});

  final VoidCallback? onEditName;
  final VoidCallback? onEditBirthday;
  final bool birthdayExists;

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
          ],
        ),
      ),
    );
  }
}
