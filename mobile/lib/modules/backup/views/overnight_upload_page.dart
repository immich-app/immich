import 'dart:math';

import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/modules/backup/models/backup_state.model.dart';
import 'package:immich_mobile/modules/backup/providers/backup.provider.dart';
import 'package:immich_mobile/modules/backup/providers/error_backup_list.provider.dart';
import 'package:immich_mobile/modules/backup/providers/manual_upload.provider.dart';
import 'package:wakelock_plus/wakelock_plus.dart';

@RoutePage()
class OvernightUploadPage extends HookConsumerWidget {
  const OvernightUploadPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final backupProgress =
        ref.watch(backupProvider.select((value) => value.backupProgress));
    final isInProgress = backupProgress == BackUpProgressEnum.inProgress ||
        backupProgress == BackUpProgressEnum.manualInProgress;

    void startBackup() {
      ref.watch(errorBackupListProvider.notifier).empty();
      if (ref.watch(backupProvider).backupProgress !=
          BackUpProgressEnum.inBackground) {
        ref.watch(backupProvider.notifier).startBackupProcess();
      }
    }

    void stopBackup() {
      if (backupProgress == BackUpProgressEnum.manualInProgress) {
        ref.read(manualUploadProvider.notifier).cancelBackup();
      } else {
        ref.read(backupProvider.notifier).cancelBackup();
      }
    }

    useEffect(
      () {
        return () {
          WakelockPlus.disable();
          SystemChrome.setEnabledSystemUIMode(SystemUiMode.edgeToEdge);
        };
      },
      [],
    );

    return AnimatedSwitcher(
      duration: const Duration(milliseconds: 500),
      child: isInProgress
          ? _BackupInProgress(stopBackup)
          : _OvernightInfo(startBackup),
    );
  }
}

class _BackupInProgress extends HookWidget {
  final Function() onClick;

  const _BackupInProgress(this.onClick);

  @override
  Widget build(BuildContext context) {
    final animationController =
        useAnimationController(duration: const Duration(hours: 1));
    final reset = useState(false);
    final from = useRef<Alignment>(Alignment.center);
    final to = useRef<Alignment>(Alignment.center);
    final tween = AlignmentTween(begin: from.value, end: to.value);

    void randomizeAlignment() {
      final random = Random();
      from.value = to.value;
      final currentAlign = to.value;
      var newAlignment = currentAlign;
      do {
        newAlignment = switch (random.nextInt(9)) {
          0 => Alignment.bottomCenter,
          1 => Alignment.bottomLeft,
          2 => Alignment.bottomRight,
          3 => Alignment.center,
          4 => Alignment.centerLeft,
          5 => Alignment.centerRight,
          6 => Alignment.topCenter,
          7 => Alignment.topLeft,
          8 => Alignment.topRight,
          _ => Alignment.center,
        };
      } while (newAlignment == currentAlign);
      to.value = newAlignment;

      animationController.reset();
      animationController.forward();
      WakelockPlus.enable();
    }

    void onAnimationStateChange(AnimationStatus status) {
      if (status == AnimationStatus.completed) {
        reset.value = !reset.value;
      }
    }

    useEffect(
      () {
        WidgetsBinding.instance.addPostFrameCallback((_) {
          animationController.addStatusListener(onAnimationStateChange);
          SystemChrome.setEnabledSystemUIMode(SystemUiMode.immersiveSticky);
          // Start animating
          reset.value = !reset.value;
        });
        return () {
          WakelockPlus.disable();
          animationController.removeStatusListener(onAnimationStateChange);
          SystemChrome.setEnabledSystemUIMode(SystemUiMode.edgeToEdge);
        };
      },
      [],
    );

    useEffect(() {
      randomizeAlignment();
      return null;
    });

    return Stack(
      children: [
        Positioned.fill(
          child: AlignTransition(
            alignment: tween.animate(animationController),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(
                  Icons.upload_rounded,
                  size: context.height / 4,
                  color: Colors.grey[850],
                ),
                Text(
                  "Uploading",
                  style: context.textTheme.titleLarge
                      ?.copyWith(color: Colors.grey[800]),
                ),
                const SizedBox(height: 10),
                ElevatedButton(
                  style: ButtonStyle(
                    backgroundColor: MaterialStatePropertyAll(Colors.grey[850]),
                  ),
                  onPressed: onClick,
                  child: const Text("Stop Upload"),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

class _OvernightInfo extends StatelessWidget {
  final Function() onClick;

  const _OvernightInfo(this.onClick);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text("Over Night upload")),
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Expanded(
            flex: 1,
            child: Align(
              alignment: Alignment.bottomCenter,
              child: Icon(
                Icons.hotel_outlined,
                size: context.height * (context.isMobile ? 0.15 : 0.20),
              ),
            ),
          ),
          Expanded(
            flex: 2,
            child: Align(
              alignment: Alignment.topCenter,
              child: Column(
                children: [
                  const Text(
                    textAlign: TextAlign.center,
                    "Immich will run background backup with a darkened screen",
                  ),
                  const SizedBox(height: 10),
                  const Text(
                    textAlign: TextAlign.center,
                    "Make sure the device is:",
                    maxLines: 5,
                  ),
                  const SizedBox(height: 10),
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.center,
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        Icons.wifi_rounded,
                        size: context.width * (context.isMobile ? 0.07 : 0.03),
                      ),
                      const SizedBox(width: 10),
                      const Text("Connected to WiFi"),
                    ],
                  ),
                  const SizedBox(height: 10),
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.center,
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        Icons.battery_charging_full_rounded,
                        size: context.width * (context.isMobile ? 0.07 : 0.03),
                      ),
                      const SizedBox(width: 10),
                      const Text("Connected to charger"),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
      bottomNavigationBar: Stack(
        alignment: Alignment.topCenter,
        children: [
          Padding(
            padding: EdgeInsets.only(bottom: context.height * 0.1),
            child: ElevatedButton(
              onPressed: onClick,
              child: const Text("Start Overnight Upload"),
            ),
          ),
        ],
      ),
    );
  }
}
