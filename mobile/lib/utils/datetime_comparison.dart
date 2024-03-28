bool isAtSameMomentAs(DateTime? a, DateTime? b) =>
    (a == null && b == null) ||
    ((a != null && b != null) && a.isAtSameMomentAs(b));
