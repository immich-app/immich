// dart format width=80
// GENERATED CODE, DO NOT EDIT BY HAND.
// ignore_for_file: type=lint
import 'package:drift/drift.dart';

class UserEntity extends Table with TableInfo<UserEntity, UserEntityData> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  UserEntity(this.attachedDatabase, [this._alias]);
  late final GeneratedColumn<String> id = GeneratedColumn<String>(
    'id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  late final GeneratedColumn<String> name = GeneratedColumn<String>(
    'name',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  late final GeneratedColumn<String> email = GeneratedColumn<String>(
    'email',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  late final GeneratedColumn<bool> hasProfileImage = GeneratedColumn<bool>(
    'has_profile_image',
    aliasedName,
    false,
    type: DriftSqlType.bool,
    requiredDuringInsert: false,
    defaultConstraints: GeneratedColumn.constraintIsAlways(
      'CHECK ("has_profile_image" IN (0, 1))',
    ),
    defaultValue: const CustomExpression('0'),
  );
  late final GeneratedColumn<DateTime> profileChangedAt =
      GeneratedColumn<DateTime>(
        'profile_changed_at',
        aliasedName,
        false,
        type: DriftSqlType.dateTime,
        requiredDuringInsert: false,
        defaultValue: const CustomExpression('CURRENT_TIMESTAMP'),
      );
  late final GeneratedColumn<int> avatarColor = GeneratedColumn<int>(
    'avatar_color',
    aliasedName,
    false,
    type: DriftSqlType.int,
    requiredDuringInsert: false,
    defaultValue: const CustomExpression('0'),
  );
  @override
  List<GeneratedColumn> get $columns => [
    id,
    name,
    email,
    hasProfileImage,
    profileChangedAt,
    avatarColor,
  ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'user_entity';
  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  UserEntityData map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return UserEntityData(
      id: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}id'],
      )!,
      name: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}name'],
      )!,
      email: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}email'],
      )!,
      hasProfileImage: attachedDatabase.typeMapping.read(
        DriftSqlType.bool,
        data['${effectivePrefix}has_profile_image'],
      )!,
      profileChangedAt: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}profile_changed_at'],
      )!,
      avatarColor: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}avatar_color'],
      )!,
    );
  }

  @override
  UserEntity createAlias(String alias) {
    return UserEntity(attachedDatabase, alias);
  }

  @override
  bool get withoutRowId => true;
  @override
  bool get isStrict => true;
}

class UserEntityData extends DataClass implements Insertable<UserEntityData> {
  final String id;
  final String name;
  final String email;
  final bool hasProfileImage;
  final DateTime profileChangedAt;
  final int avatarColor;
  const UserEntityData({
    required this.id,
    required this.name,
    required this.email,
    required this.hasProfileImage,
    required this.profileChangedAt,
    required this.avatarColor,
  });
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<String>(id);
    map['name'] = Variable<String>(name);
    map['email'] = Variable<String>(email);
    map['has_profile_image'] = Variable<bool>(hasProfileImage);
    map['profile_changed_at'] = Variable<DateTime>(profileChangedAt);
    map['avatar_color'] = Variable<int>(avatarColor);
    return map;
  }

  factory UserEntityData.fromJson(
    Map<String, dynamic> json, {
    ValueSerializer? serializer,
  }) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return UserEntityData(
      id: serializer.fromJson<String>(json['id']),
      name: serializer.fromJson<String>(json['name']),
      email: serializer.fromJson<String>(json['email']),
      hasProfileImage: serializer.fromJson<bool>(json['hasProfileImage']),
      profileChangedAt: serializer.fromJson<DateTime>(json['profileChangedAt']),
      avatarColor: serializer.fromJson<int>(json['avatarColor']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<String>(id),
      'name': serializer.toJson<String>(name),
      'email': serializer.toJson<String>(email),
      'hasProfileImage': serializer.toJson<bool>(hasProfileImage),
      'profileChangedAt': serializer.toJson<DateTime>(profileChangedAt),
      'avatarColor': serializer.toJson<int>(avatarColor),
    };
  }

  UserEntityData copyWith({
    String? id,
    String? name,
    String? email,
    bool? hasProfileImage,
    DateTime? profileChangedAt,
    int? avatarColor,
  }) => UserEntityData(
    id: id ?? this.id,
    name: name ?? this.name,
    email: email ?? this.email,
    hasProfileImage: hasProfileImage ?? this.hasProfileImage,
    profileChangedAt: profileChangedAt ?? this.profileChangedAt,
    avatarColor: avatarColor ?? this.avatarColor,
  );
  UserEntityData copyWithCompanion(UserEntityCompanion data) {
    return UserEntityData(
      id: data.id.present ? data.id.value : this.id,
      name: data.name.present ? data.name.value : this.name,
      email: data.email.present ? data.email.value : this.email,
      hasProfileImage: data.hasProfileImage.present
          ? data.hasProfileImage.value
          : this.hasProfileImage,
      profileChangedAt: data.profileChangedAt.present
          ? data.profileChangedAt.value
          : this.profileChangedAt,
      avatarColor: data.avatarColor.present
          ? data.avatarColor.value
          : this.avatarColor,
    );
  }

  @override
  String toString() {
    return (StringBuffer('UserEntityData(')
          ..write('id: $id, ')
          ..write('name: $name, ')
          ..write('email: $email, ')
          ..write('hasProfileImage: $hasProfileImage, ')
          ..write('profileChangedAt: $profileChangedAt, ')
          ..write('avatarColor: $avatarColor')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(
    id,
    name,
    email,
    hasProfileImage,
    profileChangedAt,
    avatarColor,
  );
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is UserEntityData &&
          other.id == this.id &&
          other.name == this.name &&
          other.email == this.email &&
          other.hasProfileImage == this.hasProfileImage &&
          other.profileChangedAt == this.profileChangedAt &&
          other.avatarColor == this.avatarColor);
}

class UserEntityCompanion extends UpdateCompanion<UserEntityData> {
  final Value<String> id;
  final Value<String> name;
  final Value<String> email;
  final Value<bool> hasProfileImage;
  final Value<DateTime> profileChangedAt;
  final Value<int> avatarColor;
  const UserEntityCompanion({
    this.id = const Value.absent(),
    this.name = const Value.absent(),
    this.email = const Value.absent(),
    this.hasProfileImage = const Value.absent(),
    this.profileChangedAt = const Value.absent(),
    this.avatarColor = const Value.absent(),
  });
  UserEntityCompanion.insert({
    required String id,
    required String name,
    required String email,
    this.hasProfileImage = const Value.absent(),
    this.profileChangedAt = const Value.absent(),
    this.avatarColor = const Value.absent(),
  }) : id = Value(id),
       name = Value(name),
       email = Value(email);
  static Insertable<UserEntityData> custom({
    Expression<String>? id,
    Expression<String>? name,
    Expression<String>? email,
    Expression<bool>? hasProfileImage,
    Expression<DateTime>? profileChangedAt,
    Expression<int>? avatarColor,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (name != null) 'name': name,
      if (email != null) 'email': email,
      if (hasProfileImage != null) 'has_profile_image': hasProfileImage,
      if (profileChangedAt != null) 'profile_changed_at': profileChangedAt,
      if (avatarColor != null) 'avatar_color': avatarColor,
    });
  }

  UserEntityCompanion copyWith({
    Value<String>? id,
    Value<String>? name,
    Value<String>? email,
    Value<bool>? hasProfileImage,
    Value<DateTime>? profileChangedAt,
    Value<int>? avatarColor,
  }) {
    return UserEntityCompanion(
      id: id ?? this.id,
      name: name ?? this.name,
      email: email ?? this.email,
      hasProfileImage: hasProfileImage ?? this.hasProfileImage,
      profileChangedAt: profileChangedAt ?? this.profileChangedAt,
      avatarColor: avatarColor ?? this.avatarColor,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<String>(id.value);
    }
    if (name.present) {
      map['name'] = Variable<String>(name.value);
    }
    if (email.present) {
      map['email'] = Variable<String>(email.value);
    }
    if (hasProfileImage.present) {
      map['has_profile_image'] = Variable<bool>(hasProfileImage.value);
    }
    if (profileChangedAt.present) {
      map['profile_changed_at'] = Variable<DateTime>(profileChangedAt.value);
    }
    if (avatarColor.present) {
      map['avatar_color'] = Variable<int>(avatarColor.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('UserEntityCompanion(')
          ..write('id: $id, ')
          ..write('name: $name, ')
          ..write('email: $email, ')
          ..write('hasProfileImage: $hasProfileImage, ')
          ..write('profileChangedAt: $profileChangedAt, ')
          ..write('avatarColor: $avatarColor')
          ..write(')'))
        .toString();
  }
}

class RemoteAssetEntity extends Table
    with TableInfo<RemoteAssetEntity, RemoteAssetEntityData> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  RemoteAssetEntity(this.attachedDatabase, [this._alias]);
  late final GeneratedColumn<String> name = GeneratedColumn<String>(
    'name',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  late final GeneratedColumn<int> type = GeneratedColumn<int>(
    'type',
    aliasedName,
    false,
    type: DriftSqlType.int,
    requiredDuringInsert: true,
  );
  late final GeneratedColumn<DateTime> createdAt = GeneratedColumn<DateTime>(
    'created_at',
    aliasedName,
    false,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: false,
    defaultValue: const CustomExpression('CURRENT_TIMESTAMP'),
  );
  late final GeneratedColumn<DateTime> updatedAt = GeneratedColumn<DateTime>(
    'updated_at',
    aliasedName,
    false,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: false,
    defaultValue: const CustomExpression('CURRENT_TIMESTAMP'),
  );
  late final GeneratedColumn<int> width = GeneratedColumn<int>(
    'width',
    aliasedName,
    true,
    type: DriftSqlType.int,
    requiredDuringInsert: false,
  );
  late final GeneratedColumn<int> height = GeneratedColumn<int>(
    'height',
    aliasedName,
    true,
    type: DriftSqlType.int,
    requiredDuringInsert: false,
  );
  late final GeneratedColumn<int> durationInSeconds = GeneratedColumn<int>(
    'duration_in_seconds',
    aliasedName,
    true,
    type: DriftSqlType.int,
    requiredDuringInsert: false,
  );
  late final GeneratedColumn<String> id = GeneratedColumn<String>(
    'id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  late final GeneratedColumn<String> checksum = GeneratedColumn<String>(
    'checksum',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  late final GeneratedColumn<bool> isFavorite = GeneratedColumn<bool>(
    'is_favorite',
    aliasedName,
    false,
    type: DriftSqlType.bool,
    requiredDuringInsert: false,
    defaultConstraints: GeneratedColumn.constraintIsAlways(
      'CHECK ("is_favorite" IN (0, 1))',
    ),
    defaultValue: const CustomExpression('0'),
  );
  late final GeneratedColumn<String> ownerId = GeneratedColumn<String>(
    'owner_id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
    defaultConstraints: GeneratedColumn.constraintIsAlways(
      'REFERENCES user_entity (id) ON DELETE CASCADE',
    ),
  );
  late final GeneratedColumn<DateTime> localDateTime =
      GeneratedColumn<DateTime>(
        'local_date_time',
        aliasedName,
        true,
        type: DriftSqlType.dateTime,
        requiredDuringInsert: false,
      );
  late final GeneratedColumn<String> thumbHash = GeneratedColumn<String>(
    'thumb_hash',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  late final GeneratedColumn<DateTime> deletedAt = GeneratedColumn<DateTime>(
    'deleted_at',
    aliasedName,
    true,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: false,
  );
  late final GeneratedColumn<String> livePhotoVideoId = GeneratedColumn<String>(
    'live_photo_video_id',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  late final GeneratedColumn<int> visibility = GeneratedColumn<int>(
    'visibility',
    aliasedName,
    false,
    type: DriftSqlType.int,
    requiredDuringInsert: true,
  );
  late final GeneratedColumn<String> stackId = GeneratedColumn<String>(
    'stack_id',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  late final GeneratedColumn<String> libraryId = GeneratedColumn<String>(
    'library_id',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  @override
  List<GeneratedColumn> get $columns => [
    name,
    type,
    createdAt,
    updatedAt,
    width,
    height,
    durationInSeconds,
    id,
    checksum,
    isFavorite,
    ownerId,
    localDateTime,
    thumbHash,
    deletedAt,
    livePhotoVideoId,
    visibility,
    stackId,
    libraryId,
  ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'remote_asset_entity';
  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  RemoteAssetEntityData map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return RemoteAssetEntityData(
      name: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}name'],
      )!,
      type: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}type'],
      )!,
      createdAt: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}created_at'],
      )!,
      updatedAt: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}updated_at'],
      )!,
      width: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}width'],
      ),
      height: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}height'],
      ),
      durationInSeconds: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}duration_in_seconds'],
      ),
      id: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}id'],
      )!,
      checksum: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}checksum'],
      )!,
      isFavorite: attachedDatabase.typeMapping.read(
        DriftSqlType.bool,
        data['${effectivePrefix}is_favorite'],
      )!,
      ownerId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}owner_id'],
      )!,
      localDateTime: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}local_date_time'],
      ),
      thumbHash: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}thumb_hash'],
      ),
      deletedAt: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}deleted_at'],
      ),
      livePhotoVideoId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}live_photo_video_id'],
      ),
      visibility: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}visibility'],
      )!,
      stackId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}stack_id'],
      ),
      libraryId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}library_id'],
      ),
    );
  }

  @override
  RemoteAssetEntity createAlias(String alias) {
    return RemoteAssetEntity(attachedDatabase, alias);
  }

  @override
  bool get withoutRowId => true;
  @override
  bool get isStrict => true;
}

class RemoteAssetEntityData extends DataClass
    implements Insertable<RemoteAssetEntityData> {
  final String name;
  final int type;
  final DateTime createdAt;
  final DateTime updatedAt;
  final int? width;
  final int? height;
  final int? durationInSeconds;
  final String id;
  final String checksum;
  final bool isFavorite;
  final String ownerId;
  final DateTime? localDateTime;
  final String? thumbHash;
  final DateTime? deletedAt;
  final String? livePhotoVideoId;
  final int visibility;
  final String? stackId;
  final String? libraryId;
  const RemoteAssetEntityData({
    required this.name,
    required this.type,
    required this.createdAt,
    required this.updatedAt,
    this.width,
    this.height,
    this.durationInSeconds,
    required this.id,
    required this.checksum,
    required this.isFavorite,
    required this.ownerId,
    this.localDateTime,
    this.thumbHash,
    this.deletedAt,
    this.livePhotoVideoId,
    required this.visibility,
    this.stackId,
    this.libraryId,
  });
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['name'] = Variable<String>(name);
    map['type'] = Variable<int>(type);
    map['created_at'] = Variable<DateTime>(createdAt);
    map['updated_at'] = Variable<DateTime>(updatedAt);
    if (!nullToAbsent || width != null) {
      map['width'] = Variable<int>(width);
    }
    if (!nullToAbsent || height != null) {
      map['height'] = Variable<int>(height);
    }
    if (!nullToAbsent || durationInSeconds != null) {
      map['duration_in_seconds'] = Variable<int>(durationInSeconds);
    }
    map['id'] = Variable<String>(id);
    map['checksum'] = Variable<String>(checksum);
    map['is_favorite'] = Variable<bool>(isFavorite);
    map['owner_id'] = Variable<String>(ownerId);
    if (!nullToAbsent || localDateTime != null) {
      map['local_date_time'] = Variable<DateTime>(localDateTime);
    }
    if (!nullToAbsent || thumbHash != null) {
      map['thumb_hash'] = Variable<String>(thumbHash);
    }
    if (!nullToAbsent || deletedAt != null) {
      map['deleted_at'] = Variable<DateTime>(deletedAt);
    }
    if (!nullToAbsent || livePhotoVideoId != null) {
      map['live_photo_video_id'] = Variable<String>(livePhotoVideoId);
    }
    map['visibility'] = Variable<int>(visibility);
    if (!nullToAbsent || stackId != null) {
      map['stack_id'] = Variable<String>(stackId);
    }
    if (!nullToAbsent || libraryId != null) {
      map['library_id'] = Variable<String>(libraryId);
    }
    return map;
  }

  factory RemoteAssetEntityData.fromJson(
    Map<String, dynamic> json, {
    ValueSerializer? serializer,
  }) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return RemoteAssetEntityData(
      name: serializer.fromJson<String>(json['name']),
      type: serializer.fromJson<int>(json['type']),
      createdAt: serializer.fromJson<DateTime>(json['createdAt']),
      updatedAt: serializer.fromJson<DateTime>(json['updatedAt']),
      width: serializer.fromJson<int?>(json['width']),
      height: serializer.fromJson<int?>(json['height']),
      durationInSeconds: serializer.fromJson<int?>(json['durationInSeconds']),
      id: serializer.fromJson<String>(json['id']),
      checksum: serializer.fromJson<String>(json['checksum']),
      isFavorite: serializer.fromJson<bool>(json['isFavorite']),
      ownerId: serializer.fromJson<String>(json['ownerId']),
      localDateTime: serializer.fromJson<DateTime?>(json['localDateTime']),
      thumbHash: serializer.fromJson<String?>(json['thumbHash']),
      deletedAt: serializer.fromJson<DateTime?>(json['deletedAt']),
      livePhotoVideoId: serializer.fromJson<String?>(json['livePhotoVideoId']),
      visibility: serializer.fromJson<int>(json['visibility']),
      stackId: serializer.fromJson<String?>(json['stackId']),
      libraryId: serializer.fromJson<String?>(json['libraryId']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'name': serializer.toJson<String>(name),
      'type': serializer.toJson<int>(type),
      'createdAt': serializer.toJson<DateTime>(createdAt),
      'updatedAt': serializer.toJson<DateTime>(updatedAt),
      'width': serializer.toJson<int?>(width),
      'height': serializer.toJson<int?>(height),
      'durationInSeconds': serializer.toJson<int?>(durationInSeconds),
      'id': serializer.toJson<String>(id),
      'checksum': serializer.toJson<String>(checksum),
      'isFavorite': serializer.toJson<bool>(isFavorite),
      'ownerId': serializer.toJson<String>(ownerId),
      'localDateTime': serializer.toJson<DateTime?>(localDateTime),
      'thumbHash': serializer.toJson<String?>(thumbHash),
      'deletedAt': serializer.toJson<DateTime?>(deletedAt),
      'livePhotoVideoId': serializer.toJson<String?>(livePhotoVideoId),
      'visibility': serializer.toJson<int>(visibility),
      'stackId': serializer.toJson<String?>(stackId),
      'libraryId': serializer.toJson<String?>(libraryId),
    };
  }

  RemoteAssetEntityData copyWith({
    String? name,
    int? type,
    DateTime? createdAt,
    DateTime? updatedAt,
    Value<int?> width = const Value.absent(),
    Value<int?> height = const Value.absent(),
    Value<int?> durationInSeconds = const Value.absent(),
    String? id,
    String? checksum,
    bool? isFavorite,
    String? ownerId,
    Value<DateTime?> localDateTime = const Value.absent(),
    Value<String?> thumbHash = const Value.absent(),
    Value<DateTime?> deletedAt = const Value.absent(),
    Value<String?> livePhotoVideoId = const Value.absent(),
    int? visibility,
    Value<String?> stackId = const Value.absent(),
    Value<String?> libraryId = const Value.absent(),
  }) => RemoteAssetEntityData(
    name: name ?? this.name,
    type: type ?? this.type,
    createdAt: createdAt ?? this.createdAt,
    updatedAt: updatedAt ?? this.updatedAt,
    width: width.present ? width.value : this.width,
    height: height.present ? height.value : this.height,
    durationInSeconds: durationInSeconds.present
        ? durationInSeconds.value
        : this.durationInSeconds,
    id: id ?? this.id,
    checksum: checksum ?? this.checksum,
    isFavorite: isFavorite ?? this.isFavorite,
    ownerId: ownerId ?? this.ownerId,
    localDateTime: localDateTime.present
        ? localDateTime.value
        : this.localDateTime,
    thumbHash: thumbHash.present ? thumbHash.value : this.thumbHash,
    deletedAt: deletedAt.present ? deletedAt.value : this.deletedAt,
    livePhotoVideoId: livePhotoVideoId.present
        ? livePhotoVideoId.value
        : this.livePhotoVideoId,
    visibility: visibility ?? this.visibility,
    stackId: stackId.present ? stackId.value : this.stackId,
    libraryId: libraryId.present ? libraryId.value : this.libraryId,
  );
  RemoteAssetEntityData copyWithCompanion(RemoteAssetEntityCompanion data) {
    return RemoteAssetEntityData(
      name: data.name.present ? data.name.value : this.name,
      type: data.type.present ? data.type.value : this.type,
      createdAt: data.createdAt.present ? data.createdAt.value : this.createdAt,
      updatedAt: data.updatedAt.present ? data.updatedAt.value : this.updatedAt,
      width: data.width.present ? data.width.value : this.width,
      height: data.height.present ? data.height.value : this.height,
      durationInSeconds: data.durationInSeconds.present
          ? data.durationInSeconds.value
          : this.durationInSeconds,
      id: data.id.present ? data.id.value : this.id,
      checksum: data.checksum.present ? data.checksum.value : this.checksum,
      isFavorite: data.isFavorite.present
          ? data.isFavorite.value
          : this.isFavorite,
      ownerId: data.ownerId.present ? data.ownerId.value : this.ownerId,
      localDateTime: data.localDateTime.present
          ? data.localDateTime.value
          : this.localDateTime,
      thumbHash: data.thumbHash.present ? data.thumbHash.value : this.thumbHash,
      deletedAt: data.deletedAt.present ? data.deletedAt.value : this.deletedAt,
      livePhotoVideoId: data.livePhotoVideoId.present
          ? data.livePhotoVideoId.value
          : this.livePhotoVideoId,
      visibility: data.visibility.present
          ? data.visibility.value
          : this.visibility,
      stackId: data.stackId.present ? data.stackId.value : this.stackId,
      libraryId: data.libraryId.present ? data.libraryId.value : this.libraryId,
    );
  }

  @override
  String toString() {
    return (StringBuffer('RemoteAssetEntityData(')
          ..write('name: $name, ')
          ..write('type: $type, ')
          ..write('createdAt: $createdAt, ')
          ..write('updatedAt: $updatedAt, ')
          ..write('width: $width, ')
          ..write('height: $height, ')
          ..write('durationInSeconds: $durationInSeconds, ')
          ..write('id: $id, ')
          ..write('checksum: $checksum, ')
          ..write('isFavorite: $isFavorite, ')
          ..write('ownerId: $ownerId, ')
          ..write('localDateTime: $localDateTime, ')
          ..write('thumbHash: $thumbHash, ')
          ..write('deletedAt: $deletedAt, ')
          ..write('livePhotoVideoId: $livePhotoVideoId, ')
          ..write('visibility: $visibility, ')
          ..write('stackId: $stackId, ')
          ..write('libraryId: $libraryId')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(
    name,
    type,
    createdAt,
    updatedAt,
    width,
    height,
    durationInSeconds,
    id,
    checksum,
    isFavorite,
    ownerId,
    localDateTime,
    thumbHash,
    deletedAt,
    livePhotoVideoId,
    visibility,
    stackId,
    libraryId,
  );
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is RemoteAssetEntityData &&
          other.name == this.name &&
          other.type == this.type &&
          other.createdAt == this.createdAt &&
          other.updatedAt == this.updatedAt &&
          other.width == this.width &&
          other.height == this.height &&
          other.durationInSeconds == this.durationInSeconds &&
          other.id == this.id &&
          other.checksum == this.checksum &&
          other.isFavorite == this.isFavorite &&
          other.ownerId == this.ownerId &&
          other.localDateTime == this.localDateTime &&
          other.thumbHash == this.thumbHash &&
          other.deletedAt == this.deletedAt &&
          other.livePhotoVideoId == this.livePhotoVideoId &&
          other.visibility == this.visibility &&
          other.stackId == this.stackId &&
          other.libraryId == this.libraryId);
}

