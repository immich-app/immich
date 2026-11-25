import 'package:pigeon/pigeon.dart';

@ConfigurePigeon(
  PigeonOptions(
    dartOut: 'lib/platform/system_occlusions_api.g.dart',
    swiftOut: 'ios/Runner/Core/SystemOcclusions.g.swift',
    swiftOptions: SwiftOptions(includeErrorClass: false),
    dartOptions: DartOptions(),
    dartPackageName: 'immich_mobile',
  ),
)
class OcclusionRect {
  final double left;
  final double top;
  final double right;
  final double bottom;

  const OcclusionRect({required this.left, required this.top, required this.right, required this.bottom});
}

@FlutterApi()
abstract class SystemOcclusionsFlutterApi {
  /// New occlusion reserved regions (e.g. a status bar)
  void onChanged(List<OcclusionRect> occlusions);
}
