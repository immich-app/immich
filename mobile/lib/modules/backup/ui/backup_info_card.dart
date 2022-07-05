import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';

class BackupInfoCard extends StatelessWidget {
  final String title;
  final String subtitle;
  final String info;
  const BackupInfoCard(
      {Key? key,
      required this.title,
      required this.subtitle,
      required this.info})
      : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Card(
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(5), // if you need this
        side: const BorderSide(
          color: Colors.black12,
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
            style: const TextStyle(color: Color(0xFF808080), fontSize: 12),
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
