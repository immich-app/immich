//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'validate_library_import_path_response_dto.g.dart';

/// ValidateLibraryImportPathResponseDto
///
/// Properties:
/// * [importPath] 
/// * [isValid] 
/// * [message] 
@BuiltValue()
abstract class ValidateLibraryImportPathResponseDto implements Built<ValidateLibraryImportPathResponseDto, ValidateLibraryImportPathResponseDtoBuilder> {
  @BuiltValueField(wireName: r'importPath')
  String get importPath;

  @BuiltValueField(wireName: r'isValid')
  bool get isValid;

  @BuiltValueField(wireName: r'message')
  String? get message;

  ValidateLibraryImportPathResponseDto._();

  factory ValidateLibraryImportPathResponseDto([void updates(ValidateLibraryImportPathResponseDtoBuilder b)]) = _$ValidateLibraryImportPathResponseDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(ValidateLibraryImportPathResponseDtoBuilder b) => b
      ..isValid = false;

  @BuiltValueSerializer(custom: true)
  static Serializer<ValidateLibraryImportPathResponseDto> get serializer => _$ValidateLibraryImportPathResponseDtoSerializer();
}

class _$ValidateLibraryImportPathResponseDtoSerializer implements PrimitiveSerializer<ValidateLibraryImportPathResponseDto> {
  @override
  final Iterable<Type> types = const [ValidateLibraryImportPathResponseDto, _$ValidateLibraryImportPathResponseDto];

  @override
  final String wireName = r'ValidateLibraryImportPathResponseDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    ValidateLibraryImportPathResponseDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'importPath';
    yield serializers.serialize(
      object.importPath,
      specifiedType: const FullType(String),
    );
    yield r'isValid';
    yield serializers.serialize(
      object.isValid,
      specifiedType: const FullType(bool),
    );
    if (object.message != null) {
      yield r'message';
      yield serializers.serialize(
        object.message,
        specifiedType: const FullType(String),
      );
    }
  }

  @override
  Object serialize(
    Serializers serializers,
    ValidateLibraryImportPathResponseDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required ValidateLibraryImportPathResponseDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'importPath':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.importPath = valueDes;
          break;
        case r'isValid':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(bool),
          ) as bool;
          result.isValid = valueDes;
          break;
        case r'message':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.message = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  ValidateLibraryImportPathResponseDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = ValidateLibraryImportPathResponseDtoBuilder();
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

