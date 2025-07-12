# DETAILS.md

🔍 **Powered by [Detailer](https://detailer.ginylil.com)** - Intelligent agent-ready documentation



---

## 1. Project Overview

### Purpose & Domain
This project is a comprehensive, cross-platform photo and media management system primarily implemented in Dart (Flutter) for mobile clients, supported by a robust backend and machine learning components. It addresses the problem of personal media organization, backup, sharing, and intelligent search, providing users with a private, self-hosted alternative to cloud photo services.

### Target Users and Use Cases
- **End Users:** Individuals seeking secure, private photo and video management with features like backup, sharing, facial recognition, and timeline views.
- **Administrators:** Users managing server deployments, backups, and integrations.
- **Developers:** Contributors extending features, maintaining infrastructure, or integrating AI/ML capabilities.

### Value Proposition
- **Privacy-first media management:** Local and remote asset handling with secure sharing.
- **Rich feature set:** Backup, facial recognition, timeline views, map-based browsing.
- **Cross-platform support:** Mobile apps (Flutter), backend services, CLI tools.
- **Extensibility:** Modular architecture supporting plugins, ML models, and API clients.
- **Automation:** CI/CD pipelines, containerized deployment, and monitoring.

---

## 2. Architecture and Structure

### High-Level Architecture
- **Mobile Client:** Flutter app with modular UI, state management via Riverpod, and extensive use of Dart domain models.
- **Backend Server:** Node.js/NestJS-based API server with microservices, database, and ML inference.
- **Machine Learning:** Python and C++ components for facial recognition, embedding, and model serving.
- **CLI Tools:** TypeScript-based CLI for media upload and management.
- **Infrastructure:** Docker Compose configurations, Prometheus monitoring, and deployment scripts.
- **Documentation:** Extensive docs organized by domain (admin, developer, features, guides, install).

### Complete Repository Structure (abridged for clarity)

```
.
├── .devcontainer/
│   ├── mobile/
│   └── server/
├── .github/
│   ├── workflows/
│   ├── FUNDING.yml
│   ├── labeler.yml
│   └── release.yml
├── cli/
│   ├── bin/
│   └── src/
│       ├── commands/
│       ├── queue.ts
│       └── utils.ts
├── deployment/
│   ├── modules/
│   └── state.hcl
├── design/
│   ├── immich-logo-*.png/svg
│   └── immich-text-*.png
├── docker/
│   ├── docker-compose*.yml
│   ├── hwaccel.ml.yml
│   ├── hwaccel.transcoding.yml
│   └── prometheus.yml
├── docs/
│   ├── administration/
│   ├── developer/
│   ├── features/
│   ├── guides/
│   ├── install/
│   ├── partials/
│   ├── overview/
│   └── ...
├── e2e/
│   ├── src/
│   │   ├── api/
│   │   ├── cli/
│   │   ├── web/
│   │   └── ...
│   └── ...
├── machine-learning/
│   ├── ann/
│   ├── immich_ml/
│   ├── ann/
│   └── ...
├── mobile/
│   ├── android/
│   ├── ios/
│   ├── lib/
│   │   ├── constants/
│   │   ├── domain/
│   │   ├── entities/
│   │   ├── extensions/
│   │   ├── infrastructure/
│   │   ├── models/
│   │   ├── pages/
│   │   ├── presentation/
│   │   ├── providers/
│   │   ├── repositories/
│   │   ├── routing/
│   │   ├── services/
│   │   ├── theme/
│   │   ├── utils/
│   │   └── widgets/
│   ├── scripts/
│   └── test/
├── open-api/
│   ├── bin/
│   ├── patch/
│   └── templates/
├── web/
│   ├── src/
│   └── ...
├── .gitignore
├── Makefile
├── README.md
└── renovate.json
```

---

## 3. Technical Implementation Details

### Mobile Client (Flutter/Dart)

- **Modular UI:** Organized under `mobile/lib/pages/`, `widgets/`, and `presentation/` directories, with feature-specific subfolders (e.g., `album`, `backup`, `search`, `asset_viewer`).
- **State Management:** Uses Riverpod extensively (`providers/`), with `StateNotifier`, `FutureProvider`, and `StreamProvider` patterns for reactive data flow.
- **Domain Models:** Defined under `domain/models/` and `models/`, representing core entities like `Asset`, `Album`, `User`, `Memory`, with serialization and copy methods.
- **Repositories:** Under `infrastructure/repositories/`, abstracting data access to local DB (Isar, Drift), remote APIs, and device media.
- **Services:** Under `services/`, encapsulating business logic coordinating repositories and external APIs.
- **Routing:** Declarative routing via `auto_route` in `routing/`, with guards for authentication, permissions, and locked views.
- **UI Components:** Reusable widgets under `widgets/`, including complex components like timeline, map, asset grid, and photo viewer.
- **Image Handling:** Custom `ImageProvider` implementations for local and remote images, with caching and progressive loading.
- **Video Playback:** Native video player integration with custom controls and state management.
- **Backup & Sync:** Comprehensive backup UI and logic, including manual upload, progress tracking, and error handling.
- **Localization:** Uses `easy_localization` with JSON files under `i18n/`.

### Backend & API Client

- **OpenAPI Generated SDK:** Under `mobile/openapi/lib/api/` and `model/`, auto-generated Dart client code for API interaction, with DTOs for request/response payloads.
- **Authentication:** Multiple auth strategies implemented (`ApiKeyAuth`, `HttpBasicAuth`, `HttpBearerAuth`, `OAuth`).
- **API Models:** Extensive DTOs representing domain entities, synchronization data, search results, notifications, etc.
- **Versioning & Compatibility:** DTOs include versioned models supporting backward compatibility.
- **Error Handling:** DTOs and services include error enums and response validation.

### Machine Learning

- **Model Serving:** Python FastAPI server (`machine-learning/immich_ml/`) exposing inference endpoints.
- **Model Export & Conversion:** Scripts for exporting models to ONNX, TFLite, ARMNN formats.
- **ANN Implementation:** C++ ANN runtime with Python bindings.
- **Load Testing:** Locust scripts for performance testing ML endpoints.
- **Utilities:** Image transforms, normalization, and serialization utilities.

### CLI Tools

- **TypeScript CLI:** Under `cli/src/`, commands for login, upload, server info, with concurrency queue and utilities.
- **Testing:** E2E tests for CLI and API.

### Infrastructure & Deployment

- **Docker Compose:** Multiple compose files for dev/prod, hardware acceleration, ML services.
- **Monitoring:** Prometheus and Grafana configurations.
- **CI/CD:** GitHub Actions workflows for build, test, release, and deployment automation.
- **Dev Containers:** `.devcontainer/` scripts and configs for development environment setup.

---

## 4. Development Patterns and Standards

- **Code Organization:**
  - Feature-based modularization in Flutter (`pages`, `widgets`, `providers`, `services`).
  - Separation of domain models, data access, business logic, and UI.
  - Use of code generation for API clients and Riverpod providers.
- **State Management:**
  - Riverpod with `StateNotifier`, `FutureProvider`, `StreamProvider`.
  - Use of hooks (`flutter_hooks`) for UI state and lifecycle.
- **Testing:**
  - Extensive E2E tests in `e2e/` for API, CLI, and UI.
  - Mocking with `mocktail` for unit tests.
  - Widget testing utilities and HTTP overrides.
- **Error Handling:**
  - Custom error classes and DTO validation.
  - Toast notifications and dialogs for user feedback.
- **Localization:**
  - `easy_localization` with JSON files under `i18n/`.
  - Localization keys enforced via scripts.
- **Build & Deployment:**
  - Use of Makefiles, shell scripts, and Docker for build automation.
  - CI/CD pipelines with GitHub Actions.
- **Code Quality:**
  - Linting, formatting, and static analysis integrated into workflows.
  - Use of `dcm` for license and code quality checks.

---

## 5. Integration and Dependencies

### External Libraries & Tools
- **Flutter Ecosystem:** Flutter SDK, Riverpod, Flutter Hooks, AutoRoute, Easy Localization.
- **Dart Packages:** Isar, Drift, Photo Manager, Cached Network Image, OctoImage.
- **Backend:** Node.js, NestJS, OpenAPI-generated clients.
- **Machine Learning:** Python FastAPI, ONNX Runtime, PyTorch, OpenCL, Rockchip NN SDK.
- **CI/CD:** GitHub Actions, Docker, Prometheus, Grafana.
- **Testing:** Vitest, Playwright, Mocktail.
- **Others:** Background Downloader, Local Auth, Permission Handler, Share Plus.

### Internal Dependencies
- **Domain Models:** Shared across UI, services, and repositories.
- **Services:** Depend on repositories and API clients.
- **Providers:** Inject services and repositories for UI consumption.
- **Utilities:** Shared helpers for hashing, URL building, throttling, and image processing.

---

## 6. Usage and Operational Guidance

### Getting Started
- **Development Environment:** Use `.devcontainer/` for containerized dev setup.
- **Building:** Use Makefiles and Flutter commands (`flutter pub get`, `make build`).
- **Running:** Mobile apps run via Flutter; backend via Docker Compose or Node.js.
- **Testing:** Run E2E tests via Playwright and Vitest; unit tests with mock dependencies.

### Extending the Codebase
- **Adding Features:** Follow modular patterns; add domain models under `domain/models`, UI under `widgets/` or `pages/`, and state logic under `providers/`.
- **API Changes:** Update OpenAPI specs and regenerate client code.
- **ML Models:** Use provided scripts for model export and deployment.
- **Localization:** Add keys to `i18n/` JSON files and ensure usage in code.

### Debugging and Monitoring
- Use Prometheus and Grafana dashboards (configured in `docker/`) for system monitoring.
- Use logging facilities (`immich_logger.service.dart`) for app logs.
- Use development pages (`presentation/pages/dev/`) for internal diagnostics.

### Deployment
- Use Docker Compose files in `docker/` for multi-service deployment.
- Hardware acceleration options configurable via compose files.
- CI/CD pipelines automate build, test, and release workflows.

---

## Summary

This project is a large-scale, modular, and well-architected media management system with a Flutter mobile client, a Node.js backend, machine learning components, and extensive automation. It employs modern development patterns including reactive state management, code generation, layered architecture, and containerized deployment. The repository structure supports scalability, maintainability, and extensibility, with clear separation of concerns across UI, domain, infrastructure, and services.

For efficient navigation and modification:
- Focus on `mobile/lib/` for client app logic and UI.
- Use `mobile/openapi/lib/` for API client models and communication.
- Refer to `machine-learning/` for ML model handling and inference.
- Use `e2e/` for testing infrastructure.
- Leverage `docker/` and `.github/workflows/` for deployment and CI/CD.

This documentation enables AI agents and developers to rapidly comprehend the codebase's purpose, architecture, and operational workflows.

---