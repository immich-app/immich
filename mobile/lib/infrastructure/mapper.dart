import 'package:immich_mobile/domain/models/user.model.dart';
import 'package:immich_mobile/infrastructure/entities/partner.entity.drift.dart';
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