class RemoteAssetEntityCompanion
    extends UpdateCompanion<RemoteAssetEntityData> {
  final Value<String> name;
  final Value<int> type;
  final Value<DateTime> createdAt;
  final Value<DateTime> updatedAt;
  final Value<int?> width;
  final Value<int?> height;
  final Value<int?> durationInSeconds;
  final Value<String> id;
  final Value<String> checksum;
  final Value<bool> isFavorite;
  final Value<String> ownerId;
  final Value<DateTime?> localDateTime;
  final Value<String?> thumbHash;
  final Value<DateTime?> deletedAt;
  final Value<String?> livePhotoVideoId;
  final Value<int> visibility;
  final Value<String?> stackId;
  final Value<String?> libraryId;
  const RemoteAssetEntityCompanion({
    this.name = const Value.absent(),
    this.type = const Value.absent(),
    this.createdAt = const Value.absent(),
    this.updatedAt = const Value.absent(),
    this.width = const Value.absent(),
    this.height = const Value.absent(),
    this.durationInSeconds = const Value.absent(),
    this.id = const Value.absent(),
    this.checksum = const Value.absent(),
    this.isFavorite = const Value.absent(),
    this.ownerId = const Value.absent(),
    this.localDateTime = const Value.absent(),
    this.thumbHash = const Value.absent(),
    this.deletedAt = const Value.absent(),
    this.livePhotoVideoId = const Value.absent(),
    this.visibility = const Value.absent(),
    this.stackId = const Value.absent(),
    this.libraryId = const Value.absent(),
  });
  RemoteAssetEntityCompanion.insert({
    required String name,
    required int type,
    this.createdAt = const Value.absent(),
    this.updatedAt = const Value.absent(),
    this.width = const Value.absent(),
    this.height = const Value.absent(),
    this.durationInSeconds = const Value.absent(),
    required String id,
    required String checksum,
    this.isFavorite = const Value.absent(),
    required String ownerId,
    this.localDateTime = const Value.absent(),
    this.thumbHash = const Value.absent(),
    this.deletedAt = const Value.absent(),
    this.livePhotoVideoId = const Value.absent(),
    required int visibility,
    this.stackId = const Value.absent(),
    this.libraryId = const Value.absent(),
  }) : name = Value(name),
       type = Value(type),
       id = Value(id),
       checksum = Value(checksum),
       ownerId = Value(ownerId),
       visibility = Value(visibility);
  static Insertable<RemoteAssetEntityData> custom({
    Expression<String>? name,
    Expression<int>? type,
    Expression<DateTime>? createdAt,
    Expression<DateTime>? updatedAt,
    Expression<int>? width,
    Expression<int>? height,
    Expression<int>? durationInSeconds,
    Expression<String>? id,
    Expression<String>? checksum,
    Expression<bool>? isFavorite,
    Expression<String>? ownerId,
    Expression<DateTime>? localDateTime,
    Expression<String>? thumbHash,
    Expression<DateTime>? deletedAt,
    Expression<String>? livePhotoVideoId,
    Expression<int>? visibility,
    Expression<String>? stackId,
    Expression<String>? libraryId,
  }) {
    return RawValuesInsertable({
      if (name != null) 'name': name,
      if (type != null) 'type': type,
      if (createdAt != null) 'created_at': createdAt,
      if (updatedAt != null) 'updated_at': updatedAt,
      if (width != null) 'width': width,
      if (height != null) 'height': height,
      if (durationInSeconds != null) 'duration_in_seconds': durationInSeconds,
      if (id != null) 'id': id,
      if (checksum != null) 'checksum': checksum,
      if (isFavorite != null) 'is_favorite': isFavorite,
      if (ownerId != null) 'owner_id': ownerId,
      if (localDateTime != null) 'local_date_time': localDateTime,
      if (thumbHash != null) 'thumb_hash': thumbHash,
      if (deletedAt != null) 'deleted_at': deletedAt,
      if (livePhotoVideoId != null) 'live_photo_video_id': livePhotoVideoId,
      if (visibility != null) 'visibility': visibility,
      if (stackId != null) 'stack_id': stackId,
      if (libraryId != null) 'library_id': libraryId,
    });
  }

  RemoteAssetEntityCompanion copyWith({
    Value<String>? name,
    Value<int>? type,
    Value<DateTime>? createdAt,
    Value<DateTime>? updatedAt,
    Value<int?>? width,
    Value<int?>? height,
    Value<int?>? durationInSeconds,
    Value<String>? id,
    Value<String>? checksum,
    Value<bool>? isFavorite,
    Value<String>? ownerId,
    Value<DateTime?>? localDateTime,
    Value<String?>? thumbHash,
    Value<DateTime?>? deletedAt,
    Value<String?>? livePhotoVideoId,
    Value<int>? visibility,
    Value<String?>? stackId,
    Value<String?>? libraryId,
  }) {
    return RemoteAssetEntityCompanion(
      name: name ?? this.name,
      type: type ?? this.type,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      width: width ?? this.width,
      height: height ?? this.height,
      durationInSeconds: durationInSeconds ?? this.durationInSeconds,
      id: id ?? this.id,
      checksum: checksum ?? this.checksum,
      isFavorite: isFavorite ?? this.isFavorite,
      ownerId: ownerId ?? this.ownerId,
      localDateTime: localDateTime ?? this.localDateTime,
      thumbHash: thumbHash ?? this.thumbHash,
      deletedAt: deletedAt ?? this.deletedAt,
      livePhotoVideoId: livePhotoVideoId ?? this.livePhotoVideoId,
      visibility: visibility ?? this.visibility,
      stackId: stackId ?? this.stackId,
      libraryId: libraryId ?? this.libraryId,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (name.present) {
      map['name'] = Variable<String>(name.value);
    }
    if (type.present) {
      map['type'] = Variable<int>(type.value);
    }
    if (createdAt.present) {
      map['created_at'] = Variable<DateTime>(createdAt.value);
    }
    if (updatedAt.present) {
      map['updated_at'] = Variable<DateTime>(updatedAt.value);
    }
    if (width.present) {
      map['width'] = Variable<int>(width.value);
    }
    if (height.present) {
      map['height'] = Variable<int>(height.value);
    }
    if (durationInSeconds.present) {
      map['duration_in_seconds'] = Variable<int>(durationInSeconds.value);
    }
    if (id.present) {
      map['id'] = Variable<String>(id.value);
    }
    if (checksum.present) {
      map['checksum'] = Variable<String>(checksum.value);
    }
    if (isFavorite.present) {
      map['is_favorite'] = Variable<bool>(isFavorite.value);
    }
    if (ownerId.present) {
      map['owner_id'] = Variable<String>(ownerId.value);
    }
    if (localDateTime.present) {
      map['local_date_time'] = Variable<DateTime>(localDateTime.value);
    }
    if (thumbHash.present) {
      map['thumb_hash'] = Variable<String>(thumbHash.value);
    }
    if (deletedAt.present) {
      map['deleted_at'] = Variable<DateTime>(deletedAt.value);
    }
    if (livePhotoVideoId.present) {
      map['live_photo_video_id'] = Variable<String>(livePhotoVideoId.value);
    }
    if (visibility.present) {
      map['visibility'] = Variable<int>(visibility.value);
    }
    if (stackId.present) {
      map['stack_id'] = Variable<String>(stackId.value);
    }
    if (libraryId.present) {
      map['library_id'] = Variable<String>(libraryId.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('RemoteAssetEntityCompanion(')
          ..write('name: $name, ')
          ..write('type: $type, ')
          ..write('createdAt: $createdAt, ')
          ..write('updatedAt: $updatedAt, ')
          ..write('width: $width, ')
          ..write('height: $height, ')
          ..write('durationInSeconds: $durationInSeconds, ')
          ..write('id: $id, ')
          ..write('checksum: $checksum, ')
          ..write('isFavorite: $isFavorite, ')
          ..write('ownerId: $ownerId, ')
          ..write('localDateTime: $localDateTime, ')
          ..write('thumbHash: $thumbHash, ')
          ..write('deletedAt: $deletedAt, ')
          ..write('livePhotoVideoId: $livePhotoVideoId, ')
          ..write('visibility: $visibility, ')
          ..write('stackId: $stackId, ')
          ..write('libraryId: $libraryId')
          ..write(')'))
        .toString();
  }
}

class StackEntity extends Table with TableInfo<StackEntity, StackEntityData> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  StackEntity(this.attachedDatabase, [this._alias]);
  late final GeneratedColumn<String> id = GeneratedColumn<String>(
    'id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  late final GeneratedColumn<DateTime> createdAt = GeneratedColumn<DateTime>(
    'created_at',
    aliasedName,
    false,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: false,
    defaultValue: const CustomExpression('CURRENT_TIMESTAMP'),
  );
  late final GeneratedColumn<DateTime> updatedAt = GeneratedColumn<DateTime>(
    'updated_at',
    aliasedName,
    false,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: false,
    defaultValue: const CustomExpression('CURRENT_TIMESTAMP'),
  );
  late final GeneratedColumn<String> ownerId = GeneratedColumn<String>(
    'owner_id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
    defaultConstraints: GeneratedColumn.constraintIsAlways(
      'REFERENCES user_entity (id) ON DELETE CASCADE',
    ),
  );
  late final GeneratedColumn<String> primaryAssetId = GeneratedColumn<String>(
    'primary_asset_id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  @override
  List<GeneratedColumn> get $columns => [
    id,
    createdAt,
    updatedAt,
    ownerId,
    primaryAssetId,
  ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'stack_entity';
  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  StackEntityData map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return StackEntityData(
      id: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}id'],
      )!,
      createdAt: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}created_at'],
      )!,
      updatedAt: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}updated_at'],
      )!,
      ownerId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}owner_id'],
      )!,
      primaryAssetId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}primary_asset_id'],
      )!,
    );
  }

  @override
  StackEntity createAlias(String alias) {
    return StackEntity(attachedDatabase, alias);
  }

  @override
  bool get withoutRowId => true;
  @override
  bool get isStrict => true;
}

class StackEntityData extends DataClass implements Insertable<StackEntityData> {
  final String id;
  final DateTime createdAt;
  final DateTime updatedAt;
  final String ownerId;
  final String primaryAssetId;
  const StackEntityData({
    required this.id,
    required this.createdAt,
    required this.updatedAt,
    required this.ownerId,
    required this.primaryAssetId,
  });
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<String>(id);
    map['created_at'] = Variable<DateTime>(createdAt);
    map['updated_at'] = Variable<DateTime>(updatedAt);
    map['owner_id'] = Variable<String>(ownerId);
    map['primary_asset_id'] = Variable<String>(primaryAssetId);
    return map;
  }

  factory StackEntityData.fromJson(
    Map<String, dynamic> json, {
    ValueSerializer? serializer,
  }) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return StackEntityData(
      id: serializer.fromJson<String>(json['id']),
      createdAt: serializer.fromJson<DateTime>(json['createdAt']),
      updatedAt: serializer.fromJson<DateTime>(json['updatedAt']),
      ownerId: serializer.fromJson<String>(json['ownerId']),
      primaryAssetId: serializer.fromJson<String>(json['primaryAssetId']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<String>(id),
      'createdAt': serializer.toJson<DateTime>(createdAt),
      'updatedAt': serializer.toJson<DateTime>(updatedAt),
      'ownerId': serializer.toJson<String>(ownerId),
      'primaryAssetId': serializer.toJson<String>(primaryAssetId),
    };
  }

  StackEntityData copyWith({
    String? id,
    DateTime? createdAt,
    DateTime? updatedAt,
    String? ownerId,
    String? primaryAssetId,
  }) => StackEntityData(
    id: id ?? this.id,
    createdAt: createdAt ?? this.createdAt,
    updatedAt: updatedAt ?? this.updatedAt,
    ownerId: ownerId ?? this.ownerId,
    primaryAssetId: primaryAssetId ?? this.primaryAssetId,
  );
  StackEntityData copyWithCompanion(StackEntityCompanion data) {
    return StackEntityData(
      id: data.id.present ? data.id.value : this.id,
      createdAt: data.createdAt.present ? data.createdAt.value : this.createdAt,
      updatedAt: data.updatedAt.present ? data.updatedAt.value : this.updatedAt,
      ownerId: data.ownerId.present ? data.ownerId.value : this.ownerId,
      primaryAssetId: data.primaryAssetId.present
          ? data.primaryAssetId.value
          : this.primaryAssetId,
    );
  }

  @override
  String toString() {
    return (StringBuffer('StackEntityData(')
          ..write('id: $id, ')
          ..write('createdAt: $createdAt, ')
          ..write('updatedAt: $updatedAt, ')
          ..write('ownerId: $ownerId, ')
          ..write('primaryAssetId: $primaryAssetId')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode =>
      Object.hash(id, createdAt, updatedAt, ownerId, primaryAssetId);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is StackEntityData &&
          other.id == this.id &&
          other.createdAt == this.createdAt &&
          other.updatedAt == this.updatedAt &&
          other.ownerId == this.ownerId &&
          other.primaryAssetId == this.primaryAssetId);
}

class StackEntityCompanion extends UpdateCompanion<StackEntityData> {
  final Value<String> id;
  final Value<DateTime> createdAt;
  final Value<DateTime> updatedAt;
  final Value<String> ownerId;
  final Value<String> primaryAssetId;
  const StackEntityCompanion({
    this.id = const Value.absent(),
    this.createdAt = const Value.absent(),
    this.updatedAt = const Value.absent(),
    this.ownerId = const Value.absent(),
    this.primaryAssetId = const Value.absent(),
  });
  StackEntityCompanion.insert({
    required String id,
    this.createdAt = const Value.absent(),
    this.updatedAt = const Value.absent(),
    required String ownerId,
    required String primaryAssetId,
  }) : id = Value(id),
       ownerId = Value(ownerId),
       primaryAssetId = Value(primaryAssetId);
  static Insertable<StackEntityData> custom({
    Expression<String>? id,
    Expression<DateTime>? createdAt,
    Expression<DateTime>? updatedAt,
    Expression<String>? ownerId,
    Expression<String>? primaryAssetId,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (createdAt != null) 'created_at': createdAt,
      if (updatedAt != null) 'updated_at': updatedAt,
      if (ownerId != null) 'owner_id': ownerId,
      if (primaryAssetId != null) 'primary_asset_id': primaryAssetId,
    });
  }

  StackEntityCompanion copyWith({
    Value<String>? id,
    Value<DateTime>? createdAt,
    Value<DateTime>? updatedAt,
    Value<String>? ownerId,
    Value<String>? primaryAssetId,
  }) {
    return StackEntityCompanion(
      id: id ?? this.id,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      ownerId: ownerId ?? this.ownerId,
      primaryAssetId: primaryAssetId ?? this.primaryAssetId,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<String>(id.value);
    }
    if (createdAt.present) {
      map['created_at'] = Variable<DateTime>(createdAt.value);
    }
    if (updatedAt.present) {
      map['updated_at'] = Variable<DateTime>(updatedAt.value);
    }
    if (ownerId.present) {
      map['owner_id'] = Variable<String>(ownerId.value);
    }
    if (primaryAssetId.present) {
      map['primary_asset_id'] = Variable<String>(primaryAssetId.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('StackEntityCompanion(')
          ..write('id: $id, ')
          ..write('createdAt: $createdAt, ')
          ..write('updatedAt: $updatedAt, ')
          ..write('ownerId: $ownerId, ')
          ..write('primaryAssetId: $primaryAssetId')
          ..write(')'))
        .toString();
  }
}

class LocalAssetEntity extends Table
    with TableInfo<LocalAssetEntity, LocalAssetEntityData> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  LocalAssetEntity(this.attachedDatabase, [this._alias]);
  late final GeneratedColumn<String> name = GeneratedColumn<String>(
    'name',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  late final GeneratedColumn<int> type = GeneratedColumn<int>(
    'type',
    aliasedName,
    false,
    type: DriftSqlType.int,
    requiredDuringInsert: true,
  );
  late final GeneratedColumn<DateTime> createdAt = GeneratedColumn<DateTime>(
    'created_at',
    aliasedName,
    false,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: false,
    defaultValue: const CustomExpression('CURRENT_TIMESTAMP'),
  );
  late final GeneratedColumn<DateTime> updatedAt = GeneratedColumn<DateTime>(
    'updated_at',
    aliasedName,
    false,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: false,
    defaultValue: const CustomExpression('CURRENT_TIMESTAMP'),
  );
  late final GeneratedColumn<int> width = GeneratedColumn<int>(
    'width',
    aliasedName,
    true,
    type: DriftSqlType.int,
    requiredDuringInsert: false,
  );
  late final GeneratedColumn<int> height = GeneratedColumn<int>(
    'height',
    aliasedName,
    true,
    type: DriftSqlType.int,
    requiredDuringInsert: false,
  );
  late final GeneratedColumn<int> durationInSeconds = GeneratedColumn<int>(
    'duration_in_seconds',
    aliasedName,
    true,
    type: DriftSqlType.int,
    requiredDuringInsert: false,
  );
  late final GeneratedColumn<String> id = GeneratedColumn<String>(
    'id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  late final GeneratedColumn<String> checksum = GeneratedColumn<String>(
    'checksum',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  late final GeneratedColumn<bool> isFavorite = GeneratedColumn<bool>(
    'is_favorite',
    aliasedName,
    false,
    type: DriftSqlType.bool,
    requiredDuringInsert: false,
    defaultConstraints: GeneratedColumn.constraintIsAlways(
      'CHECK ("is_favorite" IN (0, 1))',
    ),
    defaultValue: const CustomExpression('0'),
  );
  late final GeneratedColumn<int> orientation = GeneratedColumn<int>(
    'orientation',
    aliasedName,
    false,
    type: DriftSqlType.int,
    requiredDuringInsert: false,
    defaultValue: const CustomExpression('0'),
  );
  @override
  List<GeneratedColumn> get $columns => [
    name,
    type,
    createdAt,
    updatedAt,
    width,
    height,
    durationInSeconds,
    id,
    checksum,
    isFavorite,
    orientation,
  ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'local_asset_entity';
  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  LocalAssetEntityData map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return LocalAssetEntityData(
      name: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}name'],
      )!,
      type: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}type'],
      )!,
      createdAt: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}created_at'],
      )!,
      updatedAt: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}updated_at'],
      )!,
      width: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}width'],
      ),
      height: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}height'],
      ),
      durationInSeconds: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}duration_in_seconds'],
      ),
      id: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}id'],
      )!,
      checksum: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}checksum'],
      ),
      isFavorite: attachedDatabase.typeMapping.read(
        DriftSqlType.bool,
        data['${effectivePrefix}is_favorite'],
      )!,
      orientation: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}orientation'],
      )!,
    );
  }

  @override
  LocalAssetEntity createAlias(String alias) {
    return LocalAssetEntity(attachedDatabase, alias);
  }

  @override
  bool get withoutRowId => true;
  @override
  bool get isStrict => true;
}

class LocalAssetEntityData extends DataClass
    implements Insertable<LocalAssetEntityData> {
  final String name;
  final int type;
  final DateTime createdAt;
  final DateTime updatedAt;
  final int? width;
  final int? height;
  final int? durationInSeconds;
  final String id;
  final String? checksum;
  final bool isFavorite;
  final int orientation;
  const LocalAssetEntityData({
    required this.name,
    required this.type,
    required this.createdAt,
    required this.updatedAt,
    this.width,
    this.height,
    this.durationInSeconds,
    required this.id,
    this.checksum,
    required this.isFavorite,
    required this.orientation,
  });
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['name'] = Variable<String>(name);
    map['type'] = Variable<int>(type);
    map['created_at'] = Variable<DateTime>(createdAt);
    map['updated_at'] = Variable<DateTime>(updatedAt);
    if (!nullToAbsent || width != null) {
      map['width'] = Variable<int>(width);
    }
    if (!nullToAbsent || height != null) {
      map['height'] = Variable<int>(height);
    }
    if (!nullToAbsent || durationInSeconds != null) {
      map['duration_in_seconds'] = Variable<int>(durationInSeconds);
    }
    map['id'] = Variable<String>(id);
    if (!nullToAbsent || checksum != null) {
      map['checksum'] = Variable<String>(checksum);
    }
    map['is_favorite'] = Variable<bool>(isFavorite);
    map['orientation'] = Variable<int>(orientation);
    return map;
  }

  factory LocalAssetEntityData.fromJson(
    Map<String, dynamic> json, {
    ValueSerializer? serializer,
  }) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return LocalAssetEntityData(
      name: serializer.fromJson<String>(json['name']),
      type: serializer.fromJson<int>(json['type']),
      createdAt: serializer.fromJson<DateTime>(json['createdAt']),
      updatedAt: serializer.fromJson<DateTime>(json['updatedAt']),
      width: serializer.fromJson<int?>(json['width']),
      height: serializer.fromJson<int?>(json['height']),
      durationInSeconds: serializer.fromJson<int?>(json['durationInSeconds']),
      id: serializer.fromJson<String>(json['id']),
      checksum: serializer.fromJson<String?>(json['checksum']),
      isFavorite: serializer.fromJson<bool>(json['isFavorite']),
      orientation: serializer.fromJson<int>(json['orientation']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'name': serializer.toJson<String>(name),
      'type': serializer.toJson<int>(type),
      'createdAt': serializer.toJson<DateTime>(createdAt),
      'updatedAt': serializer.toJson<DateTime>(updatedAt),
      'width': serializer.toJson<int?>(width),
      'height': serializer.toJson<int?>(height),
      'durationInSeconds': serializer.toJson<int?>(durationInSeconds),
      'id': serializer.toJson<String>(id),
      'checksum': serializer.toJson<String?>(checksum),
      'isFavorite': serializer.toJson<bool>(isFavorite),
      'orientation': serializer.toJson<int>(orientation),
    };
  }

  LocalAssetEntityData copyWith({
    String? name,
    int? type,
    DateTime? createdAt,
    DateTime? updatedAt,
    Value<int?> width = const Value.absent(),
    Value<int?> height = const Value.absent(),
    Value<int?> durationInSeconds = const Value.absent(),
    String? id,
    Value<String?> checksum = const Value.absent(),
    bool? isFavorite,
    int? orientation,
  }) => LocalAssetEntityData(
    name: name ?? this.name,
    type: type ?? this.type,
    createdAt: createdAt ?? this.createdAt,
    updatedAt: updatedAt ?? this.updatedAt,
    width: width.present ? width.value : this.width,
    height: height.present ? height.value : this.height,
    durationInSeconds: durationInSeconds.present
        ? durationInSeconds.value
        : this.durationInSeconds,
    id: id ?? this.id,
    checksum: checksum.present ? checksum.value : this.checksum,
    isFavorite: isFavorite ?? this.isFavorite,
    orientation: orientation ?? this.orientation,
  );
  LocalAssetEntityData copyWithCompanion(LocalAssetEntityCompanion data) {
    return LocalAssetEntityData(
      name: data.name.present ? data.name.value : this.name,
      type: data.type.present ? data.type.value : this.type,
      createdAt: data.createdAt.present ? data.createdAt.value : this.createdAt,
      updatedAt: data.updatedAt.present ? data.updatedAt.value : this.updatedAt,
      width: data.width.present ? data.width.value : this.width,
      height: data.height.present ? data.height.value : this.height,
      durationInSeconds: data.durationInSeconds.present
          ? data.durationInSeconds.value
          : this.durationInSeconds,
      id: data.id.present ? data.id.value : this.id,
      checksum: data.checksum.present ? data.checksum.value : this.checksum,
      isFavorite: data.isFavorite.present
          ? data.isFavorite.value
          : this.isFavorite,
      orientation: data.orientation.present
          ? data.orientation.value
          : this.orientation,
    );
  }

  @override
  String toString() {
    return (StringBuffer('LocalAssetEntityData(')
          ..write('name: $name, ')
          ..write('type: $type, ')
          ..write('createdAt: $createdAt, ')
          ..write('updatedAt: $updatedAt, ')
          ..write('width: $width, ')
          ..write('height: $height, ')
          ..write('durationInSeconds: $durationInSeconds, ')
          ..write('id: $id, ')
          ..write('checksum: $checksum, ')
          ..write('isFavorite: $isFavorite, ')
          ..write('orientation: $orientation')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(
    name,
    type,
    createdAt,
    updatedAt,
    width,
    height,
    durationInSeconds,
    id,
    checksum,
    isFavorite,
    orientation,
  );
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is LocalAssetEntityData &&
          other.name == this.name &&
          other.type == this.type &&
          other.createdAt == this.createdAt &&
          other.updatedAt == this.updatedAt &&
          other.width == this.width &&
          other.height == this.height &&
          other.durationInSeconds == this.durationInSeconds &&
          other.id == this.id &&
          other.checksum == this.checksum &&
          other.isFavorite == this.isFavorite &&
          other.orientation == this.orientation);
}

class LocalAssetEntityCompanion extends UpdateCompanion<LocalAssetEntityData> {
  final Value<String> name;
  final Value<int> type;
  final Value<DateTime> createdAt;
  final Value<DateTime> updatedAt;
  final Value<int?> width;
  final Value<int?> height;
  final Value<int?> durationInSeconds;
  final Value<String> id;
  final Value<String?> checksum;
  final Value<bool> isFavorite;
  final Value<int> orientation;
  const LocalAssetEntityCompanion({
    this.name = const Value.absent(),
    this.type = const Value.absent(),
    this.createdAt = const Value.absent(),
    this.updatedAt = const Value.absent(),
    this.width = const Value.absent(),
    this.height = const Value.absent(),
    this.durationInSeconds = const Value.absent(),
    this.id = const Value.absent(),
    this.checksum = const Value.absent(),
    this.isFavorite = const Value.absent(),
    this.orientation = const Value.absent(),
  });
  LocalAssetEntityCompanion.insert({
    required String name,
    required int type,
    this.createdAt = const Value.absent(),
    this.updatedAt = const Value.absent(),
    this.width = const Value.absent(),
    this.height = const Value.absent(),
    this.durationInSeconds = const Value.absent(),
    required String id,
    this.checksum = const Value.absent(),
    this.isFavorite = const Value.absent(),
    this.orientation = const Value.absent(),
  }) : name = Value(name),
       type = Value(type),
       id = Value(id);
  static Insertable<LocalAssetEntityData> custom({
    Expression<String>? name,
    Expression<int>? type,
    Expression<DateTime>? createdAt,
    Expression<DateTime>? updatedAt,
    Expression<int>? width,
    Expression<int>? height,
    Expression<int>? durationInSeconds,
    Expression<String>? id,
    Expression<String>? checksum,
    Expression<bool>? isFavorite,
    Expression<int>? orientation,
  }) {
    return RawValuesInsertable({
      if (name != null) 'name': name,
      if (type != null) 'type': type,
      if (createdAt != null) 'created_at': createdAt,
      if (updatedAt != null) 'updated_at': updatedAt,
      if (width != null) 'width': width,
      if (height != null) 'height': height,
      if (durationInSeconds != null) 'duration_in_seconds': durationInSeconds,
      if (id != null) 'id': id,
      if (checksum != null) 'checksum': checksum,
      if (isFavorite != null) 'is_favorite': isFavorite,
      if (orientation != null) 'orientation': orientation,
    });
  }

