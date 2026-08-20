import 'dart:async';
import 'dart:io';

import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/services/log.service.dart';
import 'package:immich_mobile/domain/services/troubleshoot.service.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/generated/translations.g.dart';
import 'package:immich_mobile/providers/infrastructure/settings.provider.dart';
import 'package:logging/logging.dart';
import 'package:path_provider/path_provider.dart';
import 'package:share_plus/share_plus.dart';

class TroubleshootShareDialog extends ConsumerStatefulWidget {
  const TroubleshootShareDialog({super.key});

  @override
  ConsumerState<TroubleshootShareDialog> createState() => _TroubleshootShareDialogState();
}

class _TroubleshootShareDialogState extends ConsumerState<TroubleshootShareDialog> {
  final _log = Logger('TroubleshootShareDialog');

  bool _includeLogs = true;
  bool _includeConfig = true;
  bool _isSharing = false;
  double _progress = 0;

  Future<void> _deleteDir(Directory dir) async {
    try {
      await dir.delete(recursive: true);
    } catch (error, stack) {
      _log.warning('Failed to delete troubleshoot data', error, stack);
    }
  }

  Future<void> _share() async {
    setState(() {
      _isSharing = true;
      _progress = 0;
    });
    final size = MediaQuery.of(context).size;
    final service = TroubleshootService(LogService.I);
    final config = ref.read(appConfigProvider);
    Directory? dir;
    var shared = false;
    try {
      final tempDir = await getTemporaryDirectory();
      dir = await Directory('${tempDir.path}/troubleshoot_${DateTime.now().millisecondsSinceEpoch}').create();
      final parts = await service.buildBundle(
        dir,
        config: config,
        includeLogs: _includeLogs,
        includeConfig: _includeConfig,
        onProgress: (progress) {
          if (mounted) {
            setState(() => _progress = progress);
          }
        },
      );
      await Share.shareXFiles(
        [for (final part in parts) XFile(part.path)],
        subject: "Immich troubleshoot data",
        sharePositionOrigin: Rect.fromPoints(Offset.zero, Offset(size.width / 3, size.height)),
      );
      shared = true;
    } catch (error, stack) {
      _log.severe('Failed to share troubleshoot data', error, stack);
    } finally {
      final bundleDir = dir;
      if (bundleDir != null) {
        if (shared) {
          unawaited(Future.delayed(const Duration(seconds: 30), () => _deleteDir(bundleDir)));
        } else {
          await _deleteDir(bundleDir);
        }
      }
      if (mounted) {
        context.pop();
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final hasSelection = _includeLogs || _includeConfig;

    return AlertDialog(
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.all(Radius.circular(10))),
      title: Text(context.t.troubleshoot_share_dialog_title),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(context.t.troubleshoot_share_dialog_description),
          CheckboxListTile(
            title: Text(context.t.logs),
            value: _includeLogs,
            onChanged: _isSharing ? null : (value) => setState(() => _includeLogs = value!),
          ),
          CheckboxListTile(
            title: Text(context.t.troubleshoot_share_app_config),
            value: _includeConfig,
            onChanged: _isSharing ? null : (value) => setState(() => _includeConfig = value!),
          ),
          if (_isSharing) ...[
            const SizedBox(height: 16),
            ClipRRect(
              borderRadius: const BorderRadius.all(Radius.circular(4)),
              child: LinearProgressIndicator(value: _progress > 0 ? _progress : null, minHeight: 4),
            ),
          ],
        ],
      ),
      actions: [
        TextButton(
          onPressed: _isSharing ? null : () => context.pop(),
          child: Text(
            context.t.cancel,
            style: TextStyle(color: context.primaryColor, fontWeight: FontWeight.bold),
          ),
        ),
        TextButton(
          onPressed: _isSharing || !hasSelection ? null : () => unawaited(_share()),
          child: Text(
            context.t.share,
            style: TextStyle(color: context.primaryColor, fontWeight: FontWeight.bold),
          ),
        ),
      ],
    );
  }
}
