class Bucket {
  final int assetCount;

  const Bucket({required this.assetCount});

  @override
  bool operator ==(covariant Bucket other) {
    return assetCount == other.assetCount;
  }

  @override
  int get hashCode => assetCount.hashCode;
}

class TimeBucket extends Bucket {
  final DateTime date;

  const TimeBucket({required this.date, required super.assetCount});

  @override
  bool operator ==(covariant TimeBucket other) {
    return super == other && date == other.date;
  }

  @override
  int get hashCode => super.hashCode ^ date.hashCode;
}
