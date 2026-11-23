import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';

class EndInsetBar extends StatelessWidget {
  const EndInsetBar({super.key, required this.child});

  static const _statusBarOverBlack = SystemUiOverlayStyle(statusBarBrightness: Brightness.dark);

  final Widget child;

  @override
  Widget build(BuildContext context) {
    final isRtl = Directionality.of(context) == TextDirection.rtl;
    final endInset = isRtl ? context.padding.left : context.padding.right;
    return Stack(
      fit: StackFit.passthrough,
      children: [
        ColoredBox(
          color: Colors.black,
          child: SafeArea(left: isRtl, right: !isRtl, top: false, bottom: false, child: child),
        ),
        if (endInset > 0)
          const Positioned.fill(
            child: AnnotatedRegion<SystemUiOverlayStyle>(value: _statusBarOverBlack, child: SizedBox.expand()),
          ),
      ],
    );
  }
}
