# Context: Eleventy Lifestream & Social Dashboard (Full Build)

You are an expert full-stack developer specializing in static site generators, open-web protocols, and API aggregation. Your task is to build a centralized "IndieWeb" social dashboard from scratch using Eleventy (11ty), Liquid templating, native protocol fetching, and vanilla CSS/JS.

## System Architecture & Constraints
1. **Hosting Environment:** GitHub Pages running on a custom subdomain (`social.matthaldane.com`). All routing is at the root level (no path prefixes).
2. **Data Aggregation Engine:** A pre-build Node.js script must fetch public posts directly from Mastodon (ActivityPub API) and Bluesky (AT Protocol API) and persist them in a local `archive.json` file to ensure historical permanence and capture edits.
3. **Data Sources:** 
   - Local: Markdown files in `src/posts/*.md`.
   - Remote 1: Bluesky (`did:plc:dhqhylu42opraylmcwlkunvj`)
   - Remote 2: Bluesky (`did:plc:j2p5gvo2hg7fxtnypmwqaq7h`)
   - Remote 3: Mastodon (`@mdhaldane` on `mastodon.social`)
4. **IndieWeb Pipeline:** Retain Webmention.io integrations to pull replies/likes for local posts.
5. **Aesthetic & UI:** Terminal-inspired styling. Posts with images must use a dynamic CSS grid (masonry-style based on image count) and utilize the `medium-zoom` library for fluid click-to-zoom capabilities.

---

## Phase 1: Environment & Scaffolding
Initialize the Eleventy project and establish the directory structure.

### Tasks for Antigravity CLI:
* Initialize a Node project and install `@11ty/eleventy` as a dev dependency.
* Create the following directory structure:
  ├── .eleventy.js
  ├── package.json
  ├── scripts/
  │   └── fetch-social.js
  └── src/
      ├── _data/
      │   ├── archive.json (Initialize as `[]`)
      │   └── webmentions.js
      ├── _includes/
      │   ├── base.liquid
      │   └── micro.liquid
      ├── css/
      │   └── style.css
      ├── index.liquid
      └── posts/
* Update `package.json` scripts:
  * `"prebuild": "node scripts/fetch-social.js"`
  * `"build": "eleventy"`
  * `"start": "eleventy --serve"`

---

## Phase 2: The Archiving Engine (Pre-Build Script)
Write `scripts/fetch-social.js` to pull from native APIs, extract text and images, and save them permanently.

### Tasks for Antigravity CLI:
* **The Unified Schema:** Every post must be saved as: `{ id, type: 'remote', source: 'Mastodon'|'Bluesky', url, date, content, images: [{ url, alt }] }`
* **Bluesky Fetch Logic:**
  * Query `https://public.api.bsky.app/xrpc/app.bsky.feed.getAuthorFeed?actor={DID}&filter=posts_no_replies` for both DIDs.
  * Extract text (`item.post.record.text`) and timestamp (`item.post.indexedAt`).
  * Extract images by checking `item.post.embed`. Handle both `app.bsky.embed.images#view` and `app.bsky.embed.recordWithMedia#view`. Map `fullsize` URL and `alt` text.
* **Mastodon Fetch Logic:**
  * Query `https://mastodon.social/api/v1/accounts/lookup?acct=mdhaldane` to get the Account ID, then query `/statuses?exclude_replies=true&exclude_reblogs=true`.
  * Extract text (`status.content`) and timestamp (`status.created_at`).
  * Filter `status.media_attachments` for `type === 'image'` and map `url` and `description` (as alt).
* **Merge & Save:** Combine fetched arrays, load the existing `src/_data/archive.json`, overwrite existing IDs to capture edits, push new IDs, sort descending by `date`, and write back to `archive.json`.

---

## Phase 3: Eleventy Configuration & Data Aggregation
Configure `.eleventy.js` to process Liquid templates and unify the data feeds.

### Tasks for Antigravity CLI:
* Set `markdownTemplateEngine`, `htmlTemplateEngine`, and `dataTemplateEngine` to `"liquid"`.
* Configure directories: `input: "src"`, `output: "_site"`, `includes: "_includes"`.
* Add a `dateToISO` Liquid filter.
* Create a Custom Collection named `unifiedFeed`:
  1. Fetch local markdown posts via `collectionApi.getFilteredByGlob("src/posts/*.md")`.
  2. Map local posts to the unified schema: `{ type: 'local', source: 'social.matthaldane.com', url: post.url, date: post.date, content: post.templateContent, images: [] }`.
  3. Load the global data file `archive.json` (accessible via `collectionsApi.getAll()[0].data.archive` or requiring it directly).
  4. Concatenate local and remote arrays, sort by `date` descending, and return.

---

## Phase 4: CSS Image Grid & Zoom Implementation

Build the responsive UI logic for the dashboard.

### Tasks for Antigravity CLI:

* **In `src/css/style.css`:**
  * Define the terminal-inspired dark theme (monospaced fonts, dark background, stark borders).
  * Build the `.post-media-grid` CSS using CSS Grid. Use `[data-count="1"]` through `[data-count="4"]` attribute selectors to dynamically alter `grid-template-columns` and `max-height` (e.g., 2 items = `1fr 1fr`, 3 items = first item spans 2 rows).
* **In `src/_includes/base.liquid`:**
  * Import `https://cdn.jsdelivr.net/npm/medium-zoom@1.1.0/dist/medium-zoom.min.js`.
  * Initialize the zoomer targeting `[data-zoomable]` with a dark background (`#000000`).

---

## Phase 5: The Dashboard Feed (`index.liquid`)

Render the chronological feed.

### Tasks for Antigravity CLI:

* Loop through `{% for item in collections.unifiedFeed %}`.
* Output the timestamp, source network metadata, and `{{ item.content }}`.
* Conditionally render images:

```html
  {% if item.images and item.images.length > 0 %}
    <div class="post-media-grid" data-count="{{ item.images.length }}">
      {% for img in item.images %}
        <img src="{{ img.url }}" alt="{{ img.alt }}" loading="lazy" data-zoomable />
      {% endfor %}
    </div>
  {% endif %}
```

* Link the timestamp to `{{ item.url }}`.

---

## Phase 6: Webmention Integration (Local Interactivity)

Keep the IndieWeb loop intact for local posts.

### Tasks for Antigravity CLI:

* Write `src/_data/webmentions.js` to fetch from `https://webmention.io/api/mentions.jf2?domain=social.matthaldane.com&token=YOUR_TOKEN` during build.
* In `src/_includes/micro.liquid` (the layout for local posts), write logic to loop through `webmentions` where the mention URL matches `page.url`, rendering them as comments/likes at the bottom of the article.

---

## Next Action Item

Please respond by providing the complete file code for **Phase 2** (`scripts/fetch-social.js`) and **Phase 3** (`.eleventy.js`) to establish the data backbone of this project.
