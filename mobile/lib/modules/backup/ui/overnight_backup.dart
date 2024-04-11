import 'dart:math';

import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/modules/backup/models/backup_state.model.dart';
import 'package:immich_mobile/modules/backup/providers/backup.provider.dart';
import 'package:wakelock_plus/wakelock_plus.dart';

class OvernightBackup extends HookConsumerWidget {
  final Function() stopOvernightBackup;

  const OvernightBackup({required this.stopOvernightBackup, super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final animationController =
        useAnimationController(duration: const Duration(hours: 1));
    final reset = useState(false);
    final from = useRef<Alignment>(Alignment.center);
    final to = useRef<Alignment>(Alignment.center);
    final tween = AlignmentTween(begin: from.value, end: to.value);

    ref.listen(
      backupProvider.select((value) => value.backupProgress),
      (prev, next) {
        if (prev == BackUpProgressEnum.inProgress &&
            next != BackUpProgressEnum.inProgress) {
          stopOvernightBackup();
        }
      },
    );

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
        /// This is used to force a rebuild of the widget to call the randomizeAlignment() method
        /// through the useEffect hook which takes care of animating the icon to the new alignment
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

    /// The following effect is called on each rebuild of the widget and handles the starts the animation
    /// This is also called on screen orientation change and handles updating the alignment and size of the icon
    /// accordingly
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
                  "overnight_upload_inprogress",
                  style: context.textTheme.titleLarge
                      ?.copyWith(color: Colors.grey[800]),
                ).tr(),
                const SizedBox(height: 10),
                ElevatedButton(
                  style: ButtonStyle(
                    backgroundColor: MaterialStatePropertyAll(Colors.grey[850]),
                  ),
                  onPressed: stopOvernightBackup,
                  child: const Text("overnight_upload_stop").tr(),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}