  LocalAssetEntityCompanion copyWith({
    Value<String>? name,
    Value<int>? type,
    Value<DateTime>? createdAt,
    Value<DateTime>? updatedAt,
    Value<int?>? width,
    Value<int?>? height,
    Value<int?>? durationInSeconds,
    Value<String>? id,
    Value<String?>? checksum,
    Value<bool>? isFavorite,
    Value<int>? orientation,
  }) {
    return LocalAssetEntityCompanion(
      name: name ?? this.name,
      type: type ?? this.type,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      width: width ?? this.width,
      height: height ?? this.height,
      durationInSeconds: durationInSeconds ?? this.durationInSeconds,
      id: id ?? this.id,
      checksum: checksum ?? this.checksum,
      isFavorite: isFavorite ?? this.isFavorite,
      orientation: orientation ?? this.orientation,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (name.present) {
      map['name'] = Variable<String>(name.value);
    }
    if (type.present) {
      map['type'] = Variable<int>(type.value);
    }
    if (createdAt.present) {
      map['created_at'] = Variable<DateTime>(createdAt.value);
    }
    if (updatedAt.present) {
      map['updated_at'] = Variable<DateTime>(updatedAt.value);
    }
    if (width.present) {
      map['width'] = Variable<int>(width.value);
    }
    if (height.present) {
      map['height'] = Variable<int>(height.value);
    }
    if (durationInSeconds.present) {
      map['duration_in_seconds'] = Variable<int>(durationInSeconds.value);
    }
    if (id.present) {
      map['id'] = Variable<String>(id.value);
    }
    if (checksum.present) {
      map['checksum'] = Variable<String>(checksum.value);
    }
    if (isFavorite.present) {
      map['is_favorite'] = Variable<bool>(isFavorite.value);
    }
    if (orientation.present) {
      map['orientation'] = Variable<int>(orientation.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('LocalAssetEntityCompanion(')
          ..write('name: $name, ')
          ..write('type: $type, ')
          ..write('createdAt: $createdAt, ')
          ..write('updatedAt: $updatedAt, ')
          ..write('width: $width, ')
          ..write('height: $height, ')
          ..write('durationInSeconds: $durationInSeconds, ')
          ..write('id: $id, ')
          ..write('checksum: $checksum, ')
          ..write('isFavorite: $isFavorite, ')
          ..write('orientation: $orientation')
          ..write(')'))
        .toString();
  }
}

class RemoteAlbumEntity extends Table
    with TableInfo<RemoteAlbumEntity, RemoteAlbumEntityData> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  RemoteAlbumEntity(this.attachedDatabase, [this._alias]);
  late final GeneratedColumn<String> id = GeneratedColumn<String>(
    'id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  late final GeneratedColumn<String> name = GeneratedColumn<String>(
    'name',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  late final GeneratedColumn<String> description = GeneratedColumn<String>(
    'description',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
    defaultValue: const CustomExpression('\'\''),
  );
  late final GeneratedColumn<DateTime> createdAt = GeneratedColumn<DateTime>(
    'created_at',
    aliasedName,
    false,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: false,
    defaultValue: const CustomExpression('CURRENT_TIMESTAMP'),
  );
  late final GeneratedColumn<DateTime> updatedAt = GeneratedColumn<DateTime>(
    'updated_at',
    aliasedName,
    false,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: false,
    defaultValue: const CustomExpression('CURRENT_TIMESTAMP'),
  );
  late final GeneratedColumn<String> ownerId = GeneratedColumn<String>(
    'owner_id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
    defaultConstraints: GeneratedColumn.constraintIsAlways(
      'REFERENCES user_entity (id) ON DELETE CASCADE',
    ),
  );
  late final GeneratedColumn<String> thumbnailAssetId = GeneratedColumn<String>(
    'thumbnail_asset_id',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
    defaultConstraints: GeneratedColumn.constraintIsAlways(
      'REFERENCES remote_asset_entity (id) ON DELETE SET NULL',
    ),
  );
  late final GeneratedColumn<bool> isActivityEnabled = GeneratedColumn<bool>(
    'is_activity_enabled',
    aliasedName,
    false,
    type: DriftSqlType.bool,
    requiredDuringInsert: false,
    defaultConstraints: GeneratedColumn.constraintIsAlways(
      'CHECK ("is_activity_enabled" IN (0, 1))',
    ),
    defaultValue: const CustomExpression('1'),
  );
  late final GeneratedColumn<int> order = GeneratedColumn<int>(
    'order',
    aliasedName,
    false,
    type: DriftSqlType.int,
    requiredDuringInsert: true,
  );
  @override
  List<GeneratedColumn> get $columns => [
    id,
    name,
    description,
    createdAt,
    updatedAt,
    ownerId,
    thumbnailAssetId,
    isActivityEnabled,
    order,
  ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'remote_album_entity';
  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  RemoteAlbumEntityData map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return RemoteAlbumEntityData(
      id: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}id'],
      )!,
      name: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}name'],
      )!,
      description: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}description'],
      )!,
      createdAt: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}created_at'],
      )!,
      updatedAt: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}updated_at'],
      )!,
      ownerId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}owner_id'],
      )!,
      thumbnailAssetId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}thumbnail_asset_id'],
      ),
      isActivityEnabled: attachedDatabase.typeMapping.read(
        DriftSqlType.bool,
        data['${effectivePrefix}is_activity_enabled'],
      )!,
      order: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}order'],
      )!,
    );
  }

  @override
  RemoteAlbumEntity createAlias(String alias) {
    return RemoteAlbumEntity(attachedDatabase, alias);
  }

  @override
  bool get withoutRowId => true;
  @override
  bool get isStrict => true;
}

class RemoteAlbumEntityData extends DataClass
    implements Insertable<RemoteAlbumEntityData> {
  final String id;
  final String name;
  final String description;
  final DateTime createdAt;
  final DateTime updatedAt;
  final String ownerId;
  final String? thumbnailAssetId;
  final bool isActivityEnabled;
  final int order;
  const RemoteAlbumEntityData({
    required this.id,
    required this.name,
    required this.description,
    required this.createdAt,
    required this.updatedAt,
    required this.ownerId,
    this.thumbnailAssetId,
    required this.isActivityEnabled,
    required this.order,
  });
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<String>(id);
    map['name'] = Variable<String>(name);
    map['description'] = Variable<String>(description);
    map['created_at'] = Variable<DateTime>(createdAt);
    map['updated_at'] = Variable<DateTime>(updatedAt);
    map['owner_id'] = Variable<String>(ownerId);
    if (!nullToAbsent || thumbnailAssetId != null) {
      map['thumbnail_asset_id'] = Variable<String>(thumbnailAssetId);
    }
    map['is_activity_enabled'] = Variable<bool>(isActivityEnabled);
    map['order'] = Variable<int>(order);
    return map;
  }

  factory RemoteAlbumEntityData.fromJson(
    Map<String, dynamic> json, {
    ValueSerializer? serializer,
  }) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return RemoteAlbumEntityData(
      id: serializer.fromJson<String>(json['id']),
      name: serializer.fromJson<String>(json['name']),
      description: serializer.fromJson<String>(json['description']),
      createdAt: serializer.fromJson<DateTime>(json['createdAt']),
      updatedAt: serializer.fromJson<DateTime>(json['updatedAt']),
      ownerId: serializer.fromJson<String>(json['ownerId']),
      thumbnailAssetId: serializer.fromJson<String?>(json['thumbnailAssetId']),
      isActivityEnabled: serializer.fromJson<bool>(json['isActivityEnabled']),
      order: serializer.fromJson<int>(json['order']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<String>(id),
      'name': serializer.toJson<String>(name),
      'description': serializer.toJson<String>(description),
      'createdAt': serializer.toJson<DateTime>(createdAt),
      'updatedAt': serializer.toJson<DateTime>(updatedAt),
      'ownerId': serializer.toJson<String>(ownerId),
      'thumbnailAssetId': serializer.toJson<String?>(thumbnailAssetId),
      'isActivityEnabled': serializer.toJson<bool>(isActivityEnabled),
      'order': serializer.toJson<int>(order),
    };
  }

  RemoteAlbumEntityData copyWith({
    String? id,
    String? name,
    String? description,
    DateTime? createdAt,
    DateTime? updatedAt,
    String? ownerId,
    Value<String?> thumbnailAssetId = const Value.absent(),
    bool? isActivityEnabled,
    int? order,
  }) => RemoteAlbumEntityData(
    id: id ?? this.id,
    name: name ?? this.name,
    description: description ?? this.description,
    createdAt: createdAt ?? this.createdAt,
    updatedAt: updatedAt ?? this.updatedAt,
    ownerId: ownerId ?? this.ownerId,
    thumbnailAssetId: thumbnailAssetId.present
        ? thumbnailAssetId.value
        : this.thumbnailAssetId,
    isActivityEnabled: isActivityEnabled ?? this.isActivityEnabled,
    order: order ?? this.order,
  );
  RemoteAlbumEntityData copyWithCompanion(RemoteAlbumEntityCompanion data) {
    return RemoteAlbumEntityData(
      id: data.id.present ? data.id.value : this.id,
      name: data.name.present ? data.name.value : this.name,
      description: data.description.present
          ? data.description.value
          : this.description,
      createdAt: data.createdAt.present ? data.createdAt.value : this.createdAt,
      updatedAt: data.updatedAt.present ? data.updatedAt.value : this.updatedAt,
      ownerId: data.ownerId.present ? data.ownerId.value : this.ownerId,
      thumbnailAssetId: data.thumbnailAssetId.present
          ? data.thumbnailAssetId.value
          : this.thumbnailAssetId,
      isActivityEnabled: data.isActivityEnabled.present
          ? data.isActivityEnabled.value
          : this.isActivityEnabled,
      order: data.order.present ? data.order.value : this.order,
    );
  }

  @override
  String toString() {
    return (StringBuffer('RemoteAlbumEntityData(')
          ..write('id: $id, ')
          ..write('name: $name, ')
          ..write('description: $description, ')
          ..write('createdAt: $createdAt, ')
          ..write('updatedAt: $updatedAt, ')
          ..write('ownerId: $ownerId, ')
          ..write('thumbnailAssetId: $thumbnailAssetId, ')
          ..write('isActivityEnabled: $isActivityEnabled, ')
          ..write('order: $order')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(
    id,
    name,
    description,
    createdAt,
    updatedAt,
    ownerId,
    thumbnailAssetId,
    isActivityEnabled,
    order,
  );
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is RemoteAlbumEntityData &&
          other.id == this.id &&
          other.name == this.name &&
          other.description == this.description &&
          other.createdAt == this.createdAt &&
          other.updatedAt == this.updatedAt &&
          other.ownerId == this.ownerId &&
          other.thumbnailAssetId == this.thumbnailAssetId &&
          other.isActivityEnabled == this.isActivityEnabled &&
          other.order == this.order);
}

class RemoteAlbumEntityCompanion
    extends UpdateCompanion<RemoteAlbumEntityData> {
  final Value<String> id;
  final Value<String> name;
  final Value<String> description;
  final Value<DateTime> createdAt;
  final Value<DateTime> updatedAt;
  final Value<String> ownerId;
  final Value<String?> thumbnailAssetId;
  final Value<bool> isActivityEnabled;
  final Value<int> order;
  const RemoteAlbumEntityCompanion({
    this.id = const Value.absent(),
    this.name = const Value.absent(),
    this.description = const Value.absent(),
    this.createdAt = const Value.absent(),
    this.updatedAt = const Value.absent(),
    this.ownerId = const Value.absent(),
    this.thumbnailAssetId = const Value.absent(),
    this.isActivityEnabled = const Value.absent(),
    this.order = const Value.absent(),
  });
  RemoteAlbumEntityCompanion.insert({
    required String id,
    required String name,
    this.description = const Value.absent(),
    this.createdAt = const Value.absent(),
    this.updatedAt = const Value.absent(),
    required String ownerId,
    this.thumbnailAssetId = const Value.absent(),
    this.isActivityEnabled = const Value.absent(),
    required int order,
  }) : id = Value(id),
       name = Value(name),
       ownerId = Value(ownerId),
       order = Value(order);
  static Insertable<RemoteAlbumEntityData> custom({
    Expression<String>? id,
    Expression<String>? name,
    Expression<String>? description,
    Expression<DateTime>? createdAt,
    Expression<DateTime>? updatedAt,
    Expression<String>? ownerId,
    Expression<String>? thumbnailAssetId,
    Expression<bool>? isActivityEnabled,
    Expression<int>? order,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (name != null) 'name': name,
      if (description != null) 'description': description,
      if (createdAt != null) 'created_at': createdAt,
      if (updatedAt != null) 'updated_at': updatedAt,
      if (ownerId != null) 'owner_id': ownerId,
      if (thumbnailAssetId != null) 'thumbnail_asset_id': thumbnailAssetId,
      if (isActivityEnabled != null) 'is_activity_enabled': isActivityEnabled,
      if (order != null) 'order': order,
    });
  }

  RemoteAlbumEntityCompanion copyWith({
    Value<String>? id,
    Value<String>? name,
    Value<String>? description,
    Value<DateTime>? createdAt,
    Value<DateTime>? updatedAt,
    Value<String>? ownerId,
    Value<String?>? thumbnailAssetId,
    Value<bool>? isActivityEnabled,
    Value<int>? order,
  }) {
    return RemoteAlbumEntityCompanion(
      id: id ?? this.id,
      name: name ?? this.name,
      description: description ?? this.description,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      ownerId: ownerId ?? this.ownerId,
      thumbnailAssetId: thumbnailAssetId ?? this.thumbnailAssetId,
      isActivityEnabled: isActivityEnabled ?? this.isActivityEnabled,
      order: order ?? this.order,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<String>(id.value);
    }
    if (name.present) {
      map['name'] = Variable<String>(name.value);
    }
    if (description.present) {
      map['description'] = Variable<String>(description.value);
    }
    if (createdAt.present) {
      map['created_at'] = Variable<DateTime>(createdAt.value);
    }
    if (updatedAt.present) {
      map['updated_at'] = Variable<DateTime>(updatedAt.value);
    }
    if (ownerId.present) {
      map['owner_id'] = Variable<String>(ownerId.value);
    }
    if (thumbnailAssetId.present) {
      map['thumbnail_asset_id'] = Variable<String>(thumbnailAssetId.value);
    }
    if (isActivityEnabled.present) {
      map['is_activity_enabled'] = Variable<bool>(isActivityEnabled.value);
    }
    if (order.present) {
      map['order'] = Variable<int>(order.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('RemoteAlbumEntityCompanion(')
          ..write('id: $id, ')
          ..write('name: $name, ')
          ..write('description: $description, ')
          ..write('createdAt: $createdAt, ')
          ..write('updatedAt: $updatedAt, ')
          ..write('ownerId: $ownerId, ')
          ..write('thumbnailAssetId: $thumbnailAssetId, ')
          ..write('isActivityEnabled: $isActivityEnabled, ')
          ..write('order: $order')
          ..write(')'))
        .toString();
  }
}

class LocalAlbumEntity extends Table
    with TableInfo<LocalAlbumEntity, LocalAlbumEntityData> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  LocalAlbumEntity(this.attachedDatabase, [this._alias]);
  late final GeneratedColumn<String> id = GeneratedColumn<String>(
    'id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  late final GeneratedColumn<String> name = GeneratedColumn<String>(
    'name',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  late final GeneratedColumn<DateTime> updatedAt = GeneratedColumn<DateTime>(
    'updated_at',
    aliasedName,
    false,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: false,
    defaultValue: const CustomExpression('CURRENT_TIMESTAMP'),
  );
  late final GeneratedColumn<int> backupSelection = GeneratedColumn<int>(
    'backup_selection',
    aliasedName,
    false,
    type: DriftSqlType.int,
    requiredDuringInsert: true,
  );
  late final GeneratedColumn<bool> isIosSharedAlbum = GeneratedColumn<bool>(
    'is_ios_shared_album',
    aliasedName,
    false,
    type: DriftSqlType.bool,
    requiredDuringInsert: false,
    defaultConstraints: GeneratedColumn.constraintIsAlways(
      'CHECK ("is_ios_shared_album" IN (0, 1))',
    ),
    defaultValue: const CustomExpression('0'),
  );
  late final GeneratedColumn<String> linkedRemoteAlbumId =
      GeneratedColumn<String>(
        'linked_remote_album_id',
        aliasedName,
        true,
        type: DriftSqlType.string,
        requiredDuringInsert: false,
        defaultConstraints: GeneratedColumn.constraintIsAlways(
          'REFERENCES remote_album_entity (id) ON DELETE SET NULL',
        ),
      );
  late final GeneratedColumn<bool> marker_ = GeneratedColumn<bool>(
    'marker',
    aliasedName,
    true,
    type: DriftSqlType.bool,
    requiredDuringInsert: false,
    defaultConstraints: GeneratedColumn.constraintIsAlways(
      'CHECK ("marker" IN (0, 1))',
    ),
  );
  @override
  List<GeneratedColumn> get $columns => [
    id,
    name,
    updatedAt,
    backupSelection,
    isIosSharedAlbum,
    linkedRemoteAlbumId,
    marker_,
  ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'local_album_entity';
  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  LocalAlbumEntityData map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return LocalAlbumEntityData(
      id: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}id'],
      )!,
      name: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}name'],
      )!,
      updatedAt: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}updated_at'],
      )!,
      backupSelection: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}backup_selection'],
      )!,
      isIosSharedAlbum: attachedDatabase.typeMapping.read(
        DriftSqlType.bool,
        data['${effectivePrefix}is_ios_shared_album'],
      )!,
      linkedRemoteAlbumId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}linked_remote_album_id'],
      ),
      marker_: attachedDatabase.typeMapping.read(
        DriftSqlType.bool,
        data['${effectivePrefix}marker'],
      ),
    );
  }

  @override
  LocalAlbumEntity createAlias(String alias) {
    return LocalAlbumEntity(attachedDatabase, alias);
  }

  @override
  bool get withoutRowId => true;
  @override
  bool get isStrict => true;
}

class LocalAlbumEntityData extends DataClass
    implements Insertable<LocalAlbumEntityData> {
  final String id;
  final String name;
  final DateTime updatedAt;
  final int backupSelection;
  final bool isIosSharedAlbum;
  final String? linkedRemoteAlbumId;
  final bool? marker_;
  const LocalAlbumEntityData({
    required this.id,
    required this.name,
    required this.updatedAt,
    required this.backupSelection,
    required this.isIosSharedAlbum,
    this.linkedRemoteAlbumId,
    this.marker_,
  });
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<String>(id);
    map['name'] = Variable<String>(name);
    map['updated_at'] = Variable<DateTime>(updatedAt);
    map['backup_selection'] = Variable<int>(backupSelection);
    map['is_ios_shared_album'] = Variable<bool>(isIosSharedAlbum);
    if (!nullToAbsent || linkedRemoteAlbumId != null) {
      map['linked_remote_album_id'] = Variable<String>(linkedRemoteAlbumId);
    }
    if (!nullToAbsent || marker_ != null) {
      map['marker'] = Variable<bool>(marker_);
    }
    return map;
  }

  factory LocalAlbumEntityData.fromJson(
    Map<String, dynamic> json, {
    ValueSerializer? serializer,
  }) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return LocalAlbumEntityData(
      id: serializer.fromJson<String>(json['id']),
      name: serializer.fromJson<String>(json['name']),
      updatedAt: serializer.fromJson<DateTime>(json['updatedAt']),
      backupSelection: serializer.fromJson<int>(json['backupSelection']),
      isIosSharedAlbum: serializer.fromJson<bool>(json['isIosSharedAlbum']),
      linkedRemoteAlbumId: serializer.fromJson<String?>(
        json['linkedRemoteAlbumId'],
      ),
      marker_: serializer.fromJson<bool?>(json['marker_']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<String>(id),
      'name': serializer.toJson<String>(name),
      'updatedAt': serializer.toJson<DateTime>(updatedAt),
      'backupSelection': serializer.toJson<int>(backupSelection),
      'isIosSharedAlbum': serializer.toJson<bool>(isIosSharedAlbum),
      'linkedRemoteAlbumId': serializer.toJson<String?>(linkedRemoteAlbumId),
      'marker_': serializer.toJson<bool?>(marker_),
    };
  }

  LocalAlbumEntityData copyWith({
    String? id,
    String? name,
    DateTime? updatedAt,
    int? backupSelection,
    bool? isIosSharedAlbum,
    Value<String?> linkedRemoteAlbumId = const Value.absent(),
    Value<bool?> marker_ = const Value.absent(),
  }) => LocalAlbumEntityData(
    id: id ?? this.id,
    name: name ?? this.name,
    updatedAt: updatedAt ?? this.updatedAt,
    backupSelection: backupSelection ?? this.backupSelection,
    isIosSharedAlbum: isIosSharedAlbum ?? this.isIosSharedAlbum,
    linkedRemoteAlbumId: linkedRemoteAlbumId.present
        ? linkedRemoteAlbumId.value
        : this.linkedRemoteAlbumId,
    marker_: marker_.present ? marker_.value : this.marker_,
  );
  LocalAlbumEntityData copyWithCompanion(LocalAlbumEntityCompanion data) {
    return LocalAlbumEntityData(
      id: data.id.present ? data.id.value : this.id,
      name: data.name.present ? data.name.value : this.name,
      updatedAt: data.updatedAt.present ? data.updatedAt.value : this.updatedAt,
      backupSelection: data.backupSelection.present
          ? data.backupSelection.value
          : this.backupSelection,
      isIosSharedAlbum: data.isIosSharedAlbum.present
          ? data.isIosSharedAlbum.value
          : this.isIosSharedAlbum,
      linkedRemoteAlbumId: data.linkedRemoteAlbumId.present
          ? data.linkedRemoteAlbumId.value
          : this.linkedRemoteAlbumId,
      marker_: data.marker_.present ? data.marker_.value : this.marker_,
    );
  }

  @override
  String toString() {
    return (StringBuffer('LocalAlbumEntityData(')
          ..write('id: $id, ')
          ..write('name: $name, ')
          ..write('updatedAt: $updatedAt, ')
          ..write('backupSelection: $backupSelection, ')
          ..write('isIosSharedAlbum: $isIosSharedAlbum, ')
          ..write('linkedRemoteAlbumId: $linkedRemoteAlbumId, ')
          ..write('marker_: $marker_')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(
    id,
    name,
    updatedAt,
    backupSelection,
    isIosSharedAlbum,
    linkedRemoteAlbumId,
    marker_,
  );
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is LocalAlbumEntityData &&
          other.id == this.id &&
          other.name == this.name &&
          other.updatedAt == this.updatedAt &&
          other.backupSelection == this.backupSelection &&
          other.isIosSharedAlbum == this.isIosSharedAlbum &&
          other.linkedRemoteAlbumId == this.linkedRemoteAlbumId &&
          other.marker_ == this.marker_);
}

