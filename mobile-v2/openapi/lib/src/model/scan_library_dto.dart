//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'scan_library_dto.g.dart';

/// ScanLibraryDto
///
/// Properties:
/// * [refreshAllFiles] 
/// * [refreshModifiedFiles] 
@BuiltValue()
abstract class ScanLibraryDto implements Built<ScanLibraryDto, ScanLibraryDtoBuilder> {
  @BuiltValueField(wireName: r'refreshAllFiles')
  bool? get refreshAllFiles;

  @BuiltValueField(wireName: r'refreshModifiedFiles')
  bool? get refreshModifiedFiles;

  ScanLibraryDto._();

  factory ScanLibraryDto([void updates(ScanLibraryDtoBuilder b)]) = _$ScanLibraryDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(ScanLibraryDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<ScanLibraryDto> get serializer => _$ScanLibraryDtoSerializer();
}

class _$ScanLibraryDtoSerializer implements PrimitiveSerializer<ScanLibraryDto> {
  @override
  final Iterable<Type> types = const [ScanLibraryDto, _$ScanLibraryDto];

  @override
  final String wireName = r'ScanLibraryDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    ScanLibraryDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    if (object.refreshAllFiles != null) {
      yield r'refreshAllFiles';
      yield serializers.serialize(
        object.refreshAllFiles,
        specifiedType: const FullType(bool),
      );
    }
    if (object.refreshModifiedFiles != null) {
      yield r'refreshModifiedFiles';
      yield serializers.serialize(
        object.refreshModifiedFiles,
        specifiedType: const FullType(bool),
      );
    }
  }

  @override
  Object serialize(
    Serializers serializers,
    ScanLibraryDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required ScanLibraryDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'refreshAllFiles':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(bool),
          ) as bool;
          result.refreshAllFiles = valueDes;
          break;
        case r'refreshModifiedFiles':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(bool),
          ) as bool;
          result.refreshModifiedFiles = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  ScanLibraryDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = ScanLibraryDtoBuilder();
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

