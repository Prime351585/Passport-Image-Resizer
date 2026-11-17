# resize-it.com — Content & Keyword Plan (Nov 2026)

Prepared 2026-11-17. Data: Google Search Console (`sc-domain:resize-it.com`, 16 months to 2026-11-15) and GA4 (property 488679806, organic/referral only). No Semrush or other volume tool was used, so **search volumes for queries the site does not rank for yet are unverified**. Those items are marked "external demand, unverified".

---

## 0. Read this first: Google non-brand visibility collapsed on 15–16 Aug 2026

The plan's priorities depend on this.

| Period (daily avg) | Impressions/day | Clicks/day | Avg position |
|---|---|---|---|
| 15 Jul – 14 Aug 2026 | ~600–930 | ~6–17 | 12–27 |
| 16 Aug – 15 Nov 2026 | **~7–35** | ~3–10 | 1–20 (brand only) |

The drop happened in one step: 490 impressions on 14 Aug, 230 on 15 Aug, 12 on 16 Aug. It hit every non-brand page at once:

| Page | Jul 2026 impr. @pos | Aug 2026 (mostly 1–15 Aug) | Sep–Nov 2026 |
|---|---|---|---|
| /blogs/3000x3000-image-guide | 8,241 @9 | 4,365 @9 | 9 / 6 / 7 per month, pos 5–38 |
| /passport/peru | 1,350 @11 | 35 @9 | ~0 |
| /passport/morocco | 154 @12 | 161 @14 | 5–9/month |
| /passport/iran | 44 @13 | 124 @10 | ~1 |
| /ar/resize/3000x3000 | 829 @11 | — | — |
| /blogs/screenshot-to-pdf-guide | 2,407 @8 (Apr) | 7 | — (already fading from Jul, pos 63) |

### Diagnosis (updated 2026-11-17 with Search Console indexing data)

- **No manual action** (the user checked in GSC).
- **No Google update explains it.** The August 2026 spam update ran 18–21 Aug, after the drop (Search Status Dashboard incident `LEubPCm2octf2uMqCFKE`), and there was no core update in August.
- **Most likely cause: self-inflicted canonical and URL churn.**
  - Commit `dea79e7` (4 Aug) removed trailing slashes, so every old `/x/` URL now 308s to `/x`.
  - Locale pages declared broken canonicals until `958dfc7` went live on 15 Nov. Example: `/de/resize/instagram-beitrag` declared `/de/bildgroesse-aendern/instagram-beitrag`, which is now a 404.
  - Google spent three months reconciling duplicates and redirects instead of ranking pages.
- **Bing, Yahoo and DuckDuckGo did not collapse** (e.g. ~30 Bing sessions to `/blogs/whatsapp-dp-size-guide` from Aug to Nov), which fits a Google canonicalisation problem rather than a demand change.
- **Pages report:** 724 URLs known, **160 indexed**, 235 in the sitemap.

| Reason | URLs | Content action? |
|---|---|---|
| Duplicate, Google chose different canonical | 258 | No. These are mostly untranslated locale tool pages (`/tr/saturate`, `/hi/compress`, `/ja/resize/3000x3000`) crawled before 15 Nov, plus old `/x/` variants. Now correctly canonicalised; should clear on recrawl. |
| Page with redirect | 121 | No (slash variants). |
| Discovered – not indexed | 82 | Indirectly: the site has to earn crawl budget. |
| Alternate with proper canonical | 68 | No (working as intended). |
| **Crawled – currently not indexed** | **30** | **Yes. This is the quality signal (see below).** |
| 404 | 5 | Check they aren't linked internally. |

**Crawled – currently not indexed** (Google fetched the page and rejected it):
- **Passport:** `/passport/japan`, `portugal`, `netherlands`, `mexico`, `pakistan`, `schengen-area`, `spain`, `sweden`.
  - Mexico and Pakistan got requirements blocks on 9 Nov (`a5b0856`), but Google last crawled Pakistan on 25 Sep, when it was still thin. A reindex request is in progress (user).
  - Japan, Spain, Portugal, Netherlands, Sweden and Schengen are still old-format pages.
