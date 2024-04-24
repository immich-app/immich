//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:openapi/src/model/library_type.dart';
import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'create_library_dto.g.dart';

/// CreateLibraryDto
///
/// Properties:
/// * [exclusionPatterns] 
/// * [importPaths] 
/// * [isVisible] 
/// * [name] 
/// * [ownerId] 
/// * [type] 
@BuiltValue()
abstract class CreateLibraryDto implements Built<CreateLibraryDto, CreateLibraryDtoBuilder> {
  @BuiltValueField(wireName: r'exclusionPatterns')
  BuiltList<String>? get exclusionPatterns;

  @BuiltValueField(wireName: r'importPaths')
  BuiltList<String>? get importPaths;

  @BuiltValueField(wireName: r'isVisible')
  bool? get isVisible;

  @BuiltValueField(wireName: r'name')
  String? get name;

  @BuiltValueField(wireName: r'ownerId')
  String get ownerId;

  @BuiltValueField(wireName: r'type')
  LibraryType get type;
  // enum typeEnum {  UPLOAD,  EXTERNAL,  };

  CreateLibraryDto._();

  factory CreateLibraryDto([void updates(CreateLibraryDtoBuilder b)]) = _$CreateLibraryDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(CreateLibraryDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<CreateLibraryDto> get serializer => _$CreateLibraryDtoSerializer();
}

class _$CreateLibraryDtoSerializer implements PrimitiveSerializer<CreateLibraryDto> {
  @override
  final Iterable<Type> types = const [CreateLibraryDto, _$CreateLibraryDto];

  @override
  final String wireName = r'CreateLibraryDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    CreateLibraryDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    if (object.exclusionPatterns != null) {
      yield r'exclusionPatterns';
      yield serializers.serialize(
        object.exclusionPatterns,
        specifiedType: const FullType(BuiltList, [FullType(String)]),
      );
    }
    if (object.importPaths != null) {
      yield r'importPaths';
      yield serializers.serialize(
        object.importPaths,
        specifiedType: const FullType(BuiltList, [FullType(String)]),
      );
    }
    if (object.isVisible != null) {
      yield r'isVisible';
      yield serializers.serialize(
        object.isVisible,
        specifiedType: const FullType(bool),
      );
    }
    if (object.name != null) {
      yield r'name';
      yield serializers.serialize(
        object.name,
        specifiedType: const FullType(String),
      );
    }
    yield r'ownerId';
    yield serializers.serialize(
      object.ownerId,
      specifiedType: const FullType(String),
    );
    yield r'type';
    yield serializers.serialize(
      object.type,
      specifiedType: const FullType(LibraryType),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    CreateLibraryDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required CreateLibraryDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'exclusionPatterns':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(String)]),
          ) as BuiltList<String>;
          result.exclusionPatterns.replace(valueDes);
          break;
        case r'importPaths':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(String)]),
          ) as BuiltList<String>;
          result.importPaths.replace(valueDes);
          break;
        case r'isVisible':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(bool),
          ) as bool;
          result.isVisible = valueDes;
          break;
        case r'name':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.name = valueDes;
          break;
        case r'ownerId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.ownerId = valueDes;
          break;
        case r'type':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(LibraryType),
          ) as LibraryType;
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
  CreateLibraryDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = CreateLibraryDtoBuilder();
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

