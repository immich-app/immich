import 'package:flutter/material.dart';

class EditFilter {
  final String name;
  final double rrBias;
  final double rgBias;
  final double rbBias;
  final double grBias;
  final double ggBias;
  final double gbBias;
  final double brBias;
  final double bgBias;
  final double bbBias;
  final double rOffset;
  final double gOffset;
  final double bOffset;

  const EditFilter({
    required this.name,
    required this.rrBias,
    required this.rgBias,
    required this.rbBias,
    required this.grBias,
    required this.ggBias,
    required this.gbBias,
    required this.brBias,
    required this.bgBias,
    required this.bbBias,
    required this.rOffset,
    required this.gOffset,
    required this.bOffset,
  });

  bool get isIdentity =>
      rrBias == 1 &&
      rgBias == 0 &&
      rbBias == 0 &&
      grBias == 0 &&
      ggBias == 1 &&
      gbBias == 0 &&
      brBias == 0 &&
      bgBias == 0 &&
      bbBias == 1 &&
      rOffset == 0 &&
      gOffset == 0 &&
      bOffset == 0;

  factory EditFilter.fromMatrix(List<double> matrix, String name) {
    if (matrix.length != 20) {
      throw ArgumentError('Color filter matrix must have 20 elements');
    }

    return EditFilter(
      name: name,
      rrBias: matrix[0],
      rgBias: matrix[1],
      rbBias: matrix[2],
      grBias: matrix[5],
      ggBias: matrix[6],
      gbBias: matrix[7],
      brBias: matrix[10],
      bgBias: matrix[11],
      bbBias: matrix[12],
      rOffset: matrix[4],
      gOffset: matrix[9],
      bOffset: matrix[14],
    );
  }

  factory EditFilter.fromDtoParams(Map<String, dynamic> params, String name) {
    return EditFilter(
      name: name,
      rrBias: (params['rrBias'] as num).toDouble(),
      rgBias: (params['rgBias'] as num).toDouble(),
      rbBias: (params['rbBias'] as num).toDouble(),
      grBias: (params['grBias'] as num).toDouble(),
      ggBias: (params['ggBias'] as num).toDouble(),
      gbBias: (params['gbBias'] as num).toDouble(),
      brBias: (params['brBias'] as num).toDouble(),
      bgBias: (params['bgBias'] as num).toDouble(),
      bbBias: (params['bbBias'] as num).toDouble(),
      rOffset: (params['rOffset'] as num).toDouble(),
      gOffset: (params['gOffset'] as num).toDouble(),
      bOffset: (params['bOffset'] as num).toDouble(),
    );
  }

  ColorFilter get colorFilter {
    final colorMatrix = <double>[
      rrBias,
      rgBias,
      rbBias,
      0,
      rOffset,
      grBias,
      ggBias,
      gbBias,
      0,
      gOffset,
      brBias,
      bgBias,
      bbBias,
      0,
      bOffset,
      0,
      0,
      0,
      1,
      0,
    ];

    return ColorFilter.matrix(colorMatrix);
  }

  Map<String, dynamic> get dtoParameters {
    return {
      "rrBias": rrBias,
      "rgBias": rgBias,
      "rbBias": rbBias,
      "grBias": grBias,
      "ggBias": ggBias,
      "gbBias": gbBias,
      "brBias": brBias,
      "bgBias": bgBias,
      "bbBias": bbBias,
      "rOffset": rOffset,
      "gOffset": gOffset,
      "bOffset": bOffset,
    };
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    if (other is! EditFilter) return false;

    return rrBias == other.rrBias &&
        rgBias == other.rgBias &&
        rbBias == other.rbBias &&
        grBias == other.grBias &&
        ggBias == other.ggBias &&
        gbBias == other.gbBias &&
        brBias == other.brBias &&
        bgBias == other.bgBias &&
        bbBias == other.bbBias &&
        rOffset == other.rOffset &&
        gOffset == other.gOffset &&
        bOffset == other.bOffset;
  }

