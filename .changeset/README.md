# Changesets

When your pull request should trigger a release (user-visible change), add a changeset before merging:

```bash
npx changeset
```

Commit the generated file under `.changeset/` with your PR. After merge to `main`, automation opens a **Version packages** pull request; when that PR lands, a GitHub Release is created and npm publish runs.

Use `patch` for fixes, `minor` for backwards-compatible features, `major` for breaking changes.
