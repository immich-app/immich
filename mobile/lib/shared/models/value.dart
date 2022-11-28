import 'package:isar/isar.dart';
import 'dart:convert';

import 'package:openapi/api.dart';

part 'value.g.dart';

@Collection()
class Value {
  Value(this.id, {this.intValue, this.strValue});
  final Id id;
  final int? intValue;
  final String? strValue;
}

enum DbKey {
  deviceInfo(1, DeviceInfoResponseDto.fromJson),
  loggedInUser(2),
  remoteAssetsEtag(3),
  ;

  const DbKey(this._id, [this._fromJson]);
  final int _id;
  final Function(dynamic)? _fromJson;
}

extension IsarKeyValueHelper on IsarCollection<Value> {
  Future<int> getInt(DbKey key, [int defaultValue = 0]) async {
    return (await get(key._id))?.intValue ?? defaultValue;
  }

  int getIntSync(DbKey key, [int defaultValue = 0]) {
    return getSync(key._id)?.intValue ?? defaultValue;
  }

  Future<String?> getStr(DbKey key, [String? defaultValue]) async {
    return (await get(key._id))?.strValue ?? defaultValue;
  }

  String? getStrSync(DbKey key, [String? defaultValue]) {
    return getSync(key._id)?.strValue ?? defaultValue;
  }

  Future<T> getJson<T>(DbKey key, [T? defaultValue]) async {
    final String? data = await getStr(key);
    return data == null ? null : key._fromJson!(json.decode(data));
  }

  T getJsonSync<T>(DbKey key, [T? defaultValue]) {
    final String? data = getStrSync(key);
    return data == null ? null : key._fromJson!(json.decode(data));
  }

  Future<bool?> getBool(DbKey key, [bool? defaultValue]) async {
    final int? i = (await get(key._id))?.intValue;
    return i == null ? defaultValue : i != 0;
  }

  bool? getBoolSync(DbKey key, [bool? defaultValue]) {
    final int? i = getSync(key._id)?.intValue;
    return i == null ? defaultValue : i != 0;
  }

  Future<void> setInt(DbKey key, int value) async {
    await put(Value(key._id, intValue: value));
  }

  void setIntSync(DbKey key, int value) {
    putSync(Value(key._id, intValue: value), saveLinks: false);
  }

  Future<void> setStr(DbKey key, String value) async {
    await put(Value(key._id, strValue: value));
  }

  void setStrSync(DbKey key, String value) {
    putSync(Value(key._id, strValue: value), saveLinks: false);
  }

  Future<void> setJson(DbKey key, Map<String, dynamic> value) async {
    return setStr(key, json.encode(value));
  }

  void setJsonSync(DbKey key, Map<String, dynamic> value) {
    setStrSync(key, json.encode(value));
  }

  Future<void> setBool(DbKey key, bool value) async {
    await put(Value(key._id, intValue: value ? 1 : 0));
  }

  void setBoolSync(DbKey key, bool value) {
    putSync(Value(key._id, intValue: value ? 1 : 0), saveLinks: false);
  }

  Future<bool> remove(DbKey key) {
    return delete(key._id);
  }

  void removeSync(DbKey key) {
    deleteSync(key._id);
  }
}
