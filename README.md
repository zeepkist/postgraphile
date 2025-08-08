# PostGraphile GraphQL API

This repository provides the **GraphQL API** for the [Zeepkist Community Hub], powering [ZeepCentral], the [GTR mod], and other community services. It exposes a flexible, high-performance GraphQL endpoint backed by PostgreSQL, with custom plugins and observability features.

## Features

- **GraphQL API** for querying and mutating data from the Zeepkist Community Hub [backend](https://github.com/zeepkist/backend)
- Custom PostGraphile plugins
- OpenTelemetry integration for distributed tracing and metrics
- Query cost analysis and enforcement to prevent expensive queries
- CORS support and request logging
- Dockerized for easy deployment

## Requirements

- Node.js 18+ (Node 22 recommended)
- PostgreSQL database
- Docker (optional, for containerised deployment)

## Getting Started

1. **Clone the repository:**
    ```sh
    git clone https://github.com/zeepkist/postgraphile.git
    cd postgraphile
    ```

2. **Install dependencies:**
    ```sh
    yarn install
    ```

3. **Configure environment:**
    - Copy `.env.example` to `.env` and fill in the required values for your database and OpenTelemetry setup.

4. **Start the server:**
    ```sh
    yarn start
    ```

5. **Access GraphiQL:**
    - Open [http://localhost:5000/](http://localhost:5000/) in your browser for the Ruru GraphiQL interface.

### Docker Deployment

To build and run the service with Docker:

```sh
docker build -t zeepkist/postgraphile .
docker run --env-file .env -p 5000:5000 zeepkist/postgraphile
```

## Structure

The repository is organized for clarity and extensibility:

```sh
./
├── src/
│   ├── middleware/   # Koa middleware (query cost, metrics, GraphiQL, etc.)
│   ├── plugins/      # Custom PostGraphile plugins (inflectors, tracing, etc.)
│   ├── otel.js       # OpenTelemetry setup
│   └── server.js     # Koa server and PostGraphile integration
└── Dockerfile        # Docker build instructions
```

## Custom Plugins

- [`src/plugins/TracePlugin.js`](src/plugins/TracePlugin.js): Adds OpenTelemetry tracing to GraphQL field resolvers.
- [`src/plugins/PaginationLimitsPlugin.js`](src/plugins/PaginationLimitsPlugin.js): Enforces sensible pagination limits.
- [`src/plugins/FixForeignKeyNamesPlugin.js`](src/plugins/FixForeignKeyNamesPlugin.js): Customises foreign key field naming.
- [`src/plugins/ManyToManyInflectorsPlugin.js`](src/plugins/ManyToManyInflectorsPlugin.js): Improves many-to-many relation field names.
- [`src/plugins/OrderByRelatedInflectorsPlugin.js`](src/plugins/OrderByRelatedInflectorsPlugin.js): Enhances order-by inflection for related tables.
- [`src/plugins/AddCdnToUrlsPlugin.js`](src/plugins/AddCdnToUrlsPlugin.js): Automatically prepends CDN URLs to asset fields.
- [`src/plugins/SkipByNodeIdFieldsPlugin.js`](src/plugins/SkipByNodeIdFieldsPlugin.js): Removes `ByNodeId` root query fields.

## Observability

- **Tracing:** OpenTelemetry traces are exported via OTLP (see [`src/otel.js`](src/otel.js)).
- **Metrics:** Selected request and header metrics are collected for monitoring.
- **Query Cost:** All GraphQL queries are analyzed for cost before execution (see [`src/middleware/createQueryCostMiddleware.js`](src/middleware/createQueryCostMiddleware.js)).

## Contributing

Contributions are welcome! Please open issues or submit pull requests for improvements and bug fixes.

## Documentation

- **GraphQL API:** [graphql.zeepki.st](https://graphql.zeepki.st) (production instance)
- **Plugins:** See [`src/plugins/`](src/plugins/) for custom plugin implementations.
- **Middleware:** See [`src/middleware/`](src/middleware/) for request handling logic.

## License

This project is licensed under the [MIT License](LICENSE).

[Zeepkist Community Hub]: https://github.com/zeepkist
[ZeepCentral]: https://zeepki.st
[GTR mod]: https://mod.io/g/zeepkist/m/zeepkist-gtr
[Zeepkist]: https://store.steampowered.com/app/1440670/Zeepkist/
```
