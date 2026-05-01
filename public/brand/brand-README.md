# Brand Assets

Drop your files here and they'll be picked up automatically by the site. **No code changes needed.**

## Files

### `logo.svg` — Main logo
Used everywhere `<CHALogo />` is rendered: navigation, login page, hero, footer, applicant pages, admin dashboard.

**Specs:**
- Format: **SVG** (preferred, scales crisply at all sizes)
- Aspect ratio: **square or near-square** (will be displayed in square containers from 24px to 380px)
- Background: **transparent**
- File size: under 50KB
- If you only have PNG: name it `logo.svg` won't work — instead, edit `components/common/CHALogo.tsx` and change `LOGO_PATH` from `/brand/logo.svg` to `/brand/logo.png`

**Fallback:** if file missing or fails to load, the inline 4-heart SVG kicks in automatically — site never breaks.

### `favicon.ico` — Browser tab icon
Classic format, displayed in browser tabs and bookmarks.

**Specs:**
- Format: ICO (multi-resolution preferred: 16×16, 32×32, 48×48 in one file)
- Background: solid color (transparency renders inconsistently across browsers)

If you only have a PNG, you can convert it at [favicon.io](https://favicon.io/favicon-converter/) or [realfavicongenerator.net](https://realfavicongenerator.net/).

### `icon.svg` — Modern browser icon
Used by Chrome/Firefox/Safari for high-resolution rendering. Same shape as favicon but as SVG.

**Specs:**
- Format: SVG
- Square aspect ratio
- Solid colored background recommended

### `apple-touch-icon.png` — iOS home screen icon
Used when someone adds the site to their iPhone home screen.

**Specs:**
- Format: PNG
- Size: **180×180 pixels exactly**
- Background: solid color (no transparency — iOS adds rounded corners automatically)

## Suggested workflow

If you have one master logo file (SVG):

1. Save it as `logo.svg` in this folder
2. Convert to favicon at [realfavicongenerator.net](https://realfavicongenerator.net/) — upload SVG, download bundle
3. From the bundle: keep `favicon.ico`, `apple-touch-icon.png`, and rename `favicon.svg` to `icon.svg`
4. Drop all 4 files in this folder
5. Commit + push → done

After deploy, browsers may take a few hours to refresh cached favicons. Hard refresh (Ctrl+Shift+R) usually does the trick.
