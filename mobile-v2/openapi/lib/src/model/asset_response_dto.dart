//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:openapi/src/model/asset_type_enum.dart';
import 'package:built_collection/built_collection.dart';
import 'package:openapi/src/model/exif_response_dto.dart';
import 'package:openapi/src/model/smart_info_response_dto.dart';
import 'package:openapi/src/model/user_response_dto.dart';
import 'package:openapi/src/model/tag_response_dto.dart';
import 'package:openapi/src/model/person_with_faces_response_dto.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'asset_response_dto.g.dart';

/// AssetResponseDto
///
/// Properties:
/// * [checksum] - base64 encoded sha1 hash
/// * [deviceAssetId] 
/// * [deviceId] 
/// * [duration] 
/// * [exifInfo] 
/// * [fileCreatedAt] 
/// * [fileModifiedAt] 
/// * [hasMetadata] 
/// * [id] 
/// * [isArchived] 
/// * [isExternal] 
/// * [isFavorite] 
/// * [isOffline] 
/// * [isReadOnly] 
/// * [isTrashed] 
/// * [libraryId] 
/// * [livePhotoVideoId] 
/// * [localDateTime] 
/// * [originalFileName] 
/// * [originalPath] 
/// * [owner] 
/// * [ownerId] 
/// * [people] 
/// * [resized] 
/// * [smartInfo] 
/// * [stack] 
/// * [stackCount] 
/// * [stackParentId] 
/// * [tags] 
/// * [thumbhash] 
/// * [type] 
/// * [updatedAt] 
@BuiltValue()
abstract class AssetResponseDto implements Built<AssetResponseDto, AssetResponseDtoBuilder> {
  /// base64 encoded sha1 hash
  @BuiltValueField(wireName: r'checksum')
  String get checksum;

  @BuiltValueField(wireName: r'deviceAssetId')
  String get deviceAssetId;

  @BuiltValueField(wireName: r'deviceId')
  String get deviceId;

  @BuiltValueField(wireName: r'duration')
  String get duration;

  @BuiltValueField(wireName: r'exifInfo')
  ExifResponseDto? get exifInfo;

  @BuiltValueField(wireName: r'fileCreatedAt')
  DateTime get fileCreatedAt;

  @BuiltValueField(wireName: r'fileModifiedAt')
  DateTime get fileModifiedAt;

  @BuiltValueField(wireName: r'hasMetadata')
  bool get hasMetadata;

  @BuiltValueField(wireName: r'id')
  String get id;

  @BuiltValueField(wireName: r'isArchived')
  bool get isArchived;

  @BuiltValueField(wireName: r'isExternal')
  bool get isExternal;

  @BuiltValueField(wireName: r'isFavorite')
  bool get isFavorite;

  @BuiltValueField(wireName: r'isOffline')
  bool get isOffline;

  @BuiltValueField(wireName: r'isReadOnly')
  bool get isReadOnly;

  @BuiltValueField(wireName: r'isTrashed')
  bool get isTrashed;

  @BuiltValueField(wireName: r'libraryId')
  String get libraryId;

  @BuiltValueField(wireName: r'livePhotoVideoId')
  String? get livePhotoVideoId;

  @BuiltValueField(wireName: r'localDateTime')
  DateTime get localDateTime;

  @BuiltValueField(wireName: r'originalFileName')
  String get originalFileName;

  @BuiltValueField(wireName: r'originalPath')
  String get originalPath;

  @BuiltValueField(wireName: r'owner')
  UserResponseDto? get owner;

  @BuiltValueField(wireName: r'ownerId')
  String get ownerId;

  @BuiltValueField(wireName: r'people')
  BuiltList<PersonWithFacesResponseDto>? get people;

  @BuiltValueField(wireName: r'resized')
  bool get resized;

  @BuiltValueField(wireName: r'smartInfo')
  SmartInfoResponseDto? get smartInfo;

  @BuiltValueField(wireName: r'stack')
  BuiltList<AssetResponseDto>? get stack;

  @BuiltValueField(wireName: r'stackCount')
  int? get stackCount;

  @BuiltValueField(wireName: r'stackParentId')
  String? get stackParentId;

  @BuiltValueField(wireName: r'tags')
  BuiltList<TagResponseDto>? get tags;

  @BuiltValueField(wireName: r'thumbhash')
  String? get thumbhash;

  @BuiltValueField(wireName: r'type')
  AssetTypeEnum get type;
  // enum typeEnum {  IMAGE,  VIDEO,  AUDIO,  OTHER,  };

  @BuiltValueField(wireName: r'updatedAt')
  DateTime get updatedAt;

