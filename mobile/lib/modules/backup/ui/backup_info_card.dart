import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';

class BackupInfoCard extends StatelessWidget {
  final String title;
  final String subtitle;
  final String info;
  const BackupInfoCard({
    Key? key,
    required this.title,
    required this.subtitle,
    required this.info,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    var isDarkMode = Theme.of(context).brightness == Brightness.dark;

    return Card(
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(20), // if you need this
        side: BorderSide(
          color: isDarkMode
              ? const Color.fromARGB(255, 56, 56, 56)
              : Colors.black12,
          width: 1,
        ),
      ),
      elevation: 0,
      borderOnForeground: false,
      child: ListTile(
        minVerticalPadding: 15,
        isThreeLine: true,
        title: Text(
          title,
          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 20),
        ),
        subtitle: Padding(
          padding: const EdgeInsets.only(top: 8.0),
          child: Text(
            subtitle,
            style: const TextStyle(fontSize: 12),
          ),
        ),
        trailing: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              info,
              style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
            ),
            const Text("backup_info_card_assets").tr(),
          ],
        ),
      ),
    );
  }
}
