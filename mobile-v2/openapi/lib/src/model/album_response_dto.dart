//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:openapi/src/model/asset_order.dart';
import 'package:built_collection/built_collection.dart';
import 'package:openapi/src/model/asset_response_dto.dart';
import 'package:openapi/src/model/user_response_dto.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'album_response_dto.g.dart';

/// AlbumResponseDto
///
/// Properties:
/// * [albumName] 
/// * [albumThumbnailAssetId] 
/// * [assetCount] 
/// * [assets] 
/// * [createdAt] 
/// * [description] 
/// * [endDate] 
/// * [hasSharedLink] 
/// * [id] 
/// * [isActivityEnabled] 
/// * [lastModifiedAssetTimestamp] 
/// * [order] 
/// * [owner] 
/// * [ownerId] 
/// * [shared] 
/// * [sharedUsers] 
/// * [startDate] 
/// * [updatedAt] 
@BuiltValue()
abstract class AlbumResponseDto implements Built<AlbumResponseDto, AlbumResponseDtoBuilder> {
  @BuiltValueField(wireName: r'albumName')
  String get albumName;

  @BuiltValueField(wireName: r'albumThumbnailAssetId')
  String? get albumThumbnailAssetId;

  @BuiltValueField(wireName: r'assetCount')
  int get assetCount;

  @BuiltValueField(wireName: r'assets')
  BuiltList<AssetResponseDto> get assets;

  @BuiltValueField(wireName: r'createdAt')
  DateTime get createdAt;

  @BuiltValueField(wireName: r'description')
  String get description;

  @BuiltValueField(wireName: r'endDate')
  DateTime? get endDate;

  @BuiltValueField(wireName: r'hasSharedLink')
  bool get hasSharedLink;

  @BuiltValueField(wireName: r'id')
  String get id;

  @BuiltValueField(wireName: r'isActivityEnabled')
  bool get isActivityEnabled;

  @BuiltValueField(wireName: r'lastModifiedAssetTimestamp')
  DateTime? get lastModifiedAssetTimestamp;

  @BuiltValueField(wireName: r'order')
  AssetOrder? get order;
  // enum orderEnum {  asc,  desc,  };

  @BuiltValueField(wireName: r'owner')
  UserResponseDto get owner;

  @BuiltValueField(wireName: r'ownerId')
  String get ownerId;

  @BuiltValueField(wireName: r'shared')
  bool get shared;

  @BuiltValueField(wireName: r'sharedUsers')
  BuiltList<UserResponseDto> get sharedUsers;

  @BuiltValueField(wireName: r'startDate')
  DateTime? get startDate;

  @BuiltValueField(wireName: r'updatedAt')
  DateTime get updatedAt;

  AlbumResponseDto._();

  factory AlbumResponseDto([void updates(AlbumResponseDtoBuilder b)]) = _$AlbumResponseDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(AlbumResponseDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<AlbumResponseDto> get serializer => _$AlbumResponseDtoSerializer();
}

class _$AlbumResponseDtoSerializer implements PrimitiveSerializer<AlbumResponseDto> {
  @override
  final Iterable<Type> types = const [AlbumResponseDto, _$AlbumResponseDto];

