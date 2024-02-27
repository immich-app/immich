import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:immich_mobile/shared/models/asset.dart';
import 'package:immich_mobile/shared/ui/hooks/blurhash_hook.dart';

class BlurhashThumb extends HookWidget {
  final double height;
  final double width;
  final Asset asset;
  final EdgeInsets margin;

  const BlurhashThumb({
    super.key,
    required this.height,
    required this.width,
    required this.asset,
    required this.margin,
  });

  @override
  Widget build(BuildContext context) {
    final blurhash = useBlurHashRef(asset).value;
    if (blurhash == null) {
      return SizedBox(
        height: height,
        width: width,
      );
    }
    return Padding(
      padding: margin,
      child: Image.memory(
        blurhash,
        gaplessPlayback: true,
        frameBuilder: (
          BuildContext context,
          Widget child,
          int? frame,
          bool wasSynchronouslyLoaded,
        ) {
          if (wasSynchronouslyLoaded) {
            return child;
          }

          return AnimatedSwitcher(
            duration: const Duration(milliseconds: 100),
            child: frame != null
                ? child
                : SizedBox(
                    height: height,
                    width: width,
                  ),
          );
        },
        fit: BoxFit.cover,
        height: height,
        width: width,
      ),
    );
  }
}
