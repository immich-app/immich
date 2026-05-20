import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/providers/asset_viewer/slideshow.provider.dart';

class SlideshowControlBar extends ConsumerWidget {
  final VoidCallback onNext;
  final VoidCallback onPrevious;
  final VoidCallback onExit;

  const SlideshowControlBar({super.key, required this.onNext, required this.onPrevious, required this.onExit});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(slideshowNotifierProvider);
    final notifier = ref.read(slideshowNotifierProvider.notifier);

    if (!state.isPlaying || !state.showControls) {
      return const SizedBox.shrink();
    }

    return SafeArea(
      child: Align(
        alignment: Alignment.topCenter,
        child: Container(
          margin: const EdgeInsets.only(top: 8),
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
          decoration: BoxDecoration(
            color: Colors.black54,
            borderRadius: BorderRadius.circular(24),
          ),
          child: Wrap(
            alignment: WrapAlignment.center,
            spacing: 0,
            runSpacing: 0,
            crossAxisAlignment: WrapCrossAlignment.center,
            children: [
              // Close
              IconButton(
                visualDensity: VisualDensity.compact,
                constraints: const BoxConstraints(minWidth: 36, minHeight: 36),
                onPressed: onExit,
                icon: const Icon(Icons.close, color: Colors.white),
                tooltip: 'Exit slideshow',
              ),
              // Previous
              IconButton(
                visualDensity: VisualDensity.compact,
                constraints: const BoxConstraints(minWidth: 36, minHeight: 36),
                onPressed: onPrevious,
                icon: const Icon(Icons.chevron_left, color: Colors.white),
                tooltip: 'Previous',
              ),
              // Play/Pause
              IconButton(
                visualDensity: VisualDensity.compact,
                constraints: const BoxConstraints(minWidth: 36, minHeight: 36),
                onPressed: state.isPaused ? notifier.resume : notifier.pause,
                icon: Icon(state.isPaused ? Icons.play_arrow : Icons.pause, color: Colors.white),
                tooltip: state.isPaused ? 'Resume' : 'Pause',
              ),
              // Next
              IconButton(
                visualDensity: VisualDensity.compact,
                constraints: const BoxConstraints(minWidth: 36, minHeight: 36),
                onPressed: onNext,
                icon: const Icon(Icons.chevron_right, color: Colors.white),
                tooltip: 'Next',
              ),
              // Delay selector — shows current value
              _DelayMenu(
                currentDelay: state.delaySeconds,
                onSelected: notifier.setDelay,
              ),
              // Repeat toggle
              IconButton(
                onPressed: () => notifier.setRepeat(!state.repeat),
                icon: Icon(
                  state.repeat ? Icons.repeat : Icons.repeat_one_on,
                  color: Colors.white,
                ),
                tooltip: state.repeat ? 'Repeat on' : 'Repeat off',
              ),
              // Navigation mode selector — shows current mode
              _NavigationMenu(
                currentMode: state.navigation,
                onSelected: notifier.setNavigation,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _DelayMenu extends StatelessWidget {
  final int currentDelay;
  final void Function(int) onSelected;

  const _DelayMenu({required this.currentDelay, required this.onSelected});

  @override
  Widget build(BuildContext context) {
    return PopupMenuButton<int>(
      icon: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(Icons.timer_outlined, color: Colors.white),
          const SizedBox(width: 2),
          Text(
            '${currentDelay}s',
            style: const TextStyle(color: Colors.white, fontSize: 12),
          ),
        ],
      ),
      tooltip: 'Delay',
      onSelected: onSelected,
      itemBuilder: (context) => [
        _buildItem(3, '3s'),
        _buildItem(5, '5s'),
        _buildItem(10, '10s'),
      ],
    );
  }

  PopupMenuItem<int> _buildItem(int value, String label) {
    final isSelected = value == currentDelay;
    return PopupMenuItem<int>(
      value: value,
      child: Row(
        children: [
          if (isSelected)
            const Icon(Icons.check, size: 16, color: Colors.grey)
          else
            const SizedBox(width: 16),
          const SizedBox(width: 8),
          Text(label),
          if (isSelected) ...[
            const SizedBox(width: 4),
            const Text('✓', style: TextStyle(color: Colors.grey, fontSize: 12)),
          ],
        ],
      ),
    );
  }
}

class _NavigationMenu extends StatelessWidget {
  final SlideshowNavigationMode currentMode;
  final void Function(SlideshowNavigationMode) onSelected;

  const _NavigationMenu({required this.currentMode, required this.onSelected});

  IconData get _icon {
    switch (currentMode) {
      case SlideshowNavigationMode.descending:
        return Icons.arrow_forward;
      case SlideshowNavigationMode.ascending:
        return Icons.arrow_back;
      case SlideshowNavigationMode.shuffle:
        return Icons.shuffle;
    }
  }

  String get _label {
    switch (currentMode) {
      case SlideshowNavigationMode.descending:
        return 'Next →';
      case SlideshowNavigationMode.ascending:
        return '← Prev';
      case SlideshowNavigationMode.shuffle:
        return 'Shuffle';
    }
  }

  @override
  Widget build(BuildContext context) {
    return PopupMenuButton<SlideshowNavigationMode>(
      icon: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(_icon, color: Colors.white),
          const SizedBox(width: 2),
          Text(
            _label,
            style: const TextStyle(color: Colors.white, fontSize: 11),
          ),
        ],
      ),
      tooltip: 'Navigation',
      onSelected: onSelected,
      itemBuilder: (context) => [
        _buildItem(SlideshowNavigationMode.descending, Icons.arrow_forward, 'Next →'),
        _buildItem(SlideshowNavigationMode.ascending, Icons.arrow_back, '← Prev'),
        _buildItem(SlideshowNavigationMode.shuffle, Icons.shuffle, 'Shuffle'),
      ],
    );
  }

  PopupMenuItem<SlideshowNavigationMode> _buildItem(
    SlideshowNavigationMode value,
    IconData icon,
    String label,
  ) {
    final isSelected = value == currentMode;
    return PopupMenuItem<SlideshowNavigationMode>(
      value: value,
      child: Row(
        children: [
          if (isSelected)
            const Icon(Icons.check, size: 16, color: Colors.grey)
          else
            const SizedBox(width: 16),
          const SizedBox(width: 8),
          Icon(icon, size: 18),
          const SizedBox(width: 8),
          Text(label),
        ],
      ),
    );
  }
}