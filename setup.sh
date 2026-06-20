#!/bin/bash
# Scaffolding automation script for Eleventy Microblog

echo "============================================="
echo "Initializing Eleventy Microblog Scaffolding"
echo "============================================="

# Create directories
echo "Creating folder structure..."
mkdir -p src/_data src/_includes src/css src/posts .github/workflows

# Write package.json
echo "Writing package.json..."
cat << 'EOF' > package.json
{
  "name": "microblog",
  "version": "1.0.0",
  "description": "IndieWeb Microblog powered by Eleventy (11ty)",
  "main": "index.js",
  "scripts": {
    "build": "eleventy",
    "serve": "eleventy --serve",
    "start": "eleventy --serve"
  },
  "dependencies": {
    "@11ty/eleventy": "^2.0.1"
  },
  "devDependencies": {
    "dotenv": "^16.4.5"
  }
}
EOF

# Write .eleventy.js
echo "Writing .eleventy.js..."
cat << 'EOF' > .eleventy.js
module.exports = function(eleventyConfig) {
  // Passthrough file copy for CSS
  eleventyConfig.addPassthroughCopy("src/css");

  // Custom Liquid filter dateToISO
  eleventyConfig.addLiquidFilter("dateToISO", function(dateVal) {
    const date = (dateVal instanceof Date) ? dateVal : new Date(dateVal);
    if (isNaN(date.getTime())) {
      return dateVal;
    }
    return date.toISOString();
  });

  return {
    markdownTemplateEngine: "liquid",
    htmlTemplateEngine: "liquid",
    dataTemplateEngine: "liquid",
    pathPrefix: "/microblog/",
    dir: {
      input: "src",
      output: "_site"
    }
  };
};
EOF

# Write .gitignore
echo "Writing .gitignore..."
cat << 'EOF' > .gitignore
node_modules/
_site/
.env
.env.local
.env.*.local
.DS_Store
Thumbs.db
EOF

# Write src/css/style.css
echo "Writing src/css/style.css..."
cat << 'EOF' > src/css/style.css
/* --- Google Font import for terminal feel --- */
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@300;400;600&display=swap');

:root {
  --bg-color: #101015;
  --footer-bg-color: #0b0b0f;
  --text-color: #E8E3D3;
  --accent-color: #D4C5B0;
  --hover-color: #dfd4c4;
  --border-color: #1d1d26;
  --meta-color: #8c887e;
  --font-stack: "IBM Plex Mono", "Courier New", Courier, "Lucida Console", Monaco, monospace;
}

* {
  box-sizing: border-box;
}

html, body {
  margin: 0;
  padding: 0;
  background-color: var(--bg-color);
  color: var(--text-color);
  font-family: var(--font-stack);
  font-size: 16px;
  line-height: 1.6;
}

h1, h2, h3, h4, h5, h6 {
  color: var(--accent-color);
  font-family: var(--font-stack);
  font-weight: 600;
  margin-top: 1.5em;
  margin-bottom: 0.5em;
}

h1 {
  font-size: 1.8rem;
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 0.3em;
}

p, li, span, div {
  font-family: var(--font-stack);
}

a {
  color: var(--accent-color);
  text-decoration: none;
  border-bottom: 1px dashed var(--accent-color);
  transition: color 0.2s ease, border-color 0.2s ease;
}

a:hover {
  color: var(--hover-color);
  border-bottom-style: solid;
}

.container {
  max-width: 800px;
  margin: 0 auto;
  padding: 0 1.5rem;
}

header.masthead {
  background-color: var(--bg-color);
  border-bottom: 1px solid var(--border-color);
  padding: 1.5rem 0;
  margin-bottom: 2rem;
}

