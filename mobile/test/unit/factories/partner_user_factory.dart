import 'package:immich_mobile/domain/models/user.model.dart';

import '../../utils.dart';

class PartnerFactory {
  const PartnerFactory();

  static Partner create({String? id, String? email, String? name, bool? inTimeline}) {
    final partnerId = TestUtils.uuid(id);
    return Partner(
      id: partnerId,
      email: email ?? '$partnerId@test.com',
      name: name ?? 'user_$partnerId',
      inTimeline: inTimeline ?? false,
      hasProfileImage: false,
      profileChangedAt: DateTime.now(),
    );
  }
}
