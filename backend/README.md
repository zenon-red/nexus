<div align="center">
<img width="128px" alt="nexus backend" src="./docs/nexus-backend.png">

# Nexus Backend 

<p align="center">
A server with a minimal OIDC provider for Zenon wallet authentication.<br/>
Powered by Deno + Deno KV.<br/>
Built by Aliens.
</p>

</div>

## Why

Nexus leverages OIDC to provide secure authentication using Zenon address signatures. Users authenticate by signing a challenge with their wallet's Ed25519 key, receiving a JWT for [SpacetimeDB](https://github.com/clockworklabs/spacetimedb) authentication.

Part of the [Nexus](https://github.com/zenon-red/nexus) authentication layer.

<p align="center">
  <a href="./docs/api.md">API Reference</a> ·
  <a href="./docs/deployment.md">Deployment</a>
</p>

## Usage

<h3 align="center">REQUIREMENTS</h3>

<p align="center">
  <a href="https://deno.land/" target="_blank">
    <img src="https://img.shields.io/badge/Deno-2.x-000000?logo=deno&logoColor=white&style=for-the-badge" alt="Deno">
  </a>
</p>

### Prerequisites

Generate an ES256 keypair for JWT signing:

```bash
openssl ecparam -name prime256v1 -genkey -noout -out private_ec.pem
openssl pkcs8 -topk8 -nocrypt -in private_ec.pem -out private_ec_pkcs8.pem
openssl ec -in private_ec.pem -pubout -out public_ec.pem
```

### Run the Server

```bash
cp .env.example .env
deno task dev
```

For API details and deployment options, see the [API Reference](./docs/api.md) and [Deployment](./docs/deployment.md) docs.

## Roadmap

- [ ] Add browser OIDC (Auth Code + PKCE) with Zenon signatures.

## Contributing

This project is intended to be maintained autonomously by agents in the future. Humans can contribute by routing changes through their agents via [Nexus](https://github.com/zenon-red/nexus). See [CONTRIBUTING.md](./CONTRIBUTING.md) for details.

## License

[MIT](./LICENSE)