class LocalAlbumEntityCompanion extends UpdateCompanion<LocalAlbumEntityData> {
  final Value<String> id;
  final Value<String> name;
  final Value<DateTime> updatedAt;
  final Value<int> backupSelection;
  final Value<bool> isIosSharedAlbum;
  final Value<String?> linkedRemoteAlbumId;
  final Value<bool?> marker_;
  const LocalAlbumEntityCompanion({
    this.id = const Value.absent(),
    this.name = const Value.absent(),
    this.updatedAt = const Value.absent(),
    this.backupSelection = const Value.absent(),
    this.isIosSharedAlbum = const Value.absent(),
    this.linkedRemoteAlbumId = const Value.absent(),
    this.marker_ = const Value.absent(),
  });
  LocalAlbumEntityCompanion.insert({
    required String id,
    required String name,
    this.updatedAt = const Value.absent(),
    required int backupSelection,
    this.isIosSharedAlbum = const Value.absent(),
    this.linkedRemoteAlbumId = const Value.absent(),
    this.marker_ = const Value.absent(),
  }) : id = Value(id),
       name = Value(name),
       backupSelection = Value(backupSelection);
  static Insertable<LocalAlbumEntityData> custom({
    Expression<String>? id,
    Expression<String>? name,
    Expression<DateTime>? updatedAt,
    Expression<int>? backupSelection,
    Expression<bool>? isIosSharedAlbum,
    Expression<String>? linkedRemoteAlbumId,
    Expression<bool>? marker_,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (name != null) 'name': name,
      if (updatedAt != null) 'updated_at': updatedAt,
      if (backupSelection != null) 'backup_selection': backupSelection,
      if (isIosSharedAlbum != null) 'is_ios_shared_album': isIosSharedAlbum,
      if (linkedRemoteAlbumId != null)
        'linked_remote_album_id': linkedRemoteAlbumId,
      if (marker_ != null) 'marker': marker_,
    });
  }

  LocalAlbumEntityCompanion copyWith({
    Value<String>? id,
    Value<String>? name,
    Value<DateTime>? updatedAt,
    Value<int>? backupSelection,
    Value<bool>? isIosSharedAlbum,
    Value<String?>? linkedRemoteAlbumId,
    Value<bool?>? marker_,
  }) {
    return LocalAlbumEntityCompanion(
      id: id ?? this.id,
      name: name ?? this.name,
      updatedAt: updatedAt ?? this.updatedAt,
      backupSelection: backupSelection ?? this.backupSelection,
      isIosSharedAlbum: isIosSharedAlbum ?? this.isIosSharedAlbum,
      linkedRemoteAlbumId: linkedRemoteAlbumId ?? this.linkedRemoteAlbumId,
      marker_: marker_ ?? this.marker_,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<String>(id.value);
    }
    if (name.present) {
      map['name'] = Variable<String>(name.value);
    }
    if (updatedAt.present) {
      map['updated_at'] = Variable<DateTime>(updatedAt.value);
    }
    if (backupSelection.present) {
      map['backup_selection'] = Variable<int>(backupSelection.value);
    }
    if (isIosSharedAlbum.present) {
      map['is_ios_shared_album'] = Variable<bool>(isIosSharedAlbum.value);
    }
    if (linkedRemoteAlbumId.present) {
      map['linked_remote_album_id'] = Variable<String>(
        linkedRemoteAlbumId.value,
      );
    }
    if (marker_.present) {
      map['marker'] = Variable<bool>(marker_.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('LocalAlbumEntityCompanion(')
          ..write('id: $id, ')
          ..write('name: $name, ')
          ..write('updatedAt: $updatedAt, ')
          ..write('backupSelection: $backupSelection, ')
          ..write('isIosSharedAlbum: $isIosSharedAlbum, ')
          ..write('linkedRemoteAlbumId: $linkedRemoteAlbumId, ')
          ..write('marker_: $marker_')
          ..write(')'))
        .toString();
  }
}

class LocalAlbumAssetEntity extends Table
    with TableInfo<LocalAlbumAssetEntity, LocalAlbumAssetEntityData> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  LocalAlbumAssetEntity(this.attachedDatabase, [this._alias]);
  late final GeneratedColumn<String> assetId = GeneratedColumn<String>(
    'asset_id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
    defaultConstraints: GeneratedColumn.constraintIsAlways(
      'REFERENCES local_asset_entity (id) ON DELETE CASCADE',
    ),
  );
  late final GeneratedColumn<String> albumId = GeneratedColumn<String>(
    'album_id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
    defaultConstraints: GeneratedColumn.constraintIsAlways(
      'REFERENCES local_album_entity (id) ON DELETE CASCADE',
    ),
  );
  @override
  List<GeneratedColumn> get $columns => [assetId, albumId];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'local_album_asset_entity';
  @override
  Set<GeneratedColumn> get $primaryKey => {assetId, albumId};
  @override
  LocalAlbumAssetEntityData map(
    Map<String, dynamic> data, {
    String? tablePrefix,
  }) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return LocalAlbumAssetEntityData(
      assetId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}asset_id'],
      )!,
      albumId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}album_id'],
      )!,
    );
  }

  @override
  LocalAlbumAssetEntity createAlias(String alias) {
    return LocalAlbumAssetEntity(attachedDatabase, alias);
  }

  @override
  bool get withoutRowId => true;
  @override
  bool get isStrict => true;
}

class LocalAlbumAssetEntityData extends DataClass
    implements Insertable<LocalAlbumAssetEntityData> {
  final String assetId;
  final String albumId;
  const LocalAlbumAssetEntityData({
    required this.assetId,
    required this.albumId,
  });
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['asset_id'] = Variable<String>(assetId);
    map['album_id'] = Variable<String>(albumId);
    return map;
  }

  factory LocalAlbumAssetEntityData.fromJson(
    Map<String, dynamic> json, {
    ValueSerializer? serializer,
  }) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return LocalAlbumAssetEntityData(
      assetId: serializer.fromJson<String>(json['assetId']),
      albumId: serializer.fromJson<String>(json['albumId']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'assetId': serializer.toJson<String>(assetId),
      'albumId': serializer.toJson<String>(albumId),
    };
  }

  LocalAlbumAssetEntityData copyWith({String? assetId, String? albumId}) =>
      LocalAlbumAssetEntityData(
        assetId: assetId ?? this.assetId,
        albumId: albumId ?? this.albumId,
      );
  LocalAlbumAssetEntityData copyWithCompanion(
    LocalAlbumAssetEntityCompanion data,
  ) {
    return LocalAlbumAssetEntityData(
      assetId: data.assetId.present ? data.assetId.value : this.assetId,
      albumId: data.albumId.present ? data.albumId.value : this.albumId,
    );
  }

  @override
  String toString() {
    return (StringBuffer('LocalAlbumAssetEntityData(')
          ..write('assetId: $assetId, ')
          ..write('albumId: $albumId')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(assetId, albumId);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is LocalAlbumAssetEntityData &&
          other.assetId == this.assetId &&
          other.albumId == this.albumId);
}

class LocalAlbumAssetEntityCompanion
    extends UpdateCompanion<LocalAlbumAssetEntityData> {
  final Value<String> assetId;
  final Value<String> albumId;
  const LocalAlbumAssetEntityCompanion({
    this.assetId = const Value.absent(),
    this.albumId = const Value.absent(),
  });
  LocalAlbumAssetEntityCompanion.insert({
    required String assetId,
    required String albumId,
  }) : assetId = Value(assetId),
       albumId = Value(albumId);
  static Insertable<LocalAlbumAssetEntityData> custom({
    Expression<String>? assetId,
    Expression<String>? albumId,
  }) {
    return RawValuesInsertable({
      if (assetId != null) 'asset_id': assetId,
      if (albumId != null) 'album_id': albumId,
    });
  }

  LocalAlbumAssetEntityCompanion copyWith({
    Value<String>? assetId,
    Value<String>? albumId,
  }) {
    return LocalAlbumAssetEntityCompanion(
      assetId: assetId ?? this.assetId,
      albumId: albumId ?? this.albumId,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (assetId.present) {
      map['asset_id'] = Variable<String>(assetId.value);
    }
    if (albumId.present) {
      map['album_id'] = Variable<String>(albumId.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('LocalAlbumAssetEntityCompanion(')
          ..write('assetId: $assetId, ')
          ..write('albumId: $albumId')
          ..write(')'))
        .toString();
  }
}

class AuthUserEntity extends Table
    with TableInfo<AuthUserEntity, AuthUserEntityData> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  AuthUserEntity(this.attachedDatabase, [this._alias]);
  late final GeneratedColumn<String> id = GeneratedColumn<String>(
    'id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  late final GeneratedColumn<String> name = GeneratedColumn<String>(
    'name',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  late final GeneratedColumn<String> email = GeneratedColumn<String>(
    'email',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  late final GeneratedColumn<bool> isAdmin = GeneratedColumn<bool>(
    'is_admin',
    aliasedName,
    false,
    type: DriftSqlType.bool,
    requiredDuringInsert: false,
    defaultConstraints: GeneratedColumn.constraintIsAlways(
      'CHECK ("is_admin" IN (0, 1))',
    ),
    defaultValue: const CustomExpression('0'),
  );
  late final GeneratedColumn<bool> hasProfileImage = GeneratedColumn<bool>(
    'has_profile_image',
    aliasedName,
    false,
    type: DriftSqlType.bool,
    requiredDuringInsert: false,
    defaultConstraints: GeneratedColumn.constraintIsAlways(
      'CHECK ("has_profile_image" IN (0, 1))',
    ),
    defaultValue: const CustomExpression('0'),
  );
  late final GeneratedColumn<DateTime> profileChangedAt =
      GeneratedColumn<DateTime>(
        'profile_changed_at',
        aliasedName,
        false,
        type: DriftSqlType.dateTime,
        requiredDuringInsert: false,
        defaultValue: const CustomExpression('CURRENT_TIMESTAMP'),
      );
  late final GeneratedColumn<int> avatarColor = GeneratedColumn<int>(
    'avatar_color',
    aliasedName,
    false,
    type: DriftSqlType.int,
    requiredDuringInsert: true,
  );
  late final GeneratedColumn<int> quotaSizeInBytes = GeneratedColumn<int>(
    'quota_size_in_bytes',
    aliasedName,
    false,
    type: DriftSqlType.int,
    requiredDuringInsert: false,
    defaultValue: const CustomExpression('0'),
  );
  late final GeneratedColumn<int> quotaUsageInBytes = GeneratedColumn<int>(
    'quota_usage_in_bytes',
    aliasedName,
    false,
    type: DriftSqlType.int,
    requiredDuringInsert: false,
    defaultValue: const CustomExpression('0'),
  );
  late final GeneratedColumn<String> pinCode = GeneratedColumn<String>(
    'pin_code',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  @override
  List<GeneratedColumn> get $columns => [
    id,
    name,
    email,
    isAdmin,
    hasProfileImage,
    profileChangedAt,
    avatarColor,
    quotaSizeInBytes,
    quotaUsageInBytes,
    pinCode,
  ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'auth_user_entity';
  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  AuthUserEntityData map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return AuthUserEntityData(
      id: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}id'],
      )!,
      name: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}name'],
      )!,
      email: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}email'],
      )!,
      isAdmin: attachedDatabase.typeMapping.read(
        DriftSqlType.bool,
        data['${effectivePrefix}is_admin'],
      )!,
      hasProfileImage: attachedDatabase.typeMapping.read(
        DriftSqlType.bool,
        data['${effectivePrefix}has_profile_image'],
      )!,
      profileChangedAt: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}profile_changed_at'],
      )!,
      avatarColor: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}avatar_color'],
      )!,
      quotaSizeInBytes: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}quota_size_in_bytes'],
      )!,
      quotaUsageInBytes: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}quota_usage_in_bytes'],
      )!,
      pinCode: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}pin_code'],
      ),
    );
  }

  @override
  AuthUserEntity createAlias(String alias) {
    return AuthUserEntity(attachedDatabase, alias);
  }

  @override
  bool get withoutRowId => true;
  @override
  bool get isStrict => true;
}

class AuthUserEntityData extends DataClass
    implements Insertable<AuthUserEntityData> {
  final String id;
  final String name;
  final String email;
  final bool isAdmin;
  final bool hasProfileImage;
  final DateTime profileChangedAt;
  final int avatarColor;
  final int quotaSizeInBytes;
  final int quotaUsageInBytes;
  final String? pinCode;
  const AuthUserEntityData({
    required this.id,
    required this.name,
    required this.email,
    required this.isAdmin,
    required this.hasProfileImage,
    required this.profileChangedAt,
    required this.avatarColor,
    required this.quotaSizeInBytes,
    required this.quotaUsageInBytes,
    this.pinCode,
  });
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<String>(id);
    map['name'] = Variable<String>(name);
    map['email'] = Variable<String>(email);
    map['is_admin'] = Variable<bool>(isAdmin);
    map['has_profile_image'] = Variable<bool>(hasProfileImage);
    map['profile_changed_at'] = Variable<DateTime>(profileChangedAt);
    map['avatar_color'] = Variable<int>(avatarColor);
    map['quota_size_in_bytes'] = Variable<int>(quotaSizeInBytes);
    map['quota_usage_in_bytes'] = Variable<int>(quotaUsageInBytes);
    if (!nullToAbsent || pinCode != null) {
      map['pin_code'] = Variable<String>(pinCode);
    }
    return map;
  }

  factory AuthUserEntityData.fromJson(
    Map<String, dynamic> json, {
    ValueSerializer? serializer,
  }) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return AuthUserEntityData(
      id: serializer.fromJson<String>(json['id']),
      name: serializer.fromJson<String>(json['name']),
      email: serializer.fromJson<String>(json['email']),
      isAdmin: serializer.fromJson<bool>(json['isAdmin']),
      hasProfileImage: serializer.fromJson<bool>(json['hasProfileImage']),
      profileChangedAt: serializer.fromJson<DateTime>(json['profileChangedAt']),
      avatarColor: serializer.fromJson<int>(json['avatarColor']),
      quotaSizeInBytes: serializer.fromJson<int>(json['quotaSizeInBytes']),
      quotaUsageInBytes: serializer.fromJson<int>(json['quotaUsageInBytes']),
      pinCode: serializer.fromJson<String?>(json['pinCode']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<String>(id),
      'name': serializer.toJson<String>(name),
      'email': serializer.toJson<String>(email),
      'isAdmin': serializer.toJson<bool>(isAdmin),
      'hasProfileImage': serializer.toJson<bool>(hasProfileImage),
      'profileChangedAt': serializer.toJson<DateTime>(profileChangedAt),
      'avatarColor': serializer.toJson<int>(avatarColor),
      'quotaSizeInBytes': serializer.toJson<int>(quotaSizeInBytes),
      'quotaUsageInBytes': serializer.toJson<int>(quotaUsageInBytes),
      'pinCode': serializer.toJson<String?>(pinCode),
    };
  }

  AuthUserEntityData copyWith({
    String? id,
    String? name,
    String? email,
    bool? isAdmin,
    bool? hasProfileImage,
    DateTime? profileChangedAt,
    int? avatarColor,
    int? quotaSizeInBytes,
    int? quotaUsageInBytes,
    Value<String?> pinCode = const Value.absent(),
  }) => AuthUserEntityData(
    id: id ?? this.id,
    name: name ?? this.name,
    email: email ?? this.email,
    isAdmin: isAdmin ?? this.isAdmin,
    hasProfileImage: hasProfileImage ?? this.hasProfileImage,
    profileChangedAt: profileChangedAt ?? this.profileChangedAt,
    avatarColor: avatarColor ?? this.avatarColor,
    quotaSizeInBytes: quotaSizeInBytes ?? this.quotaSizeInBytes,
    quotaUsageInBytes: quotaUsageInBytes ?? this.quotaUsageInBytes,
    pinCode: pinCode.present ? pinCode.value : this.pinCode,
  );
  AuthUserEntityData copyWithCompanion(AuthUserEntityCompanion data) {
    return AuthUserEntityData(
      id: data.id.present ? data.id.value : this.id,
      name: data.name.present ? data.name.value : this.name,
      email: data.email.present ? data.email.value : this.email,
      isAdmin: data.isAdmin.present ? data.isAdmin.value : this.isAdmin,
      hasProfileImage: data.hasProfileImage.present
          ? data.hasProfileImage.value
          : this.hasProfileImage,
      profileChangedAt: data.profileChangedAt.present
          ? data.profileChangedAt.value
          : this.profileChangedAt,
      avatarColor: data.avatarColor.present
          ? data.avatarColor.value
          : this.avatarColor,
      quotaSizeInBytes: data.quotaSizeInBytes.present
          ? data.quotaSizeInBytes.value
          : this.quotaSizeInBytes,
      quotaUsageInBytes: data.quotaUsageInBytes.present
          ? data.quotaUsageInBytes.value
          : this.quotaUsageInBytes,
      pinCode: data.pinCode.present ? data.pinCode.value : this.pinCode,
    );
  }

  @override
  String toString() {
    return (StringBuffer('AuthUserEntityData(')
          ..write('id: $id, ')
          ..write('name: $name, ')
          ..write('email: $email, ')
          ..write('isAdmin: $isAdmin, ')
          ..write('hasProfileImage: $hasProfileImage, ')
          ..write('profileChangedAt: $profileChangedAt, ')
          ..write('avatarColor: $avatarColor, ')
          ..write('quotaSizeInBytes: $quotaSizeInBytes, ')
          ..write('quotaUsageInBytes: $quotaUsageInBytes, ')
          ..write('pinCode: $pinCode')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(
    id,
    name,
    email,
    isAdmin,
    hasProfileImage,
    profileChangedAt,
    avatarColor,
    quotaSizeInBytes,
    quotaUsageInBytes,
    pinCode,
  );
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is AuthUserEntityData &&
          other.id == this.id &&
          other.name == this.name &&
          other.email == this.email &&
          other.isAdmin == this.isAdmin &&
          other.hasProfileImage == this.hasProfileImage &&
          other.profileChangedAt == this.profileChangedAt &&
          other.avatarColor == this.avatarColor &&
          other.quotaSizeInBytes == this.quotaSizeInBytes &&
          other.quotaUsageInBytes == this.quotaUsageInBytes &&
          other.pinCode == this.pinCode);
}

class AuthUserEntityCompanion extends UpdateCompanion<AuthUserEntityData> {
  final Value<String> id;
  final Value<String> name;
  final Value<String> email;
  final Value<bool> isAdmin;
  final Value<bool> hasProfileImage;
  final Value<DateTime> profileChangedAt;
  final Value<int> avatarColor;
  final Value<int> quotaSizeInBytes;
  final Value<int> quotaUsageInBytes;
  final Value<String?> pinCode;
  const AuthUserEntityCompanion({
    this.id = const Value.absent(),
    this.name = const Value.absent(),
    this.email = const Value.absent(),
    this.isAdmin = const Value.absent(),
    this.hasProfileImage = const Value.absent(),
    this.profileChangedAt = const Value.absent(),
    this.avatarColor = const Value.absent(),
    this.quotaSizeInBytes = const Value.absent(),
    this.quotaUsageInBytes = const Value.absent(),
    this.pinCode = const Value.absent(),
  });
  AuthUserEntityCompanion.insert({
    required String id,
    required String name,
    required String email,
    this.isAdmin = const Value.absent(),
    this.hasProfileImage = const Value.absent(),
    this.profileChangedAt = const Value.absent(),
    required int avatarColor,
    this.quotaSizeInBytes = const Value.absent(),
    this.quotaUsageInBytes = const Value.absent(),
    this.pinCode = const Value.absent(),
  }) : id = Value(id),
       name = Value(name),
       email = Value(email),
       avatarColor = Value(avatarColor);
  static Insertable<AuthUserEntityData> custom({
    Expression<String>? id,
    Expression<String>? name,
    Expression<String>? email,
    Expression<bool>? isAdmin,
    Expression<bool>? hasProfileImage,
    Expression<DateTime>? profileChangedAt,
    Expression<int>? avatarColor,
    Expression<int>? quotaSizeInBytes,
    Expression<int>? quotaUsageInBytes,
    Expression<String>? pinCode,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (name != null) 'name': name,
      if (email != null) 'email': email,
      if (isAdmin != null) 'is_admin': isAdmin,
      if (hasProfileImage != null) 'has_profile_image': hasProfileImage,
      if (profileChangedAt != null) 'profile_changed_at': profileChangedAt,
      if (avatarColor != null) 'avatar_color': avatarColor,
      if (quotaSizeInBytes != null) 'quota_size_in_bytes': quotaSizeInBytes,
      if (quotaUsageInBytes != null) 'quota_usage_in_bytes': quotaUsageInBytes,
      if (pinCode != null) 'pin_code': pinCode,
    });
  }

  AuthUserEntityCompanion copyWith({
    Value<String>? id,
    Value<String>? name,
    Value<String>? email,
    Value<bool>? isAdmin,
    Value<bool>? hasProfileImage,
    Value<DateTime>? profileChangedAt,
    Value<int>? avatarColor,
    Value<int>? quotaSizeInBytes,
    Value<int>? quotaUsageInBytes,
    Value<String?>? pinCode,
  }) {
    return AuthUserEntityCompanion(
      id: id ?? this.id,
      name: name ?? this.name,
      email: email ?? this.email,
      isAdmin: isAdmin ?? this.isAdmin,
      hasProfileImage: hasProfileImage ?? this.hasProfileImage,
      profileChangedAt: profileChangedAt ?? this.profileChangedAt,
      avatarColor: avatarColor ?? this.avatarColor,
      quotaSizeInBytes: quotaSizeInBytes ?? this.quotaSizeInBytes,
      quotaUsageInBytes: quotaUsageInBytes ?? this.quotaUsageInBytes,
      pinCode: pinCode ?? this.pinCode,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<String>(id.value);
    }
    if (name.present) {
      map['name'] = Variable<String>(name.value);
    }
    if (email.present) {
      map['email'] = Variable<String>(email.value);
    }
    if (isAdmin.present) {
      map['is_admin'] = Variable<bool>(isAdmin.value);
    }
    if (hasProfileImage.present) {
      map['has_profile_image'] = Variable<bool>(hasProfileImage.value);
    }
    if (profileChangedAt.present) {
      map['profile_changed_at'] = Variable<DateTime>(profileChangedAt.value);
    }
    if (avatarColor.present) {
      map['avatar_color'] = Variable<int>(avatarColor.value);
    }
    if (quotaSizeInBytes.present) {
      map['quota_size_in_bytes'] = Variable<int>(quotaSizeInBytes.value);
    }
    if (quotaUsageInBytes.present) {
      map['quota_usage_in_bytes'] = Variable<int>(quotaUsageInBytes.value);
    }
    if (pinCode.present) {
      map['pin_code'] = Variable<String>(pinCode.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('AuthUserEntityCompanion(')
          ..write('id: $id, ')
          ..write('name: $name, ')
          ..write('email: $email, ')
          ..write('isAdmin: $isAdmin, ')
          ..write('hasProfileImage: $hasProfileImage, ')
          ..write('profileChangedAt: $profileChangedAt, ')
          ..write('avatarColor: $avatarColor, ')
          ..write('quotaSizeInBytes: $quotaSizeInBytes, ')
          ..write('quotaUsageInBytes: $quotaUsageInBytes, ')
          ..write('pinCode: $pinCode')
          ..write(')'))
        .toString();
  }
}

class UserMetadataEntity extends Table
    with TableInfo<UserMetadataEntity, UserMetadataEntityData> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  UserMetadataEntity(this.attachedDatabase, [this._alias]);
  late final GeneratedColumn<String> userId = GeneratedColumn<String>(
    'user_id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
    defaultConstraints: GeneratedColumn.constraintIsAlways(
      'REFERENCES user_entity (id) ON DELETE CASCADE',
    ),
  );
  late final GeneratedColumn<int> key = GeneratedColumn<int>(
    'key',
    aliasedName,
    false,
    type: DriftSqlType.int,
    requiredDuringInsert: true,
  );
  late final GeneratedColumn<Uint8List> value = GeneratedColumn<Uint8List>(
    'value',
    aliasedName,
    false,
    type: DriftSqlType.blob,
    requiredDuringInsert: true,
  );
  @override
  List<GeneratedColumn> get $columns => [userId, key, value];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'user_metadata_entity';
  @override
  Set<GeneratedColumn> get $primaryKey => {userId, key};
  @override
  UserMetadataEntityData map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return UserMetadataEntityData(
      userId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}user_id'],
      )!,
      key: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}key'],
      )!,
      value: attachedDatabase.typeMapping.read(
        DriftSqlType.blob,
        data['${effectivePrefix}value'],
      )!,
    );
  }

  @override
  UserMetadataEntity createAlias(String alias) {
    return UserMetadataEntity(attachedDatabase, alias);
  }

  @override
  bool get withoutRowId => true;
  @override
  bool get isStrict => true;
}

class UserMetadataEntityData extends DataClass
    implements Insertable<UserMetadataEntityData> {
  final String userId;
  final int key;
  final Uint8List value;
  const UserMetadataEntityData({
    required this.userId,
    required this.key,
    required this.value,
  });
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['user_id'] = Variable<String>(userId);
    map['key'] = Variable<int>(key);
    map['value'] = Variable<Uint8List>(value);
    return map;
  }

  factory UserMetadataEntityData.fromJson(
    Map<String, dynamic> json, {
    ValueSerializer? serializer,
  }) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return UserMetadataEntityData(
      userId: serializer.fromJson<String>(json['userId']),
      key: serializer.fromJson<int>(json['key']),
      value: serializer.fromJson<Uint8List>(json['value']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'userId': serializer.toJson<String>(userId),
      'key': serializer.toJson<int>(key),
      'value': serializer.toJson<Uint8List>(value),
    };
  }

  UserMetadataEntityData copyWith({
    String? userId,
    int? key,
    Uint8List? value,
  }) => UserMetadataEntityData(
    userId: userId ?? this.userId,
    key: key ?? this.key,
    value: value ?? this.value,
  );
  UserMetadataEntityData copyWithCompanion(UserMetadataEntityCompanion data) {
    return UserMetadataEntityData(
      userId: data.userId.present ? data.userId.value : this.userId,
      key: data.key.present ? data.key.value : this.key,
      value: data.value.present ? data.value.value : this.value,
    );
  }

  @override
  String toString() {
    return (StringBuffer('UserMetadataEntityData(')
          ..write('userId: $userId, ')
          ..write('key: $key, ')
          ..write('value: $value')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(userId, key, $driftBlobEquality.hash(value));
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is UserMetadataEntityData &&
          other.userId == this.userId &&
          other.key == this.key &&
          $driftBlobEquality.equals(other.value, this.value));
}

