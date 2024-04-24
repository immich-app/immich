//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'file_checksum_response_dto.g.dart';

/// FileChecksumResponseDto
///
/// Properties:
/// * [checksum] 
/// * [filename] 
@BuiltValue()
abstract class FileChecksumResponseDto implements Built<FileChecksumResponseDto, FileChecksumResponseDtoBuilder> {
  @BuiltValueField(wireName: r'checksum')
  String get checksum;

  @BuiltValueField(wireName: r'filename')
  String get filename;

  FileChecksumResponseDto._();

  factory FileChecksumResponseDto([void updates(FileChecksumResponseDtoBuilder b)]) = _$FileChecksumResponseDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(FileChecksumResponseDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<FileChecksumResponseDto> get serializer => _$FileChecksumResponseDtoSerializer();
}

class _$FileChecksumResponseDtoSerializer implements PrimitiveSerializer<FileChecksumResponseDto> {
  @override
  final Iterable<Type> types = const [FileChecksumResponseDto, _$FileChecksumResponseDto];

  @override
  final String wireName = r'FileChecksumResponseDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    FileChecksumResponseDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'checksum';
    yield serializers.serialize(
      object.checksum,
      specifiedType: const FullType(String),
    );
    yield r'filename';
    yield serializers.serialize(
      object.filename,
      specifiedType: const FullType(String),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    FileChecksumResponseDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required FileChecksumResponseDtoBuilder result,
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
        case r'filename':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.filename = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  FileChecksumResponseDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = FileChecksumResponseDtoBuilder();
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

