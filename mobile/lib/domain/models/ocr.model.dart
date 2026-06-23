class Ocr {
  final String id;
  final String assetId;
  final double x1;
  final double y1;
  final double x2;
  final double y2;
  final double x3;
  final double y3;
  final double x4;
  final double y4;
  final double boxScore;
  final double textScore;
  final String text;
  final bool isVisible;

  const Ocr({
    required this.id,
    required this.assetId,
    required this.x1,
    required this.y1,
    required this.x2,
    required this.y2,
    required this.x3,
    required this.y3,
    required this.x4,
    required this.y4,
    required this.boxScore,
    required this.textScore,
    required this.text,
    required this.isVisible,
  });

  Ocr copyWith({
    String? id,
    String? assetId,
    double? x1,
    double? y1,
    double? x2,
    double? y2,
    double? x3,
    double? y3,
    double? x4,
    double? y4,
    double? boxScore,
    double? textScore,
    String? text,
    bool? isVisible,
  }) {
    return Ocr(
      id: id ?? this.id,
      assetId: assetId ?? this.assetId,
      x1: x1 ?? this.x1,
      y1: y1 ?? this.y1,
      x2: x2 ?? this.x2,
      y2: y2 ?? this.y2,
      x3: x3 ?? this.x3,
      y3: y3 ?? this.y3,
      x4: x4 ?? this.x4,
      y4: y4 ?? this.y4,
      boxScore: boxScore ?? this.boxScore,
      textScore: textScore ?? this.textScore,
      text: text ?? this.text,
      isVisible: isVisible ?? this.isVisible,
    );
  }

  @override
  String toString() {
    return '''Ocr {
    id: $id,
    assetId: $assetId,
    x1: $x1,
    y1: $y1,
    x2: $x2,
    y2: $y2,
    x3: $x3,
    y3: $y3,
    x4: $x4,
    y4: $y4,
    boxScore: $boxScore,
    textScore: $textScore,
    text: $text,
    isVisible: $isVisible
  }''';
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) {
      return true;
    }

    return other is Ocr &&
        other.id == id &&
        other.assetId == assetId &&
        other.x1 == x1 &&
        other.y1 == y1 &&
        other.x2 == x2 &&
        other.y2 == y2 &&
        other.x3 == x3 &&
        other.y3 == y3 &&
        other.x4 == x4 &&
        other.y4 == y4 &&
        other.boxScore == boxScore &&
        other.textScore == textScore &&
        other.text == text &&
        other.isVisible == isVisible;
  }

  @override
  int get hashCode {
    return id.hashCode ^
        assetId.hashCode ^
        x1.hashCode ^
        y1.hashCode ^
        x2.hashCode ^
        y2.hashCode ^
        x3.hashCode ^
        y3.hashCode ^
        x4.hashCode ^
        y4.hashCode ^
        boxScore.hashCode ^
        textScore.hashCode ^
        text.hashCode ^
        isVisible.hashCode;
  }
}