class UserMetadataEntityCompanion
    extends UpdateCompanion<UserMetadataEntityData> {
  final Value<String> userId;
  final Value<int> key;
  final Value<Uint8List> value;
  const UserMetadataEntityCompanion({
    this.userId = const Value.absent(),
    this.key = const Value.absent(),
    this.value = const Value.absent(),
  });
  UserMetadataEntityCompanion.insert({
    required String userId,
    required int key,
    required Uint8List value,
  }) : userId = Value(userId),
       key = Value(key),
       value = Value(value);
  static Insertable<UserMetadataEntityData> custom({
    Expression<String>? userId,
    Expression<int>? key,
    Expression<Uint8List>? value,
  }) {
    return RawValuesInsertable({
      if (userId != null) 'user_id': userId,
      if (key != null) 'key': key,
      if (value != null) 'value': value,
    });
  }

  UserMetadataEntityCompanion copyWith({
    Value<String>? userId,
    Value<int>? key,
    Value<Uint8List>? value,
  }) {
    return UserMetadataEntityCompanion(
      userId: userId ?? this.userId,
      key: key ?? this.key,
      value: value ?? this.value,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (userId.present) {
      map['user_id'] = Variable<String>(userId.value);
    }
    if (key.present) {
      map['key'] = Variable<int>(key.value);
    }
    if (value.present) {
      map['value'] = Variable<Uint8List>(value.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('UserMetadataEntityCompanion(')
          ..write('userId: $userId, ')
          ..write('key: $key, ')
          ..write('value: $value')
          ..write(')'))
        .toString();
  }
}

class PartnerEntity extends Table
    with TableInfo<PartnerEntity, PartnerEntityData> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  PartnerEntity(this.attachedDatabase, [this._alias]);
  late final GeneratedColumn<String> sharedById = GeneratedColumn<String>(
    'shared_by_id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
    defaultConstraints: GeneratedColumn.constraintIsAlways(
      'REFERENCES user_entity (id) ON DELETE CASCADE',
    ),
  );
  late final GeneratedColumn<String> sharedWithId = GeneratedColumn<String>(
    'shared_with_id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
    defaultConstraints: GeneratedColumn.constraintIsAlways(
      'REFERENCES user_entity (id) ON DELETE CASCADE',
    ),
  );
  late final GeneratedColumn<bool> inTimeline = GeneratedColumn<bool>(
    'in_timeline',
    aliasedName,
    false,
    type: DriftSqlType.bool,
    requiredDuringInsert: false,
    defaultConstraints: GeneratedColumn.constraintIsAlways(
      'CHECK ("in_timeline" IN (0, 1))',
    ),
    defaultValue: const CustomExpression('0'),
  );
  @override
  List<GeneratedColumn> get $columns => [sharedById, sharedWithId, inTimeline];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'partner_entity';
  @override
  Set<GeneratedColumn> get $primaryKey => {sharedById, sharedWithId};
  @override
  PartnerEntityData map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return PartnerEntityData(
      sharedById: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}shared_by_id'],
      )!,
      sharedWithId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}shared_with_id'],
      )!,
      inTimeline: attachedDatabase.typeMapping.read(
        DriftSqlType.bool,
        data['${effectivePrefix}in_timeline'],
      )!,
    );
  }

  @override
  PartnerEntity createAlias(String alias) {
    return PartnerEntity(attachedDatabase, alias);
  }

  @override
  bool get withoutRowId => true;
  @override
  bool get isStrict => true;
}

class PartnerEntityData extends DataClass
    implements Insertable<PartnerEntityData> {
  final String sharedById;
  final String sharedWithId;
  final bool inTimeline;
  const PartnerEntityData({
    required this.sharedById,
    required this.sharedWithId,
    required this.inTimeline,
  });
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['shared_by_id'] = Variable<String>(sharedById);
    map['shared_with_id'] = Variable<String>(sharedWithId);
    map['in_timeline'] = Variable<bool>(inTimeline);
    return map;
  }

  factory PartnerEntityData.fromJson(
    Map<String, dynamic> json, {
    ValueSerializer? serializer,
  }) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return PartnerEntityData(
      sharedById: serializer.fromJson<String>(json['sharedById']),
      sharedWithId: serializer.fromJson<String>(json['sharedWithId']),
      inTimeline: serializer.fromJson<bool>(json['inTimeline']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'sharedById': serializer.toJson<String>(sharedById),
      'sharedWithId': serializer.toJson<String>(sharedWithId),
      'inTimeline': serializer.toJson<bool>(inTimeline),
    };
  }

  PartnerEntityData copyWith({
    String? sharedById,
    String? sharedWithId,
    bool? inTimeline,
  }) => PartnerEntityData(
    sharedById: sharedById ?? this.sharedById,
    sharedWithId: sharedWithId ?? this.sharedWithId,
    inTimeline: inTimeline ?? this.inTimeline,
  );
  PartnerEntityData copyWithCompanion(PartnerEntityCompanion data) {
    return PartnerEntityData(
      sharedById: data.sharedById.present
          ? data.sharedById.value
          : this.sharedById,
      sharedWithId: data.sharedWithId.present
          ? data.sharedWithId.value
          : this.sharedWithId,
      inTimeline: data.inTimeline.present
          ? data.inTimeline.value
          : this.inTimeline,
    );
  }

  @override
  String toString() {
    return (StringBuffer('PartnerEntityData(')
          ..write('sharedById: $sharedById, ')
          ..write('sharedWithId: $sharedWithId, ')
          ..write('inTimeline: $inTimeline')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(sharedById, sharedWithId, inTimeline);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is PartnerEntityData &&
          other.sharedById == this.sharedById &&
          other.sharedWithId == this.sharedWithId &&
          other.inTimeline == this.inTimeline);
}

class PartnerEntityCompanion extends UpdateCompanion<PartnerEntityData> {
  final Value<String> sharedById;
  final Value<String> sharedWithId;
  final Value<bool> inTimeline;
  const PartnerEntityCompanion({
    this.sharedById = const Value.absent(),
    this.sharedWithId = const Value.absent(),
    this.inTimeline = const Value.absent(),
  });
  PartnerEntityCompanion.insert({
    required String sharedById,
    required String sharedWithId,
    this.inTimeline = const Value.absent(),
  }) : sharedById = Value(sharedById),
       sharedWithId = Value(sharedWithId);
  static Insertable<PartnerEntityData> custom({
    Expression<String>? sharedById,
    Expression<String>? sharedWithId,
    Expression<bool>? inTimeline,
  }) {
    return RawValuesInsertable({
      if (sharedById != null) 'shared_by_id': sharedById,
      if (sharedWithId != null) 'shared_with_id': sharedWithId,
      if (inTimeline != null) 'in_timeline': inTimeline,
    });
  }

  PartnerEntityCompanion copyWith({
    Value<String>? sharedById,
    Value<String>? sharedWithId,
    Value<bool>? inTimeline,
  }) {
    return PartnerEntityCompanion(
      sharedById: sharedById ?? this.sharedById,
      sharedWithId: sharedWithId ?? this.sharedWithId,
      inTimeline: inTimeline ?? this.inTimeline,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (sharedById.present) {
      map['shared_by_id'] = Variable<String>(sharedById.value);
    }
    if (sharedWithId.present) {
      map['shared_with_id'] = Variable<String>(sharedWithId.value);
    }
    if (inTimeline.present) {
      map['in_timeline'] = Variable<bool>(inTimeline.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('PartnerEntityCompanion(')
          ..write('sharedById: $sharedById, ')
          ..write('sharedWithId: $sharedWithId, ')
          ..write('inTimeline: $inTimeline')
          ..write(')'))
        .toString();
  }
}

class RemoteExifEntity extends Table
    with TableInfo<RemoteExifEntity, RemoteExifEntityData> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  RemoteExifEntity(this.attachedDatabase, [this._alias]);
  late final GeneratedColumn<String> assetId = GeneratedColumn<String>(
    'asset_id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
    defaultConstraints: GeneratedColumn.constraintIsAlways(
      'REFERENCES remote_asset_entity (id) ON DELETE CASCADE',
    ),
  );
  late final GeneratedColumn<String> city = GeneratedColumn<String>(
    'city',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  late final GeneratedColumn<String> state = GeneratedColumn<String>(
    'state',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  late final GeneratedColumn<String> country = GeneratedColumn<String>(
    'country',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  late final GeneratedColumn<DateTime> dateTimeOriginal =
      GeneratedColumn<DateTime>(
        'date_time_original',
        aliasedName,
        true,
        type: DriftSqlType.dateTime,
        requiredDuringInsert: false,
      );
  late final GeneratedColumn<String> description = GeneratedColumn<String>(
    'description',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  late final GeneratedColumn<int> height = GeneratedColumn<int>(
    'height',
    aliasedName,
    true,
    type: DriftSqlType.int,
    requiredDuringInsert: false,
  );
  late final GeneratedColumn<int> width = GeneratedColumn<int>(
    'width',
    aliasedName,
    true,
    type: DriftSqlType.int,
    requiredDuringInsert: false,
  );
  late final GeneratedColumn<String> exposureTime = GeneratedColumn<String>(
    'exposure_time',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  late final GeneratedColumn<double> fNumber = GeneratedColumn<double>(
    'f_number',
    aliasedName,
    true,
    type: DriftSqlType.double,
    requiredDuringInsert: false,
  );
  late final GeneratedColumn<int> fileSize = GeneratedColumn<int>(
    'file_size',
    aliasedName,
    true,
    type: DriftSqlType.int,
    requiredDuringInsert: false,
  );
  late final GeneratedColumn<double> focalLength = GeneratedColumn<double>(
    'focal_length',
    aliasedName,
    true,
    type: DriftSqlType.double,
    requiredDuringInsert: false,
  );
  late final GeneratedColumn<double> latitude = GeneratedColumn<double>(
    'latitude',
    aliasedName,
    true,
    type: DriftSqlType.double,
    requiredDuringInsert: false,
  );
  late final GeneratedColumn<double> longitude = GeneratedColumn<double>(
    'longitude',
    aliasedName,
    true,
    type: DriftSqlType.double,
    requiredDuringInsert: false,
  );
  late final GeneratedColumn<int> iso = GeneratedColumn<int>(
    'iso',
    aliasedName,
    true,
    type: DriftSqlType.int,
    requiredDuringInsert: false,
  );
  late final GeneratedColumn<String> make = GeneratedColumn<String>(
    'make',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  late final GeneratedColumn<String> model = GeneratedColumn<String>(
    'model',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  late final GeneratedColumn<String> lens = GeneratedColumn<String>(
    'lens',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  late final GeneratedColumn<String> orientation = GeneratedColumn<String>(
    'orientation',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  late final GeneratedColumn<String> timeZone = GeneratedColumn<String>(
    'time_zone',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  late final GeneratedColumn<int> rating = GeneratedColumn<int>(
    'rating',
    aliasedName,
    true,
    type: DriftSqlType.int,
    requiredDuringInsert: false,
  );
  late final GeneratedColumn<String> projectionType = GeneratedColumn<String>(
    'projection_type',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  @override
  List<GeneratedColumn> get $columns => [
    assetId,
    city,
    state,
    country,
    dateTimeOriginal,
    description,
    height,
    width,
    exposureTime,
    fNumber,
    fileSize,
    focalLength,
    latitude,
    longitude,
    iso,
    make,
    model,
    lens,
    orientation,
    timeZone,
    rating,
    projectionType,
  ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'remote_exif_entity';
  @override
  Set<GeneratedColumn> get $primaryKey => {assetId};
  @override
  RemoteExifEntityData map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return RemoteExifEntityData(
      assetId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}asset_id'],
      )!,
      city: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}city'],
      ),
      state: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}state'],
      ),
      country: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}country'],
      ),
      dateTimeOriginal: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}date_time_original'],
      ),
      description: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}description'],
      ),
      height: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}height'],
      ),
      width: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}width'],
      ),
      exposureTime: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}exposure_time'],
      ),
      fNumber: attachedDatabase.typeMapping.read(
        DriftSqlType.double,
        data['${effectivePrefix}f_number'],
      ),
      fileSize: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}file_size'],
      ),
      focalLength: attachedDatabase.typeMapping.read(
        DriftSqlType.double,
        data['${effectivePrefix}focal_length'],
      ),
      latitude: attachedDatabase.typeMapping.read(
        DriftSqlType.double,
        data['${effectivePrefix}latitude'],
      ),
      longitude: attachedDatabase.typeMapping.read(
        DriftSqlType.double,
        data['${effectivePrefix}longitude'],
      ),
      iso: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}iso'],
      ),
      make: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}make'],
      ),
      model: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}model'],
      ),
      lens: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}lens'],
      ),
      orientation: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}orientation'],
      ),
      timeZone: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}time_zone'],
      ),
      rating: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}rating'],
      ),
      projectionType: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}projection_type'],
      ),
    );
  }

  @override
  RemoteExifEntity createAlias(String alias) {
    return RemoteExifEntity(attachedDatabase, alias);
  }

  @override
  bool get withoutRowId => true;
  @override
  bool get isStrict => true;
}

class RemoteExifEntityData extends DataClass
    implements Insertable<RemoteExifEntityData> {
  final String assetId;
  final String? city;
  final String? state;
  final String? country;
  final DateTime? dateTimeOriginal;
  final String? description;
  final int? height;
  final int? width;
  final String? exposureTime;
  final double? fNumber;
  final int? fileSize;
  final double? focalLength;
  final double? latitude;
  final double? longitude;
  final int? iso;
  final String? make;
  final String? model;
  final String? lens;
  final String? orientation;
  final String? timeZone;
  final int? rating;
  final String? projectionType;
  const RemoteExifEntityData({
    required this.assetId,
    this.city,
    this.state,
    this.country,
    this.dateTimeOriginal,
    this.description,
    this.height,
    this.width,
    this.exposureTime,
    this.fNumber,
    this.fileSize,
    this.focalLength,
    this.latitude,
    this.longitude,
    this.iso,
    this.make,
    this.model,
    this.lens,
    this.orientation,
    this.timeZone,
    this.rating,
    this.projectionType,
  });
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['asset_id'] = Variable<String>(assetId);
    if (!nullToAbsent || city != null) {
      map['city'] = Variable<String>(city);
    }
    if (!nullToAbsent || state != null) {
      map['state'] = Variable<String>(state);
    }
    if (!nullToAbsent || country != null) {
      map['country'] = Variable<String>(country);
    }
    if (!nullToAbsent || dateTimeOriginal != null) {
      map['date_time_original'] = Variable<DateTime>(dateTimeOriginal);
    }
    if (!nullToAbsent || description != null) {
      map['description'] = Variable<String>(description);
    }
    if (!nullToAbsent || height != null) {
      map['height'] = Variable<int>(height);
    }
    if (!nullToAbsent || width != null) {
      map['width'] = Variable<int>(width);
    }
    if (!nullToAbsent || exposureTime != null) {
      map['exposure_time'] = Variable<String>(exposureTime);
    }
    if (!nullToAbsent || fNumber != null) {
      map['f_number'] = Variable<double>(fNumber);
    }
    if (!nullToAbsent || fileSize != null) {
      map['file_size'] = Variable<int>(fileSize);
    }
    if (!nullToAbsent || focalLength != null) {
      map['focal_length'] = Variable<double>(focalLength);
    }
    if (!nullToAbsent || latitude != null) {
      map['latitude'] = Variable<double>(latitude);
    }
    if (!nullToAbsent || longitude != null) {
      map['longitude'] = Variable<double>(longitude);
    }
    if (!nullToAbsent || iso != null) {
      map['iso'] = Variable<int>(iso);
    }
    if (!nullToAbsent || make != null) {
      map['make'] = Variable<String>(make);
    }
    if (!nullToAbsent || model != null) {
      map['model'] = Variable<String>(model);
    }
    if (!nullToAbsent || lens != null) {
      map['lens'] = Variable<String>(lens);
    }
    if (!nullToAbsent || orientation != null) {
      map['orientation'] = Variable<String>(orientation);
    }
    if (!nullToAbsent || timeZone != null) {
      map['time_zone'] = Variable<String>(timeZone);
    }
    if (!nullToAbsent || rating != null) {
      map['rating'] = Variable<int>(rating);
    }
    if (!nullToAbsent || projectionType != null) {
      map['projection_type'] = Variable<String>(projectionType);
    }
    return map;
  }

  factory RemoteExifEntityData.fromJson(
    Map<String, dynamic> json, {
    ValueSerializer? serializer,
  }) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return RemoteExifEntityData(
      assetId: serializer.fromJson<String>(json['assetId']),
      city: serializer.fromJson<String?>(json['city']),
      state: serializer.fromJson<String?>(json['state']),
      country: serializer.fromJson<String?>(json['country']),
      dateTimeOriginal: serializer.fromJson<DateTime?>(
        json['dateTimeOriginal'],
      ),
      description: serializer.fromJson<String?>(json['description']),
      height: serializer.fromJson<int?>(json['height']),
      width: serializer.fromJson<int?>(json['width']),
      exposureTime: serializer.fromJson<String?>(json['exposureTime']),
      fNumber: serializer.fromJson<double?>(json['fNumber']),
      fileSize: serializer.fromJson<int?>(json['fileSize']),
      focalLength: serializer.fromJson<double?>(json['focalLength']),
      latitude: serializer.fromJson<double?>(json['latitude']),
      longitude: serializer.fromJson<double?>(json['longitude']),
      iso: serializer.fromJson<int?>(json['iso']),
      make: serializer.fromJson<String?>(json['make']),
      model: serializer.fromJson<String?>(json['model']),
      lens: serializer.fromJson<String?>(json['lens']),
      orientation: serializer.fromJson<String?>(json['orientation']),
      timeZone: serializer.fromJson<String?>(json['timeZone']),
      rating: serializer.fromJson<int?>(json['rating']),
      projectionType: serializer.fromJson<String?>(json['projectionType']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'assetId': serializer.toJson<String>(assetId),
      'city': serializer.toJson<String?>(city),
      'state': serializer.toJson<String?>(state),
      'country': serializer.toJson<String?>(country),
      'dateTimeOriginal': serializer.toJson<DateTime?>(dateTimeOriginal),
      'description': serializer.toJson<String?>(description),
      'height': serializer.toJson<int?>(height),
      'width': serializer.toJson<int?>(width),
      'exposureTime': serializer.toJson<String?>(exposureTime),
      'fNumber': serializer.toJson<double?>(fNumber),
      'fileSize': serializer.toJson<int?>(fileSize),
      'focalLength': serializer.toJson<double?>(focalLength),
      'latitude': serializer.toJson<double?>(latitude),
      'longitude': serializer.toJson<double?>(longitude),
      'iso': serializer.toJson<int?>(iso),
      'make': serializer.toJson<String?>(make),
      'model': serializer.toJson<String?>(model),
      'lens': serializer.toJson<String?>(lens),
      'orientation': serializer.toJson<String?>(orientation),
      'timeZone': serializer.toJson<String?>(timeZone),
      'rating': serializer.toJson<int?>(rating),
      'projectionType': serializer.toJson<String?>(projectionType),
    };
  }

  RemoteExifEntityData copyWith({
    String? assetId,
    Value<String?> city = const Value.absent(),
    Value<String?> state = const Value.absent(),
    Value<String?> country = const Value.absent(),
    Value<DateTime?> dateTimeOriginal = const Value.absent(),
    Value<String?> description = const Value.absent(),
    Value<int?> height = const Value.absent(),
    Value<int?> width = const Value.absent(),
    Value<String?> exposureTime = const Value.absent(),
    Value<double?> fNumber = const Value.absent(),
    Value<int?> fileSize = const Value.absent(),
    Value<double?> focalLength = const Value.absent(),
    Value<double?> latitude = const Value.absent(),
    Value<double?> longitude = const Value.absent(),
    Value<int?> iso = const Value.absent(),
    Value<String?> make = const Value.absent(),
    Value<String?> model = const Value.absent(),
    Value<String?> lens = const Value.absent(),
    Value<String?> orientation = const Value.absent(),
    Value<String?> timeZone = const Value.absent(),
    Value<int?> rating = const Value.absent(),
    Value<String?> projectionType = const Value.absent(),
  }) => RemoteExifEntityData(
    assetId: assetId ?? this.assetId,
    city: city.present ? city.value : this.city,
    state: state.present ? state.value : this.state,
    country: country.present ? country.value : this.country,
    dateTimeOriginal: dateTimeOriginal.present
        ? dateTimeOriginal.value
        : this.dateTimeOriginal,
    description: description.present ? description.value : this.description,
    height: height.present ? height.value : this.height,
    width: width.present ? width.value : this.width,
    exposureTime: exposureTime.present ? exposureTime.value : this.exposureTime,
    fNumber: fNumber.present ? fNumber.value : this.fNumber,
    fileSize: fileSize.present ? fileSize.value : this.fileSize,
    focalLength: focalLength.present ? focalLength.value : this.focalLength,
    latitude: latitude.present ? latitude.value : this.latitude,
    longitude: longitude.present ? longitude.value : this.longitude,
    iso: iso.present ? iso.value : this.iso,
    make: make.present ? make.value : this.make,
    model: model.present ? model.value : this.model,
    lens: lens.present ? lens.value : this.lens,
    orientation: orientation.present ? orientation.value : this.orientation,
    timeZone: timeZone.present ? timeZone.value : this.timeZone,
    rating: rating.present ? rating.value : this.rating,
    projectionType: projectionType.present
        ? projectionType.value
        : this.projectionType,
  );
  RemoteExifEntityData copyWithCompanion(RemoteExifEntityCompanion data) {
    return RemoteExifEntityData(
      assetId: data.assetId.present ? data.assetId.value : this.assetId,
      city: data.city.present ? data.city.value : this.city,
      state: data.state.present ? data.state.value : this.state,
      country: data.country.present ? data.country.value : this.country,
      dateTimeOriginal: data.dateTimeOriginal.present
          ? data.dateTimeOriginal.value
          : this.dateTimeOriginal,
      description: data.description.present
          ? data.description.value
          : this.description,
      height: data.height.present ? data.height.value : this.height,
      width: data.width.present ? data.width.value : this.width,
      exposureTime: data.exposureTime.present
          ? data.exposureTime.value
          : this.exposureTime,
      fNumber: data.fNumber.present ? data.fNumber.value : this.fNumber,
      fileSize: data.fileSize.present ? data.fileSize.value : this.fileSize,
      focalLength: data.focalLength.present
          ? data.focalLength.value
          : this.focalLength,
      latitude: data.latitude.present ? data.latitude.value : this.latitude,
      longitude: data.longitude.present ? data.longitude.value : this.longitude,
      iso: data.iso.present ? data.iso.value : this.iso,
      make: data.make.present ? data.make.value : this.make,
      model: data.model.present ? data.model.value : this.model,
      lens: data.lens.present ? data.lens.value : this.lens,
      orientation: data.orientation.present
          ? data.orientation.value
          : this.orientation,
      timeZone: data.timeZone.present ? data.timeZone.value : this.timeZone,
      rating: data.rating.present ? data.rating.value : this.rating,
      projectionType: data.projectionType.present
          ? data.projectionType.value
          : this.projectionType,
    );
  }

  @override
  String toString() {
    return (StringBuffer('RemoteExifEntityData(')
          ..write('assetId: $assetId, ')
          ..write('city: $city, ')
          ..write('state: $state, ')
          ..write('country: $country, ')
          ..write('dateTimeOriginal: $dateTimeOriginal, ')
          ..write('description: $description, ')
          ..write('height: $height, ')
          ..write('width: $width, ')
          ..write('exposureTime: $exposureTime, ')
          ..write('fNumber: $fNumber, ')
          ..write('fileSize: $fileSize, ')
          ..write('focalLength: $focalLength, ')
          ..write('latitude: $latitude, ')
          ..write('longitude: $longitude, ')
          ..write('iso: $iso, ')
          ..write('make: $make, ')
          ..write('model: $model, ')
          ..write('lens: $lens, ')
          ..write('orientation: $orientation, ')
          ..write('timeZone: $timeZone, ')
          ..write('rating: $rating, ')
          ..write('projectionType: $projectionType')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hashAll([
    assetId,
    city,
    state,
    country,
    dateTimeOriginal,
    description,
    height,
    width,
    exposureTime,
    fNumber,
    fileSize,
    focalLength,
    latitude,
    longitude,
    iso,
    make,
    model,
    lens,
    orientation,
    timeZone,
    rating,
    projectionType,
  ]);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is RemoteExifEntityData &&
          other.assetId == this.assetId &&
          other.city == this.city &&
          other.state == this.state &&
          other.country == this.country &&
          other.dateTimeOriginal == this.dateTimeOriginal &&
          other.description == this.description &&
          other.height == this.height &&
          other.width == this.width &&
          other.exposureTime == this.exposureTime &&
          other.fNumber == this.fNumber &&
          other.fileSize == this.fileSize &&
          other.focalLength == this.focalLength &&
          other.latitude == this.latitude &&
          other.longitude == this.longitude &&
          other.iso == this.iso &&
          other.make == this.make &&
          other.model == this.model &&
          other.lens == this.lens &&
          other.orientation == this.orientation &&
          other.timeZone == this.timeZone &&
          other.rating == this.rating &&
          other.projectionType == this.projectionType);
}

