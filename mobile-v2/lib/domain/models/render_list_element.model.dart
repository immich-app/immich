sealed class RenderListElement {
  const RenderListElement();
}

class RenderListMonthHeaderElement extends RenderListElement {
  final String header;

  const RenderListMonthHeaderElement({required this.header});
}

class RenderListDayHeaderElement extends RenderListElement {
  final String header;

  const RenderListDayHeaderElement({required this.header});
}

class RenderListAssetElement extends RenderListElement {
  final DateTime date;
  final int assetCount;
  final int assetOffset;

  const RenderListAssetElement({
    required this.date,
    required this.assetCount,
    required this.assetOffset,
  });

  RenderListAssetElement copyWith({
    DateTime? date,
    int? assetCount,
    int? assetOffset,
  }) {
    return RenderListAssetElement(
      date: date ?? this.date,
      assetCount: assetCount ?? this.assetCount,
      assetOffset: assetOffset ?? this.assetOffset,
    );
  }

  @override
  String toString() =>
      'RenderListAssetElement(date: $date, assetCount: $assetCount, assetOffset: $assetOffset)';

  @override
  bool operator ==(covariant RenderListAssetElement other) {
    if (identical(this, other)) return true;

    return other.date == date &&
        other.assetCount == assetCount &&
        other.assetOffset == assetOffset;
  }

  @override
  int get hashCode =>
      date.hashCode ^ assetCount.hashCode ^ assetOffset.hashCode;
}
