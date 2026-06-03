import 'package:drift/drift.dart';
import 'package:immich_mobile/domain/models/user.model.dart';
import 'package:immich_mobile/infrastructure/entities/partner.entity.drift.dart';
import 'package:immich_mobile/infrastructure/entities/user.entity.dart';
import 'package:immich_mobile/infrastructure/entities/user.entity.drift.dart';
import 'package:immich_mobile/infrastructure/utils/drift_default.mixin.dart';

@TableIndex.sql('CREATE INDEX IF NOT EXISTS idx_partner_shared_with_id ON partner_entity (shared_with_id)')
class PartnerEntity extends Table with DriftDefaultsMixin {
  const PartnerEntity();

  TextColumn get sharedById => text().references(UserEntity, #id, onDelete: KeyAction.cascade)();

  TextColumn get sharedWithId => text().references(UserEntity, #id, onDelete: KeyAction.cascade)();

  BoolColumn get inTimeline => boolean().withDefault(const Constant(false))();

  @override
  Set<Column> get primaryKey => {sharedById, sharedWithId};

  static Partner rowToPartner(UserEntityData user, PartnerEntityData partner) => Partner(
    id: user.id,
    email: user.email,
    name: user.name,
    profileChangedAt: user.profileChangedAt,
    hasProfileImage: user.hasProfileImage,
    avatarColor: user.avatarColor,
    inTimeline: partner.inTimeline,
  );
}