class RemoteExifEntityCompanion extends UpdateCompanion<RemoteExifEntityData> {
  final Value<String> assetId;
  final Value<String?> city;
  final Value<String?> state;
  final Value<String?> country;
  final Value<DateTime?> dateTimeOriginal;
  final Value<String?> description;
  final Value<int?> height;
  final Value<int?> width;
  final Value<String?> exposureTime;
  final Value<double?> fNumber;
  final Value<int?> fileSize;
  final Value<double?> focalLength;
  final Value<double?> latitude;
  final Value<double?> longitude;
  final Value<int?> iso;
  final Value<String?> make;
  final Value<String?> model;
  final Value<String?> lens;
  final Value<String?> orientation;
  final Value<String?> timeZone;
  final Value<int?> rating;
  final Value<String?> projectionType;
  const RemoteExifEntityCompanion({
    this.assetId = const Value.absent(),
    this.city = const Value.absent(),
    this.state = const Value.absent(),
    this.country = const Value.absent(),
    this.dateTimeOriginal = const Value.absent(),
    this.description = const Value.absent(),
    this.height = const Value.absent(),
    this.width = const Value.absent(),
    this.exposureTime = const Value.absent(),
    this.fNumber = const Value.absent(),
    this.fileSize = const Value.absent(),
    this.focalLength = const Value.absent(),
    this.latitude = const Value.absent(),
    this.longitude = const Value.absent(),
    this.iso = const Value.absent(),
    this.make = const Value.absent(),
    this.model = const Value.absent(),
    this.lens = const Value.absent(),
    this.orientation = const Value.absent(),
    this.timeZone = const Value.absent(),
    this.rating = const Value.absent(),
    this.projectionType = const Value.absent(),
  });
  RemoteExifEntityCompanion.insert({
    required String assetId,
    this.city = const Value.absent(),
    this.state = const Value.absent(),
    this.country = const Value.absent(),
    this.dateTimeOriginal = const Value.absent(),
    this.description = const Value.absent(),
    this.height = const Value.absent(),
    this.width = const Value.absent(),
    this.exposureTime = const Value.absent(),
    this.fNumber = const Value.absent(),
    this.fileSize = const Value.absent(),
    this.focalLength = const Value.absent(),
    this.latitude = const Value.absent(),
    this.longitude = const Value.absent(),
    this.iso = const Value.absent(),
    this.make = const Value.absent(),
    this.model = const Value.absent(),
    this.lens = const Value.absent(),
    this.orientation = const Value.absent(),
    this.timeZone = const Value.absent(),
    this.rating = const Value.absent(),
    this.projectionType = const Value.absent(),
  }) : assetId = Value(assetId);
  static Insertable<RemoteExifEntityData> custom({
    Expression<String>? assetId,
    Expression<String>? city,
    Expression<String>? state,
    Expression<String>? country,
    Expression<DateTime>? dateTimeOriginal,
    Expression<String>? description,
    Expression<int>? height,
    Expression<int>? width,
    Expression<String>? exposureTime,
    Expression<double>? fNumber,
    Expression<int>? fileSize,
    Expression<double>? focalLength,
    Expression<double>? latitude,
    Expression<double>? longitude,
    Expression<int>? iso,
    Expression<String>? make,
    Expression<String>? model,
    Expression<String>? lens,
    Expression<String>? orientation,
    Expression<String>? timeZone,
    Expression<int>? rating,
    Expression<String>? projectionType,
  }) {
    return RawValuesInsertable({
      if (assetId != null) 'asset_id': assetId,
      if (city != null) 'city': city,
      if (state != null) 'state': state,
      if (country != null) 'country': country,
      if (dateTimeOriginal != null) 'date_time_original': dateTimeOriginal,
      if (description != null) 'description': description,
      if (height != null) 'height': height,
      if (width != null) 'width': width,
      if (exposureTime != null) 'exposure_time': exposureTime,
      if (fNumber != null) 'f_number': fNumber,
      if (fileSize != null) 'file_size': fileSize,
      if (focalLength != null) 'focal_length': focalLength,
      if (latitude != null) 'latitude': latitude,
      if (longitude != null) 'longitude': longitude,
      if (iso != null) 'iso': iso,
      if (make != null) 'make': make,
      if (model != null) 'model': model,
      if (lens != null) 'lens': lens,
      if (orientation != null) 'orientation': orientation,
      if (timeZone != null) 'time_zone': timeZone,
      if (rating != null) 'rating': rating,
      if (projectionType != null) 'projection_type': projectionType,
    });
  }

  RemoteExifEntityCompanion copyWith({
    Value<String>? assetId,
    Value<String?>? city,
    Value<String?>? state,
    Value<String?>? country,
    Value<DateTime?>? dateTimeOriginal,
    Value<String?>? description,
    Value<int?>? height,
    Value<int?>? width,
    Value<String?>? exposureTime,
    Value<double?>? fNumber,
    Value<int?>? fileSize,
    Value<double?>? focalLength,
    Value<double?>? latitude,
    Value<double?>? longitude,
    Value<int?>? iso,
    Value<String?>? make,
    Value<String?>? model,
    Value<String?>? lens,
    Value<String?>? orientation,
    Value<String?>? timeZone,
    Value<int?>? rating,
    Value<String?>? projectionType,
  }) {
    return RemoteExifEntityCompanion(
      assetId: assetId ?? this.assetId,
      city: city ?? this.city,
      state: state ?? this.state,
      country: country ?? this.country,
      dateTimeOriginal: dateTimeOriginal ?? this.dateTimeOriginal,
      description: description ?? this.description,
      height: height ?? this.height,
      width: width ?? this.width,
      exposureTime: exposureTime ?? this.exposureTime,
      fNumber: fNumber ?? this.fNumber,
      fileSize: fileSize ?? this.fileSize,
      focalLength: focalLength ?? this.focalLength,
      latitude: latitude ?? this.latitude,
      longitude: longitude ?? this.longitude,
      iso: iso ?? this.iso,
      make: make ?? this.make,
      model: model ?? this.model,
      lens: lens ?? this.lens,
      orientation: orientation ?? this.orientation,
      timeZone: timeZone ?? this.timeZone,
      rating: rating ?? this.rating,
      projectionType: projectionType ?? this.projectionType,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (assetId.present) {
      map['asset_id'] = Variable<String>(assetId.value);
    }
    if (city.present) {
      map['city'] = Variable<String>(city.value);
    }
    if (state.present) {
      map['state'] = Variable<String>(state.value);
    }
    if (country.present) {
      map['country'] = Variable<String>(country.value);
    }
    if (dateTimeOriginal.present) {
      map['date_time_original'] = Variable<DateTime>(dateTimeOriginal.value);
    }
    if (description.present) {
      map['description'] = Variable<String>(description.value);
    }
    if (height.present) {
      map['height'] = Variable<int>(height.value);
    }
    if (width.present) {
      map['width'] = Variable<int>(width.value);
    }
    if (exposureTime.present) {
      map['exposure_time'] = Variable<String>(exposureTime.value);
    }
    if (fNumber.present) {
      map['f_number'] = Variable<double>(fNumber.value);
    }
    if (fileSize.present) {
      map['file_size'] = Variable<int>(fileSize.value);
    }
    if (focalLength.present) {
      map['focal_length'] = Variable<double>(focalLength.value);
    }
    if (latitude.present) {
      map['latitude'] = Variable<double>(latitude.value);
    }
    if (longitude.present) {
      map['longitude'] = Variable<double>(longitude.value);
    }
    if (iso.present) {
      map['iso'] = Variable<int>(iso.value);
    }
    if (make.present) {
      map['make'] = Variable<String>(make.value);
    }
    if (model.present) {
      map['model'] = Variable<String>(model.value);
    }
    if (lens.present) {
      map['lens'] = Variable<String>(lens.value);
    }
    if (orientation.present) {
      map['orientation'] = Variable<String>(orientation.value);
    }
    if (timeZone.present) {
      map['time_zone'] = Variable<String>(timeZone.value);
    }
    if (rating.present) {
      map['rating'] = Variable<int>(rating.value);
    }
    if (projectionType.present) {
      map['projection_type'] = Variable<String>(projectionType.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('RemoteExifEntityCompanion(')
          ..write('assetId: $assetId, ')
          ..write('city: $city, ')
          ..write('state: $state, ')
          ..write('country: $country, ')
          ..write('dateTimeOriginal: $dateTimeOriginal, ')
          ..write('description: $description, ')
          ..write('height: $height, ')
          ..write('width: $width, ')
          ..write('exposureTime: $exposureTime, ')
          ..write('fNumber: $fNumber, ')
          ..write('fileSize: $fileSize, ')
          ..write('focalLength: $focalLength, ')
          ..write('latitude: $latitude, ')
          ..write('longitude: $longitude, ')
          ..write('iso: $iso, ')
          ..write('make: $make, ')
          ..write('model: $model, ')
          ..write('lens: $lens, ')
          ..write('orientation: $orientation, ')
          ..write('timeZone: $timeZone, ')
          ..write('rating: $rating, ')
          ..write('projectionType: $projectionType')
          ..write(')'))
        .toString();
  }
}

class RemoteAlbumAssetEntity extends Table
    with TableInfo<RemoteAlbumAssetEntity, RemoteAlbumAssetEntityData> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  RemoteAlbumAssetEntity(this.attachedDatabase, [this._alias]);
  late final GeneratedColumn<String> assetId = GeneratedColumn<String>(
    'asset_id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
    defaultConstraints: GeneratedColumn.constraintIsAlways(
      'REFERENCES remote_asset_entity (id) ON DELETE CASCADE',
    ),
  );
  late final GeneratedColumn<String> albumId = GeneratedColumn<String>(
    'album_id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
    defaultConstraints: GeneratedColumn.constraintIsAlways(
      'REFERENCES remote_album_entity (id) ON DELETE CASCADE',
    ),
  );
  @override
  List<GeneratedColumn> get $columns => [assetId, albumId];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'remote_album_asset_entity';
  @override
  Set<GeneratedColumn> get $primaryKey => {assetId, albumId};
  @override
  RemoteAlbumAssetEntityData map(
    Map<String, dynamic> data, {
    String? tablePrefix,
  }) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return RemoteAlbumAssetEntityData(
      assetId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}asset_id'],
      )!,
      albumId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}album_id'],
      )!,
    );
  }

  @override
  RemoteAlbumAssetEntity createAlias(String alias) {
    return RemoteAlbumAssetEntity(attachedDatabase, alias);
  }

  @override
  bool get withoutRowId => true;
  @override
  bool get isStrict => true;
}

class RemoteAlbumAssetEntityData extends DataClass
    implements Insertable<RemoteAlbumAssetEntityData> {
  final String assetId;
  final String albumId;
  const RemoteAlbumAssetEntityData({
    required this.assetId,
    required this.albumId,
  });
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['asset_id'] = Variable<String>(assetId);
    map['album_id'] = Variable<String>(albumId);
    return map;
  }

  factory RemoteAlbumAssetEntityData.fromJson(
    Map<String, dynamic> json, {
    ValueSerializer? serializer,
  }) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return RemoteAlbumAssetEntityData(
      assetId: serializer.fromJson<String>(json['assetId']),
      albumId: serializer.fromJson<String>(json['albumId']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'assetId': serializer.toJson<String>(assetId),
      'albumId': serializer.toJson<String>(albumId),
    };
  }

  RemoteAlbumAssetEntityData copyWith({String? assetId, String? albumId}) =>
      RemoteAlbumAssetEntityData(
        assetId: assetId ?? this.assetId,
        albumId: albumId ?? this.albumId,
      );
  RemoteAlbumAssetEntityData copyWithCompanion(
    RemoteAlbumAssetEntityCompanion data,
  ) {
    return RemoteAlbumAssetEntityData(
      assetId: data.assetId.present ? data.assetId.value : this.assetId,
      albumId: data.albumId.present ? data.albumId.value : this.albumId,
    );
  }

  @override
  String toString() {
    return (StringBuffer('RemoteAlbumAssetEntityData(')
          ..write('assetId: $assetId, ')
          ..write('albumId: $albumId')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(assetId, albumId);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is RemoteAlbumAssetEntityData &&
          other.assetId == this.assetId &&
          other.albumId == this.albumId);
}

class RemoteAlbumAssetEntityCompanion
    extends UpdateCompanion<RemoteAlbumAssetEntityData> {
  final Value<String> assetId;
  final Value<String> albumId;
  const RemoteAlbumAssetEntityCompanion({
    this.assetId = const Value.absent(),
    this.albumId = const Value.absent(),
  });
  RemoteAlbumAssetEntityCompanion.insert({
    required String assetId,
    required String albumId,
  }) : assetId = Value(assetId),
       albumId = Value(albumId);
  static Insertable<RemoteAlbumAssetEntityData> custom({
    Expression<String>? assetId,
    Expression<String>? albumId,
  }) {
    return RawValuesInsertable({
      if (assetId != null) 'asset_id': assetId,
      if (albumId != null) 'album_id': albumId,
    });
  }

  RemoteAlbumAssetEntityCompanion copyWith({
    Value<String>? assetId,
    Value<String>? albumId,
  }) {
    return RemoteAlbumAssetEntityCompanion(
      assetId: assetId ?? this.assetId,
      albumId: albumId ?? this.albumId,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (assetId.present) {
      map['asset_id'] = Variable<String>(assetId.value);
    }
    if (albumId.present) {
      map['album_id'] = Variable<String>(albumId.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('RemoteAlbumAssetEntityCompanion(')
          ..write('assetId: $assetId, ')
          ..write('albumId: $albumId')
          ..write(')'))
        .toString();
  }
}

class RemoteAlbumUserEntity extends Table
    with TableInfo<RemoteAlbumUserEntity, RemoteAlbumUserEntityData> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  RemoteAlbumUserEntity(this.attachedDatabase, [this._alias]);
  late final GeneratedColumn<String> albumId = GeneratedColumn<String>(
    'album_id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
    defaultConstraints: GeneratedColumn.constraintIsAlways(
      'REFERENCES remote_album_entity (id) ON DELETE CASCADE',
    ),
  );
  late final GeneratedColumn<String> userId = GeneratedColumn<String>(
    'user_id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
    defaultConstraints: GeneratedColumn.constraintIsAlways(
      'REFERENCES user_entity (id) ON DELETE CASCADE',
    ),
  );
  late final GeneratedColumn<int> role = GeneratedColumn<int>(
    'role',
    aliasedName,
    false,
    type: DriftSqlType.int,
    requiredDuringInsert: true,
  );
  @override
  List<GeneratedColumn> get $columns => [albumId, userId, role];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'remote_album_user_entity';
  @override
  Set<GeneratedColumn> get $primaryKey => {albumId, userId};
  @override
  RemoteAlbumUserEntityData map(
    Map<String, dynamic> data, {
    String? tablePrefix,
  }) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return RemoteAlbumUserEntityData(
      albumId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}album_id'],
      )!,
      userId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}user_id'],
      )!,
      role: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}role'],
      )!,
    );
  }

  @override
  RemoteAlbumUserEntity createAlias(String alias) {
    return RemoteAlbumUserEntity(attachedDatabase, alias);
  }

  @override
  bool get withoutRowId => true;
  @override
  bool get isStrict => true;
}

class RemoteAlbumUserEntityData extends DataClass
    implements Insertable<RemoteAlbumUserEntityData> {
  final String albumId;
  final String userId;
  final int role;
  const RemoteAlbumUserEntityData({
    required this.albumId,
    required this.userId,
    required this.role,
  });
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['album_id'] = Variable<String>(albumId);
    map['user_id'] = Variable<String>(userId);
    map['role'] = Variable<int>(role);
    return map;
  }

  factory RemoteAlbumUserEntityData.fromJson(
    Map<String, dynamic> json, {
    ValueSerializer? serializer,
  }) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return RemoteAlbumUserEntityData(
      albumId: serializer.fromJson<String>(json['albumId']),
      userId: serializer.fromJson<String>(json['userId']),
      role: serializer.fromJson<int>(json['role']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'albumId': serializer.toJson<String>(albumId),
      'userId': serializer.toJson<String>(userId),
      'role': serializer.toJson<int>(role),
    };
  }

  RemoteAlbumUserEntityData copyWith({
    String? albumId,
    String? userId,
    int? role,
  }) => RemoteAlbumUserEntityData(
    albumId: albumId ?? this.albumId,
    userId: userId ?? this.userId,
    role: role ?? this.role,
  );
  RemoteAlbumUserEntityData copyWithCompanion(
    RemoteAlbumUserEntityCompanion data,
  ) {
    return RemoteAlbumUserEntityData(
      albumId: data.albumId.present ? data.albumId.value : this.albumId,
      userId: data.userId.present ? data.userId.value : this.userId,
      role: data.role.present ? data.role.value : this.role,
    );
  }

  @override
  String toString() {
    return (StringBuffer('RemoteAlbumUserEntityData(')
          ..write('albumId: $albumId, ')
          ..write('userId: $userId, ')
          ..write('role: $role')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(albumId, userId, role);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is RemoteAlbumUserEntityData &&
          other.albumId == this.albumId &&
          other.userId == this.userId &&
          other.role == this.role);
}

class RemoteAlbumUserEntityCompanion
    extends UpdateCompanion<RemoteAlbumUserEntityData> {
  final Value<String> albumId;
  final Value<String> userId;
  final Value<int> role;
  const RemoteAlbumUserEntityCompanion({
    this.albumId = const Value.absent(),
    this.userId = const Value.absent(),
    this.role = const Value.absent(),
  });
  RemoteAlbumUserEntityCompanion.insert({
    required String albumId,
    required String userId,
    required int role,
  }) : albumId = Value(albumId),
       userId = Value(userId),
       role = Value(role);
  static Insertable<RemoteAlbumUserEntityData> custom({
    Expression<String>? albumId,
    Expression<String>? userId,
    Expression<int>? role,
  }) {
    return RawValuesInsertable({
      if (albumId != null) 'album_id': albumId,
      if (userId != null) 'user_id': userId,
      if (role != null) 'role': role,
    });
  }

  RemoteAlbumUserEntityCompanion copyWith({
    Value<String>? albumId,
    Value<String>? userId,
    Value<int>? role,
  }) {
    return RemoteAlbumUserEntityCompanion(
      albumId: albumId ?? this.albumId,
      userId: userId ?? this.userId,
      role: role ?? this.role,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (albumId.present) {
      map['album_id'] = Variable<String>(albumId.value);
    }
    if (userId.present) {
      map['user_id'] = Variable<String>(userId.value);
    }
    if (role.present) {
      map['role'] = Variable<int>(role.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('RemoteAlbumUserEntityCompanion(')
          ..write('albumId: $albumId, ')
          ..write('userId: $userId, ')
          ..write('role: $role')
          ..write(')'))
        .toString();
  }
}

class MemoryEntity extends Table
    with TableInfo<MemoryEntity, MemoryEntityData> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  MemoryEntity(this.attachedDatabase, [this._alias]);
  late final GeneratedColumn<String> id = GeneratedColumn<String>(
    'id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  late final GeneratedColumn<DateTime> createdAt = GeneratedColumn<DateTime>(
    'created_at',
    aliasedName,
    false,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: false,
    defaultValue: const CustomExpression('CURRENT_TIMESTAMP'),
  );
  late final GeneratedColumn<DateTime> updatedAt = GeneratedColumn<DateTime>(
    'updated_at',
    aliasedName,
    false,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: false,
    defaultValue: const CustomExpression('CURRENT_TIMESTAMP'),
  );
  late final GeneratedColumn<DateTime> deletedAt = GeneratedColumn<DateTime>(
    'deleted_at',
    aliasedName,
    true,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: false,
  );
  late final GeneratedColumn<String> ownerId = GeneratedColumn<String>(
    'owner_id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
    defaultConstraints: GeneratedColumn.constraintIsAlways(
      'REFERENCES user_entity (id) ON DELETE CASCADE',
    ),
  );
  late final GeneratedColumn<int> type = GeneratedColumn<int>(
    'type',
    aliasedName,
    false,
    type: DriftSqlType.int,
    requiredDuringInsert: true,
  );
  late final GeneratedColumn<String> data = GeneratedColumn<String>(
    'data',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  late final GeneratedColumn<bool> isSaved = GeneratedColumn<bool>(
    'is_saved',
    aliasedName,
    false,
    type: DriftSqlType.bool,
    requiredDuringInsert: false,
    defaultConstraints: GeneratedColumn.constraintIsAlways(
      'CHECK ("is_saved" IN (0, 1))',
    ),
    defaultValue: const CustomExpression('0'),
  );
  late final GeneratedColumn<DateTime> memoryAt = GeneratedColumn<DateTime>(
    'memory_at',
    aliasedName,
    false,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: true,
  );
  late final GeneratedColumn<DateTime> seenAt = GeneratedColumn<DateTime>(
    'seen_at',
    aliasedName,
    true,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: false,
  );
  late final GeneratedColumn<DateTime> showAt = GeneratedColumn<DateTime>(
    'show_at',
    aliasedName,
    true,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: false,
  );
  late final GeneratedColumn<DateTime> hideAt = GeneratedColumn<DateTime>(
    'hide_at',
    aliasedName,
    true,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: false,
  );
  @override
  List<GeneratedColumn> get $columns => [
    id,
    createdAt,
    updatedAt,
    deletedAt,
    ownerId,
    type,
    data,
    isSaved,
    memoryAt,
    seenAt,
    showAt,
    hideAt,
  ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'memory_entity';
  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  MemoryEntityData map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return MemoryEntityData(
      id: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}id'],
      )!,
      createdAt: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}created_at'],
      )!,
      updatedAt: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}updated_at'],
      )!,
      deletedAt: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}deleted_at'],
      ),
      ownerId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}owner_id'],
      )!,
      type: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}type'],
      )!,
      data: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}data'],
      )!,
      isSaved: attachedDatabase.typeMapping.read(
        DriftSqlType.bool,
        data['${effectivePrefix}is_saved'],
      )!,
      memoryAt: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}memory_at'],
      )!,
      seenAt: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}seen_at'],
      ),
      showAt: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}show_at'],
      ),
      hideAt: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}hide_at'],
      ),
    );
  }

  @override
  MemoryEntity createAlias(String alias) {
    return MemoryEntity(attachedDatabase, alias);
  }

  @override
  bool get withoutRowId => true;
  @override
  bool get isStrict => true;
}

