//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:openapi/src/model/search_explore_item.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'search_explore_response_dto.g.dart';

/// SearchExploreResponseDto
///
/// Properties:
/// * [fieldName] 
/// * [items] 
@BuiltValue()
abstract class SearchExploreResponseDto implements Built<SearchExploreResponseDto, SearchExploreResponseDtoBuilder> {
  @BuiltValueField(wireName: r'fieldName')
  String get fieldName;

  @BuiltValueField(wireName: r'items')
  BuiltList<SearchExploreItem> get items;

  SearchExploreResponseDto._();

  factory SearchExploreResponseDto([void updates(SearchExploreResponseDtoBuilder b)]) = _$SearchExploreResponseDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(SearchExploreResponseDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<SearchExploreResponseDto> get serializer => _$SearchExploreResponseDtoSerializer();
}

class _$SearchExploreResponseDtoSerializer implements PrimitiveSerializer<SearchExploreResponseDto> {
  @override
  final Iterable<Type> types = const [SearchExploreResponseDto, _$SearchExploreResponseDto];

  @override
  final String wireName = r'SearchExploreResponseDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    SearchExploreResponseDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'fieldName';
    yield serializers.serialize(
      object.fieldName,
      specifiedType: const FullType(String),
    );
    yield r'items';
    yield serializers.serialize(
      object.items,
      specifiedType: const FullType(BuiltList, [FullType(SearchExploreItem)]),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    SearchExploreResponseDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required SearchExploreResponseDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'fieldName':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.fieldName = valueDes;
          break;
        case r'items':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(SearchExploreItem)]),
          ) as BuiltList<SearchExploreItem>;
          result.items.replace(valueDes);
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  SearchExploreResponseDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = SearchExploreResponseDtoBuilder();
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

