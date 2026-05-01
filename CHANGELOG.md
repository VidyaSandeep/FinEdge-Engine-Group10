# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-05-01

### Added
- **Core Engine**: Implemented Transaction, User, and Budget services with MongoDB persistence.
- **Observability**: Integrated child-correlated logging with Pino and unique Request ID tracking.
- **Smart Logic**: Added rule-based auto-categorization and dynamic saving tips engine.
- **Real-time**: Implemented `EventBus` architecture and `NotificationService` for budget breaches.
- **Documentation**: Professional landing page and full OpenAPI/Swagger integration at `/api/docs`.
- **Testing**: Established minimal essential unit testing suite with Jest.
- **Project Structure**: Standardized `src/` directory layout.

### Fixed
- **Validation**: Fixed strict transaction date validation to allow both ISO 8601 and `YYYY-MM-DD` formats.
- **Partial Updates**: Refactored transaction validation to allow partial payloads for `PATCH` requests (only validating fields that are present).
- **Categorization**: Implemented automatic Title Case normalization for categories to ensure consistency between Transactions and Budgets.
- Resolved startup crashes caused by ESM export inconsistencies.
- Silenced common browser noise (`/favicon.ico`, `/sw.js`) in logs.

### Security
- Implemented JWT authentication and strict input validation via Zod.
- Configured Helmet security headers and API rate limiting.
