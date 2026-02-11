# Website Audit

Audit performed 2026-02-11. This is the active work list for the site. Fix each
item and commit individually.

Status key: `[ ]` = todo, `[x]` = done

---

## High Priority - Accessibility

- [x] **1. No alt text on homepage project card images**
  `_layouts/home.html` — All project thumbnails in the grid have no `alt`
  attribute. Screen readers skip these entirely.

- [x] **2. No alt text on related project images**
  `_includes/related-projects.html` — Same issue on the related projects widget.

- [x] **3. Generic "Project logo" alt text on all project hero images**
  `_layouts/project.html` — Every project page uses `alt="Project logo"`
  regardless of actual content.

- [x] **4. Theme toggle focus state removed**
  `_sass/minima/dark-mode.scss` — `outline: none` with no replacement. Keyboard
  users can't see when the button is focused. WCAG 2.4.7 failure.

- [x] **5. Hamburger menu has no accessible label**
  `_includes/header.html` — The mobile menu trigger is an SVG icon with no
  `aria-label` or visually hidden text.

- [x] **6. YouTube iframes missing `title` attribute**
  `_includes/video-embed.html` and several older posts. Screen readers can't
  describe the embedded content.

## High Priority - Responsive/Visual

- [x] **7. Non-responsive YouTube iframes in older posts**
  Several posts use hardcoded `width="690" height="390"` without a responsive
  wrapper. Causes horizontal overflow on mobile. Affected: bamboo-lidar-mount,
  bosch-indradrive-cs, cnc-machined-stereo-camera-mount,
  duplicating-keys-from-photographs, barcode-scanner-shopping-list.

- [x] **8. White background on transparent images in dark mode**
  Homepage grid cards with transparent PNG/SVG thumbnails show bright white
  rectangles in dark mode. Hardcoded `background-color: #fff` in
  `.grid-item-image` doesn't adapt.

## Medium Priority - Code Quality

- [x] **9. Duplicated grid card markup in home.html**
  Lines 27-47 vs 57-77 — card HTML is copy-pasted between visible and hidden
  sections. Must update both if markup changes.

- [x] **10. 236 lines of inline `<style>` in about.html**
  Duplicates classes already in `custom-styles.scss`. Makes maintenance harder
  and dark mode overrides unreliable.

- [x] **11. CSS stylesheet both preloaded and loaded**
  `custom-head.html` — `style.css` is both `<link rel="preload">` and
  `<link rel="stylesheet">`. The preload is redundant.

- [x] **12. DNS prefetch for unused Google Fonts**
  `custom-head.html` — `dns-prefetch` for `fonts.googleapis.com` but no Google
  Fonts are loaded. Site uses system fonts.

- [x] **13. Dead code in header.html**
  Lines 4-6 — `default_paths`, `page_paths`, `titles_size` are computed but
  never used since nav links are hardcoded.

- [x] **14. Universal `*` transition rule**
  `dark-mode.scss` — Applies transitions to every element. Performance issues on
  heavy pages and unexpected animations on elements that should change instantly.

- [x] **15. Inline `onclick` handlers**
  `home.html` and `about.html` — JavaScript in HTML attributes rather than event
  listeners.

- [x] **16. notes.html layout has page-level frontmatter**
  Layout file has `title` and `permalink` — acting as a page, creating
  redundancy with `notes.md`.

## Medium Priority - Consistency

- [x] **17. Hardcoded border-radius values remain**
  Despite recent standardisation commit, values remain in `dark-mode.scss`,
  `_layout.scss`, `_base.scss`, and inline styles in `about.html`.

- [x] **18. Inconsistent YouTube embed domains**
  Mix of `youtube.com/embed/` and `youtube-nocookie.com/embed/`. Should
  standardise on the privacy-respecting variant.

- [x] **19. Hardcoded box-shadow values**
  `custom-styles.scss` uses `rgba(0,0,0,...)` instead of the existing
  `var(--color-shadow)`. Shadows too subtle in dark mode.

- [x] **20. Excessive `!important` in dark-mode.scss**
  27 uses, several duplicated across global and `.post-content` scopes.

## Low Priority - SEO/Content

- [x] **21. No OG image for note pages**
  Only the project layout generates `og:image`. Notes shared on social media
  show no preview image.

- [x] **22. Most posts missing `keywords` frontmatter**
  Only 5 of 18 projects have keywords; rest fall back to generic default.

- [x] **23. Most posts missing `modified_date`**
  Only 7 of 27 posts have it. Derive from git history (content changes only,
  not frontmatter-only edits).

- [x] **24. Aluminium foundry post has camera filenames as alt text**
  Values like `IMG_20160828_095713` provide no useful description.

- [x] **25. Hardcoded `<hr>` colour in checkerboard post**
  `style="color: #CCC"` won't adapt to dark mode.

- [x] **26. ~100 checkerboard preview images have no alt text**
  Calibration-checkerboard-collection post.

- [x] **27. Deprecated `frameborder` attribute on iframes**
  Several posts and `about.html`.

- [x] **28. Delete links page**
  `/links/` is unlisted in navigation and scheduled for removal. Delete
  `docs/links.md`.
