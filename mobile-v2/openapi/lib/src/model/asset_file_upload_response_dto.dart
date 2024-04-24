//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'asset_file_upload_response_dto.g.dart';

/// AssetFileUploadResponseDto
///
/// Properties:
/// * [duplicate] 
/// * [id] 
@BuiltValue()
abstract class AssetFileUploadResponseDto implements Built<AssetFileUploadResponseDto, AssetFileUploadResponseDtoBuilder> {
  @BuiltValueField(wireName: r'duplicate')
  bool get duplicate;

  @BuiltValueField(wireName: r'id')
  String get id;

  AssetFileUploadResponseDto._();

  factory AssetFileUploadResponseDto([void updates(AssetFileUploadResponseDtoBuilder b)]) = _$AssetFileUploadResponseDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(AssetFileUploadResponseDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<AssetFileUploadResponseDto> get serializer => _$AssetFileUploadResponseDtoSerializer();
}

class _$AssetFileUploadResponseDtoSerializer implements PrimitiveSerializer<AssetFileUploadResponseDto> {
  @override
  final Iterable<Type> types = const [AssetFileUploadResponseDto, _$AssetFileUploadResponseDto];

  @override
  final String wireName = r'AssetFileUploadResponseDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    AssetFileUploadResponseDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'duplicate';
    yield serializers.serialize(
      object.duplicate,
      specifiedType: const FullType(bool),
    );
    yield r'id';
    yield serializers.serialize(
      object.id,
      specifiedType: const FullType(String),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    AssetFileUploadResponseDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required AssetFileUploadResponseDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'duplicate':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(bool),
          ) as bool;
          result.duplicate = valueDes;
          break;
        case r'id':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.id = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  AssetFileUploadResponseDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = AssetFileUploadResponseDtoBuilder();
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

