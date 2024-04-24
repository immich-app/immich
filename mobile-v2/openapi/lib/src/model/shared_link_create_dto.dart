//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:openapi/src/model/shared_link_type.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'shared_link_create_dto.g.dart';

/// SharedLinkCreateDto
///
/// Properties:
/// * [albumId] 
/// * [allowDownload] 
/// * [allowUpload] 
/// * [assetIds] 
/// * [description] 
/// * [expiresAt] 
/// * [password] 
/// * [showMetadata] 
/// * [type] 
@BuiltValue()
abstract class SharedLinkCreateDto implements Built<SharedLinkCreateDto, SharedLinkCreateDtoBuilder> {
  @BuiltValueField(wireName: r'albumId')
  String? get albumId;

  @BuiltValueField(wireName: r'allowDownload')
  bool? get allowDownload;

  @BuiltValueField(wireName: r'allowUpload')
  bool? get allowUpload;

  @BuiltValueField(wireName: r'assetIds')
  BuiltList<String>? get assetIds;

  @BuiltValueField(wireName: r'description')
  String? get description;

  @BuiltValueField(wireName: r'expiresAt')
  DateTime? get expiresAt;

  @BuiltValueField(wireName: r'password')
  String? get password;

  @BuiltValueField(wireName: r'showMetadata')
  bool? get showMetadata;

  @BuiltValueField(wireName: r'type')
  SharedLinkType get type;
  // enum typeEnum {  ALBUM,  INDIVIDUAL,  };

  SharedLinkCreateDto._();

  factory SharedLinkCreateDto([void updates(SharedLinkCreateDtoBuilder b)]) = _$SharedLinkCreateDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(SharedLinkCreateDtoBuilder b) => b
      ..allowDownload = true
      ..showMetadata = true;

  @BuiltValueSerializer(custom: true)
  static Serializer<SharedLinkCreateDto> get serializer => _$SharedLinkCreateDtoSerializer();
}

class _$SharedLinkCreateDtoSerializer implements PrimitiveSerializer<SharedLinkCreateDto> {
  @override
  final Iterable<Type> types = const [SharedLinkCreateDto, _$SharedLinkCreateDto];

  @override
  final String wireName = r'SharedLinkCreateDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    SharedLinkCreateDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    if (object.albumId != null) {
      yield r'albumId';
      yield serializers.serialize(
        object.albumId,
        specifiedType: const FullType(String),
      );
    }
    if (object.allowDownload != null) {
      yield r'allowDownload';
      yield serializers.serialize(
        object.allowDownload,
        specifiedType: const FullType(bool),
      );
    }
    if (object.allowUpload != null) {
      yield r'allowUpload';
      yield serializers.serialize(
        object.allowUpload,
        specifiedType: const FullType(bool),
      );
    }
    if (object.assetIds != null) {
      yield r'assetIds';
      yield serializers.serialize(
        object.assetIds,
        specifiedType: const FullType(BuiltList, [FullType(String)]),
      );
    }
    if (object.description != null) {
      yield r'description';
      yield serializers.serialize(
        object.description,
        specifiedType: const FullType(String),
      );
    }
    if (object.expiresAt != null) {
      yield r'expiresAt';
      yield serializers.serialize(
        object.expiresAt,
        specifiedType: const FullType.nullable(DateTime),
      );
    }
    if (object.password != null) {
      yield r'password';
      yield serializers.serialize(
        object.password,
        specifiedType: const FullType(String),
      );
    }
    if (object.showMetadata != null) {
      yield r'showMetadata';
      yield serializers.serialize(
        object.showMetadata,
        specifiedType: const FullType(bool),
      );
    }
    yield r'type';
    yield serializers.serialize(
      object.type,
      specifiedType: const FullType(SharedLinkType),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    SharedLinkCreateDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required SharedLinkCreateDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'albumId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.albumId = valueDes;
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
        case r'assetIds':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(String)]),
          ) as BuiltList<String>;
          result.assetIds.replace(valueDes);
          break;
        case r'description':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
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
        case r'password':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.password = valueDes;
          break;
        case r'showMetadata':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(bool),
          ) as bool;
          result.showMetadata = valueDes;
          break;
        case r'type':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(SharedLinkType),
          ) as SharedLinkType;
          result.type = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  SharedLinkCreateDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = SharedLinkCreateDtoBuilder();
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

