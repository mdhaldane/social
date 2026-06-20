# Context: Eleventy IndieWeb Microblog Setup

You are an expert developer specializing in static site generators, open-web protocols, and minimalist terminal aesthetics. Your task is to help me build a self-hosted, decentralized microblog using Eleventy (11ty), Liquid templating, and the Webmention protocol.

## System Architecture & Constraints
1. **Hosting Environment:** GitHub Pages running as a Project Page (subdirectory).
2. **Path Prefix:** Every internal URL, asset link, and feed path must use the prefix `/microblog/` to prevent broken links on GitHub Pages.
3. **Template Engine:** Liquid (to match standard Jekyll syntax and facilitate easy theme porting).
4. **Data Preservation:** Micro-notes must remain pure markdown. Metadata (timestamps, microformats) must be handled entirely by layout files.
5. **IndieWeb Pipeline:** Two-way social interactions powered via Webmention.io and Bridgy.

---

## Phase 1: Local Environment & Scaffolding
Generate the commands and files required to initialize the project directory.

### Tasks for Gemini:
* Create a shell script to automate the creation of the following file structure:
  ├── .eleventy.js
  ├── .gitignore
  ├── package.json
  └── src/
      ├── _data/
      │   └── webmentions.js (For build-time API fetching)
      ├── _includes/
      │   ├── base.liquid
      │   └── micro.liquid
      ├── css/
      │   └── style.css
      ├── index.liquid (The continuous home feed)
      └── posts/ (Where markdown notes live)
* Configure `.gitignore` to strictly exclude `node_modules/`, `_site/`, and any local `.env` configuration files.

---

## Phase 2: Configuration & Layout Porting
Write the core JavaScript and HTML layouts.

### Tasks for Gemini:
* **`.eleventy.js` Configuration:** 
  * Configure `markdownTemplateEngine`, `htmlTemplateEngine`, and `dataTemplateEngine` to use `"liquid"`.
  * Set `pathPrefix` to `"/microblog/"`.
  * Enable passthrough file copy for `src/css/`.
  * Create a custom Liquid filter called `dateToISO` to format raw frontmatter dates into valid ISO 8601 strings for microformats (`YYYY-MM-DDTHH:mm:ssZ`).
* **`base.liquid` Layout:**
  * Build the HTML skeleton incorporating a dark-mode, terminal-inspired CSS structure.
  * Embed Webmention identity plumbing in the `<head>`:
    ```html
    <link rel="webmention" href="[https://webmention.io/YOUR_DOMAIN/webmention](https://webmention.io/YOUR_DOMAIN/webmention)" />
    <link rel="pingback" href="[https://webmention.io/YOUR_DOMAIN/xmlrpc](https://webmention.io/YOUR_DOMAIN/xmlrpc)" />
    <link rel="me" href="[https://github.com/YOUR_GITHUB_USERNAME](https://github.com/YOUR_GITHUB_USERNAME)" />
    ```
* **`micro.liquid` Layout:**
* Build a layout that chains into `base.liquid`.
* Wrap the content block strictly in the `h-entry` Microformat spec:

```html
<article class="h-entry">
  <div class="e-content">{{ content }}</div>
  <a href="{{ page.url | url }}" class="u-url">
    <time class="dt-published" datetime="{{ page.date | dateToISO }}">{{ page.date | date: "%b %d, %Y @ %H:%M" }}</time>
  </a>
</article>
```

---

## Phase 3: The Build-Time Webmention Loop
Instead of running client-side JavaScript to load replies, write a script that fetches data from Webmention.io during compilation so interactions are saved directly into the static build.

### Tasks for Gemini:
* Write `src/_data/webmentions.js`. This script must:
  1. Read a `WEBMENTION_IO_TOKEN` variable (for authentication).
  2. Query the Webmention.io API endpoint (`https://webmention.io/api/mentions.jf2?domain=YOUR_DOMAIN&token=TOKEN`).
  3. Filter the incoming JSON results by URL matching so each post only loads its respective likes and replies.
  4. Return a clean, structural JavaScript object that Eleventy templates can iterate through globally.
* Update `micro.liquid` to look for matching URLs in the fetched webmention object and append them as comments at the bottom of the article block.

---

## Phase 4: CI/CD Pipeline via GitHub Actions
Automate the compilation and delivery process.

### Tasks for Gemini:
* Write a `.github/workflows/deploy.yml` pipeline that:
  1. Triggers on pushes to the default branch.
  2. Sets up Node.js.
  3. Installs dependencies and runs `npx @11ty/eleventy` using the `--pathprefix=/microblog/` execution flag.
  4. Automatically deploys the resulting `_site/` build artifact directly to GitHub Pages.

---

## Next Action Item
Please respond by providing the complete code implementations for **Phase 1** and **Phase 2** based on these constraints.