  @override
  int get hashCode =>
      name.hashCode ^
      rrBias.hashCode ^
      rgBias.hashCode ^
      rbBias.hashCode ^
      grBias.hashCode ^
      ggBias.hashCode ^
      gbBias.hashCode ^
      brBias.hashCode ^
      bgBias.hashCode ^
      bbBias.hashCode ^
      rOffset.hashCode ^
      gOffset.hashCode ^
      bOffset.hashCode;
}

final List<EditFilter> filters = [
  //Original
  EditFilter.fromMatrix([1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0], "Original"),
  //Vintage
  EditFilter.fromMatrix([0.8, 0.1, 0.1, 0, 20, 0.1, 0.8, 0.1, 0, 20, 0.1, 0.1, 0.8, 0, 20, 0, 0, 0, 1, 0], "Vintage"),
  //Mood
  EditFilter.fromMatrix([1.2, 0.1, 0.1, 0, 10, 0.1, 1, 0.1, 0, 10, 0.1, 0.1, 1, 0, 10, 0, 0, 0, 1, 0], "Mood"),
  //Crisp
  EditFilter.fromMatrix([1.2, 0, 0, 0, 0, 0, 1.2, 0, 0, 0, 0, 0, 1.2, 0, 0, 0, 0, 0, 1, 0], "Crisp"),
  //Cool
  EditFilter.fromMatrix([0.9, 0, 0.2, 0, 0, 0, 1, 0.1, 0, 0, 0.1, 0, 1.2, 0, 0, 0, 0, 0, 1, 0], "Cool"),
  //Blush
  EditFilter.fromMatrix([1.1, 0.1, 0.1, 0, 10, 0.1, 1, 0.1, 0, 10, 0.1, 0.1, 1, 0, 5, 0, 0, 0, 1, 0], "Blush"),
  //Sunkissed
  EditFilter.fromMatrix([1.3, 0, 0.1, 0, 15, 0, 1.1, 0.1, 0, 10, 0, 0, 0.9, 0, 5, 0, 0, 0, 1, 0], "Sunkissed"),
  //Fresh
  EditFilter.fromMatrix([1.2, 0, 0, 0, 20, 0, 1.2, 0, 0, 20, 0, 0, 1.1, 0, 20, 0, 0, 0, 1, 0], "Fresh"),
  //Classic
  EditFilter.fromMatrix([1.1, 0, -0.1, 0, 10, -0.1, 1.1, 0.1, 0, 5, 0, -0.1, 1.1, 0, 0, 0, 0, 0, 1, 0], "Classic"),
  //Lomo-ish
  EditFilter.fromMatrix([1.5, 0, 0.1, 0, 0, 0, 1.45, 0, 0, 0, 0.1, 0, 1.3, 0, 0, 0, 0, 0, 1, 0], "Lomo-ish"),
  //Nashville
  EditFilter.fromMatrix([
    1.2,
    0.15,
    -0.15,
    0,
    15,
    0.1,
    1.1,
    0.1,
    0,
    10,
    -0.05,
    0.2,
    1.25,
    0,
    5,
    0,
    0,
    0,
    1,
    0,
  ], "Nashville"),
  //Valencia
  EditFilter.fromMatrix([1.15, 0.1, 0.1, 0, 20, 0.1, 1.1, 0, 0, 10, 0.1, 0.1, 1.2, 0, 5, 0, 0, 0, 1, 0], "Valencia"),
  //Clarendon
  EditFilter.fromMatrix([1.2, 0, 0, 0, 10, 0, 1.25, 0, 0, 10, 0, 0, 1.3, 0, 10, 0, 0, 0, 1, 0], "Clarendon"),
  //Moon
  EditFilter.fromMatrix([
    0.33,
    0.33,
    0.33,
    0,
    0,
    0.33,
    0.33,
    0.33,
    0,
    0,
    0.33,
    0.33,
    0.33,
    0,
    0,
    0,
    0,
    0,
    1,
    0,
  ], "Moon"),
  //Willow
  EditFilter.fromMatrix([0.5, 0.5, 0.5, 0, 20, 0.5, 0.5, 0.5, 0, 20, 0.5, 0.5, 0.5, 0, 20, 0, 0, 0, 1, 0], "Willow"),
  //Kodak
  EditFilter.fromMatrix([1.3, 0.1, -0.1, 0, 10, 0, 1.25, 0.1, 0, 10, 0, -0.1, 1.1, 0, 5, 0, 0, 0, 1, 0], "Kodak"),
  //Sunset
  EditFilter.fromMatrix([1.5, 0.2, 0, 0, 0, 0.1, 0.9, 0.1, 0, 0, -0.1, -0.2, 1.3, 0, 0, 0, 0, 0, 1, 0], "Sunset"),
  //Noir
  EditFilter.fromMatrix([1.3, -0.3, 0.1, 0, 0, -0.1, 1.2, -0.1, 0, 0, 0.1, -0.2, 1.3, 0, 0, 0, 0, 0, 1, 0], "Noir"),
  //Dreamy
  EditFilter.fromMatrix([1.1, 0.1, 0.1, 0, 0, 0.1, 1.1, 0.1, 0, 0, 0.1, 0.1, 1.1, 0, 15, 0, 0, 0, 1, 0], "Dreamy"),
  //Sepia
  EditFilter.fromMatrix([
    0.393,
    0.769,
    0.189,
    0,
    0,
    0.349,
    0.686,
    0.168,
    0,
    0,
    0.272,
    0.534,
    0.131,
    0,
    0,
    0,
    0,
    0,
    1,
    0,
  ], "Sepia"),
  //Radium
  EditFilter.fromMatrix([
    1.438,
    -0.062,
    -0.062,
    0,
    0,
    -0.122,
    1.378,
    -0.122,
    0,
    0,
    -0.016,
    -0.016,
    1.483,
    0,
    0,
    0,
    0,
    0,
    1,
    0,
  ], "Radium"),
  //Aqua
  EditFilter.fromMatrix([
    0.2126,
    0.7152,
    0.0722,
    0,
    0,
    0.2126,
    0.7152,
    0.0722,
    0,
    0,
    0.7873,
    0.2848,
    0.9278,
    0,
    0,
    0,
    0,
    0,
    1,
    0,
  ], "Aqua"),
  //Purple Haze
  EditFilter.fromMatrix([1.3, 0, 1.2, 0, 0, 0, 1.1, 0, 0, 0, 0.2, 0, 1.3, 0, 0, 0, 0, 0, 1, 0], "Purple Haze"),
  //Lemonade
  EditFilter.fromMatrix([1.2, 0.1, 0, 0, 0, 0, 1.1, 0.2, 0, 0, 0.1, 0, 0.7, 0, 0, 0, 0, 0, 1, 0], "Lemonade"),
  //Caramel
  EditFilter.fromMatrix([1.6, 0.2, 0, 0, 0, 0.1, 1.3, 0.1, 0, 0, 0, 0.1, 0.9, 0, 0, 0, 0, 0, 1, 0], "Caramel"),
  //Peachy
  EditFilter.fromMatrix([1.3, 0.5, 0, 0, 0, 0.2, 1.1, 0.3, 0, 0, 0.1, 0.1, 1.2, 0, 0, 0, 0, 0, 1, 0], "Peachy"),
  //Neon
  EditFilter.fromMatrix([1, 0, 1, 0, 0, 0, 2, 0, 0, 0, 0, 0, 3, 0, 0, 0, 0, 0, 1, 0], "Neon"),
  //Cold Morning
  EditFilter.fromMatrix([0.9, 0.1, 0.2, 0, 0, 0, 1, 0.1, 0, 0, 0.1, 0, 1.2, 0, 0, 0, 0, 0, 1, 0], "Cold Morning"),
  //Lush
  EditFilter.fromMatrix([0.9, 0.2, 0, 0, 0, 0, 1.2, 0, 0, 0, 0, 0, 1.1, 0, 0, 0, 0, 0, 1, 0], "Lush"),
  //Urban Neon
  EditFilter.fromMatrix([1.1, 0, 0.3, 0, 0, 0, 0.9, 0.3, 0, 0, 0.3, 0.1, 1.2, 0, 0, 0, 0, 0, 1, 0], "Urban Neon"),
  //Monochrome
  EditFilter.fromMatrix([0.6, 0.2, 0.2, 0, 0, 0.2, 0.6, 0.2, 0, 0, 0.2, 0.2, 0.7, 0, 0, 0, 0, 0, 1, 0], "Monochrome"),
];
