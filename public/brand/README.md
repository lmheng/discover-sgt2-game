# Brand assets

Put approved files here. The full list, sizes and usage are in [docs/event/asset-request.md](../../docs/event/asset-request.md).

```
public/brand/
├─ witty/idle.png, celebrate.png, oops.png, thinking.png, wave.png, cheer.png
├─ sgt2-logo-on-dark.svg, sgt2-logo-on-light.svg
├─ icon-together.svg, icon-polyglot.svg, icon-api.svg
└─ discover-2026-lockup.svg   (if approved)
```

After adding a file, set its path in `src/config/brand.ts` (for example `idle: "/brand/witty/idle.png"`) and rebuild. Until then, the game shows labelled placeholders.
