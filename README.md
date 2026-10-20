# FGO List Shortener

A lightweight URL-shortening service built with **Cloudflare Workers, TypeScript, and Cloudflare D1** for [FGO Checklist](https://tohnocoding.github.io/fgochecklist/). Also my first experience working with TypeScript, after decades of JavaScript and jQuery.

FGO Checklist stores a user's roster and wishlist in the `pak` query-string parameter. As the roster grows, these URLs can become very long and inconvenient to share. This service stores eligible checklist URLs in a database and returns compact links that redirect to the original URL.

**Production endpoint:** https://list.fatego.workers.dev

## Features

- Generates cryptographically random, eight-character URL slugs.
- Stores short-to-long URL mappings in Cloudflare D1.
- Reuses an existing short link when the same URL is submitted again.
- Validates submitted URLs against the configured host, path, protocol, and query parameters.
- Restricts browser-based link creation to a configured origin.
- Applies rate limiting to link creation.
- Supports long URLs up to 64 KiB.
- Provides a health-check endpoint.

## Tech stack

- [Cloudflare Workers](https://developers.cloudflare.com/workers/) — serverless runtime.
- [Cloudflare D1](https://developers.cloudflare.com/d1/) — SQLite-compatible database.
- [Wrangler](https://developers.cloudflare.com/workers/wrangler/) — local development and deployment CLI.
- TypeScript — application code.

## Design Philosophy and Customization

This project was originally developed to address a specific need in [FGO Checklist](https://tohnocoding.github.io/fgochecklist/): its shareable URLs contain encoded roster and wishlist data in the `pak` query parameter, which can grow considerably as the game receives new characters.

Rather than treating the implementation as exclusively tied to FGO Checklist, the project can also serve as a starting point for a **general-purpose URL shortener**.

The current implementation intentionally restricts submissions to FGO Checklist URLs. Adapting it for another application or for arbitrary URLs requires an understanding of the existing implementation and appropriate changes to its configuration and validation logic.

Depending on the intended use case, customization may include:

- **URL validation:** Modify the accepted protocols, hostnames, paths, and query parameters in `validations.ts`.
- **Request authorization:** Review the allowed-origin checks and CORS behavior, and implement appropriate access controls for the intended deployment.
- **Slug generation:** Adjust the slug length or character set in `slug.ts`, taking collision probability and URL usability into account.
- **Rate limiting:** Configure request limits appropriate to the expected traffic and abuse risk.
- **Storage and deployment:** Configure the D1 database, Wrangler environments, and deployment settings for the target application.

These changes are not necessarily limited to configuration values. Different use cases may require changes to the application code, database schema, or request-handling logic.

**Important:** Allowing arbitrary destination URLs changes the service's security and abuse profile. A publicly accessible general-purpose shortener can be abused to distribute misleading or malicious links. Review validation, rate limiting, access controls, monitoring, and applicable hosting limits before deploying such a service publicly.

The project is therefore best understood as an FGO Checklist-specific implementation that can be adapted by developers who understand the consequences of the changes they make, rather than a general-purpose shortener that works for every use case without modification.

## API

### Create a short link

`POST /api/shorten`

Creates a short link for an eligible FGO Checklist URL.

**Request headers**

```http
Content-Type: application/json
```

The browser must send the configured `Origin` header. Cross-origin requests are supported for the configured GitHub Pages origin.

**Request body**

```json
{
  "long": "https://tohnocoding.github.io/fgochecklist/?pak=YOUR_ENCODED_DATA"
}
```

The `long` property must contain a valid URL satisfying the configured validation rules.

**Successful response — `200 OK`**

```json
{
  "status": "ok",
  "short": "a1B2c3D4"
}
```

The `short` property contains the eight-character slug. The complete short URL is constructed by appending that slug to the deployed Worker base URL.

**Relevant error responses**

| Status | Meaning |
|---|---|
| `400 Bad Request` | Invalid request, malformed URL, or unsupported source URL |
| `403 Forbidden` | Request origin is not allowed |
| `413 Content Too Large` | Submitted URL exceeds the size limit |
| `429 Too Many Requests` | Rate limit exceeded |
| `500 Internal Server Error` | Database operation failed |

### Follow a short link

`GET /{slug}`

Redirects to the original URL associated with the supplied slug.

For example:

```http
GET https://list.fatego.workers.dev/a1B2c3D4
```

A successful lookup returns `302 Found` with a `Location` header containing the original URL.

An unknown slug returns `404 Not Found`. Slugs must contain exactly eight characters from this alphabet:

```text
0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ
```

### Health check

`GET /api/health`

Returns a JSON response containing the request status and URL information. This endpoint is useful for checking that the Worker is responding; it does not perform a full database health check.

## URL validation

The service is intentionally designed for FGO Checklist rather than as a general-purpose URL shortener.

By default, a submitted URL must satisfy all of the following:

- Use HTTPS.
- Match the configured hostname.
- Match the configured pathname exactly.
- Include the `pak` query parameter.
- Contain no username, password, or explicit port.
- Use only the supported query parameters: `pak`, `fast`, `NA`, and `classlist`.
- Fit within the configured 64 KiB URL limit.

The expected production hostname and path are `tohnocoding.github.io` and `/fgochecklist/`, respectively. These restrictions can be changed through the Worker configuration.

## Database

The service uses a D1 table named `links`.

| Column | Type | Purpose |
|---|---|---|
| `slug` | `TEXT` | Primary key containing the generated short slug |
| `long_url` | `TEXT` | Original URL; unique to avoid duplicate mappings |
| `created_at` | `TEXT` | Timestamp populated automatically when a record is created |

The initial schema is defined in `migrations/0001_create_links_table.sql` (or the corresponding location in your project).

The Worker uses parameterized SQL statements for database operations. If a generated slug collides with an existing primary key, it retries with another slug. If the submitted URL already exists, it returns the existing slug.

## Configuration

The Worker is configured through `wrangler.jsonc`.

### D1 binding

The `DB` binding connects the application to the configured D1 database. The configuration includes a local-development database binding and a production environment with its own database ID.

When deploying your own instance, create a D1 database and replace the example database IDs with the IDs returned by Cloudflare.

### Environment variables

The Worker uses these variables:

| Variable | Purpose | Example |
|---|---|---|
| `ALLOWED_ORIGIN` | Browser origin permitted to create links | `https://tohnocoding.github.io` |
| `ALLOWED_HOSTNAME` | Hostname accepted in submitted URLs | `tohnocoding.github.io` |
| `ALLOWED_PATHNAME` | Exact path accepted in submitted URLs | `/fgochecklist/` |

These values are configured under the appropriate Wrangler environment's `vars` section. Keep local and production configuration consistent with the instance you intend to test or deploy.

### Rate limiting

The production configuration defines a `CREATE_RATE_LIMITER` binding with a limit of **5 requests per 60 seconds**, keyed by the client's IP address.

When the limit is exceeded, the API returns `429 Too Many Requests` and a `Retry-After` header.

## Getting started

### Prerequisites

You'll need:

- [Node.js and npm](https://nodejs.org/)
- A [Cloudflare account](https://dash.cloudflare.com/)
- A Cloudflare D1 database for your instance
- Wrangler, available through the project's dependencies or via `npx`

### 1. Clone the repository

```bash
git clone https://github.com/TohnoCoding/fgo-shortener.git
cd fgo-shortener
npm install
```

### 2. Configure Wrangler

Review `wrangler.jsonc` and configure the D1 database binding and environment variables for your instance.

For a separate production deployment, configure the production environment with the database ID and rate-limit binding belonging to that deployment.

### 3. Apply database migrations

For the local development database:

```bash
npx wrangler d1 migrations apply fgo-shortener-db --local
```

For the production database:

```bash
npx wrangler d1 migrations apply fgo-shortener-db --remote --env production
```

Replace `fgo-shortener-db` if you use a different database name. Apply migrations to the intended database before using the service.

### 4. Run locally

```bash
npx wrangler dev
```

Wrangler starts a local development server and reports its address in the terminal.

Local development requires the bindings and variables used by the application to be available in that environment. The production rate-limit binding is configured separately, so make sure your local setup accounts for that binding before testing the link-creation endpoint.

### 5. Deploy

Deploy the production environment with:

```bash
npx wrangler deploy --env production
```

Wrangler will report the deployed Worker URL and its configured bindings. Use the reported URL as the base URL for your instance.

## Security considerations

- **CORS is not authentication.** Restricting the allowed origin prevents ordinary browser pages on other origins from reading permitted cross-origin responses, but it does not prevent scripts or non-browser clients from sending requests directly to the API.
- **URL validation is an application constraint.** The service checks that submitted links match the expected FGO Checklist URL structure; it is not intended to accept arbitrary destinations.
- **Rate limiting reduces abuse but does not eliminate it.** Review the limit and other Cloudflare controls if usage grows.
- **Protect your Cloudflare credentials.** Do not commit API tokens, account credentials, or other secrets. Use Cloudflare's supported secret-management mechanisms for any future secret configuration.
- **Review resource usage.** Publicly deployed Workers and D1 databases are subject to Cloudflare's applicable limits, quotas, and pricing.

## Contributing

Contributions, bug reports, and suggestions are welcome. Please keep the service's FGO Checklist-specific purpose and URL validation requirements in mind when proposing changes.

## License

This project is licensed under the MIT License. See [`LICENSE`](LICENSE) for the full license text.