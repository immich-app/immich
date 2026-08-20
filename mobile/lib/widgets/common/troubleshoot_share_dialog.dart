import 'dart:async';
import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/services/log.service.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/generated/translations.g.dart';
import 'package:immich_mobile/providers/infrastructure/db.provider.dart';
import 'package:immich_mobile/providers/infrastructure/settings.provider.dart';
import 'package:immich_mobile/services/troubleshoot.service.dart';
import 'package:path_provider/path_provider.dart';
import 'package:share_plus/share_plus.dart';

class TroubleshootShareDialog extends HookConsumerWidget {
  const TroubleshootShareDialog({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final includeLogs = useState(true);
    final includeDatabase = useState(true);
    final includeConfig = useState(true);
    final isSharing = useState(false);

    Future<void> share() async {
      isSharing.value = true;
      final size = MediaQuery.of(context).size;
      final service = TroubleshootService(ref.read(driftProvider), LogService.I);
      final config = ref.read(appConfigProvider);
      try {
        final tempDir = await getTemporaryDirectory();
        final dir = await Directory('${tempDir.path}/troubleshoot_${DateTime.now().millisecondsSinceEpoch}').create();
        final zip = await service.buildBundle(
          dir,
          config: config,
          includeLogs: includeLogs.value,
          includeDatabase: includeDatabase.value,
          includeConfig: includeConfig.value,
        );
        await Share.shareXFiles(
          [XFile(zip.path)],
          subject: "Immich troubleshoot data",
          sharePositionOrigin: Rect.fromPoints(Offset.zero, Offset(size.width / 3, size.height)),
        ).then((value) => dir.delete(recursive: true));
      } finally {
        if (context.mounted) {
          context.pop();
        }
      }
    }

    final hasSelection = includeLogs.value || includeDatabase.value || includeConfig.value;

    return AlertDialog(
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.all(Radius.circular(10))),
      title: Text(context.t.troubleshoot_share_dialog_title),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(context.t.troubleshoot_share_dialog_description),
          CheckboxListTile(
            title: Text(context.t.logs),
            value: includeLogs.value,
            onChanged: isSharing.value ? null : (value) => includeLogs.value = value!,
          ),
          CheckboxListTile(
            title: Text(context.t.troubleshoot_share_database),
            value: includeDatabase.value,
            onChanged: isSharing.value ? null : (value) => includeDatabase.value = value!,
          ),
          CheckboxListTile(
            title: Text(context.t.troubleshoot_share_app_config),
            value: includeConfig.value,
            onChanged: isSharing.value ? null : (value) => includeConfig.value = value!,
          ),
        ],
      ),
      actions: [
        TextButton(
          onPressed: isSharing.value ? null : () => context.pop(),
          child: Text(
            context.t.cancel,
            style: TextStyle(color: context.primaryColor, fontWeight: FontWeight.bold),
          ),
        ),
        TextButton(
          onPressed: isSharing.value || !hasSelection ? null : () => unawaited(share()),
          child: Text(
            context.t.share,
            style: TextStyle(color: context.primaryColor, fontWeight: FontWeight.bold),
          ),
        ),
      ],
    );
  }
}