  @override
  final String wireName = r'AlbumResponseDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    AlbumResponseDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'albumName';
    yield serializers.serialize(
      object.albumName,
      specifiedType: const FullType(String),
    );
    yield r'albumThumbnailAssetId';
    yield object.albumThumbnailAssetId == null ? null : serializers.serialize(
      object.albumThumbnailAssetId,
      specifiedType: const FullType.nullable(String),
    );
    yield r'assetCount';
    yield serializers.serialize(
      object.assetCount,
      specifiedType: const FullType(int),
    );
    yield r'assets';
    yield serializers.serialize(
      object.assets,
      specifiedType: const FullType(BuiltList, [FullType(AssetResponseDto)]),
    );
    yield r'createdAt';
    yield serializers.serialize(
      object.createdAt,
      specifiedType: const FullType(DateTime),
    );
    yield r'description';
    yield serializers.serialize(
      object.description,
      specifiedType: const FullType(String),
    );
    if (object.endDate != null) {
      yield r'endDate';
      yield serializers.serialize(
        object.endDate,
        specifiedType: const FullType(DateTime),
      );
    }
    yield r'hasSharedLink';
    yield serializers.serialize(
      object.hasSharedLink,
      specifiedType: const FullType(bool),
    );
    yield r'id';
    yield serializers.serialize(
      object.id,
      specifiedType: const FullType(String),
    );
    yield r'isActivityEnabled';
    yield serializers.serialize(
      object.isActivityEnabled,
      specifiedType: const FullType(bool),
    );
    if (object.lastModifiedAssetTimestamp != null) {
      yield r'lastModifiedAssetTimestamp';
      yield serializers.serialize(
        object.lastModifiedAssetTimestamp,
        specifiedType: const FullType(DateTime),
      );
    }
    if (object.order != null) {
      yield r'order';
      yield serializers.serialize(
        object.order,
        specifiedType: const FullType(AssetOrder),
      );
    }
    yield r'owner';
    yield serializers.serialize(
      object.owner,
      specifiedType: const FullType(UserResponseDto),
    );
    yield r'ownerId';
    yield serializers.serialize(
      object.ownerId,
      specifiedType: const FullType(String),
    );
    yield r'shared';
    yield serializers.serialize(
      object.shared,
      specifiedType: const FullType(bool),
    );
    yield r'sharedUsers';
    yield serializers.serialize(
      object.sharedUsers,
      specifiedType: const FullType(BuiltList, [FullType(UserResponseDto)]),
    );
    if (object.startDate != null) {
      yield r'startDate';
      yield serializers.serialize(
        object.startDate,
        specifiedType: const FullType(DateTime),
      );
    }
    yield r'updatedAt';
    yield serializers.serialize(
      object.updatedAt,
      specifiedType: const FullType(DateTime),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    AlbumResponseDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required AlbumResponseDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'albumName':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.albumName = valueDes;
          break;
        case r'albumThumbnailAssetId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(String),
          ) as String?;
          if (valueDes == null) continue;
          result.albumThumbnailAssetId = valueDes;
          break;
        case r'assetCount':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(int),
          ) as int;
          result.assetCount = valueDes;
          break;
        case r'assets':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(AssetResponseDto)]),
          ) as BuiltList<AssetResponseDto>;
          result.assets.replace(valueDes);
          break;
        case r'createdAt':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(DateTime),
          ) as DateTime;
          result.createdAt = valueDes;
          break;
        case r'description':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.description = valueDes;
          break;
        case r'endDate':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(DateTime),
          ) as DateTime;
          result.endDate = valueDes;
          break;
        case r'hasSharedLink':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(bool),
          ) as bool;
          result.hasSharedLink = valueDes;
          break;
        case r'id':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.id = valueDes;
          break;
        case r'isActivityEnabled':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(bool),
          ) as bool;
          result.isActivityEnabled = valueDes;
          break;
        case r'lastModifiedAssetTimestamp':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(DateTime),
          ) as DateTime;
          result.lastModifiedAssetTimestamp = valueDes;
          break;
        case r'order':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(AssetOrder),
          ) as AssetOrder;
          result.order = valueDes;
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
        case r'shared':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(bool),
          ) as bool;
          result.shared = valueDes;
          break;
        case r'sharedUsers':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(UserResponseDto)]),
          ) as BuiltList<UserResponseDto>;
          result.sharedUsers.replace(valueDes);
          break;
        case r'startDate':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(DateTime),
          ) as DateTime;
          result.startDate = valueDes;
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
  AlbumResponseDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = AlbumResponseDtoBuilder();
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

