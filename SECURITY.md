# Security Policy

yoAnime extensions run inside a permissioned SDK model. Public extensions should not depend on raw PowerPoint COM objects, native handles, filesystem internals, or private IPC routes.

## Reporting Issues

For security-sensitive issues, please do not open a public issue with exploit details. Contact the maintainer privately first.

## Extension Safety Principles

- Request only the permissions your extension needs.
- Treat local HTML and remote content as untrusted unless you own it.
- Do not attempt to bypass the SDK permission gateway.
- Do not store secrets in extension packages.
- Prefer `timeline.bake()` for animation mutation.