.masthead-inner {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

.site-title {
  font-size: 1.3rem;
  font-weight: 600;
  color: var(--accent-color) !important;
  border-bottom: none;
}

.masthead__menu {
  display: flex;
  gap: 1.5rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.masthead__menu-item a {
  color: var(--text-color) !important;
  border-bottom: none;
  font-weight: 400;
}

.masthead__menu-item a:hover {
  color: var(--accent-color) !important;
}

.posts-list {
  display: flex;
  flex-direction: column;
  gap: 2.5rem;
}

.h-entry {
  padding: 1.5rem;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transition: transform 0.2s ease, border-color 0.2s ease;
}

.h-entry:hover {
  border-color: var(--accent-color);
}

.e-content {
  margin-bottom: 1rem;
}

.e-content p:last-child {
  margin-bottom: 0;
}

.u-url {
  display: inline-block;
  font-size: 0.85rem;
  color: var(--meta-color);
  border-bottom: none;
}

.u-url:hover {
  color: var(--accent-color);
}

.dt-published {
  font-weight: 300;
}

.webmentions {
  margin-top: 2rem;
  border-top: 1px solid var(--border-color);
  padding-top: 1.5rem;
}

.webmentions h3 {
  font-size: 1.1rem;
  margin-top: 0;
  margin-bottom: 1rem;
}

.webmentions-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.webmention-item {
  display: flex;
  gap: 0.75rem;
  font-size: 0.9rem;
}

.webmention-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 1px solid var(--border-color);
  background-color: var(--footer-bg-color);
}

.webmention-content {
  flex: 1;
}

.webmention-author {
  font-weight: 600;
  color: var(--accent-color);
}

.webmention-meta {
  font-size: 0.8rem;
  color: var(--meta-color);
  margin-left: 0.5rem;
}

.webmention-body {
  margin-top: 0.25rem;
  color: var(--text-color);
}

.site-footer {
  background-color: var(--footer-bg-color);
  border-top: 1px solid var(--border-color);
  color: var(--meta-color);
  padding: 2rem 0;
  margin-top: 4rem;
  font-size: 0.9rem;
  text-align: center;
}

.site-footer a {
  color: var(--meta-color);
}

.site-footer a:hover {
  color: var(--accent-color);
}

@media (max-width: 480px) {
  .masthead-inner {
    flex-direction: column;
    align-items: flex-start;
  }
}
EOF

# Write src/_includes/base.liquid
echo "Writing src/_includes/base.liquid..."
cat << 'EOF' > src/_includes/base.liquid
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ title | default: "Matt Haldane | Microblog" }}</title>
    
    <!-- SEO Meta Tags -->
    <meta name="description" content="Matt Haldane's self-hosted decentralized microblog. Powered by Eleventy and Webmention.">
    <meta name="author" content="Matt Haldane">
    <meta property="og:title" content="{{ title | default: 'Matt Haldane | Microblog' }}">
    <meta property="og:description" content="Matt Haldane's self-hosted decentralized microblog. Powered by Eleventy and Webmention.">
    <meta property="og:type" content="website">
    <meta property="og:url" content="https://matthaldane.com{{ page.url }}">
    
    <!-- CSS and Fonts -->
    <link rel="stylesheet" href="{{ '/css/style.css' | url }}">
    
    <!-- IndieWeb Identity & Webmention Plumbing -->
    <link rel="webmention" href="https://webmention.io/matthaldane.com/webmention" />
    <link rel="pingback" href="https://webmention.io/matthaldane.com/xmlrpc" />
    <link rel="me" href="https://github.com/matthaldane" />
  </head>
  <body>
    <header class="masthead">
      <div class="container masthead-inner">
        <a href="https://matthaldane.com/" class="site-title">Matt Haldane</a>
        <nav>
          <ul class="masthead__menu">
            <li class="masthead__menu-item"><a href="https://matthaldane.com/">Main Site</a></li>
            <li class="masthead__menu-item"><a href="{{ '/' | url }}">Microblog</a></li>
          </ul>
        </nav>
      </div>
    </header>

    <main class="container">
      {{ content }}
    </main>

    <footer class="site-footer">
      <div class="container">
        <p>&copy; {{ "now" | date: "%Y" }} <a href="https://matthaldane.com/">Matt Haldane</a>. Built with <a href="https://11ty.dev/">Eleventy</a> and <a href="https://webmention.io/">Webmention</a>.</p>
      </div>
    </footer>
  </body>
</html>
EOF

# Write src/_includes/micro.liquid
echo "Writing src/_includes/micro.liquid..."
cat << 'EOF' > src/_includes/micro.liquid
---
layout: base.liquid
---
<article class="h-entry">
  <div class="e-content">
    {{ content }}
  </div>
  <a href="{{ page.url | url }}" class="u-url">
    <time class="dt-published" datetime="{{ page.date | dateToISO }}">{{ page.date | date: "%b %d, %Y @ %H:%M" }}</time>
  </a>

  <!-- Webmentions Section -->
  {%- assign postUrlWithPrefix = page.url | url -%}
  {%- assign postAbsoluteUrl = "https://matthaldane.com" | append: postUrlWithPrefix -%}
  {%- assign postMentions = webmentions[postAbsoluteUrl] -%}

  {%- if postMentions and postMentions.size > 0 -%}
    <div class="webmentions">
      <h3>Interactions</h3>
      <ul class="webmentions-list">
        {%- for mention in postMentions -%}
          <li class="webmention-item">
            {%- if mention.author.photo -%}
              <img class="webmention-avatar" src="{{ mention.author.photo }}" alt="{{ mention.author.name }}" loading="lazy" />
            {%- else -%}
              <img class="webmention-avatar" src="{{ '/css/avatar-placeholder.png' | url }}" alt="Placeholder Avatar" />
            {%- endif -%}
            <div class="webmention-content">
              <div class="webmention-header-info">
                <span class="webmention-author">
                  {%- if mention.author.url -%}
                    <a href="{{ mention.author.url }}" target="_blank" rel="noopener noreferrer">{{ mention.author.name | default: "Anonymous" }}</a>
                  {%- else -%}
                    {{ mention.author.name | default: "Anonymous" }}
                  {%- endif -%}
                </span>
                <span class="webmention-type">
                  {%- if mention.type == "like" -%}
                    liked this post
                  {%- elsif mention.type == "repost" -%}
                    reposted this
                  {%- else -%}
                    replied
                  {%- endif -%}
                </span>
                {%- if mention.published -%}
                  <time class="webmention-meta" datetime="{{ mention.published | dateToISO }}">{{ mention.published | date: "%b %d, %Y" }}</time>
                {%- endif -%}
              </div>
              {%- if mention.content and mention.content.value -%}
                <div class="webmention-body">
                  {{ mention.content.value }}
                </div>
              {%- endif -%}
            </div>
          </li>
        {%- endfor -%}
      </ul>
    </div>
  {%- endif -%}
