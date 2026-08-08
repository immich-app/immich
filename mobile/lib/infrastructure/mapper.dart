import 'package:immich_mobile/domain/models/person.model.dart';
import 'package:immich_mobile/domain/models/user.model.dart';
import 'package:immich_mobile/infrastructure/entities/partner.entity.drift.dart';
import 'package:immich_mobile/infrastructure/entities/person.entity.drift.dart';
import 'package:immich_mobile/infrastructure/entities/person_user.entity.drift.dart';
import 'package:immich_mobile/infrastructure/entities/user.entity.drift.dart';

User mapToUser(UserEntityData data) => User(
  id: data.id,
  name: data.name,
  email: data.email,
  hasProfileImage: data.hasProfileImage,
  profileChangedAt: data.profileChangedAt,
  avatarColor: data.avatarColor,
);

Partner mapToPartner(UserEntityData user, PartnerEntityData partner) =>
    Partner.fromUser(mapToUser(user), inTimeline: partner.inTimeline);

DriftPerson mapToPerson(PersonEntityData person, PersonUserEntityData personUser) {
  final updatedAt = personUser.updatedAt.isAfter(person.updatedAt) ? personUser.updatedAt : person.updatedAt;

  return .new(
    id: person.id,
    createdAt: person.createdAt,
    updatedAt: updatedAt,
    name: person.name,
    isFavorite: personUser.isFavorite,
    isHidden: personUser.isHidden,
    birthDate: person.birthDate,
  );
}
