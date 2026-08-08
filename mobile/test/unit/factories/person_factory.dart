import 'package:immich_mobile/domain/models/person.model.dart';

import '../../utils.dart';

class PersonFactory {
  static DriftPerson create({String? id, String? name}) {
    id ??= TestUtils.uuid();
    name ??= 'person_$id';
    return DriftPerson(
      id: id,
      name: name,
      createdAt: TestUtils.date(),
      updatedAt: TestUtils.date(),
      isFavorite: TestUtils.randDouble() > 0.5,
      isHidden: TestUtils.randDouble() > 0.5,
      birthDate: TestUtils.date(),
    );
  }
}
