import 'package:flutter/widgets.dart';

/// Keeps progressive image streams delivering frames when the platform
/// requests reduced animations.
///
/// The full-image providers emit multiple, increasingly higher-quality images
/// (thumbnail -> preview -> original) as successive frames of a single image
/// stream. Since Flutter 3.44, [Image] stops listening to its stream after the
/// first frame when [MediaQueryData.disableAnimations] is set (e.g. Android's
/// "Remove animations" accessibility setting or an animator duration scale of
/// zero), which would freeze these images at their low-res first frame.
/// Photos are not animations, so clear the flag for this subtree.
class ProgressiveImageGuard extends StatelessWidget {
  const ProgressiveImageGuard({required this.child, super.key});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    final disableAnimations = MediaQuery.maybeDisableAnimationsOf(context) ?? false;
    if (!disableAnimations) {
      return child;
    }
    return MediaQuery(data: MediaQuery.of(context).copyWith(disableAnimations: false), child: child);
  }
}
