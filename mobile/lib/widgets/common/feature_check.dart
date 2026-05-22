import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/models/server_info/server_features.model.dart';
import 'package:immich_mobile/providers/server_info.provider.dart';

/// A utility widget that conditionally renders its child based on a server feature flag.
///
/// Example usage:
/// ```dart
/// FeatureCheck(
///   feature: (features) => features.ocr,
///   child: Text('OCR is enabled'),
///   fallback: Text('OCR is not available'),
/// )
/// ```
class FeatureCheck extends ConsumerWidget {
  /// A function that extracts the specific feature flag from ServerFeatures
  final bool Function(ServerFeatures) feature;

  /// The widget to display when the feature is enabled
  final Widget child;

  /// Optional widget to display when the feature is disabled
  final Widget? fallback;

  const FeatureCheck({super.key, required this.feature, required this.child, this.fallback});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final serverFeatures = ref.watch(serverInfoProvider.select((s) => s.serverFeatures));
    final isFeatureEnabled = feature(serverFeatures);
    if (isFeatureEnabled) {
      return child;
    }

    return fallback ?? const SizedBox.shrink();
  }
}
