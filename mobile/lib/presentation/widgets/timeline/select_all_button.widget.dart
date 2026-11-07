import 'dart:async';

import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/events.model.dart';
import 'package:immich_mobile/domain/utils/event_stream.dart';
import 'package:immich_mobile/generated/translations.g.dart';
import 'package:immich_mobile/providers/haptic_feedback.provider.dart';
import 'package:immich_mobile/providers/infrastructure/readonly_mode.provider.dart';
import 'package:immich_mobile/providers/infrastructure/timeline.provider.dart';
import 'package:immich_mobile/providers/timeline/multiselect.provider.dart';


class SelectAllIconButton extends ConsumerStatefulWidget {
  const SelectAllIconButton({super.key, this.iconColor, this.iconShadows});

  final Color? iconColor;
  final List<Shadow>? iconShadows;

  @override
  ConsumerState<SelectAllIconButton> createState() => _SelectAllIconButtonState();
}

class _SelectAllIconButtonState extends ConsumerState<SelectAllIconButton> {
  StreamSubscription? _reloadSubscription;

  @override
  void initState() {
    super.initState();
    _reloadSubscription = EventStream.shared.listen<TimelineReloadEvent>((_) => setState(() {}));
  }

  @override
  void dispose() {
    unawaited(_reloadSubscription?.cancel());
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isReadonlyModeEnabled = ref.watch(readonlyModeProvider);
    final totalAssets = ref.watch(timelineServiceProvider.select((service) => service.totalAssets));
    final selectedCount = ref.watch(multiSelectProvider.select((state) => state.selectedAssets.length));
    final isAllSelected = totalAssets > 0 && selectedCount >= totalAssets;

    if (isReadonlyModeEnabled || totalAssets == 0) {
      return const SizedBox.shrink();
    }

    return IconButton(
      tooltip: isAllSelected ? context.t.unselect_all : context.t.select_all,
      onPressed: () {
        ref.read(hapticFeedbackProvider.notifier).heavyImpact();
        final notifier = ref.read(multiSelectProvider.notifier);
        if (isAllSelected) {
          notifier.reset();
        } else {
          unawaited(notifier.selectAll());
        }
      },
      icon: Icon(
        isAllSelected ? Icons.deselect_rounded : Icons.select_all_rounded,
        color: widget.iconColor,
        shadows: widget.iconShadows,
      ),
    );
  }
}
