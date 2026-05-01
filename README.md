# FinEdge Engine - Financial Intelligence API

[![Node.js Version](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen)](https://nodejs.org/)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)
[![Maintenance](https://img.shields.io/badge/Maintained%3F-yes-green.svg)](https://github.com/VidyaSandeep/FinEdge-Engine-Group10)

FinEdge is a robust, production-ready RESTful API designed for personal finance management and real-time expense tracking. It features an event-driven architecture, smart transaction categorization, and proactive budget monitoring.

---

## 🚀 Features

- **Intelligence & Automation**
  - **Smart Categorization**: Automated tagging of transactions using rule-based keyword matching.
  - **Category Normalization**: Automatic Title Case conversion for consistent tracking across modules.
  - **Predictive Tips**: Dynamic saving recommendations generated from historical spending patterns.
  - **Auto-Summarization**: Real-time balance and category-wise expenditure re-computation.

- **Architecture & Performance**
  - **Event-Driven Side Effects**: Decoupled notification engine using a centralized `EventBus`.
  - **Memory Caching**: TTL-based caching for analytical queries to reduce database load.
  - **Observability**: Child-correlated logging and unique request tracking via `AsyncLocalStorage`.

- **Security & Reliability**
  - **JWT Authentication**: Secure stateless user sessions.
  - **Flexible Validation**: Strict schema enforcement using Zod with support for partial updates and multiple date formats (ISO/YYYY-MM-DD).
  - **Resilience**: Integrated rate limiting and security headers (Helmet).

---

## 🛠️ Tech Stack

- **Core**: Node.js (ES Modules)
- **Framework**: Express.js
- **Database**: MongoDB (Mongoose ODM)
- **Logging**: Pino (Structured JSON logging)
- **Testing**: Jest & Supertest
- **Documentation**: Swagger/OpenAPI 3.0

---

## 📂 Project Structure

```text
.
├── public/             # Static assets and documentation portal
├── src/                # Main application source code
│   ├── config/         # Environment and configuration management
│   ├── constants/      # Shared constants and magic strings
│   ├── controllers/    # Request handlers (HTTP/REST logic)
│   ├── datasource/     # Database connections (MongoDB/Mongoose)
│   ├── middleware/     # Custom Express middleware (Auth, Errors)
│   ├── models/         # Mongoose schemas and entity definitions
│   ├── repositories/   # Data access layer (DB abstractions)
│   ├── routes/         # API endpoint definitions
│   ├── services/       # Core business logic and use cases
│   ├── utils/          # Helper functions and shared utilities
│   ├── app.js          # Express app initialization
│   └── server.js       # Server entry point and startup logic
├── tests/              # Unit and integration test suites
├── package.json        # Dependencies and scripts
└── README.md           # Project documentation
└── .env_example        # Environment variables example
```

---

## ⚙️ Getting Started

### Prerequisites
- Node.js v20.x or higher
- MongoDB instance (local or Atlas)

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/VidyaSandeep/FinEdge-Engine-Group10.git
   cd FinEdge-Engine-Group10
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure environment variables:
   Copy the example file to `.env` and update the values:
   ```bash
   cp .env_example .env
   ```

### Running the Application
```bash
# Development (with hot-reload)
npm run dev

# Production
npm start
```

---

## 📖 API Documentation

Once the server is running, visit the interactive Swagger documentation:
- **Explorer**: `http://localhost:3000/api/docs`
- **Health Portal**: `http://localhost:3000/`

---

## 🧪 Testing & Quality Assurance

We maintain high code quality through automated testing:
```bash
npm test
```
*Note: Tests follow the directory structure of the source code under the `tests/` directory.*

---

## 🤝 Contribution Guidelines

1. **Fork** the repository.
2. Create a **Feature Branch** (`git checkout -b feature/AmazingFeature`).
3. Follow **Standard JS** style and ensure all tests pass.
4. **Commit** your changes (`git commit -m 'Add AmazingFeature'`).
5. **Push** to the branch (`git push origin feature/AmazingFeature`).
6. Open a **Pull Request**.

---

## 📝 Roadmap / TODO

- [ ] Multi-currency support.
- [ ] Bank statement (CSV/PDF) import utility.
- [ ] OAuth2 integration (Google).
- [ ] Advanced data visualization endpoints.

---

## 📜 Best Practices Followed
- **Clean Architecture**: Separation of concerns across Routes, Controllers, Services, and Repositories.
- **Fail-Fast Validation**: Schema validation at the entry point.
- **Statelessness**: JWT-based authentication for horizontal scalability.
- **Graceful Shutdown**: Proper handling of SIGTERM and database connections.

---

## 🧹 Release Hygiene

To maintain production stability, we follow strict release protocols:
- **Semantic Versioning**: Adherence to `MAJOR.MINOR.PATCH` format for all releases.
- **Changelog Maintenance**: Every significant change must be documented in `CHANGELOG.md`.
- **Pre-Release Checklist**:
  - [ ] All unit tests pass (`npm test`).
  - [ ] Swagger JSDoc is updated for any new endpoints.
  - [ ] Static assets and public portal are verified.
  - [ ] Environment variables in `.env_example` are synced.

---

## 📄 License
Distributed under the **ISC License**. See `LICENSE` for more information.
