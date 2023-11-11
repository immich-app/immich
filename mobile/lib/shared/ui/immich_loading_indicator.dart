import 'package:flutter/material.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';

class ImmichLoadingIndicator extends StatelessWidget {
  final double? borderRadius;

  const ImmichLoadingIndicator({
    Key? key,
    this.borderRadius,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 60,
      width: 60,
      decoration: BoxDecoration(
        color: context.primaryColor.withAlpha(200),
        borderRadius: BorderRadius.circular(borderRadius ?? 10),
      ),
      padding: const EdgeInsets.all(15),
      child: const CircularProgressIndicator(
        color: Colors.white,
        strokeWidth: 2,
      ),
    );
  }
}
