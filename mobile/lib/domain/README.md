# Domain Layer

This directory contains the domain layer of Immich. The domain layer is responsible for the business logic of the app. It includes interfaces for repositories, models, services and utilities. This layer should never depend on anything from the presentation layer or from the infrastructure layer.

## Structure

- **[Interfaces](./interfaces/)**: These are the interfaces that define the contract for data operations.
- **[Models](./models/)**: These are the core data classes that represent the business models.
- **[Services](./services/)**: These are the classes that contain the business logic and interact with the repositories.
- **[Utils](./utils/)**: These are utility classes and functions that provide common functionalities used across the domain layer.

```
domain/
├── interfaces/
│   └── user.interface.dart
├── models/
│   └── user.model.dart
├── services/
│   └── user.service.dart
└── utils/
    └── date_utils.dart
```

## Usage

The domain layer provides services that implement the business logic by consuming repositories through dependency injection. Services are exposed through Riverpod providers in the root `providers` directory.

```dart
// In presentation layer
final userService = ref.watch(userServiceProvider);
final user = await userService.getUser(userId);
```

The presentation layer should never directly use repositories, but instead interact with the domain layer through services.