- **Blog:** `/blogs/passport-photo-requirements-guide`, `/blogs/twitter-image-size-guide`.
- **Translated presets/tools:** `/fr/resize/miniature-youtube`, `/ja/resize/youtube-thumbnail`, `/ja/resize/facebook-cover`, `/hi/resize/pinterest-pin`, `/pt/resize/postagem-instagram`, `/id/resize/thumbnail-youtube`, `/tr/crop/facebook-kapak`, `/it/ridimensiona-immagine`, `/fr/recadrer-image`, `/de/pdf-komprimieren`.

**Implications for content:**
1. Recovery depends mainly on Google recrawling the fixed canonicals. Content can't speed that up, but **thin pages that Google already rejects pull down the site-level quality signal**, so fixing them now ranks above new pages.
2. Reindex requests are in progress (user) for `/passport/pakistan`, `mexico`, `india`, `peru`, `/blogs/3000x3000-image-guide` and `/compress`. Re-check those in 2–3 weeks before judging the rewritten passport pages.
3. Keep new pages few and strong until the indexed count recovers.

---

## How to read the priorities

**Score = evidence of demand × how close we are to ranking × fit with what the tool actually does.** Items with real GSC history come first. Items with only external demand come after a prerequisite tool change.

| # | Item | Type | New / existing | Evidence | Effort |
|---|---|---|---|---|---|
| 1 | 3000x3000 cluster refresh | Guide + tool preset | Existing | 4.7k impr. @~9 before Aug | M |
| 2 | **Fix passport pages Google rejected:** Spain first, then Netherlands, Japan, Portugal, Sweden, Schengen (rewrite or consolidate) | Country pages | Existing (old pages) | "Crawled – not indexed"; Spain also has Spanish-cluster demand | M each |
| 3 | Spanish passport-size cluster (Chile, Argentina, Venezuela) | Country pages | Existing (old pages) | ~250 impr. @7–12 | M |
| 4 | **Not-indexed blog guides:** twitter-image-size-guide (strengthen), passport-photo-requirements-guide (consolidate or turn into the hub) | Guides | Existing | "Crawled – not indexed"; Twitter guide has 22 GA4 sessions, mostly Bing | S–M |
| 5 | Compress-to-KB tool upgrade, then 20 / 50 / 100 KB pages | Tool + landing pages | Existing /compress + new | External demand, unverified; needs user UX decision | M–L |
| 6 | Exam/government-form photo KB pages (India, Pakistan) | Guide + preset tool | New | External demand + GA4 India growth | L (official sources per form) |
| 7 | Old passport pages: DACH, Bangladesh, Philippines, Turkey | Country pages | Existing | Small GSC + GA4 signals | M each |
| 8 | Screenshot-to-PDF guide | Guide | Existing | 2.5k impr. @8, but questionable queries | S |
| 9 | Bing-proven guides (WhatsApp DP, print sizes) | Guide | Existing | GA4 Bing sessions | S |
| 10 | Not-indexed translated presets/tools | Locale pages | Existing | "Crawled – not indexed" (10 URLs) | Watch only, see §2c |

---

## 1. 3000x3000 cluster — strengthen the page that already earned page-1-adjacent rankings

