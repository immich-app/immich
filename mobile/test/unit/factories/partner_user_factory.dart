import 'package:immich_mobile/domain/models/user.model.dart';

import '../../utils.dart';

class PartnerFactory {
  const PartnerFactory();

  static Partner create({String? id, String? email, String? name, bool? inTimeline}) {
    id = TestUtils.uuid(id);
    return Partner(
      id: id,
      email: email ?? '$id@test.com',
      name: name ?? 'user_$id',
      inTimeline: inTimeline ?? false,
      hasProfileImage: false,
      profileChangedAt: DateTime.now(),
    );
  }
}
