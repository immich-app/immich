import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/domain/models/tag.model.dart';

void main() {
  test('private tags and their descendants are hidden until unlocked', () {
    const tags = [
      Tag(id: 'travel', value: 'Travel'),
      Tag(id: 'family', value: 'Family', isPrivate: true),
      Tag(id: 'holiday', value: 'Family/Holiday', parentId: 'family'),
    ];

    expect(tags.visibleWhenLocked.map((tag) => tag.id), ['travel']);
  });
}
