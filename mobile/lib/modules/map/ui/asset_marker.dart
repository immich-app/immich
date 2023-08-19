import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';

class AssetMarker extends Marker {
  String remoteId;

  AssetMarker({
    Key? key,
    required LatLng point,
    required WidgetBuilder builder,
    double width = 100.0,
    double height = 100.0,
    bool? rotate,
    Offset? rotateOrigin,
    AlignmentGeometry? rotateAlignment,
    AnchorPos? anchorPos,
    required this.remoteId,
  }) : super(
          key: key,
          point: point,
          builder: builder,
          width: width,
          height: height,
          anchorPos: anchorPos,
          rotate: rotate,
          rotateOrigin: rotateOrigin,
          rotateAlignment: rotateAlignment,
        );
}
