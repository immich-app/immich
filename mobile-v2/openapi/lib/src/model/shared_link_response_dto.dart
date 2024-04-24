//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:openapi/src/model/asset_response_dto.dart';
import 'package:openapi/src/model/shared_link_type.dart';
import 'package:openapi/src/model/album_response_dto.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'shared_link_response_dto.g.dart';

/// SharedLinkResponseDto
///
/// Properties:
/// * [album] 
/// * [allowDownload] 
/// * [allowUpload] 
/// * [assets] 
/// * [createdAt] 
/// * [description] 
/// * [expiresAt] 
/// * [id] 
/// * [key] 
/// * [password] 
/// * [showMetadata] 
/// * [token] 
/// * [type] 
/// * [userId] 
@BuiltValue()
abstract class SharedLinkResponseDto implements Built<SharedLinkResponseDto, SharedLinkResponseDtoBuilder> {
  @BuiltValueField(wireName: r'album')
  AlbumResponseDto? get album;

  @BuiltValueField(wireName: r'allowDownload')
  bool get allowDownload;

  @BuiltValueField(wireName: r'allowUpload')
  bool get allowUpload;

  @BuiltValueField(wireName: r'assets')
  BuiltList<AssetResponseDto> get assets;

  @BuiltValueField(wireName: r'createdAt')
  DateTime get createdAt;

  @BuiltValueField(wireName: r'description')
  String? get description;

  @BuiltValueField(wireName: r'expiresAt')
  DateTime? get expiresAt;

  @BuiltValueField(wireName: r'id')
  String get id;

  @BuiltValueField(wireName: r'key')
  String get key;

  @BuiltValueField(wireName: r'password')
  String? get password;

  @BuiltValueField(wireName: r'showMetadata')
  bool get showMetadata;

  @BuiltValueField(wireName: r'token')
  String? get token;

  @BuiltValueField(wireName: r'type')
  SharedLinkType get type;
  // enum typeEnum {  ALBUM,  INDIVIDUAL,  };

  @BuiltValueField(wireName: r'userId')
  String get userId;

  SharedLinkResponseDto._();

  factory SharedLinkResponseDto([void updates(SharedLinkResponseDtoBuilder b)]) = _$SharedLinkResponseDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(SharedLinkResponseDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<SharedLinkResponseDto> get serializer => _$SharedLinkResponseDtoSerializer();
}

class _$SharedLinkResponseDtoSerializer implements PrimitiveSerializer<SharedLinkResponseDto> {
  @override
  final Iterable<Type> types = const [SharedLinkResponseDto, _$SharedLinkResponseDto];

  @override
  final String wireName = r'SharedLinkResponseDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    SharedLinkResponseDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    if (object.album != null) {
      yield r'album';
      yield serializers.serialize(
        object.album,
        specifiedType: const FullType(AlbumResponseDto),
      );
    }
    yield r'allowDownload';
    yield serializers.serialize(
      object.allowDownload,
      specifiedType: const FullType(bool),
    );
    yield r'allowUpload';
    yield serializers.serialize(
      object.allowUpload,
      specifiedType: const FullType(bool),
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
    yield object.description == null ? null : serializers.serialize(
      object.description,
      specifiedType: const FullType.nullable(String),
    );
    yield r'expiresAt';
    yield object.expiresAt == null ? null : serializers.serialize(
      object.expiresAt,
      specifiedType: const FullType.nullable(DateTime),
    );
    yield r'id';
    yield serializers.serialize(
      object.id,
      specifiedType: const FullType(String),
    );
    yield r'key';
    yield serializers.serialize(
      object.key,
      specifiedType: const FullType(String),
    );
    yield r'password';
    yield object.password == null ? null : serializers.serialize(
      object.password,
      specifiedType: const FullType.nullable(String),
    );
    yield r'showMetadata';
    yield serializers.serialize(
      object.showMetadata,
      specifiedType: const FullType(bool),
    );
    if (object.token != null) {
      yield r'token';
      yield serializers.serialize(
        object.token,
        specifiedType: const FullType.nullable(String),
      );
    }
    yield r'type';
    yield serializers.serialize(
      object.type,
      specifiedType: const FullType(SharedLinkType),
    );
    yield r'userId';
    yield serializers.serialize(
      object.userId,
      specifiedType: const FullType(String),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    SharedLinkResponseDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required SharedLinkResponseDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'album':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(AlbumResponseDto),
          ) as AlbumResponseDto;
          result.album.replace(valueDes);
          break;
        case r'allowDownload':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(bool),
          ) as bool;
          result.allowDownload = valueDes;
          break;
        case r'allowUpload':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(bool),
          ) as bool;
          result.allowUpload = valueDes;
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
            specifiedType: const FullType.nullable(String),
          ) as String?;
          if (valueDes == null) continue;
          result.description = valueDes;
          break;
        case r'expiresAt':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(DateTime),
          ) as DateTime?;
          if (valueDes == null) continue;
          result.expiresAt = valueDes;
          break;
        case r'id':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.id = valueDes;
          break;
        case r'key':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.key = valueDes;
          break;
        case r'password':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(String),
          ) as String?;
          if (valueDes == null) continue;
          result.password = valueDes;
          break;
        case r'showMetadata':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(bool),
          ) as bool;
          result.showMetadata = valueDes;
          break;
        case r'token':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(String),
          ) as String?;
          if (valueDes == null) continue;
          result.token = valueDes;
          break;
        case r'type':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(SharedLinkType),
          ) as SharedLinkType;
          result.type = valueDes;
          break;
        case r'userId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.userId = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  SharedLinkResponseDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = SharedLinkResponseDtoBuilder();
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

