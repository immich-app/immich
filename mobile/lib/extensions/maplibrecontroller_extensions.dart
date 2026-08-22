import 'dart:async';

import 'package:flutter/services.dart';
import 'package:maplibre_gl/maplibre_gl.dart';

extension MapMarkers on MapLibreMapController {
  Future<Symbol?> addMarkerAtLatLng(LatLng centre) async {
    // no marker is displayed if asset-path is incorrect
    try {
      final ByteData bytes = await rootBundle.load("assets/location-pin.png");
      await addImage("mapMarker", bytes.buffer.asUint8List());
      return addSymbol(SymbolOptions(geometry: centre, iconImage: "mapMarker", iconSize: 0.15, iconAnchor: "bottom"));
    } finally {
      // no-op
    }
  }
}
