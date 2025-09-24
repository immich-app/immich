import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/presentation/widgets/asset_viewer/asset_stack.provider.dart';
import 'package:immich_mobile/presentation/widgets/asset_viewer/asset_viewer.state.dart';
import 'package:immich_mobile/presentation/widgets/images/thumbnail.widget.dart';
import 'package:immich_mobile/providers/infrastructure/asset_viewer/current_asset.provider.dart';

class AssetStackRow extends ConsumerWidget {
  const AssetStackRow({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final asset = ref.watch(assetViewerProvider.select((state) => state.currentAsset));
    if (asset == null) {
      return const SizedBox.shrink();
    }

    final stackChildren = ref.watch(stackChildrenNotifier(asset)).valueOrNull;
    if (stackChildren == null || stackChildren.isEmpty) {
      return const SizedBox.shrink();
    }

    final showControls = ref.watch(assetViewerProvider.select((s) => s.showingControls));
    final opacity = showControls ? ref.watch(assetViewerProvider.select((state) => state.backgroundOpacity)) : 0;

    return IgnorePointer(
      ignoring: opacity < 255,
      child: AnimatedOpacity(
        opacity: opacity / 255,
        duration: Durations.short2,
        child: _StackList(stack: stackChildren),
      ),
    );
  }
}

class _StackList extends ConsumerWidget {
  final List<RemoteAsset> stack;

  const _StackList({required this.stack});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Center(
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        child: Padding(
          padding: const EdgeInsets.only(left: 10.0, right: 10.0, bottom: 20.0),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            spacing: 5.0,
            children: List.generate(stack.length, (i) {
              final asset = stack[i];
              return _StackItem(key: ValueKey(asset.heroTag), asset: asset, index: i);
            }),
          ),
        ),
      ),
    );
  }
}

class _StackItem extends ConsumerStatefulWidget {
  final RemoteAsset asset;
  final int index;

  const _StackItem({super.key, required this.asset, required this.index});

  @override
  ConsumerState<_StackItem> createState() => _StackItemState();
}

class _StackItemState extends ConsumerState<_StackItem> {
  void _onTap() {
    ref.read(currentAssetNotifier.notifier).setAsset(widget.asset);
    ref.read(assetViewerProvider.notifier).setStackIndex(widget.index);
  }

  @override
  Widget build(BuildContext context) {
    const playIcon = Center(
      child: Icon(
        Icons.play_circle_outline_rounded,
        color: Colors.white,
        size: 16,
        shadows: [Shadow(blurRadius: 5.0, color: Color.fromRGBO(0, 0, 0, 0.6), offset: Offset(0.0, 0.0))],
      ),
    );
    const selectedDecoration = BoxDecoration(
      border: Border.fromBorderSide(BorderSide(color: Colors.white, width: 2)),
      borderRadius: BorderRadius.all(Radius.circular(10)),
    );
    const unselectedDecoration = BoxDecoration(
      border: Border.fromBorderSide(BorderSide(color: Colors.grey, width: 0.5)),
      borderRadius: BorderRadius.all(Radius.circular(10)),
    );

    Widget thumbnail = Thumbnail.fromAsset(asset: widget.asset, size: const Size(60, 40));
    if (widget.asset.isVideo) {
      thumbnail = Stack(children: [thumbnail, playIcon]);
    }
    thumbnail = ClipRRect(borderRadius: const BorderRadius.all(Radius.circular(10)), child: thumbnail);
    final isSelected = ref.watch(assetViewerProvider.select((s) => s.stackIndex == widget.index));
    return SizedBox(
      width: 60,
      height: 40,
      child: GestureDetector(
        onTap: _onTap,
        child: DecoratedBox(
          decoration: isSelected ? selectedDecoration : unselectedDecoration,
          position: DecorationPosition.foreground,
          child: thumbnail,
        ),
      ),
    );
  }
}
