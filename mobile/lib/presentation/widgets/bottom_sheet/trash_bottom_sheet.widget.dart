import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/enums.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/delete_trash_action_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/restore_trash_action_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/timeline/timeline.state.dart';
import 'package:immich_mobile/widgets/common/measured_size.dart';

class TrashBottomBar extends ConsumerStatefulWidget {
  const TrashBottomBar({super.key});

  @override
  ConsumerState<TrashBottomBar> createState() => _TrashBottomBarState();
}

class _TrashBottomBarState extends ConsumerState<TrashBottomBar> {
  late TimelineStateNotifier _timelineStateNotifier;

  @override
  void initState() {
    super.initState();
    _timelineStateNotifier = ref.read(timelineStateProvider.notifier);
  }

  void _onSizeChanged(Size size) {
    if (!mounted) {
      return;
    }
    _timelineStateNotifier.setBottomSheetHeight(size.height);
  }

  @override
  void dispose() {
    WidgetsBinding.instance.addPostFrameCallback((_) => _timelineStateNotifier.setBottomSheetHeight(0));
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Align(
      alignment: Alignment.bottomCenter,
      child: MeasuredSize(
        onSizeChanged: _onSizeChanged,
        child: Container(
          color: context.themeData.canvasColor,
          padding: const EdgeInsets.symmetric(vertical: 8),
          child: const SafeArea(
            top: false,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                DeleteTrashActionButton(source: ActionSource.timeline),
                RestoreTrashActionButton(source: ActionSource.timeline),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
