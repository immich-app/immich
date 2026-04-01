import 'package:flutter/material.dart';

enum AppRouteCategory {
  root(''),
  forms('Forms'),
  buttons('Buttons'),
  designSystem('Design System');

  final String displayName;
  const AppRouteCategory(this.displayName);
}

enum AppRoute {
  home(
    name: 'Home',
    description: 'Home page',
    path: '/',
    category: AppRouteCategory.root,
    icon: Icons.home_outlined,
  ),
  textButton(
    name: 'Text Button',
    description: 'Versatile button with filled and ghost variants',
    path: '/text-button',
    category: AppRouteCategory.buttons,
    icon: Icons.smart_button_rounded,
  ),
  iconButton(
    name: 'Icon Button',
    description: 'Icon-only button with customizable styling',
    path: '/icon-button',
    category: AppRouteCategory.buttons,
    icon: Icons.radio_button_unchecked_rounded,
  ),
  closeButton(
    name: 'Close Button',
    description: 'Pre-configured close button for dialogs',
    path: '/close-button',
    category: AppRouteCategory.buttons,
    icon: Icons.close_rounded,
  ),
  textInput(
    name: 'Text Input',
    description: 'Text field with validation support',
    path: '/text-input',
    category: AppRouteCategory.forms,
    icon: Icons.text_fields_outlined,
  ),
  passwordInput(
    name: 'Password Input',
    description: 'Password field with visibility toggle',
    path: '/password-input',
    category: AppRouteCategory.forms,
    icon: Icons.password_outlined,
  ),
  form(
    name: 'Form',
    description: 'Form container with built-in validation',
    path: '/form',
    category: AppRouteCategory.forms,
    icon: Icons.description_outlined,
  ),
  formattedText(
    name: 'Formatted Text',
    description: 'Render text with HTML formatting',
    path: '/formatted-text',
    category: AppRouteCategory.forms,
    icon: Icons.code_rounded,
  ),
  constants(
    name: 'Constants',
    description: 'Spacing, colors, typography, and more',
    path: '/constants',
    category: AppRouteCategory.designSystem,
    icon: Icons.palette_outlined,
  );

  final String name;
  final String description;
  final String path;
  final AppRouteCategory category;
  final IconData icon;

  const AppRoute({
    required this.name,
    required this.description,
    required this.path,
    required this.category,
    required this.icon,
  });
}

final routesByCategory = AppRoute.values
    .fold<Map<AppRouteCategory, List<AppRoute>>>({}, (map, route) {
      map.putIfAbsent(route.category, () => []).add(route);
      return map;
    });
