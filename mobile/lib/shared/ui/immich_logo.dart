import 'package:flutter/material.dart';

class ImmichLogo extends StatelessWidget {
  final double size;
  final dynamic heroTag;

  const ImmichLogo({
    super.key,
    this.size = 100,
    this.heroTag,
  });

  @override
  Widget build(BuildContext context) {
    return Hero(
      tag: heroTag,
      child: Image(
        image: const AssetImage('assets/immich-logo.png'),
        width: size,
        filterQuality: FilterQuality.high,
        isAntiAlias: true,
      ),
    );
  }
}
