// ignore_for_file: public_member_api_docs, sort_constructors_first

import 'package:immich_mobile/domain/models/person.dart';

abstract interface class IPersonApiRepository {
  Future<List<Person>> getAll({bool withHidden = false});
  Future<Person> update(String id, {String? name, bool? isHidden});
}