- **Target queries:** `3000x3000` (946 impr. @9.0), `3000x3000 image` (561 @9.1), `3000x3000 image size` (247 @8.8), `3000 x 3000` (199 @11.9), `3000x3000 pixels` (171 @8.6), `3000x3000 image converter` (93 @14.3), `make image 3000x3000` (59 @10.3), `3000x3000 square jpg format` (105 @7.8), `3000x3000 image resizer` (35 @9.9). Album-art variants: `3000x3000 cover art`, `3000x3000 album cover converter`, `3000x3000 image for spotify converter`. Plus the distributor error message itself: *"cover size does not meet the requirements. the ratio should be 1 x 1 and at least 3000 x 3000 pixels"* (26 @8.7). Facts: `3000x3000 pixels how many megapixels` (@3–5), `3000x3000 pixels print size at 300 dpi` (@3.4).
- **Intent:** mixed. Mostly **transactional** ("make/convert/resize to 3000x3000"), plus informational (what it is, print size, megapixels) and a problem-solving slice (album cover rejected by a distributor).
- **Pages:** existing `/blogs/3000x3000-image-guide` (informational) and `/resize/3000x3000` (tool preset; 21 GA4 sessions, plus Bing/Yahoo). `/ar/resize/3000x3000` had 829 impr. @11 in July.
- **Evidence:** 16-month total 4,714 impr. across `/blogs/3000x3000-image-guide` and its slash variant; 101 GA4 organic sessions, 62 engaged. It ranked @8–10 from Feb to Aug 2026.
- **Why:** this is the only non-brand cluster where the site was on the edge of page 1 with real volume. The query mix is mostly "do it now", so the tool page should be the main answer and the guide should support it.
- **Actions:**
  1. Make `/resize/3000x3000` the transactional landing page. Lead with "Resize any image to 3000×3000 px" and the tool above the fold. Add a short block on fit options (crop vs pad, if the tool supports both — check before writing), output format, and the 9.0 MP / 10×10 in @300 DPI facts.
  2. Narrow the guide to the informational and problem queries, and link to the tool preset in the first screen.
  3. Add an "Album cover rejected: 'ratio should be 1 x 1 and at least 3000 x 3000 pixels'" section. Quote each distributor's requirement **from its own help page with a link** (DistroKid, Spotify for Artists, Apple Music/Podcasts, etc.). The guide already mentions DistroKid and Spotify; verify those claims against current official pages.
  4. Add 4–6 FAQ items that mirror the exact queries: "How many megapixels is 3000x3000?", "What print size is 3000x3000 at 300 DPI?", "How do I make an image 3000x3000 without cropping?" Answer each in the first sentence for AEO and AI-assistant citation.
  5. Do not create more 3000-size pages. Queries like `3000*300`, `300 x 3000` and `3000 x 30` are mostly typos of the same intent.

## 2. Passport pages — which old pages to rewrite first

### 2a. First: old pages Google has already crawled and rejected

Search Console lists these as "Crawled – currently not indexed". They actively hurt the site-level quality signal, so they come before pages that are merely weak.

| Rank | Page | Demand evidence | Recommendation |
|---|---|---|---|
| 1 | **/passport/spain** | 9 impr. @59 (`medidas pasaporte español`), plus the Spanish cluster (generic `medidas foto pasaporte` queries @7–12 rotate across Spanish-language country pages) | **Rewrite now** using official Spanish sources (Policía Nacional / DNIe-pasaporte). Highest demand of the rejected set and the most important page for the Spanish cluster. |
| 2 | **/passport/netherlands** | 4 impr. (`dutch passport photo size`) | Rewrite (Rijksoverheid has a precise official photo matrix). Low demand but cheap to source well. |
| 3 | **/passport/japan** | GA4: 2 Bing sessions; few GSC impressions | Rewrite (Ministry of Foreign Affairs of Japan). Note in-person photo rules for applications made abroad only where official sources say so. |
| 4 | **/passport/portugal** | ~0 | Rewrite only if it can be sourced cleanly (IRN/SEF successor). Otherwise use the decision below. |
| 5 | **/passport/sweden** | ~0 | Sweden takes the photo at the police office, so a "make your photo" page can't honestly promise much. Rewrite it as a short, accurate page ("photo is taken in person; here is what to wear/avoid"), as done for Peru, or use the decision below. |
| 6 | **/passport/schengen-area** | ~0 page-level | Schengen visa photos follow the issuing member state, and ICAO 35×45 mm is the common baseline. Rewrite it as an accurate **Schengen visa photo** explainer linking to the member-state pages, or consolidate. It overlaps Germany, France, Spain and Italy. |

**Decision for the user (site change, not taken here):** for pages with no demand that can't be rewritten soon (Portugal, Sweden, Schengen), the cleaner short-term option is to remove them from the sitemap and mark them `noindex` until rewritten, rather than leave rejected thin pages live. This needs your approval because it changes site files.

**Relation to the India/Pakistan audience:** Pakistan and India already have requirements blocks. Pakistan only needs Google to recrawl it (reindex requested). So the South Asia priority within passport pages is **Bangladesh** (§2b, rank 5). It moves ahead of DACH if India-region growth continues.

### 2b. Then: old pages with ranking evidence

The remaining old pages (no `requirements` block), ranked by 16-month GSC evidence plus GA4 and market fit:

