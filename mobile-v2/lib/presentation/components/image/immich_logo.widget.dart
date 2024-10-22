import 'package:flutter/widgets.dart';
import 'package:immich_mobile/utils/constants/assets.gen.dart';
import 'package:immich_mobile/utils/extensions/build_context.extension.dart';

class ImLogo extends StatelessWidget {
  const ImLogo({
    this.dimension,
    this.filterQuality = FilterQuality.high,
    super.key,
  });

  /// The dimension of the image.
  final double? dimension;

  /// The rendering quality
  final FilterQuality filterQuality;

  @override
  Widget build(BuildContext context) {
    return Image(
      image: Assets.images.immichLogo.provider(),
      semanticLabel: 'Immich Logo',
      width: dimension,
      height: dimension,
      isAntiAlias: true,
      filterQuality: filterQuality,
    );
  }
}

// ignore: prefer-single-widget-per-file
class ImLogoText extends StatelessWidget {
  const ImLogoText({
    super.key,
    this.fontSize = 48,
    this.filterQuality = FilterQuality.high,
  });

  final double fontSize;

  /// The rendering quality
  final FilterQuality filterQuality;

  @override
  Widget build(BuildContext context) {
    return Image(
      image: (context.isDarkTheme
          ? Assets.images.immichTextDark.provider
          : Assets.images.immichTextLight.provider)(),
      semanticLabel: 'Immich Logo Text',
      width: fontSize * 4,
      filterQuality: FilterQuality.high,
    );
  }
}
