//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'search_suggestion_type.g.dart';

class SearchSuggestionType extends EnumClass {

  @BuiltValueEnumConst(wireName: r'country')
  static const SearchSuggestionType country = _$country;
  @BuiltValueEnumConst(wireName: r'state')
  static const SearchSuggestionType state = _$state;
  @BuiltValueEnumConst(wireName: r'city')
  static const SearchSuggestionType city = _$city;
  @BuiltValueEnumConst(wireName: r'camera-make')
  static const SearchSuggestionType cameraMake = _$cameraMake;
  @BuiltValueEnumConst(wireName: r'camera-model')
  static const SearchSuggestionType cameraModel = _$cameraModel;

  static Serializer<SearchSuggestionType> get serializer => _$searchSuggestionTypeSerializer;

  const SearchSuggestionType._(String name): super(name);

  static BuiltSet<SearchSuggestionType> get values => _$values;
  static SearchSuggestionType valueOf(String name) => _$valueOf(name);
}

/// Optionally, enum_class can generate a mixin to go with your enum for use
/// with Angular. It exposes your enum constants as getters. So, if you mix it
/// in to your Dart component class, the values become available to the
/// corresponding Angular template.
///
/// Trigger mixin generation by writing a line like this one next to your enum.
abstract class SearchSuggestionTypeMixin = Object with _$SearchSuggestionTypeMixin;

