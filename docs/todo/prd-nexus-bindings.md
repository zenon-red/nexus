# PRD: Nexus Bindings CI (npm Trusted Publishing via OIDC)

## Context

`probe` is a separate repository and requires generated SpacetimeDB TypeScript bindings from `nexus/stdb`. Today, binding generation depends on local paths and manual steps, which is not reliably reproducible for every developer or CI environment.

This PRD defines an automated, reproducible pipeline in `nexus` that publishes versioned bindings to npm using trusted publishing (GitHub Actions OIDC), so downstream repos (like `probe`) consume bindings as a normal dependency.

## Goals

- Provide deterministic, versioned bindings from `nexus/stdb`.
- Eliminate cross-repo path coupling (`../probe/...`) as a required workflow.
- Publish bindings package to npm without long-lived npm tokens.
- Ensure supply-chain posture with npm trusted publishing + provenance.

## Non-Goals

- Migrating `probe` to consume the package in this PRD (tracked separately).
- Reworking SpacetimeDB schema/reducer design.
- Multi-registry publishing (npm only for now).

## Proposed Artifact

- npm package name: `@zenon-red/nexus-bindings`
- Source of truth: `nexus` repository (`stdb` + generated TS bindings)
- Distribution channel: npm registry (not a separate `nexus-bindings` Git repo)

## User Stories

- As a `probe` developer, I can install a pinned bindings version and build without cloning `nexus`.
- As a `nexus` maintainer, I can publish new bindings from CI after schema/reducer changes.
- As security/compliance, I can verify package provenance and avoid static publish tokens.

## Functional Requirements

1. CI detects binding-relevant changes under `stdb/**` (and binding generation scripts/config).
2. CI generates TypeScript bindings using SpacetimeDB CLI 2.x with `--module-path`.
3. CI stages generated output into a package workspace/folder dedicated to publish.
4. CI publishes to npm using OIDC trusted publishing.
5. CI attaches npm provenance for published artifacts.
6. CI fails if generation is inconsistent or package metadata is invalid.
7. CI supports manual publish (`workflow_dispatch`) for emergency republish.

## Non-Functional Requirements

- Reproducibility: same input commit => same generated package content.
- Security: no npm automation tokens in repo secrets.
- Traceability: package version maps to source commit/tag.
- Maintainability: clear docs for release and rollback.

## High-Level Design

### 1) Package Layout in `nexus`

Add a publishable package directory in this repo, e.g.:

- `bindings/package.json`
- `bindings/README.md`
- `bindings/src/` (generated files copied here during CI or prepublish step)

Package should export generated runtime/types from stable entrypoints.

### 2) Generation Step

Use Spacetime CLI from CI:

- `spacetime generate --lang typescript --module-path ./stdb --out-dir ./bindings/src -y`

Do not require a running DB server or published DB for generation.

### 3) Versioning Strategy

Choose one (decision required during implementation):

- Tag-driven (`vX.Y.Z`) release versions (recommended)
- Or changesets/semantic-release automation

Initial recommendation: tag-driven for simplicity and explicit control.

### 4) Publish Workflow

GitHub Actions in `nexus`:

- Trigger on tags and manual dispatch.
- Set permissions:
  - `id-token: write` (required for OIDC)
  - `contents: read`
- Setup Node + npm modern version (trusted publishing compatible).
- Build/generate/validate package.
- `npm publish --provenance --access public`

### 5) npm Trusted Publisher Configuration

Configure package in npm UI:

- Package: `@zenon-red/nexus-bindings`
- Trusted publisher: GitHub Actions
- Org/repo: `zenon-red/nexus`
- Workflow file: exact workflow filename
- Optional restrictions: branch/tag constraints

## Security Requirements

- No `NPM_TOKEN` for publish path.
- OIDC trust relationship must be configured before first publish.
- Restrict publishing workflow to protected tags and/or environment approvals.
- Enable npm provenance and verify published attestations.

## CI Workflow Requirements (Detailed)

Workflow file (proposed): `.github/workflows/publish-bindings.yml`

Steps:

1. Checkout repository.
2. Install Spacetime CLI 2.x (or use preinstalled, pinned version check).
3. Install Node and npm (trusted publishing-compatible).
4. Generate bindings from `stdb` into package directory.
5. Validate package (`npm pack --dry-run`, typecheck if needed).
6. Publish to npm with provenance.
7. Output published version + package URL.

Failure gates:

- Missing OIDC permission
- Untrusted publisher misconfiguration in npm
- Dirty/unexpected generated outputs
- Version already exists

## Developer Experience

- Local script for previewing package contents before release.
- Clear README in `bindings/` with:
  - install instructions
  - export surface
  - compatibility policy with SpacetimeDB versions

## Migration Plan

Phase 1 (this PRD implementation):

- Add bindings package directory and workflow in `nexus`.
- Publish first package version.

Phase 2 (follow-up):

- Update `probe` to consume `@zenon-red/nexus-bindings`.
- Remove hardcoded output to `probe` from `stdb/scripts/generate.sh` (or make optional only).

## Risks and Mitigations

- Risk: npm trusted publisher misconfigured -> publish fails.
  - Mitigation: dry-run checklist + manual dispatch validation run.
- Risk: accidental breaking binding changes.
  - Mitigation: semver policy + release notes + `probe` compatibility tests.
- Risk: codegen drift due to CLI upgrades.
  - Mitigation: pin Spacetime CLI version in CI.

## Acceptance Criteria

- A protected release workflow in `nexus` publishes `@zenon-red/nexus-bindings` via OIDC.
- No npm publish token is required in GitHub secrets.
- Published package includes generated bindings from current `stdb` schema/reducers.
- A downstream test project can `npm install @zenon-red/nexus-bindings` and typecheck.

## Open Questions

- Final package directory name (`bindings/` vs `packages/nexus-bindings/`)?
- Versioning mechanism (tags vs semantic-release vs changesets)?
- Should publish require GitHub Environment approval in production?
- Should private reducers/tables ever be included in package generation?

## Implementation Checklist

- [ ] Create publishable bindings package directory and metadata.
- [ ] Add generation command wired to `stdb` (`--module-path`).
- [ ] Add `publish-bindings.yml` workflow with `id-token: write`.
- [ ] Configure npm trusted publisher for `zenon-red/nexus` workflow.
- [ ] Publish first release and verify provenance.
- [ ] Document consumption instructions for `probe`.

## References

- npm trusted publishers docs: `https://docs.npmjs.com/trusted-publishers/`
- npm trusted publishing (GitHub changelog GA): `https://github.blog/changelog/2025-07-31-npm-trusted-publishing-with-oidc-is-generally-available/`
- GitHub docs (publishing Node.js packages): `https://docs.github.com/actions/publishing-packages/publishing-nodejs-packages`
