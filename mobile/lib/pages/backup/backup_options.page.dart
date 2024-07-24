import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:immich_mobile/widgets/settings/backup_settings/backup_settings.dart';

@RoutePage()
class BackupOptionsPage extends StatelessWidget {
  const BackupOptionsPage({super.key});
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        elevation: 0,
        title: const Text("backup_options_page_title").tr(),
        leading: IconButton(
          onPressed: () => context.maybePop(true),
          splashRadius: 24,
          icon: const Icon(
            Icons.arrow_back_ios_rounded,
          ),
        ),
      ),
      body: const BackupSettings(),
    );
  }
}
