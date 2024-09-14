import 'package:flutter/widgets.dart';
import 'package:immich_mobile/utils/constants/assets.gen.dart';
import 'package:immich_mobile/utils/extensions/build_context.extension.dart';

class ImLogo extends StatelessWidget {
  const ImLogo({
    this.width,
    this.filterQuality = FilterQuality.high,
    super.key,
  });

  /// The width of the image.
  final double? width;

  /// The rendering quality
  final FilterQuality filterQuality;

  @override
  Widget build(BuildContext context) {
    return Image(
      width: width,
      filterQuality: filterQuality,
      semanticLabel: 'Immich Logo',
      image: Assets.images.immichLogo.provider(),
      isAntiAlias: true,
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
      semanticLabel: 'Immich Logo Text',
      image: (context.isDarkTheme
          ? Assets.images.immichTextDark.provider
          : Assets.images.immichTextLight.provider)(),
      width: fontSize * 4,
      filterQuality: FilterQuality.high,
    );
  }
}