class MemoryEntityData extends DataClass
    implements Insertable<MemoryEntityData> {
  final String id;
  final DateTime createdAt;
  final DateTime updatedAt;
  final DateTime? deletedAt;
  final String ownerId;
  final int type;
  final String data;
  final bool isSaved;
  final DateTime memoryAt;
  final DateTime? seenAt;
  final DateTime? showAt;
  final DateTime? hideAt;
  const MemoryEntityData({
    required this.id,
    required this.createdAt,
    required this.updatedAt,
    this.deletedAt,
    required this.ownerId,
    required this.type,
    required this.data,
    required this.isSaved,
    required this.memoryAt,
    this.seenAt,
    this.showAt,
    this.hideAt,
  });
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<String>(id);
    map['created_at'] = Variable<DateTime>(createdAt);
    map['updated_at'] = Variable<DateTime>(updatedAt);
    if (!nullToAbsent || deletedAt != null) {
      map['deleted_at'] = Variable<DateTime>(deletedAt);
    }
    map['owner_id'] = Variable<String>(ownerId);
    map['type'] = Variable<int>(type);
    map['data'] = Variable<String>(data);
    map['is_saved'] = Variable<bool>(isSaved);
    map['memory_at'] = Variable<DateTime>(memoryAt);
    if (!nullToAbsent || seenAt != null) {
      map['seen_at'] = Variable<DateTime>(seenAt);
    }
    if (!nullToAbsent || showAt != null) {
      map['show_at'] = Variable<DateTime>(showAt);
    }
    if (!nullToAbsent || hideAt != null) {
      map['hide_at'] = Variable<DateTime>(hideAt);
    }
    return map;
  }

  factory MemoryEntityData.fromJson(
    Map<String, dynamic> json, {
    ValueSerializer? serializer,
  }) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return MemoryEntityData(
      id: serializer.fromJson<String>(json['id']),
      createdAt: serializer.fromJson<DateTime>(json['createdAt']),
      updatedAt: serializer.fromJson<DateTime>(json['updatedAt']),
      deletedAt: serializer.fromJson<DateTime?>(json['deletedAt']),
      ownerId: serializer.fromJson<String>(json['ownerId']),
      type: serializer.fromJson<int>(json['type']),
      data: serializer.fromJson<String>(json['data']),
      isSaved: serializer.fromJson<bool>(json['isSaved']),
      memoryAt: serializer.fromJson<DateTime>(json['memoryAt']),
      seenAt: serializer.fromJson<DateTime?>(json['seenAt']),
      showAt: serializer.fromJson<DateTime?>(json['showAt']),
      hideAt: serializer.fromJson<DateTime?>(json['hideAt']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<String>(id),
      'createdAt': serializer.toJson<DateTime>(createdAt),
      'updatedAt': serializer.toJson<DateTime>(updatedAt),
      'deletedAt': serializer.toJson<DateTime?>(deletedAt),
      'ownerId': serializer.toJson<String>(ownerId),
      'type': serializer.toJson<int>(type),
      'data': serializer.toJson<String>(data),
      'isSaved': serializer.toJson<bool>(isSaved),
      'memoryAt': serializer.toJson<DateTime>(memoryAt),
      'seenAt': serializer.toJson<DateTime?>(seenAt),
      'showAt': serializer.toJson<DateTime?>(showAt),
      'hideAt': serializer.toJson<DateTime?>(hideAt),
    };
  }

  MemoryEntityData copyWith({
    String? id,
    DateTime? createdAt,
    DateTime? updatedAt,
    Value<DateTime?> deletedAt = const Value.absent(),
    String? ownerId,
    int? type,
    String? data,
    bool? isSaved,
    DateTime? memoryAt,
    Value<DateTime?> seenAt = const Value.absent(),
    Value<DateTime?> showAt = const Value.absent(),
    Value<DateTime?> hideAt = const Value.absent(),
  }) => MemoryEntityData(
    id: id ?? this.id,
    createdAt: createdAt ?? this.createdAt,
    updatedAt: updatedAt ?? this.updatedAt,
    deletedAt: deletedAt.present ? deletedAt.value : this.deletedAt,
    ownerId: ownerId ?? this.ownerId,
    type: type ?? this.type,
    data: data ?? this.data,
    isSaved: isSaved ?? this.isSaved,
    memoryAt: memoryAt ?? this.memoryAt,
    seenAt: seenAt.present ? seenAt.value : this.seenAt,
    showAt: showAt.present ? showAt.value : this.showAt,
    hideAt: hideAt.present ? hideAt.value : this.hideAt,
  );
  MemoryEntityData copyWithCompanion(MemoryEntityCompanion data) {
    return MemoryEntityData(
      id: data.id.present ? data.id.value : this.id,
      createdAt: data.createdAt.present ? data.createdAt.value : this.createdAt,
      updatedAt: data.updatedAt.present ? data.updatedAt.value : this.updatedAt,
      deletedAt: data.deletedAt.present ? data.deletedAt.value : this.deletedAt,
      ownerId: data.ownerId.present ? data.ownerId.value : this.ownerId,
      type: data.type.present ? data.type.value : this.type,
      data: data.data.present ? data.data.value : this.data,
      isSaved: data.isSaved.present ? data.isSaved.value : this.isSaved,
      memoryAt: data.memoryAt.present ? data.memoryAt.value : this.memoryAt,
      seenAt: data.seenAt.present ? data.seenAt.value : this.seenAt,
      showAt: data.showAt.present ? data.showAt.value : this.showAt,
      hideAt: data.hideAt.present ? data.hideAt.value : this.hideAt,
    );
  }

  @override
  String toString() {
    return (StringBuffer('MemoryEntityData(')
          ..write('id: $id, ')
          ..write('createdAt: $createdAt, ')
          ..write('updatedAt: $updatedAt, ')
          ..write('deletedAt: $deletedAt, ')
          ..write('ownerId: $ownerId, ')
          ..write('type: $type, ')
          ..write('data: $data, ')
          ..write('isSaved: $isSaved, ')
          ..write('memoryAt: $memoryAt, ')
          ..write('seenAt: $seenAt, ')
          ..write('showAt: $showAt, ')
          ..write('hideAt: $hideAt')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(
    id,
    createdAt,
    updatedAt,
    deletedAt,
    ownerId,
    type,
    data,
    isSaved,
    memoryAt,
    seenAt,
    showAt,
    hideAt,
  );
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is MemoryEntityData &&
          other.id == this.id &&
          other.createdAt == this.createdAt &&
          other.updatedAt == this.updatedAt &&
          other.deletedAt == this.deletedAt &&
          other.ownerId == this.ownerId &&
          other.type == this.type &&
          other.data == this.data &&
          other.isSaved == this.isSaved &&
          other.memoryAt == this.memoryAt &&
          other.seenAt == this.seenAt &&
          other.showAt == this.showAt &&
          other.hideAt == this.hideAt);
}

class MemoryEntityCompanion extends UpdateCompanion<MemoryEntityData> {
  final Value<String> id;
  final Value<DateTime> createdAt;
  final Value<DateTime> updatedAt;
  final Value<DateTime?> deletedAt;
  final Value<String> ownerId;
  final Value<int> type;
  final Value<String> data;
  final Value<bool> isSaved;
  final Value<DateTime> memoryAt;
  final Value<DateTime?> seenAt;
  final Value<DateTime?> showAt;
  final Value<DateTime?> hideAt;
  const MemoryEntityCompanion({
    this.id = const Value.absent(),
    this.createdAt = const Value.absent(),
    this.updatedAt = const Value.absent(),
    this.deletedAt = const Value.absent(),
    this.ownerId = const Value.absent(),
    this.type = const Value.absent(),
    this.data = const Value.absent(),
    this.isSaved = const Value.absent(),
    this.memoryAt = const Value.absent(),
    this.seenAt = const Value.absent(),
    this.showAt = const Value.absent(),
    this.hideAt = const Value.absent(),
  });
  MemoryEntityCompanion.insert({
    required String id,
    this.createdAt = const Value.absent(),
    this.updatedAt = const Value.absent(),
    this.deletedAt = const Value.absent(),
    required String ownerId,
    required int type,
    required String data,
    this.isSaved = const Value.absent(),
    required DateTime memoryAt,
    this.seenAt = const Value.absent(),
    this.showAt = const Value.absent(),
    this.hideAt = const Value.absent(),
  }) : id = Value(id),
       ownerId = Value(ownerId),
       type = Value(type),
       data = Value(data),
       memoryAt = Value(memoryAt);
  static Insertable<MemoryEntityData> custom({
    Expression<String>? id,
    Expression<DateTime>? createdAt,
    Expression<DateTime>? updatedAt,
    Expression<DateTime>? deletedAt,
    Expression<String>? ownerId,
    Expression<int>? type,
    Expression<String>? data,
    Expression<bool>? isSaved,
    Expression<DateTime>? memoryAt,
    Expression<DateTime>? seenAt,
    Expression<DateTime>? showAt,
    Expression<DateTime>? hideAt,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (createdAt != null) 'created_at': createdAt,
      if (updatedAt != null) 'updated_at': updatedAt,
      if (deletedAt != null) 'deleted_at': deletedAt,
      if (ownerId != null) 'owner_id': ownerId,
      if (type != null) 'type': type,
      if (data != null) 'data': data,
      if (isSaved != null) 'is_saved': isSaved,
      if (memoryAt != null) 'memory_at': memoryAt,
      if (seenAt != null) 'seen_at': seenAt,
      if (showAt != null) 'show_at': showAt,
      if (hideAt != null) 'hide_at': hideAt,
    });
  }

  MemoryEntityCompanion copyWith({
    Value<String>? id,
    Value<DateTime>? createdAt,
    Value<DateTime>? updatedAt,
    Value<DateTime?>? deletedAt,
    Value<String>? ownerId,
    Value<int>? type,
    Value<String>? data,
    Value<bool>? isSaved,
    Value<DateTime>? memoryAt,
    Value<DateTime?>? seenAt,
    Value<DateTime?>? showAt,
    Value<DateTime?>? hideAt,
  }) {
    return MemoryEntityCompanion(
      id: id ?? this.id,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      deletedAt: deletedAt ?? this.deletedAt,
      ownerId: ownerId ?? this.ownerId,
      type: type ?? this.type,
      data: data ?? this.data,
      isSaved: isSaved ?? this.isSaved,
      memoryAt: memoryAt ?? this.memoryAt,
      seenAt: seenAt ?? this.seenAt,
      showAt: showAt ?? this.showAt,
      hideAt: hideAt ?? this.hideAt,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<String>(id.value);
    }
    if (createdAt.present) {
      map['created_at'] = Variable<DateTime>(createdAt.value);
    }
    if (updatedAt.present) {
      map['updated_at'] = Variable<DateTime>(updatedAt.value);
    }
    if (deletedAt.present) {
      map['deleted_at'] = Variable<DateTime>(deletedAt.value);
    }
    if (ownerId.present) {
      map['owner_id'] = Variable<String>(ownerId.value);
    }
    if (type.present) {
      map['type'] = Variable<int>(type.value);
    }
    if (data.present) {
      map['data'] = Variable<String>(data.value);
    }
    if (isSaved.present) {
      map['is_saved'] = Variable<bool>(isSaved.value);
    }
    if (memoryAt.present) {
      map['memory_at'] = Variable<DateTime>(memoryAt.value);
    }
    if (seenAt.present) {
      map['seen_at'] = Variable<DateTime>(seenAt.value);
    }
    if (showAt.present) {
      map['show_at'] = Variable<DateTime>(showAt.value);
    }
    if (hideAt.present) {
      map['hide_at'] = Variable<DateTime>(hideAt.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('MemoryEntityCompanion(')
          ..write('id: $id, ')
          ..write('createdAt: $createdAt, ')
          ..write('updatedAt: $updatedAt, ')
          ..write('deletedAt: $deletedAt, ')
          ..write('ownerId: $ownerId, ')
          ..write('type: $type, ')
          ..write('data: $data, ')
          ..write('isSaved: $isSaved, ')
          ..write('memoryAt: $memoryAt, ')
          ..write('seenAt: $seenAt, ')
          ..write('showAt: $showAt, ')
          ..write('hideAt: $hideAt')
          ..write(')'))
        .toString();
  }
}

class MemoryAssetEntity extends Table
    with TableInfo<MemoryAssetEntity, MemoryAssetEntityData> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  MemoryAssetEntity(this.attachedDatabase, [this._alias]);
  late final GeneratedColumn<String> assetId = GeneratedColumn<String>(
    'asset_id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
    defaultConstraints: GeneratedColumn.constraintIsAlways(
      'REFERENCES remote_asset_entity (id) ON DELETE CASCADE',
    ),
  );
  late final GeneratedColumn<String> memoryId = GeneratedColumn<String>(
    'memory_id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
    defaultConstraints: GeneratedColumn.constraintIsAlways(
      'REFERENCES memory_entity (id) ON DELETE CASCADE',
    ),
  );
  @override
  List<GeneratedColumn> get $columns => [assetId, memoryId];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'memory_asset_entity';
  @override
  Set<GeneratedColumn> get $primaryKey => {assetId, memoryId};
  @override
  MemoryAssetEntityData map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return MemoryAssetEntityData(
      assetId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}asset_id'],
      )!,
      memoryId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}memory_id'],
      )!,
    );
  }

  @override
  MemoryAssetEntity createAlias(String alias) {
    return MemoryAssetEntity(attachedDatabase, alias);
  }

  @override
  bool get withoutRowId => true;
  @override
  bool get isStrict => true;
}

class MemoryAssetEntityData extends DataClass
    implements Insertable<MemoryAssetEntityData> {
  final String assetId;
  final String memoryId;
  const MemoryAssetEntityData({required this.assetId, required this.memoryId});
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['asset_id'] = Variable<String>(assetId);
    map['memory_id'] = Variable<String>(memoryId);
    return map;
  }

  factory MemoryAssetEntityData.fromJson(
    Map<String, dynamic> json, {
    ValueSerializer? serializer,
  }) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return MemoryAssetEntityData(
      assetId: serializer.fromJson<String>(json['assetId']),
      memoryId: serializer.fromJson<String>(json['memoryId']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'assetId': serializer.toJson<String>(assetId),
      'memoryId': serializer.toJson<String>(memoryId),
    };
  }

  MemoryAssetEntityData copyWith({String? assetId, String? memoryId}) =>
      MemoryAssetEntityData(
        assetId: assetId ?? this.assetId,
        memoryId: memoryId ?? this.memoryId,
      );
  MemoryAssetEntityData copyWithCompanion(MemoryAssetEntityCompanion data) {
    return MemoryAssetEntityData(
      assetId: data.assetId.present ? data.assetId.value : this.assetId,
      memoryId: data.memoryId.present ? data.memoryId.value : this.memoryId,
    );
  }

  @override
  String toString() {
    return (StringBuffer('MemoryAssetEntityData(')
          ..write('assetId: $assetId, ')
          ..write('memoryId: $memoryId')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(assetId, memoryId);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is MemoryAssetEntityData &&
          other.assetId == this.assetId &&
          other.memoryId == this.memoryId);
}

class MemoryAssetEntityCompanion
    extends UpdateCompanion<MemoryAssetEntityData> {
  final Value<String> assetId;
  final Value<String> memoryId;
  const MemoryAssetEntityCompanion({
    this.assetId = const Value.absent(),
    this.memoryId = const Value.absent(),
  });
  MemoryAssetEntityCompanion.insert({
    required String assetId,
    required String memoryId,
  }) : assetId = Value(assetId),
       memoryId = Value(memoryId);
  static Insertable<MemoryAssetEntityData> custom({
    Expression<String>? assetId,
    Expression<String>? memoryId,
  }) {
    return RawValuesInsertable({
      if (assetId != null) 'asset_id': assetId,
      if (memoryId != null) 'memory_id': memoryId,
    });
  }

  MemoryAssetEntityCompanion copyWith({
    Value<String>? assetId,
    Value<String>? memoryId,
  }) {
    return MemoryAssetEntityCompanion(
      assetId: assetId ?? this.assetId,
      memoryId: memoryId ?? this.memoryId,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (assetId.present) {
      map['asset_id'] = Variable<String>(assetId.value);
    }
    if (memoryId.present) {
      map['memory_id'] = Variable<String>(memoryId.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('MemoryAssetEntityCompanion(')
          ..write('assetId: $assetId, ')
          ..write('memoryId: $memoryId')
          ..write(')'))
        .toString();
  }
}

class PersonEntity extends Table
    with TableInfo<PersonEntity, PersonEntityData> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  PersonEntity(this.attachedDatabase, [this._alias]);
  late final GeneratedColumn<String> id = GeneratedColumn<String>(
    'id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  late final GeneratedColumn<DateTime> createdAt = GeneratedColumn<DateTime>(
    'created_at',
    aliasedName,
    false,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: false,
    defaultValue: const CustomExpression('CURRENT_TIMESTAMP'),
  );
  late final GeneratedColumn<DateTime> updatedAt = GeneratedColumn<DateTime>(
    'updated_at',
    aliasedName,
    false,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: false,
    defaultValue: const CustomExpression('CURRENT_TIMESTAMP'),
  );
  late final GeneratedColumn<String> ownerId = GeneratedColumn<String>(
    'owner_id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
    defaultConstraints: GeneratedColumn.constraintIsAlways(
      'REFERENCES user_entity (id) ON DELETE CASCADE',
    ),
  );
  late final GeneratedColumn<String> name = GeneratedColumn<String>(
    'name',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  late final GeneratedColumn<String> faceAssetId = GeneratedColumn<String>(
    'face_asset_id',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  late final GeneratedColumn<bool> isFavorite = GeneratedColumn<bool>(
    'is_favorite',
    aliasedName,
    false,
    type: DriftSqlType.bool,
    requiredDuringInsert: true,
    defaultConstraints: GeneratedColumn.constraintIsAlways(
      'CHECK ("is_favorite" IN (0, 1))',
    ),
  );
  late final GeneratedColumn<bool> isHidden = GeneratedColumn<bool>(
    'is_hidden',
    aliasedName,
    false,
    type: DriftSqlType.bool,
    requiredDuringInsert: true,
    defaultConstraints: GeneratedColumn.constraintIsAlways(
      'CHECK ("is_hidden" IN (0, 1))',
    ),
  );
  late final GeneratedColumn<String> color = GeneratedColumn<String>(
    'color',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  late final GeneratedColumn<DateTime> birthDate = GeneratedColumn<DateTime>(
    'birth_date',
    aliasedName,
    true,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: false,
  );
  @override
  List<GeneratedColumn> get $columns => [
    id,
    createdAt,
    updatedAt,
    ownerId,
    name,
    faceAssetId,
    isFavorite,
    isHidden,
    color,
    birthDate,
  ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'person_entity';
  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  PersonEntityData map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return PersonEntityData(
      id: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}id'],
      )!,
      createdAt: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}created_at'],
      )!,
      updatedAt: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}updated_at'],
      )!,
      ownerId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}owner_id'],
      )!,
      name: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}name'],
      )!,
      faceAssetId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}face_asset_id'],
      ),
      isFavorite: attachedDatabase.typeMapping.read(
        DriftSqlType.bool,
        data['${effectivePrefix}is_favorite'],
      )!,
      isHidden: attachedDatabase.typeMapping.read(
        DriftSqlType.bool,
        data['${effectivePrefix}is_hidden'],
      )!,
      color: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}color'],
      ),
      birthDate: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}birth_date'],
      ),
    );
  }

  @override
  PersonEntity createAlias(String alias) {
    return PersonEntity(attachedDatabase, alias);
  }

  @override
  bool get withoutRowId => true;
  @override
  bool get isStrict => true;
}

class PersonEntityData extends DataClass
    implements Insertable<PersonEntityData> {
  final String id;
  final DateTime createdAt;
  final DateTime updatedAt;
  final String ownerId;
  final String name;
  final String? faceAssetId;
  final bool isFavorite;
  final bool isHidden;
  final String? color;
  final DateTime? birthDate;
  const PersonEntityData({
    required this.id,
    required this.createdAt,
    required this.updatedAt,
    required this.ownerId,
    required this.name,
    this.faceAssetId,
    required this.isFavorite,
    required this.isHidden,
    this.color,
    this.birthDate,
  });
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<String>(id);
    map['created_at'] = Variable<DateTime>(createdAt);
    map['updated_at'] = Variable<DateTime>(updatedAt);
    map['owner_id'] = Variable<String>(ownerId);
    map['name'] = Variable<String>(name);
    if (!nullToAbsent || faceAssetId != null) {
      map['face_asset_id'] = Variable<String>(faceAssetId);
    }
    map['is_favorite'] = Variable<bool>(isFavorite);
    map['is_hidden'] = Variable<bool>(isHidden);
    if (!nullToAbsent || color != null) {
      map['color'] = Variable<String>(color);
    }
    if (!nullToAbsent || birthDate != null) {
      map['birth_date'] = Variable<DateTime>(birthDate);
    }
    return map;
  }

  factory PersonEntityData.fromJson(
    Map<String, dynamic> json, {
    ValueSerializer? serializer,
  }) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return PersonEntityData(
      id: serializer.fromJson<String>(json['id']),
      createdAt: serializer.fromJson<DateTime>(json['createdAt']),
      updatedAt: serializer.fromJson<DateTime>(json['updatedAt']),
      ownerId: serializer.fromJson<String>(json['ownerId']),
      name: serializer.fromJson<String>(json['name']),
      faceAssetId: serializer.fromJson<String?>(json['faceAssetId']),
      isFavorite: serializer.fromJson<bool>(json['isFavorite']),
      isHidden: serializer.fromJson<bool>(json['isHidden']),
      color: serializer.fromJson<String?>(json['color']),
      birthDate: serializer.fromJson<DateTime?>(json['birthDate']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<String>(id),
      'createdAt': serializer.toJson<DateTime>(createdAt),
      'updatedAt': serializer.toJson<DateTime>(updatedAt),
      'ownerId': serializer.toJson<String>(ownerId),
      'name': serializer.toJson<String>(name),
      'faceAssetId': serializer.toJson<String?>(faceAssetId),
      'isFavorite': serializer.toJson<bool>(isFavorite),
      'isHidden': serializer.toJson<bool>(isHidden),
      'color': serializer.toJson<String?>(color),
      'birthDate': serializer.toJson<DateTime?>(birthDate),
    };
  }

  PersonEntityData copyWith({
    String? id,
    DateTime? createdAt,
    DateTime? updatedAt,
    String? ownerId,
    String? name,
    Value<String?> faceAssetId = const Value.absent(),
    bool? isFavorite,
    bool? isHidden,
    Value<String?> color = const Value.absent(),
    Value<DateTime?> birthDate = const Value.absent(),
  }) => PersonEntityData(
    id: id ?? this.id,
    createdAt: createdAt ?? this.createdAt,
    updatedAt: updatedAt ?? this.updatedAt,
    ownerId: ownerId ?? this.ownerId,
    name: name ?? this.name,
    faceAssetId: faceAssetId.present ? faceAssetId.value : this.faceAssetId,
    isFavorite: isFavorite ?? this.isFavorite,
    isHidden: isHidden ?? this.isHidden,
    color: color.present ? color.value : this.color,
    birthDate: birthDate.present ? birthDate.value : this.birthDate,
  );
  PersonEntityData copyWithCompanion(PersonEntityCompanion data) {
    return PersonEntityData(
      id: data.id.present ? data.id.value : this.id,
      createdAt: data.createdAt.present ? data.createdAt.value : this.createdAt,
      updatedAt: data.updatedAt.present ? data.updatedAt.value : this.updatedAt,
      ownerId: data.ownerId.present ? data.ownerId.value : this.ownerId,
      name: data.name.present ? data.name.value : this.name,
      faceAssetId: data.faceAssetId.present
          ? data.faceAssetId.value
          : this.faceAssetId,
      isFavorite: data.isFavorite.present
          ? data.isFavorite.value
          : this.isFavorite,
      isHidden: data.isHidden.present ? data.isHidden.value : this.isHidden,
      color: data.color.present ? data.color.value : this.color,
      birthDate: data.birthDate.present ? data.birthDate.value : this.birthDate,
    );
  }

  @override
  String toString() {
    return (StringBuffer('PersonEntityData(')
          ..write('id: $id, ')
          ..write('createdAt: $createdAt, ')
          ..write('updatedAt: $updatedAt, ')
          ..write('ownerId: $ownerId, ')
          ..write('name: $name, ')
          ..write('faceAssetId: $faceAssetId, ')
          ..write('isFavorite: $isFavorite, ')
          ..write('isHidden: $isHidden, ')
          ..write('color: $color, ')
          ..write('birthDate: $birthDate')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(
    id,
    createdAt,
    updatedAt,
    ownerId,
    name,
    faceAssetId,
    isFavorite,
    isHidden,
    color,
    birthDate,
  );
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is PersonEntityData &&
          other.id == this.id &&
          other.createdAt == this.createdAt &&
          other.updatedAt == this.updatedAt &&
          other.ownerId == this.ownerId &&
          other.name == this.name &&
          other.faceAssetId == this.faceAssetId &&
          other.isFavorite == this.isFavorite &&
          other.isHidden == this.isHidden &&
          other.color == this.color &&
          other.birthDate == this.birthDate);
}

class PersonEntityCompanion extends UpdateCompanion<PersonEntityData> {
  final Value<String> id;
  final Value<DateTime> createdAt;
  final Value<DateTime> updatedAt;
  final Value<String> ownerId;
  final Value<String> name;
  final Value<String?> faceAssetId;
  final Value<bool> isFavorite;
  final Value<bool> isHidden;
  final Value<String?> color;
  final Value<DateTime?> birthDate;
  const PersonEntityCompanion({
    this.id = const Value.absent(),
    this.createdAt = const Value.absent(),
    this.updatedAt = const Value.absent(),
    this.ownerId = const Value.absent(),
    this.name = const Value.absent(),
    this.faceAssetId = const Value.absent(),
    this.isFavorite = const Value.absent(),
    this.isHidden = const Value.absent(),
    this.color = const Value.absent(),
    this.birthDate = const Value.absent(),
  });
  PersonEntityCompanion.insert({
    required String id,
    this.createdAt = const Value.absent(),
    this.updatedAt = const Value.absent(),
    required String ownerId,
    required String name,
    this.faceAssetId = const Value.absent(),
    required bool isFavorite,
    required bool isHidden,
    this.color = const Value.absent(),
    this.birthDate = const Value.absent(),
  }) : id = Value(id),
       ownerId = Value(ownerId),
       name = Value(name),
       isFavorite = Value(isFavorite),
       isHidden = Value(isHidden);
  static Insertable<PersonEntityData> custom({
    Expression<String>? id,
    Expression<DateTime>? createdAt,
    Expression<DateTime>? updatedAt,
    Expression<String>? ownerId,
    Expression<String>? name,
    Expression<String>? faceAssetId,
    Expression<bool>? isFavorite,
    Expression<bool>? isHidden,
    Expression<String>? color,
    Expression<DateTime>? birthDate,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (createdAt != null) 'created_at': createdAt,
      if (updatedAt != null) 'updated_at': updatedAt,
      if (ownerId != null) 'owner_id': ownerId,
      if (name != null) 'name': name,
      if (faceAssetId != null) 'face_asset_id': faceAssetId,
      if (isFavorite != null) 'is_favorite': isFavorite,
      if (isHidden != null) 'is_hidden': isHidden,
      if (color != null) 'color': color,
      if (birthDate != null) 'birth_date': birthDate,
    });
  }

  PersonEntityCompanion copyWith({
    Value<String>? id,
    Value<DateTime>? createdAt,
    Value<DateTime>? updatedAt,
    Value<String>? ownerId,
    Value<String>? name,
    Value<String?>? faceAssetId,
    Value<bool>? isFavorite,
    Value<bool>? isHidden,
    Value<String?>? color,
    Value<DateTime?>? birthDate,
  }) {
    return PersonEntityCompanion(
      id: id ?? this.id,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      ownerId: ownerId ?? this.ownerId,
      name: name ?? this.name,
      faceAssetId: faceAssetId ?? this.faceAssetId,
      isFavorite: isFavorite ?? this.isFavorite,
      isHidden: isHidden ?? this.isHidden,
      color: color ?? this.color,
      birthDate: birthDate ?? this.birthDate,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<String>(id.value);
    }
    if (createdAt.present) {
      map['created_at'] = Variable<DateTime>(createdAt.value);
    }
    if (updatedAt.present) {
      map['updated_at'] = Variable<DateTime>(updatedAt.value);
    }
    if (ownerId.present) {
      map['owner_id'] = Variable<String>(ownerId.value);
    }
    if (name.present) {
      map['name'] = Variable<String>(name.value);
    }
    if (faceAssetId.present) {
      map['face_asset_id'] = Variable<String>(faceAssetId.value);
    }
    if (isFavorite.present) {
      map['is_favorite'] = Variable<bool>(isFavorite.value);
    }
    if (isHidden.present) {
      map['is_hidden'] = Variable<bool>(isHidden.value);
    }
    if (color.present) {
      map['color'] = Variable<String>(color.value);
    }
    if (birthDate.present) {
      map['birth_date'] = Variable<DateTime>(birthDate.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('PersonEntityCompanion(')
          ..write('id: $id, ')
          ..write('createdAt: $createdAt, ')
          ..write('updatedAt: $updatedAt, ')
          ..write('ownerId: $ownerId, ')
          ..write('name: $name, ')
          ..write('faceAssetId: $faceAssetId, ')
          ..write('isFavorite: $isFavorite, ')
          ..write('isHidden: $isHidden, ')
          ..write('color: $color, ')
          ..write('birthDate: $birthDate')
          ..write(')'))
        .toString();
  }
}

