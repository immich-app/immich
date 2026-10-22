import 'package:flutter/material.dart';

class ImmichLogo extends StatelessWidget {
  final double size;

  const ImmichLogo({super.key, this.size = 100});

  @override
  Widget build(BuildContext context) {
    return Image(
      image: const AssetImage('assets/immich-logo.png'),
      width: size,
      filterQuality: FilterQuality.high,
      isAntiAlias: true,
    );
  }
}
