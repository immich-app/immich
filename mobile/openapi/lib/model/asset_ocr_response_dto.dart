// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class AssetOcrResponseDto {
  const AssetOcrResponseDto({
    required this.assetId,
    required this.boxScore,
    required this.id,
    required this.text,
    required this.textScore,
    required this.x1,
    required this.x2,
    required this.x3,
    required this.x4,
    required this.y1,
    required this.y2,
    required this.y3,
    required this.y4,
  });

  final String assetId;

  /// Confidence score for text detection box
  final double boxScore;

  final String id;

  /// Recognized text
  final String text;

  /// Confidence score for text recognition
  final double textScore;

  /// Normalized x coordinate of box corner 1 (0-1)
  final double x1;

  /// Normalized x coordinate of box corner 2 (0-1)
  final double x2;

  /// Normalized x coordinate of box corner 3 (0-1)
  final double x3;

  /// Normalized x coordinate of box corner 4 (0-1)
  final double x4;

  /// Normalized y coordinate of box corner 1 (0-1)
  final double y1;

  /// Normalized y coordinate of box corner 2 (0-1)
  final double y2;

  /// Normalized y coordinate of box corner 3 (0-1)
  final double y3;

  /// Normalized y coordinate of box corner 4 (0-1)
  final double y4;

  static AssetOcrResponseDto? fromJson(dynamic value) {
    ApiCompat.upgrade<AssetOcrResponseDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(
      assetId: json[r'assetId'] as String,
      boxScore: (json[r'boxScore'] as num).toDouble(),
      id: json[r'id'] as String,
      text: json[r'text'] as String,
      textScore: (json[r'textScore'] as num).toDouble(),
      x1: (json[r'x1'] as num).toDouble(),
      x2: (json[r'x2'] as num).toDouble(),
      x3: (json[r'x3'] as num).toDouble(),
      x4: (json[r'x4'] as num).toDouble(),
      y1: (json[r'y1'] as num).toDouble(),
      y2: (json[r'y2'] as num).toDouble(),
      y3: (json[r'y3'] as num).toDouble(),
      y4: (json[r'y4'] as num).toDouble(),
    );
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json[r'assetId'] = assetId;
    json[r'boxScore'] = boxScore;
    json[r'id'] = id;
    json[r'text'] = text;
    json[r'textScore'] = textScore;
    json[r'x1'] = x1;
    json[r'x2'] = x2;
    json[r'x3'] = x3;
    json[r'x4'] = x4;
    json[r'y1'] = y1;
    json[r'y2'] = y2;
    json[r'y3'] = y3;
    json[r'y4'] = y4;
    return json;
  }

  AssetOcrResponseDto copyWith({
    String? assetId,
    double? boxScore,
    String? id,
    String? text,
    double? textScore,
    double? x1,
    double? x2,
    double? x3,
    double? x4,
    double? y1,
    double? y2,
    double? y3,
    double? y4,
  }) {
    return .new(
      assetId: assetId ?? this.assetId,
      boxScore: boxScore ?? this.boxScore,
      id: id ?? this.id,
      text: text ?? this.text,
      textScore: textScore ?? this.textScore,
      x1: x1 ?? this.x1,
      x2: x2 ?? this.x2,
      x3: x3 ?? this.x3,
      x4: x4 ?? this.x4,
      y1: y1 ?? this.y1,
      y2: y2 ?? this.y2,
      y3: y3 ?? this.y3,
      y4: y4 ?? this.y4,
    );
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other is AssetOcrResponseDto &&
            assetId == other.assetId &&
            boxScore == other.boxScore &&
            id == other.id &&
            text == other.text &&
            textScore == other.textScore &&
            x1 == other.x1 &&
            x2 == other.x2 &&
            x3 == other.x3 &&
            x4 == other.x4 &&
            y1 == other.y1 &&
            y2 == other.y2 &&
            y3 == other.y3 &&
            y4 == other.y4);
  }

  @override
  int get hashCode {
    return Object.hashAll([assetId, boxScore, id, text, textScore, x1, x2, x3, x4, y1, y2, y3, y4]);
  }

  @override
  String toString() =>
      'AssetOcrResponseDto(assetId=$assetId, boxScore=$boxScore, id=$id, text=$text, textScore=$textScore, x1=$x1, x2=$x2, x3=$x3, x4=$x4, y1=$y1, y2=$y2, y3=$y3, y4=$y4)';
}
