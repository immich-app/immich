import 'previews.g.dart';
import 'snapshot.dart';

void main() {
  for (final MapEntry(key: subject, value: build) in previews.entries) {
    previewSnapshotTest(subject, build);
  }
}
