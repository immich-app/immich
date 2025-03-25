import 'package:intl/intl.dart';

enum RenderListGroupBy { month, day }

sealed class RenderListElement {
  const RenderListElement({required this.date});

  final DateTime date;

  @override
  bool operator ==(covariant RenderListElement other) {
    if (identical(this, other)) return true;

    return date == other.date;
  }

  @override
  int get hashCode => date.hashCode;
}

/// Used to pad the render list elements
class RenderListPaddingElement extends RenderListElement {
  final double topPadding;

  const RenderListPaddingElement({
    required this.topPadding,
    required super.date,
  });

  factory RenderListPaddingElement.beforeElement({
    required double top,
    RenderListElement? before,
  }) =>
      RenderListPaddingElement(
        topPadding: top,
        date: before?.date ?? DateTime.now(),
      );

  @override
  bool operator ==(covariant RenderListPaddingElement other) {
    if (identical(this, other)) return true;

    return super == other && other.topPadding == topPadding;
  }

  @override
  int get hashCode => super.hashCode ^ topPadding.hashCode;
}

class RenderListMonthHeaderElement extends RenderListElement {
  late final String header;

  RenderListMonthHeaderElement({required super.date}) {
    final formatter = DateTime.now().year == date.year
        ? DateFormat.MMMM()
        : DateFormat.yMMMM();
    header = formatter.format(date);
  }

  @override
  String toString() =>
      'RenderListMonthHeaderElement(header: $header, date: $date)';

  @override
  bool operator ==(covariant RenderListMonthHeaderElement other) {
    if (identical(this, other)) return true;

    return super == other && header == other.header;
  }

  @override
  int get hashCode => super.hashCode ^ date.hashCode;
}

class RenderListDayHeaderElement extends RenderListElement {
  late final String header;

  RenderListDayHeaderElement({required super.date}) {
    header = DateFormat.yMMMMd().format(date);
  }

  @override
  String toString() =>
      'RenderListDayHeaderElement(header: $header, date: $date)';

  @override
  bool operator ==(covariant RenderListDayHeaderElement other) {
    if (identical(this, other)) return true;

    return super == other && header == other.header;
  }

  @override
  int get hashCode => super.hashCode ^ date.hashCode;
}

class RenderListAssetElement extends RenderListElement {
  final int assetCount;
  final int assetOffset;

  const RenderListAssetElement({
    required super.date,
    required this.assetCount,
    required this.assetOffset,
  });

  @override
  String toString() =>
      'RenderListAssetElement(date: $date, assetCount: $assetCount, assetOffset: $assetOffset)';

  @override
  bool operator ==(covariant RenderListAssetElement other) {
    if (identical(this, other)) return true;

    return super == other &&
        other.assetCount == assetCount &&
        other.assetOffset == assetOffset;
  }

  @override
  int get hashCode =>
      super.hashCode ^ assetCount.hashCode ^ assetOffset.hashCode;
}
