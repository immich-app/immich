import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/providers/background_sync.provider.dart';
import 'package:immich_mobile/providers/infrastructure/db.provider.dart';
import 'package:immich_mobile/utils/migration.dart';

@RoutePage()
class ChangeExperiencePage extends ConsumerStatefulWidget {
  final bool switchingToBeta;

  const ChangeExperiencePage({super.key, required this.switchingToBeta});

  @override
  ConsumerState createState() => _ChangeExperiencePageState();
}

class _ChangeExperiencePageState extends ConsumerState<ChangeExperiencePage> {
  bool hasMigrated = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _handleMigration());
  }

  Future<void> _handleMigration() async {
    if (widget.switchingToBeta) {
      await ref.read(backgroundSyncProvider).syncLocal();
      await migrateDeviceAssetToSqlite(
        ref.read(isarProvider),
        ref.read(driftProvider),
      );
    } else {
      await ref.read(backgroundSyncProvider).cancel();
    }
    if (mounted) {
      setState(() {
        hasMigrated = true;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            AnimatedSwitcher(
              duration: Durations.long4,
              child: hasMigrated
                  ? const Icon(
                      Icons.check_circle_rounded,
                      color: Colors.green,
                      size: 48.0,
                    )
                  : const SizedBox(
                      width: 50.0,
                      height: 50.0,
                      child: CircularProgressIndicator(),
                    ),
            ),
            const SizedBox(height: 16.0),
            Center(
              child: Column(
                children: [
                  SizedBox(
                    width: 300.0,
                    child: AnimatedSwitcher(
                      duration: Durations.long4,
                      child: hasMigrated
                          ? Text(
                              "Migration success. Please close and reopen the app",
                              style: context.textTheme.titleMedium,
                              textAlign: TextAlign.center,
                            )
                          : Text(
                              "Data migration in progress...\nPlease wait and don't close this page",
                              style: context.textTheme.titleMedium,
                              textAlign: TextAlign.center,
                            ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