class AssetFaceEntity extends Table
    with TableInfo<AssetFaceEntity, AssetFaceEntityData> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  AssetFaceEntity(this.attachedDatabase, [this._alias]);
  late final GeneratedColumn<String> id = GeneratedColumn<String>(
    'id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  late final GeneratedColumn<String> assetId = GeneratedColumn<String>(
    'asset_id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
    defaultConstraints: GeneratedColumn.constraintIsAlways(
      'REFERENCES remote_asset_entity (id) ON DELETE CASCADE',
    ),
  );
  late final GeneratedColumn<String> personId = GeneratedColumn<String>(
    'person_id',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
    defaultConstraints: GeneratedColumn.constraintIsAlways(
      'REFERENCES person_entity (id) ON DELETE SET NULL',
    ),
  );
  late final GeneratedColumn<int> imageWidth = GeneratedColumn<int>(
    'image_width',
    aliasedName,
    false,
    type: DriftSqlType.int,
    requiredDuringInsert: true,
  );
  late final GeneratedColumn<int> imageHeight = GeneratedColumn<int>(
    'image_height',
    aliasedName,
    false,
    type: DriftSqlType.int,
    requiredDuringInsert: true,
  );
  late final GeneratedColumn<int> boundingBoxX1 = GeneratedColumn<int>(
    'bounding_box_x1',
    aliasedName,
    false,
    type: DriftSqlType.int,
    requiredDuringInsert: true,
  );
  late final GeneratedColumn<int> boundingBoxY1 = GeneratedColumn<int>(
    'bounding_box_y1',
    aliasedName,
    false,
    type: DriftSqlType.int,
    requiredDuringInsert: true,
  );
  late final GeneratedColumn<int> boundingBoxX2 = GeneratedColumn<int>(
    'bounding_box_x2',
    aliasedName,
    false,
    type: DriftSqlType.int,
    requiredDuringInsert: true,
  );
  late final GeneratedColumn<int> boundingBoxY2 = GeneratedColumn<int>(
    'bounding_box_y2',
    aliasedName,
    false,
    type: DriftSqlType.int,
    requiredDuringInsert: true,
  );
  late final GeneratedColumn<String> sourceType = GeneratedColumn<String>(
    'source_type',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  @override
  List<GeneratedColumn> get $columns => [
    id,
    assetId,
    personId,
    imageWidth,
    imageHeight,
    boundingBoxX1,
    boundingBoxY1,
    boundingBoxX2,
    boundingBoxY2,
    sourceType,
  ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'asset_face_entity';
  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  AssetFaceEntityData map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return AssetFaceEntityData(
      id: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}id'],
      )!,
      assetId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}asset_id'],
      )!,
      personId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}person_id'],
      ),
      imageWidth: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}image_width'],
      )!,
      imageHeight: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}image_height'],
      )!,
      boundingBoxX1: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}bounding_box_x1'],
      )!,
      boundingBoxY1: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}bounding_box_y1'],
      )!,
      boundingBoxX2: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}bounding_box_x2'],
      )!,
      boundingBoxY2: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}bounding_box_y2'],
      )!,
      sourceType: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}source_type'],
      )!,
    );
  }

  @override
  AssetFaceEntity createAlias(String alias) {
    return AssetFaceEntity(attachedDatabase, alias);
  }

  @override
  bool get withoutRowId => true;
  @override
  bool get isStrict => true;
}

class AssetFaceEntityData extends DataClass
    implements Insertable<AssetFaceEntityData> {
  final String id;
  final String assetId;
  final String? personId;
  final int imageWidth;
  final int imageHeight;
  final int boundingBoxX1;
  final int boundingBoxY1;
  final int boundingBoxX2;
  final int boundingBoxY2;
  final String sourceType;
  const AssetFaceEntityData({
    required this.id,
    required this.assetId,
    this.personId,
    required this.imageWidth,
    required this.imageHeight,
    required this.boundingBoxX1,
    required this.boundingBoxY1,
    required this.boundingBoxX2,
    required this.boundingBoxY2,
    required this.sourceType,
  });
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<String>(id);
    map['asset_id'] = Variable<String>(assetId);
    if (!nullToAbsent || personId != null) {
      map['person_id'] = Variable<String>(personId);
    }
    map['image_width'] = Variable<int>(imageWidth);
    map['image_height'] = Variable<int>(imageHeight);
    map['bounding_box_x1'] = Variable<int>(boundingBoxX1);
    map['bounding_box_y1'] = Variable<int>(boundingBoxY1);
    map['bounding_box_x2'] = Variable<int>(boundingBoxX2);
    map['bounding_box_y2'] = Variable<int>(boundingBoxY2);
    map['source_type'] = Variable<String>(sourceType);
    return map;
  }

  factory AssetFaceEntityData.fromJson(
    Map<String, dynamic> json, {
    ValueSerializer? serializer,
  }) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return AssetFaceEntityData(
      id: serializer.fromJson<String>(json['id']),
      assetId: serializer.fromJson<String>(json['assetId']),
      personId: serializer.fromJson<String?>(json['personId']),
      imageWidth: serializer.fromJson<int>(json['imageWidth']),
      imageHeight: serializer.fromJson<int>(json['imageHeight']),
      boundingBoxX1: serializer.fromJson<int>(json['boundingBoxX1']),
      boundingBoxY1: serializer.fromJson<int>(json['boundingBoxY1']),
      boundingBoxX2: serializer.fromJson<int>(json['boundingBoxX2']),
      boundingBoxY2: serializer.fromJson<int>(json['boundingBoxY2']),
      sourceType: serializer.fromJson<String>(json['sourceType']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<String>(id),
      'assetId': serializer.toJson<String>(assetId),
      'personId': serializer.toJson<String?>(personId),
      'imageWidth': serializer.toJson<int>(imageWidth),
      'imageHeight': serializer.toJson<int>(imageHeight),
      'boundingBoxX1': serializer.toJson<int>(boundingBoxX1),
      'boundingBoxY1': serializer.toJson<int>(boundingBoxY1),
      'boundingBoxX2': serializer.toJson<int>(boundingBoxX2),
      'boundingBoxY2': serializer.toJson<int>(boundingBoxY2),
      'sourceType': serializer.toJson<String>(sourceType),
    };
  }

  AssetFaceEntityData copyWith({
    String? id,
    String? assetId,
    Value<String?> personId = const Value.absent(),
    int? imageWidth,
    int? imageHeight,
    int? boundingBoxX1,
    int? boundingBoxY1,
    int? boundingBoxX2,
    int? boundingBoxY2,
    String? sourceType,
  }) => AssetFaceEntityData(
    id: id ?? this.id,
    assetId: assetId ?? this.assetId,
    personId: personId.present ? personId.value : this.personId,
    imageWidth: imageWidth ?? this.imageWidth,
    imageHeight: imageHeight ?? this.imageHeight,
    boundingBoxX1: boundingBoxX1 ?? this.boundingBoxX1,
    boundingBoxY1: boundingBoxY1 ?? this.boundingBoxY1,
    boundingBoxX2: boundingBoxX2 ?? this.boundingBoxX2,
    boundingBoxY2: boundingBoxY2 ?? this.boundingBoxY2,
    sourceType: sourceType ?? this.sourceType,
  );
  AssetFaceEntityData copyWithCompanion(AssetFaceEntityCompanion data) {
    return AssetFaceEntityData(
      id: data.id.present ? data.id.value : this.id,
      assetId: data.assetId.present ? data.assetId.value : this.assetId,
      personId: data.personId.present ? data.personId.value : this.personId,
      imageWidth: data.imageWidth.present
          ? data.imageWidth.value
          : this.imageWidth,
      imageHeight: data.imageHeight.present
          ? data.imageHeight.value
          : this.imageHeight,
      boundingBoxX1: data.boundingBoxX1.present
          ? data.boundingBoxX1.value
          : this.boundingBoxX1,
      boundingBoxY1: data.boundingBoxY1.present
          ? data.boundingBoxY1.value
          : this.boundingBoxY1,
      boundingBoxX2: data.boundingBoxX2.present
          ? data.boundingBoxX2.value
          : this.boundingBoxX2,
      boundingBoxY2: data.boundingBoxY2.present
          ? data.boundingBoxY2.value
          : this.boundingBoxY2,
      sourceType: data.sourceType.present
          ? data.sourceType.value
          : this.sourceType,
    );
  }

  @override
  String toString() {
    return (StringBuffer('AssetFaceEntityData(')
          ..write('id: $id, ')
          ..write('assetId: $assetId, ')
          ..write('personId: $personId, ')
          ..write('imageWidth: $imageWidth, ')
          ..write('imageHeight: $imageHeight, ')
          ..write('boundingBoxX1: $boundingBoxX1, ')
          ..write('boundingBoxY1: $boundingBoxY1, ')
          ..write('boundingBoxX2: $boundingBoxX2, ')
          ..write('boundingBoxY2: $boundingBoxY2, ')
          ..write('sourceType: $sourceType')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(
    id,
    assetId,
    personId,
    imageWidth,
    imageHeight,
    boundingBoxX1,
    boundingBoxY1,
    boundingBoxX2,
    boundingBoxY2,
    sourceType,
  );
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is AssetFaceEntityData &&
          other.id == this.id &&
          other.assetId == this.assetId &&
          other.personId == this.personId &&
          other.imageWidth == this.imageWidth &&
          other.imageHeight == this.imageHeight &&
          other.boundingBoxX1 == this.boundingBoxX1 &&
          other.boundingBoxY1 == this.boundingBoxY1 &&
          other.boundingBoxX2 == this.boundingBoxX2 &&
          other.boundingBoxY2 == this.boundingBoxY2 &&
          other.sourceType == this.sourceType);
}

class AssetFaceEntityCompanion extends UpdateCompanion<AssetFaceEntityData> {
  final Value<String> id;
  final Value<String> assetId;
  final Value<String?> personId;
  final Value<int> imageWidth;
  final Value<int> imageHeight;
  final Value<int> boundingBoxX1;
  final Value<int> boundingBoxY1;
  final Value<int> boundingBoxX2;
  final Value<int> boundingBoxY2;
  final Value<String> sourceType;
  const AssetFaceEntityCompanion({
    this.id = const Value.absent(),
    this.assetId = const Value.absent(),
    this.personId = const Value.absent(),
    this.imageWidth = const Value.absent(),
    this.imageHeight = const Value.absent(),
    this.boundingBoxX1 = const Value.absent(),
    this.boundingBoxY1 = const Value.absent(),
    this.boundingBoxX2 = const Value.absent(),
    this.boundingBoxY2 = const Value.absent(),
    this.sourceType = const Value.absent(),
  });
  AssetFaceEntityCompanion.insert({
    required String id,
    required String assetId,
    this.personId = const Value.absent(),
    required int imageWidth,
    required int imageHeight,
    required int boundingBoxX1,
    required int boundingBoxY1,
    required int boundingBoxX2,
    required int boundingBoxY2,
    required String sourceType,
  }) : id = Value(id),
       assetId = Value(assetId),
       imageWidth = Value(imageWidth),
       imageHeight = Value(imageHeight),
       boundingBoxX1 = Value(boundingBoxX1),
       boundingBoxY1 = Value(boundingBoxY1),
       boundingBoxX2 = Value(boundingBoxX2),
       boundingBoxY2 = Value(boundingBoxY2),
       sourceType = Value(sourceType);
  static Insertable<AssetFaceEntityData> custom({
    Expression<String>? id,
    Expression<String>? assetId,
    Expression<String>? personId,
    Expression<int>? imageWidth,
    Expression<int>? imageHeight,
    Expression<int>? boundingBoxX1,
    Expression<int>? boundingBoxY1,
    Expression<int>? boundingBoxX2,
    Expression<int>? boundingBoxY2,
    Expression<String>? sourceType,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (assetId != null) 'asset_id': assetId,
      if (personId != null) 'person_id': personId,
      if (imageWidth != null) 'image_width': imageWidth,
      if (imageHeight != null) 'image_height': imageHeight,
      if (boundingBoxX1 != null) 'bounding_box_x1': boundingBoxX1,
      if (boundingBoxY1 != null) 'bounding_box_y1': boundingBoxY1,
      if (boundingBoxX2 != null) 'bounding_box_x2': boundingBoxX2,
      if (boundingBoxY2 != null) 'bounding_box_y2': boundingBoxY2,
      if (sourceType != null) 'source_type': sourceType,
    });
  }

  AssetFaceEntityCompanion copyWith({
    Value<String>? id,
    Value<String>? assetId,
    Value<String?>? personId,
    Value<int>? imageWidth,
    Value<int>? imageHeight,
    Value<int>? boundingBoxX1,
    Value<int>? boundingBoxY1,
    Value<int>? boundingBoxX2,
    Value<int>? boundingBoxY2,
    Value<String>? sourceType,
  }) {
    return AssetFaceEntityCompanion(
      id: id ?? this.id,
      assetId: assetId ?? this.assetId,
      personId: personId ?? this.personId,
      imageWidth: imageWidth ?? this.imageWidth,
      imageHeight: imageHeight ?? this.imageHeight,
      boundingBoxX1: boundingBoxX1 ?? this.boundingBoxX1,
      boundingBoxY1: boundingBoxY1 ?? this.boundingBoxY1,
      boundingBoxX2: boundingBoxX2 ?? this.boundingBoxX2,
      boundingBoxY2: boundingBoxY2 ?? this.boundingBoxY2,
      sourceType: sourceType ?? this.sourceType,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<String>(id.value);
    }
    if (assetId.present) {
      map['asset_id'] = Variable<String>(assetId.value);
    }
    if (personId.present) {
      map['person_id'] = Variable<String>(personId.value);
    }
    if (imageWidth.present) {
      map['image_width'] = Variable<int>(imageWidth.value);
    }
    if (imageHeight.present) {
      map['image_height'] = Variable<int>(imageHeight.value);
    }
    if (boundingBoxX1.present) {
      map['bounding_box_x1'] = Variable<int>(boundingBoxX1.value);
    }
    if (boundingBoxY1.present) {
      map['bounding_box_y1'] = Variable<int>(boundingBoxY1.value);
    }
    if (boundingBoxX2.present) {
      map['bounding_box_x2'] = Variable<int>(boundingBoxX2.value);
    }
    if (boundingBoxY2.present) {
      map['bounding_box_y2'] = Variable<int>(boundingBoxY2.value);
    }
    if (sourceType.present) {
      map['source_type'] = Variable<String>(sourceType.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('AssetFaceEntityCompanion(')
          ..write('id: $id, ')
          ..write('assetId: $assetId, ')
          ..write('personId: $personId, ')
          ..write('imageWidth: $imageWidth, ')
          ..write('imageHeight: $imageHeight, ')
          ..write('boundingBoxX1: $boundingBoxX1, ')
          ..write('boundingBoxY1: $boundingBoxY1, ')
          ..write('boundingBoxX2: $boundingBoxX2, ')
          ..write('boundingBoxY2: $boundingBoxY2, ')
          ..write('sourceType: $sourceType')
          ..write(')'))
        .toString();
  }
}

class StoreEntity extends Table with TableInfo<StoreEntity, StoreEntityData> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  StoreEntity(this.attachedDatabase, [this._alias]);
  late final GeneratedColumn<int> id = GeneratedColumn<int>(
    'id',
    aliasedName,
    false,
    type: DriftSqlType.int,
    requiredDuringInsert: true,
  );
  late final GeneratedColumn<String> stringValue = GeneratedColumn<String>(
    'string_value',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  late final GeneratedColumn<int> intValue = GeneratedColumn<int>(
    'int_value',
    aliasedName,
    true,
    type: DriftSqlType.int,
    requiredDuringInsert: false,
  );
  @override
  List<GeneratedColumn> get $columns => [id, stringValue, intValue];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'store_entity';
  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  StoreEntityData map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return StoreEntityData(
      id: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}id'],
      )!,
      stringValue: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}string_value'],
      ),
      intValue: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}int_value'],
      ),
    );
  }

  @override
  StoreEntity createAlias(String alias) {
    return StoreEntity(attachedDatabase, alias);
  }

  @override
  bool get withoutRowId => true;
  @override
  bool get isStrict => true;
}

class StoreEntityData extends DataClass implements Insertable<StoreEntityData> {
  final int id;
  final String? stringValue;
  final int? intValue;
  const StoreEntityData({required this.id, this.stringValue, this.intValue});
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<int>(id);
    if (!nullToAbsent || stringValue != null) {
      map['string_value'] = Variable<String>(stringValue);
    }
    if (!nullToAbsent || intValue != null) {
      map['int_value'] = Variable<int>(intValue);
    }
    return map;
  }

  factory StoreEntityData.fromJson(
    Map<String, dynamic> json, {
    ValueSerializer? serializer,
  }) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return StoreEntityData(
      id: serializer.fromJson<int>(json['id']),
      stringValue: serializer.fromJson<String?>(json['stringValue']),
      intValue: serializer.fromJson<int?>(json['intValue']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<int>(id),
      'stringValue': serializer.toJson<String?>(stringValue),
      'intValue': serializer.toJson<int?>(intValue),
    };
  }

  StoreEntityData copyWith({
    int? id,
    Value<String?> stringValue = const Value.absent(),
    Value<int?> intValue = const Value.absent(),
  }) => StoreEntityData(
    id: id ?? this.id,
    stringValue: stringValue.present ? stringValue.value : this.stringValue,
    intValue: intValue.present ? intValue.value : this.intValue,
  );
  StoreEntityData copyWithCompanion(StoreEntityCompanion data) {
    return StoreEntityData(
      id: data.id.present ? data.id.value : this.id,
      stringValue: data.stringValue.present
          ? data.stringValue.value
          : this.stringValue,
      intValue: data.intValue.present ? data.intValue.value : this.intValue,
    );
  }

  @override
  String toString() {
    return (StringBuffer('StoreEntityData(')
          ..write('id: $id, ')
          ..write('stringValue: $stringValue, ')
          ..write('intValue: $intValue')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(id, stringValue, intValue);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is StoreEntityData &&
          other.id == this.id &&
          other.stringValue == this.stringValue &&
          other.intValue == this.intValue);
}

class StoreEntityCompanion extends UpdateCompanion<StoreEntityData> {
  final Value<int> id;
  final Value<String?> stringValue;
  final Value<int?> intValue;
  const StoreEntityCompanion({
    this.id = const Value.absent(),
    this.stringValue = const Value.absent(),
    this.intValue = const Value.absent(),
  });
  StoreEntityCompanion.insert({
    required int id,
    this.stringValue = const Value.absent(),
    this.intValue = const Value.absent(),
  }) : id = Value(id);
  static Insertable<StoreEntityData> custom({
    Expression<int>? id,
    Expression<String>? stringValue,
    Expression<int>? intValue,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (stringValue != null) 'string_value': stringValue,
      if (intValue != null) 'int_value': intValue,
    });
  }

  StoreEntityCompanion copyWith({
    Value<int>? id,
    Value<String?>? stringValue,
    Value<int?>? intValue,
  }) {
    return StoreEntityCompanion(
      id: id ?? this.id,
      stringValue: stringValue ?? this.stringValue,
      intValue: intValue ?? this.intValue,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<int>(id.value);
    }
    if (stringValue.present) {
      map['string_value'] = Variable<String>(stringValue.value);
    }
    if (intValue.present) {
      map['int_value'] = Variable<int>(intValue.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('StoreEntityCompanion(')
          ..write('id: $id, ')
          ..write('stringValue: $stringValue, ')
          ..write('intValue: $intValue')
          ..write(')'))
        .toString();
  }
}

class DatabaseAtV10 extends GeneratedDatabase {
  DatabaseAtV10(QueryExecutor e) : super(e);
  late final UserEntity userEntity = UserEntity(this);
  late final RemoteAssetEntity remoteAssetEntity = RemoteAssetEntity(this);
  late final StackEntity stackEntity = StackEntity(this);
  late final LocalAssetEntity localAssetEntity = LocalAssetEntity(this);
  late final RemoteAlbumEntity remoteAlbumEntity = RemoteAlbumEntity(this);
  late final LocalAlbumEntity localAlbumEntity = LocalAlbumEntity(this);
  late final LocalAlbumAssetEntity localAlbumAssetEntity =
      LocalAlbumAssetEntity(this);
  late final Index idxLocalAssetChecksum = Index(
    'idx_local_asset_checksum',
    'CREATE INDEX IF NOT EXISTS idx_local_asset_checksum ON local_asset_entity (checksum)',
  );
  late final Index idxRemoteAssetOwnerChecksum = Index(
    'idx_remote_asset_owner_checksum',
    'CREATE INDEX IF NOT EXISTS idx_remote_asset_owner_checksum ON remote_asset_entity (owner_id, checksum)',
  );
  late final Index uQRemoteAssetsOwnerChecksum = Index(
    'UQ_remote_assets_owner_checksum',
    'CREATE UNIQUE INDEX IF NOT EXISTS UQ_remote_assets_owner_checksum ON remote_asset_entity (owner_id, checksum) WHERE(library_id IS NULL)',
  );
  late final Index uQRemoteAssetsOwnerLibraryChecksum = Index(
    'UQ_remote_assets_owner_library_checksum',
    'CREATE UNIQUE INDEX IF NOT EXISTS UQ_remote_assets_owner_library_checksum ON remote_asset_entity (owner_id, library_id, checksum) WHERE(library_id IS NOT NULL)',
  );
  late final Index idxRemoteAssetChecksum = Index(
    'idx_remote_asset_checksum',
    'CREATE INDEX IF NOT EXISTS idx_remote_asset_checksum ON remote_asset_entity (checksum)',
  );
  late final AuthUserEntity authUserEntity = AuthUserEntity(this);
  late final UserMetadataEntity userMetadataEntity = UserMetadataEntity(this);
  late final PartnerEntity partnerEntity = PartnerEntity(this);
  late final RemoteExifEntity remoteExifEntity = RemoteExifEntity(this);
  late final RemoteAlbumAssetEntity remoteAlbumAssetEntity =
      RemoteAlbumAssetEntity(this);
  late final RemoteAlbumUserEntity remoteAlbumUserEntity =
      RemoteAlbumUserEntity(this);
  late final MemoryEntity memoryEntity = MemoryEntity(this);
  late final MemoryAssetEntity memoryAssetEntity = MemoryAssetEntity(this);
  late final PersonEntity personEntity = PersonEntity(this);
  late final AssetFaceEntity assetFaceEntity = AssetFaceEntity(this);
  late final StoreEntity storeEntity = StoreEntity(this);
  late final Index idxLatLng = Index(
    'idx_lat_lng',
    'CREATE INDEX IF NOT EXISTS idx_lat_lng ON remote_exif_entity (latitude, longitude)',
  );
  @override
  Iterable<TableInfo<Table, Object?>> get allTables =>
      allSchemaEntities.whereType<TableInfo<Table, Object?>>();
  @override
  List<DatabaseSchemaEntity> get allSchemaEntities => [
    userEntity,
    remoteAssetEntity,
    stackEntity,
    localAssetEntity,
    remoteAlbumEntity,
    localAlbumEntity,
    localAlbumAssetEntity,
    idxLocalAssetChecksum,
    idxRemoteAssetOwnerChecksum,
    uQRemoteAssetsOwnerChecksum,
    uQRemoteAssetsOwnerLibraryChecksum,
    idxRemoteAssetChecksum,
    authUserEntity,
    userMetadataEntity,
    partnerEntity,
    remoteExifEntity,
    remoteAlbumAssetEntity,
    remoteAlbumUserEntity,
    memoryEntity,
    memoryAssetEntity,
    personEntity,
    assetFaceEntity,
    storeEntity,
    idxLatLng,
  ];
  @override
  int get schemaVersion => 10;
  @override
  DriftDatabaseOptions get options =>
      const DriftDatabaseOptions(storeDateTimeAsText: true);
}
