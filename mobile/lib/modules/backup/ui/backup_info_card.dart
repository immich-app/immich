import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';

class BackupInfoCard extends StatelessWidget {
  final String title;
  final String subtitle;
  final String info;
  const BackupInfoCard({
    super.key,
    required this.title,
    required this.subtitle,
    required this.info,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(20), // if you need this
        side: BorderSide(
          color: context.isDarkTheme
              ? const Color.fromARGB(255, 56, 56, 56)
              : Colors.black12,
          width: 1,
        ),
      ),
      elevation: 0,
      borderOnForeground: false,
      child: ListTile(
        minVerticalPadding: 18,
        isThreeLine: true,
        title: Text(
          title,
          style: context.textTheme.titleMedium,
        ),
        subtitle: Padding(
          padding: const EdgeInsets.only(top: 4.0, right: 18.0),
          child: Text(
            subtitle,
            style: context.textTheme.bodyMedium,
          ),
        ),
        trailing: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              info,
              style: context.textTheme.titleLarge,
            ),
            Text(
              "backup_info_card_assets",
              style: context.textTheme.labelLarge,
            ).tr(),
          ],
        ),
      ),
    );
  }
}
