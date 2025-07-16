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
            const Padding(
              padding: EdgeInsetsGeometry.all(20),
              child: Image(
                image: AssetImage('assets/immich-logo.png'),
                width: 80,
                filterQuality: FilterQuality.high,
              ),
            ),
            const Padding(padding: EdgeInsets.only(top: 16.0)),
            Center(
              child: Column(
                children: [
                  AnimatedSwitcher(
                    duration: Durations.medium4,
                    child: !hasMigrated
                        ? const SizedBox(
                            width: 20.0,
                            height: 20.0,
                            child: CircularProgressIndicator(),
                          )
                        : const Icon(
                            Icons.check_circle_rounded,
                            color: Colors.green,
                          ),
                  ),
                  const SizedBox(height: 20),
                  SizedBox(
                    width: 300.0,
                    height: 100.0,
                    child: Text(
                      !hasMigrated
                          ? "Do not close the app while the migration is in progress"
                          : "Migration completed. Close and Reopen the app",
                      style: context.textTheme.displayLarge,
                      textAlign: TextAlign.center,
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
