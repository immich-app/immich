import 'package:flutter/material.dart';
import 'package:immich_mobile/widgets/common/transparent_image.dart';

class FadeInPlaceholderImage extends StatelessWidget {
  final Widget placeholder;
  final ImageProvider image;
  final Duration duration;
  final BoxFit fit;

  const FadeInPlaceholderImage({
    super.key,
    required this.placeholder,
    required this.image,
    this.duration = const Duration(milliseconds: 100),
    this.fit = BoxFit.cover,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox.expand(
      child: Stack(
        fit: StackFit.expand,
        children: [
          placeholder,
          FadeInImage(
            fadeInDuration: duration,
            image: image,
            fit: fit,
            placeholder: MemoryImage(kTransparentImage),
          ),
        ],
      ),
    );
  }
}