| Rank | Country | GSC 16-mo impr. @pos | Top queries | Why |
|---|---|---|---|---|
| 1 | **Chile** | 35 page-level @16.5. Also shares generic Spanish queries ranking @7–12 (`medidas de foto pasaporte` 24 @7.0, `medida foto pasaporte` 15 @11, `cual es el tamaño pasaporte` 12 @8.8) | `medidas pasaporte chileno` | Spanish passport-size queries were the site's second-best non-brand cluster after 3000x3000. Peru (already rewritten) took most of them; Chile and Argentina also ranked for the same generic queries. |
| 2 | **Argentina** | 20 @11.9 | `medida pasaporte`, `medidas pasaporte argentino` | Same Spanish cluster, already near page 1. |
| 3 | **Venezuela** | 5 @7.8 | `cuanto mide un pasaporte venezolano` @5, `medidas foto carnet venezuela` | Few impressions but positions 5–8; large diaspora searching from abroad. |
| 4 | **Germany** (then **Austria**, **Switzerland**) | 45 @61, 13 @49, 14 @61 | `passbildgröße`, `passbild größe`, `passfoto größe` | One shared DACH query cluster with high-volume German terms. A rewrite with official sources (Bundesdruckerei/BMI, Austrian BMI, Swiss fedpol) is the clearest way to move from @60. |
| 5 | **Bangladesh** | 11 @44, plus `passport size photo dimensions in bangladesh` @8 and `…size in inch bangladesh` @6 in the last 3 months | `bangladesh passport photo size` | One of the few pages with fresh rankings after August; South Asia is the growing audience (GA4: India is #1 organic country with 388 sessions; Pakistan 34, Bangladesh 9 with 590 s avg duration). |
| 6 | **Philippines** | 13 @52 | `passport id size in inches philippines`, `35mm x 45mm` | Large search market; DFA is an official source. |
| 7 | **Turkey** | 8 @48; **GA4: 10 organic sessions to `/passport/turkey`** (more than any other old page) | `50x60 biyometrik fotoğraf`, `pasaport fotoğraf boyutu` | 50×60 mm is unusual, so a precise page can stand out; it already gets clicks. |
| — | ~~Spain~~ | — | — | Moved to §2a rank 1 (Google rejected it). |
| 8 | Malaysia | GA4: 6 sessions (+4 from Bing) | — | Bing traffic already arrives. |

Defer for now: Kuwait (most July/Aug impressions went to the old URL and there is little left), China, Japan, Korea, the Nordics and Schengen. Their GSC evidence is under ~5 impressions.

- **Intent:** informational with a quick conversion ("what size, then make it").
- **Rules, as for the 16 done pages:** every size and rule links to the issuing government page. Where the office takes the photo itself (as Migraciones does for Peru), say so plainly, and position the tool for visa or renewal-by-mail use only where that is accurate.
- **Consider (needs user decision):** a Spanish hub answering `medidas foto pasaporte` / `tamaño foto pasaporte` (most-repeated Spanish queries: 24 @7, 24 @9.9, 19 @46, 16 @8.7) that links to the Peru, Mexico, Colombia, Chile, Argentina, Venezuela and Spain pages. Today Google rotates those generic queries between country pages. A single Spanish hub, under a properly translated `/es/` path, would give that intent one target.

### 2c. Not-indexed blog guides and translated pages

**/blogs/twitter-image-size-guide — strengthen.** It earns traffic outside Google (22 GA4 sessions, mostly Bing; 33 GSC impr. @51 before Aug), so the topic works and the page needs to be better.
- Verify every size against X's current official help-center pages and date-stamp them.
- Answer "what size is an X/Twitter post image" in the first sentence.
- Add a compact table (post, header, profile, card) and a short FAQ.
- Link to the matching resize/crop presets.
- Retarget the title to the "X (Twitter)" wording people now search.

**/blogs/passport-photo-requirements-guide — consolidate.** It overlaps `/passport` and the 16 verified country pages, and has little GSC evidence (10 impr. @62).
- Option A (recommended): 301 it to `/passport`, moving any unique, sourced content into the hub's intro.
- Option B: rewrite it as the general "how passport photo rules work" explainer (ICAO 35×45 mm baseline, head-size ratio, background, glasses) that links to every verified country page. Make sure `/passport` remains the tool page.
- Either option is a site change for the user to approve.

**Translated presets/tools not indexed** (`/fr/resize/miniature-youtube`, `/ja/resize/youtube-thumbnail`, `/ja/resize/facebook-cover`, `/hi/resize/pinterest-pin`, `/pt/resize/postagem-instagram`, `/id/resize/thumbnail-youtube`, `/tr/crop/facebook-kapak`, `/it/ridimensiona-immagine`, `/fr/recadrer-image`, `/de/pdf-komprimieren`):
- Watch only for now. Several were crawled before the 15 Nov canonical fix.
- If they are still "Crawled – not indexed" after a recrawl in Dec–Jan, decide per locale whether to deepen the content or canonicalise to English as done for the untranslated tools. Don't add more locale pages until the indexed count recovers.

## 3. Prerequisite: preset the target size from the page (small)

_Corrected 2026-11-17: an earlier version of this section described `src/components/CompressTool.tsx`, an old component no page used (now deleted). The live compressor is `src/components/CompressToolContainer.tsx`._

What the live compressor already does:
- Target-size mode with quick buttons for **20, 50, 100, 200 and 500 KB**, and any custom value.
- `encodeToTargetSize` (`src/utils/imageOutput.ts`) binary-searches JPEG/WebP quality, then **scales the dimensions down** (×0.8 per pass, up to 12 passes) when quality alone can't reach the target.
- PNG input is converted automatically: to WebP if it has transparency, otherwise to JPEG.
- It never returns a file bigger than the original when the format is unchanged.

The one gap is that **a page can't preset the target**: there is no prop or URL parameter, unlike the resize presets (`/resize/[preset].astro` passes `preset={PRESET_DIMENSIONS[id]}`). Add a `targetKB` prop (start in target mode with that value) before building §4. Showing the final pixel size after compression ("reduced to 600×800 px to fit 20 KB") would also help; that is a UI decision to make with the user.

## 4. "Compress image to N KB" landing pages (after #3)

- **Target queries (external demand, unverified — the site has zero impressions for any KB query in 16 months):** `compress image to 20kb`, `… to 50kb`, `… to 100kb`, `reduce photo size to 50 kb`, `jpg to 20kb`, `photo under 50kb`. Also `200kb` and `10kb` once the 20/50/100 pages show impressions.
- **Intent:** transactional, mobile-heavy, mainly India and Pakistan.
- **Page type:** tool preset landing pages, like `/resize/[preset]`. Suggested `/compress/20kb`, `/compress/50kb`, `/compress/100kb` (follow the existing no-trailing-slash pattern).
- **Evidence:** no GSC rows for KB queries at all, so the site has no presence there. GA4: India is the #1 Google-organic country (388 sessions, 57% engaged) and is growing; Pakistan 34. `/compress` gets ~197 impressions/quarter, all at brand position ~1.5.
- **Why:** this matches the audience that is already growing. The pages are clearly differentiated if each one carries **unique useful content**: what fits in that size (realistic pixel dimensions at reasonable quality, measured with our own tool on sample photos and stated as our test result), typical forms that ask for that limit (with links to the official notices), and failure tips.
- **Quality gate (`seo-programmatic`):** start with **3 pages**. Add more sizes only if the first three earn impressions within 4–6 weeks. No pages per exam × size combination.

## 5. Exam / government-form photo pages (India, Pakistan)

- **Target queries (external demand, unverified):** `photo size for ssc form`, `upsc photo size in kb`, `signature size 10kb to 20kb`, `nadra/fbr photo size`, `passport seva photo size kb`, `photo resize for online form`.
- **Intent:** transactional with a hard constraint (pixels + KB + background).
- **Page type:** one **guide hub** — "Photo and signature size for online application forms (India)" — with a table where each row (form → dimensions → KB range → official notice link) links to the tool preset, plus a few dedicated pages only for the biggest forms.
- **Evidence:** GA4 India growth; existing `/passport/india` and `/passport/pakistan` already have requirements blocks to cross-link.
- **Why and how:** this fits the audience and intent closely, but **each figure must come from the current official notification**, and exam notices change every cycle. The hub needs a "last checked" date per row, so only take it on if someone can maintain it. Needs the target-KB and dimensions combined preset from #3 (resize to W×H, then compress under N KB).

## 6. Screenshot-to-PDF guide — fix cheaply, then deprioritise

- **Queries:** 2,539 impr. @~8.6 (Mar–Jun 2026), almost all quoted, operator-style strings like `"files by google" "print" "save as pdf"` (1,357 @8.9). Natural-language queries (`how to convert a screenshot to pdf`, `how to turn a screenshot into a pdf`) sit at @38–73.
- **Assessment:** quoted multi-phrase queries are typical of SEO tools, scrapers or researchers rather than ordinary users, and they produced 0 clicks. Treat those impressions as low-value. The real opportunity is the natural-language "screenshot to PDF on iPhone/Android/Windows/Mac" queries, where we rank @40–70.
- **Actions (small):**
  1. Confirm the canonical. GSC's 4 Nov crawl still saw `userCanonical` = `…/screenshot-to-pdf-guide.html`; the live page now serves the right canonical. Request reindexing in GSC.
  2. Answer the natural-language query in the first 50 words. Use one H2 per platform with numbered steps, and check each step against the current OS or app (Files by Google, Google Photos, iOS Files/Print, Windows "Microsoft Print to PDF").
  3. Link to the site's own image→PDF tool only if one exists. Today there is `/merge-pdf` and `/compress-pdf` but no image-to-PDF tool, so **do not imply one**. If the user wants this cluster, an "Images to PDF" tool would be the real asset (a product decision).

## 7. Bing-proven guides — small refresh

- `/blogs/whatsapp-dp-size-guide`: 57 organic sessions since May (30 Bing, 12 DuckDuckGo, 6 Yahoo; ~65% engaged). `/blogs/standard-photo-print-sizes`: 36 sessions. `/blogs/twitter-image-size-guide`: 22.
- These pages already satisfy users on Bing, so they are good candidates to rank again on Google once site-level trust recovers. Refresh the dates and verify each platform's current spec against official help pages, add a short FAQ, and link to the matching resize or crop preset.
- Facebook DP queries (`fb dp size` 249 @76, `facebook profile picture size ratio` 209 @70) have demand but we rank poorly. A `facebook-profile-picture-size` guide plus crop preset could follow, using the same pattern and official Meta help-center sources.

---

## Suggested order (revised 2026-11-17)

1. **3000x3000 refresh** (§1): highest proven demand; the guide is indexed and has a reindex request in progress.
2. **Rejected passport pages** (§2a): Spain now, then Netherlands and Japan. Rewrite, consolidate or noindex Portugal, Sweden and Schengen (user decision).
3. **Spanish cluster** (§2b): Chile → Argentina → Venezuela, sharing a cross-linked set with Spain, Peru, Mexico and Colombia.
4. **Not-indexed guides** (§2c): strengthen the Twitter/X guide; consolidate the passport-requirements guide into `/passport`.
5. **`targetKB` preset prop → three KB pages** (§3–4), then measure for 4–6 weeks. The compressor already supports these sizes, so this is small and could move earlier.
6. Then Bangladesh, the DACH trio, Philippines and Turkey (§2b); the exam-form hub (§5); the screenshot-to-PDF and Bing-proven refreshes (§6–7).

Re-check in 2–3 weeks: whether the reindex requests (pakistan, mexico, india, peru, 3000x3000 guide, /compress) are indexed, and whether "Duplicate, Google chose different canonical" is shrinking after the 15 Nov fix.

## Technical follow-ups (not content)

- **BreadcrumbList schema:** URL Inspection shows breadcrumb items as "Unnamed item" (seen on `/passport/peru`). Each `ListItem` is missing `name`, or has it outside `item`. Fix in the schema builder (`src/utils/schemas.ts`, which currently has uncommitted local changes, so coordinate with that work).
- **404s (5):** confirm none are linked from internal pages or the sitemap.
- **Old `/x/` and broken locale canonicals:** no action beyond waiting for recrawl. Optionally resubmit the sitemap index in GSC to prompt it.

## Measurement

- GSC per-page impressions and position, checked monthly. Success for #1 is a return to ≥1,000 impr./month at position ≤10.
- GA4: organic sessions by landing page, excluding direct traffic from China, Singapore and the US (bot traffic).
- KB pages: impressions within 4–6 weeks of indexing decide whether to expand to 10/200 KB.