  AssetResponseDto._();

  factory AssetResponseDto([void updates(AssetResponseDtoBuilder b)]) = _$AssetResponseDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(AssetResponseDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<AssetResponseDto> get serializer => _$AssetResponseDtoSerializer();
}

class _$AssetResponseDtoSerializer implements PrimitiveSerializer<AssetResponseDto> {
  @override
  final Iterable<Type> types = const [AssetResponseDto, _$AssetResponseDto];

  @override
  final String wireName = r'AssetResponseDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    AssetResponseDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'checksum';
    yield serializers.serialize(
      object.checksum,
      specifiedType: const FullType(String),
    );
    yield r'deviceAssetId';
    yield serializers.serialize(
      object.deviceAssetId,
      specifiedType: const FullType(String),
    );
    yield r'deviceId';
    yield serializers.serialize(
      object.deviceId,
      specifiedType: const FullType(String),
    );
    yield r'duration';
    yield serializers.serialize(
      object.duration,
      specifiedType: const FullType(String),
    );
    if (object.exifInfo != null) {
      yield r'exifInfo';
      yield serializers.serialize(
        object.exifInfo,
        specifiedType: const FullType(ExifResponseDto),
      );
    }
    yield r'fileCreatedAt';
    yield serializers.serialize(
      object.fileCreatedAt,
      specifiedType: const FullType(DateTime),
    );
    yield r'fileModifiedAt';
    yield serializers.serialize(
      object.fileModifiedAt,
      specifiedType: const FullType(DateTime),
    );
    yield r'hasMetadata';
    yield serializers.serialize(
      object.hasMetadata,
      specifiedType: const FullType(bool),
    );
    yield r'id';
    yield serializers.serialize(
      object.id,
      specifiedType: const FullType(String),
    );
    yield r'isArchived';
    yield serializers.serialize(
      object.isArchived,
      specifiedType: const FullType(bool),
    );
    yield r'isExternal';
    yield serializers.serialize(
      object.isExternal,
      specifiedType: const FullType(bool),
    );
    yield r'isFavorite';
    yield serializers.serialize(
      object.isFavorite,
      specifiedType: const FullType(bool),
    );
    yield r'isOffline';
    yield serializers.serialize(
      object.isOffline,
      specifiedType: const FullType(bool),
    );
    yield r'isReadOnly';
    yield serializers.serialize(
      object.isReadOnly,
      specifiedType: const FullType(bool),
    );
    yield r'isTrashed';
    yield serializers.serialize(
      object.isTrashed,
      specifiedType: const FullType(bool),
    );
    yield r'libraryId';
    yield serializers.serialize(
      object.libraryId,
      specifiedType: const FullType(String),
    );
    if (object.livePhotoVideoId != null) {
      yield r'livePhotoVideoId';
      yield serializers.serialize(
        object.livePhotoVideoId,
        specifiedType: const FullType.nullable(String),
      );
    }
    yield r'localDateTime';
    yield serializers.serialize(
      object.localDateTime,
      specifiedType: const FullType(DateTime),
    );
    yield r'originalFileName';
    yield serializers.serialize(
      object.originalFileName,
      specifiedType: const FullType(String),
    );
    yield r'originalPath';
    yield serializers.serialize(
      object.originalPath,
      specifiedType: const FullType(String),
    );
    if (object.owner != null) {
      yield r'owner';
      yield serializers.serialize(
        object.owner,
        specifiedType: const FullType(UserResponseDto),
      );
    }
    yield r'ownerId';
    yield serializers.serialize(
      object.ownerId,
      specifiedType: const FullType(String),
    );
    if (object.people != null) {
      yield r'people';
      yield serializers.serialize(
        object.people,
        specifiedType: const FullType(BuiltList, [FullType(PersonWithFacesResponseDto)]),
      );
    }
    yield r'resized';
    yield serializers.serialize(
      object.resized,
      specifiedType: const FullType(bool),
    );
    if (object.smartInfo != null) {
      yield r'smartInfo';
      yield serializers.serialize(
        object.smartInfo,
        specifiedType: const FullType(SmartInfoResponseDto),
      );
    }
    if (object.stack != null) {
      yield r'stack';
      yield serializers.serialize(
        object.stack,
        specifiedType: const FullType(BuiltList, [FullType(AssetResponseDto)]),
      );
    }
    yield r'stackCount';
    yield object.stackCount == null ? null : serializers.serialize(
      object.stackCount,
      specifiedType: const FullType.nullable(int),
    );
    if (object.stackParentId != null) {
      yield r'stackParentId';
      yield serializers.serialize(
        object.stackParentId,
        specifiedType: const FullType.nullable(String),
      );
    }
    if (object.tags != null) {
      yield r'tags';
      yield serializers.serialize(
        object.tags,
        specifiedType: const FullType(BuiltList, [FullType(TagResponseDto)]),
      );
    }
    yield r'thumbhash';
    yield object.thumbhash == null ? null : serializers.serialize(
      object.thumbhash,
      specifiedType: const FullType.nullable(String),
    );
    yield r'type';
    yield serializers.serialize(
      object.type,
      specifiedType: const FullType(AssetTypeEnum),
    );
    yield r'updatedAt';
    yield serializers.serialize(
      object.updatedAt,
      specifiedType: const FullType(DateTime),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    AssetResponseDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required AssetResponseDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'checksum':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.checksum = valueDes;
          break;
        case r'deviceAssetId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.deviceAssetId = valueDes;
          break;
        case r'deviceId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.deviceId = valueDes;
          break;
        case r'duration':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.duration = valueDes;
          break;
        case r'exifInfo':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(ExifResponseDto),
          ) as ExifResponseDto;
          result.exifInfo.replace(valueDes);
          break;
        case r'fileCreatedAt':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(DateTime),
          ) as DateTime;
          result.fileCreatedAt = valueDes;
          break;
        case r'fileModifiedAt':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(DateTime),
          ) as DateTime;
          result.fileModifiedAt = valueDes;
          break;
        case r'hasMetadata':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(bool),
          ) as bool;
          result.hasMetadata = valueDes;
          break;
        case r'id':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.id = valueDes;
          break;
        case r'isArchived':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(bool),
          ) as bool;
          result.isArchived = valueDes;
          break;
        case r'isExternal':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(bool),
          ) as bool;
          result.isExternal = valueDes;
          break;
        case r'isFavorite':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(bool),
          ) as bool;
          result.isFavorite = valueDes;
          break;
        case r'isOffline':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(bool),
          ) as bool;
          result.isOffline = valueDes;
          break;
        case r'isReadOnly':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(bool),
          ) as bool;
          result.isReadOnly = valueDes;
          break;
        case r'isTrashed':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(bool),
          ) as bool;
          result.isTrashed = valueDes;
          break;
        case r'libraryId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.libraryId = valueDes;
          break;
        case r'livePhotoVideoId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(String),
          ) as String?;
          if (valueDes == null) continue;
          result.livePhotoVideoId = valueDes;
          break;
        case r'localDateTime':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(DateTime),
          ) as DateTime;
          result.localDateTime = valueDes;
          break;
        case r'originalFileName':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.originalFileName = valueDes;
          break;
        case r'originalPath':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.originalPath = valueDes;
          break;
        case r'owner':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(UserResponseDto),
          ) as UserResponseDto;
          result.owner.replace(valueDes);
          break;
        case r'ownerId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.ownerId = valueDes;
          break;
        case r'people':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(PersonWithFacesResponseDto)]),
          ) as BuiltList<PersonWithFacesResponseDto>;
          result.people.replace(valueDes);
          break;
        case r'resized':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(bool),
          ) as bool;
          result.resized = valueDes;
          break;
        case r'smartInfo':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(SmartInfoResponseDto),
          ) as SmartInfoResponseDto;
          result.smartInfo.replace(valueDes);
          break;
        case r'stack':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(AssetResponseDto)]),
          ) as BuiltList<AssetResponseDto>;
          result.stack.replace(valueDes);
          break;
        case r'stackCount':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(int),
          ) as int?;
          if (valueDes == null) continue;
          result.stackCount = valueDes;
          break;
        case r'stackParentId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(String),
          ) as String?;
          if (valueDes == null) continue;
          result.stackParentId = valueDes;
          break;
        case r'tags':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(TagResponseDto)]),
          ) as BuiltList<TagResponseDto>;
          result.tags.replace(valueDes);
          break;
        case r'thumbhash':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(String),
          ) as String?;
          if (valueDes == null) continue;
          result.thumbhash = valueDes;
          break;
        case r'type':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(AssetTypeEnum),
          ) as AssetTypeEnum;
          result.type = valueDes;
          break;
        case r'updatedAt':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(DateTime),
          ) as DateTime;
          result.updatedAt = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  AssetResponseDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = AssetResponseDtoBuilder();
    final serializedList = (serialized as Iterable<Object?>).toList();
    final unhandled = <Object?>[];
    _deserializeProperties(
      serializers,
      serialized,
      specifiedType: specifiedType,
      serializedList: serializedList,
      unhandled: unhandled,
      result: result,
    );
    return result.build();
  }
}

