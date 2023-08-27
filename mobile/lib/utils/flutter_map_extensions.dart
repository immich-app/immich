import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'dart:math' as math;

extension MoveByBounds on MapController {
  // TODO: Remove this in favor of built-in method when upgrading flutter_map to 5.0.0
  LatLng? centerBoundsWithPadding(
    LatLng coordinates,
    Offset offset, {
    double? zoomLevel,
  }) {
    const crs = Epsg3857();
    final oldCenterPt = crs.latLngToPoint(coordinates, zoomLevel ?? zoom);
    final mapCenterPoint = _rotatePoint(
      oldCenterPt,
      oldCenterPt - CustomPoint(offset.dx, offset.dy),
    );
    return crs.pointToLatLng(mapCenterPoint, zoomLevel ?? zoom);
  }

  CustomPoint<double> _rotatePoint(
    CustomPoint<double> mapCenter,
    CustomPoint<double> point, {
    bool counterRotation = true,
  }) {
    final counterRotationFactor = counterRotation ? -1 : 1;

    final m = Matrix4.identity()
      ..translate(mapCenter.x, mapCenter.y)
      ..rotateZ(degToRadian(rotation) * counterRotationFactor)
      ..translate(-mapCenter.x, -mapCenter.y);

    final tp = MatrixUtils.transformPoint(m, Offset(point.x, point.y));

    return CustomPoint(tp.dx, tp.dy);
  }

  double getTapThresholdForZoomLevel() {
    const scale = [
      25000000,
      15000000,
      8000000,
      4000000,
      2000000,
      1000000,
      500000,
      250000,
      100000,
      50000,
      25000,
      15000,
      8000,
      4000,
      2000,
      1000,
      500,
      250,
      100,
      50,
      25,
      10,
      5,
    ];
    return scale[math.max(0, math.min(20, zoom.round() + 2))].toDouble() / 6;
  }
}