</article>
EOF

# Write src/index.liquid
echo "Writing src/index.liquid..."
cat << 'EOF' > src/index.liquid
---
layout: base.liquid
title: "Matt Haldane | Microblog"
---
<h1 class="page-title">Micro-Notes</h1>

<div class="posts-list">
  {%- for post in collections.posts reversed -%}
    <article class="h-entry">
      <div class="e-content">
        {{ post.content }}
      </div>
      <a href="{{ post.url | url }}" class="u-url">
        <time class="dt-published" datetime="{{ post.date | dateToISO }}">{{ post.date | date: "%b %d, %Y @ %H:%M" }}</time>
      </a>
    </article>
  {%- else -%}
    <p>No micro-notes published yet.</p>
  {%- endfor -%}
</div>
EOF

# Write src/_data/webmentions.js
echo "Writing src/_data/webmentions.js..."
cat << 'EOF' > src/_data/webmentions.js
const fs = require('fs');
const path = require('path');

try {
  require('dotenv').config();
} catch (e) {
  console.log("dotenv not loaded, reading environment variables directly.");
}

module.exports = async function() {
  const token = process.env.WEBMENTION_IO_TOKEN;
  const domain = 'matthaldane.com';

  if (!token) {
    console.warn("WARNING: WEBMENTION_IO_TOKEN is not set. Webmentions will not be fetched.");
    return {};
  }

  const url = `https://webmention.io/api/mentions.jf2?domain=${domain}&token=${token}&per-page=1000`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Webmention API responded with status ${response.status}`);
    }
    const data = await response.json();
    
    const mentionsByTarget = {};
    if (data.children && Array.isArray(data.children)) {
      data.children.forEach(mention => {
        const target = mention['wm-target'];
        if (!target) return;
        
        let targetUrl = target.trim();
        
        if (!mentionsByTarget[targetUrl]) {
          mentionsByTarget[targetUrl] = [];
        }
        
        let type = 'reply';
        const prop = mention['wm-property'];
        if (prop === 'like-of') {
          type = 'like';
        } else if (prop === 'repost-of') {
          type = 'repost';
        } else if (prop === 'in-reply-to' || prop === 'mention-of') {
          type = 'reply';
        }

        mentionsByTarget[targetUrl].push({
          author: {
            name: mention.author ? mention.author.name : 'Anonymous',
            photo: mention.author ? mention.author.photo : null,
            url: mention.author ? mention.author.url : null
          },
          published: mention.published || mention['wm-received'],
          type: type,
          content: mention.content ? {
            value: mention.content.text || mention.content.html || '',
            html: mention.content.html || ''
          } : null
        });
      });
    }

    console.log(`Successfully fetched and grouped webmentions for ${Object.keys(mentionsByTarget).length} target URLs.`);
    return mentionsByTarget;
  } catch (error) {
    console.error("Error fetching webmentions:", error.message);
    return {};
  }
};
EOF

# Write .github/workflows/deploy.yml
echo "Writing .github/workflows/deploy.yml..."
cat << 'EOF' > .github/workflows/deploy.yml
name: Deploy Eleventy to GitHub Pages

on:
  push:
    branches:
      - main
      - master
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Pages
        uses: actions/configure-pages@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci || npm install

      - name: Build with Eleventy
        run: npx @11ty/eleventy --pathprefix=/microblog/
        env:
          WEBMENTION_IO_TOKEN: ${{ secrets.WEBMENTION_IO_TOKEN }}

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: _site

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
EOF

# Write sample posts
echo "Writing sample posts..."
cat << 'EOF' > src/posts/2026-06-19-hello-world.md
---
layout: micro.liquid
date: 2026-06-19T15:37:48+08:00
tags: posts
title: "Hello World"
---
This is my very first post on my new self-hosted IndieWeb microblog! Testing out the layout, styles, and Webmention loop integration. Minimalist terminal vibes are feeling clean.
EOF

cat << 'EOF' > src/posts/2026-06-19-indieweb-goals.md
---
layout: micro.liquid
date: 2026-06-19T16:15:00+08:00
tags: posts
title: "IndieWeb Goals"
---
Reflecting on the value of owning your own content. No algorithms, no corporate walled gardens. Just simple HTML, CSS, and open web protocols like Webmention and RSS.
EOF

echo "============================================="
echo "Scaffolding Complete!"
echo "Run 'npm install' then 'npm start' to run dev server."
echo "============================================="
