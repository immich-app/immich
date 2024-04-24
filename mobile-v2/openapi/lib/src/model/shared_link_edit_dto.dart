//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'shared_link_edit_dto.g.dart';

/// SharedLinkEditDto
///
/// Properties:
/// * [allowDownload] 
/// * [allowUpload] 
/// * [changeExpiryTime] - Few clients cannot send null to set the expiryTime to never. Setting this flag and not sending expiryAt is considered as null instead. Clients that can send null values can ignore this.
/// * [description] 
/// * [expiresAt] 
/// * [password] 
/// * [showMetadata] 
@BuiltValue()
abstract class SharedLinkEditDto implements Built<SharedLinkEditDto, SharedLinkEditDtoBuilder> {
  @BuiltValueField(wireName: r'allowDownload')
  bool? get allowDownload;

  @BuiltValueField(wireName: r'allowUpload')
  bool? get allowUpload;

  /// Few clients cannot send null to set the expiryTime to never. Setting this flag and not sending expiryAt is considered as null instead. Clients that can send null values can ignore this.
  @BuiltValueField(wireName: r'changeExpiryTime')
  bool? get changeExpiryTime;

  @BuiltValueField(wireName: r'description')
  String? get description;

  @BuiltValueField(wireName: r'expiresAt')
  DateTime? get expiresAt;

  @BuiltValueField(wireName: r'password')
  String? get password;

  @BuiltValueField(wireName: r'showMetadata')
  bool? get showMetadata;

  SharedLinkEditDto._();

  factory SharedLinkEditDto([void updates(SharedLinkEditDtoBuilder b)]) = _$SharedLinkEditDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(SharedLinkEditDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<SharedLinkEditDto> get serializer => _$SharedLinkEditDtoSerializer();
}

class _$SharedLinkEditDtoSerializer implements PrimitiveSerializer<SharedLinkEditDto> {
  @override
  final Iterable<Type> types = const [SharedLinkEditDto, _$SharedLinkEditDto];

  @override
  final String wireName = r'SharedLinkEditDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    SharedLinkEditDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
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
    if (object.changeExpiryTime != null) {
      yield r'changeExpiryTime';
      yield serializers.serialize(
        object.changeExpiryTime,
        specifiedType: const FullType(bool),
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
  }

  @override
  Object serialize(
    Serializers serializers,
    SharedLinkEditDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required SharedLinkEditDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
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
        case r'changeExpiryTime':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(bool),
          ) as bool;
          result.changeExpiryTime = valueDes;
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
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  SharedLinkEditDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = SharedLinkEditDtoBuilder();
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

