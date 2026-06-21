const fs = require('fs');
const path = require('path');

const ARCHIVE_PATH = path.join(__dirname, '../src/_data/archive.json');

// DIDs for Bluesky
const BLUESKY_DIDS = [
  'did:plc:dhqhylu42opraylmcwlkunvj',
  'did:plc:j2p5gvo2hg7fxtnypmwqaq7h'
];

// Mastodon username and instance
const MASTODON_ACCT = 'mdhaldane';
const MASTODON_INSTANCE = 'mastodon.social';

async function fetchBluesky(did) {
  try {
    const url = `https://public.api.bsky.app/xrpc/app.bsky.feed.getAuthorFeed?actor=${did}&filter=posts_no_replies`;
    console.log(`Fetching Bluesky feed for ${did}...`);
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Failed to fetch Bluesky feed for ${did}: ${res.statusText}`);
    }
    const data = await res.json();
    const posts = [];

    if (data.feed) {
      for (const item of data.feed) {
        // Skip if it's a repost (reason is app.bsky.feed.defs#reasonRepost)
        if (item.reason && item.reason.$type === 'app.bsky.feed.defs#reasonRepost') {
          continue;
        }

        const post = item.post;
        if (!post) continue;

        const postId = post.uri.split('/').pop();
        const postUrl = `https://bsky.app/profile/${post.author.handle}/post/${postId}`;
        const date = post.indexedAt;
        let content = post.record ? post.record.text : '';

        // Extract external links / embeds (like YouTube card embeds)
        let external = null;
        if (post.embed) {
          if (post.embed.$type === 'app.bsky.embed.external#view' && post.embed.external) {
            external = post.embed.external;
          } else if (post.embed.$type === 'app.bsky.embed.recordWithMedia#view' && post.embed.media) {
            if (post.embed.media.$type === 'app.bsky.embed.external#view' && post.embed.media.external) {
              external = post.embed.media.external;
            }
          }
        }

        if (external && external.uri) {
          const hasLink = content.includes(external.uri);
          if (!hasLink) {
            content += (content ? '\n\n' : '') + external.uri;
          }
        }

        // Extract images
        const images = [];
        if (post.embed) {
          let embedImgs = [];
          if (post.embed.$type === 'app.bsky.embed.images#view') {
            embedImgs = post.embed.images || [];
          } else if (post.embed.$type === 'app.bsky.embed.recordWithMedia#view' && post.embed.media) {
            embedImgs = post.embed.media.images || [];
          }

          for (const img of embedImgs) {
            images.push({
              url: img.fullsize || img.thumb,
              alt: img.alt || ''
            });
          }
        }

        posts.push({
          id: `bsky-${post.cid}`,
          type: 'remote',
          source: 'Bluesky',
          url: postUrl,
          date: date,
          content: content,
          images: images,
          external: external ? {
            uri: external.uri,
            title: external.title || '',
            description: external.description || '',
            thumb: external.thumb || ''
          } : null
        });
      }
    }
    return posts;
  } catch (error) {
    console.error(`Error fetching Bluesky for ${did}:`, error);
    return [];
  }
}

async function fetchMastodon() {
  try {
    console.log(`Looking up Mastodon account ID for ${MASTODON_ACCT}...`);
    const lookupUrl = `https://${MASTODON_INSTANCE}/api/v1/accounts/lookup?acct=${MASTODON_ACCT}`;
    const lookupRes = await fetch(lookupUrl);
    if (!lookupRes.ok) {
      throw new Error(`Failed to look up Mastodon account: ${lookupRes.statusText}`);
    }
    const account = await lookupRes.json();
    const accountId = account.id;

    console.log(`Fetching Mastodon statuses for account ID ${accountId}...`);
    const statusesUrl = `https://${MASTODON_INSTANCE}/api/v1/accounts/${accountId}/statuses`;
    const statusesRes = await fetch(statusesUrl);
    if (!statusesRes.ok) {
      throw new Error(`Failed to fetch Mastodon statuses: ${statusesRes.statusText}`);
    }
    const statuses = await statusesRes.json();
    const posts = [];

    for (const status of statuses) {
      let targetStatus = status;
      let isReblog = false;
      if (status.reblog) {
        targetStatus = status.reblog;
        isReblog = true;
      }

      const date = status.created_at;
      let content = targetStatus.content; // HTML string
      const postUrl = targetStatus.url;

      if (isReblog) {
        // Prepend a line indicating this was a boosted post
        content = `<div class="boost-header" style="color: #8c8578; font-size: 0.8rem; margin-bottom: 8px;">Boosted @${targetStatus.account.acct}</div>` + content;
      }

      // Extract images
      const images = [];
      if (targetStatus.media_attachments) {
        const mediaImgs = targetStatus.media_attachments.filter(m => m.type === 'image');
        for (const img of mediaImgs) {
          images.push({
            url: img.url,
            alt: img.description || ''
          });
        }
      }

      // Extract external card if present
      let external = null;
      if (targetStatus.card) {
        external = {
          uri: targetStatus.card.url,
          title: targetStatus.card.title || '',
          description: targetStatus.card.description || '',
          thumb: targetStatus.card.image || ''
        };
      }

      posts.push({
        id: `mastodon-${status.id}`,
        type: 'remote',
        source: isReblog ? 'Mastodon (Boost)' : 'Mastodon',
        url: postUrl,
        date: date,
        content: content,
        images: images,
        external: external
      });
    }

    return posts;
  } catch (error) {
    console.error('Error fetching Mastodon:', error);
    return [];
  }
}

function parseMarkdown(md) {
  if (!md) return '';
  let html = md
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Headings
  html = html.replace(/^### (.*?)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.*?)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.*?)$/gm, '<h1>$1</h1>');

  // Bold
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  // Italic
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');

  // Paragraphs
  const paragraphs = html.split(/\r?\n\r?\n/);
  html = paragraphs.map(p => {
    p = p.trim();
    if (!p) return '';
    if (p.startsWith('<h1') || p.startsWith('<h2') || p.startsWith('<h3')) {
      return p;
    }
    return `<p>${p.replace(/\r?\n/g, '<br />')}</p>`;
  }).filter(Boolean).join('\n');

  return html;
}

async function fetchWhiteWind(did) {
  try {
    const handleMap = {
      'did:plc:dhqhylu42opraylmcwlkunvj': 'matthaldane.com',
      'did:plc:j2p5gvo2hg7fxtnypmwqaq7h': 'social.matthaldane.com'
    };
    const handle = handleMap[did] || did;

    const url = `https://bsky.social/xrpc/com.atproto.repo.listRecords?repo=${did}&collection=com.whtwnd.blog.entry`;
    console.log(`Fetching WhiteWind blog entries for ${handle}...`);
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Failed to fetch WhiteWind blog entries for ${handle}: ${res.statusText}`);
    }
    const data = await res.json();
    const posts = [];

    if (data.records) {
      for (const record of data.records) {
        const val = record.value;
        if (!val || !val.content) continue;

        const recordKey = record.uri.split('/').pop();
        const postUrl = `https://whtwnd.com/${handle}/${recordKey}`;
        const date = val.createdAt;

        // Title and content HTML formatting
        const titleHtml = val.title ? `<h2 class="blog-title" style="margin-top: 0; margin-bottom: 12px; color: #D4C5B0; font-size: 1.15rem; font-weight: 600;"><a href="${postUrl}" target="_blank" rel="noopener noreferrer">${val.title}</a></h2>` : '';
        const bodyHtml = parseMarkdown(val.content);
        const contentHtml = titleHtml + bodyHtml;

        const images = [];
        if (val.ogp && val.ogp.url) {
          images.push({
            url: val.ogp.url,
            alt: val.title || 'Blog post image'
          });
        }

        posts.push({
          id: `whtwnd-${record.cid || recordKey}`,
          type: 'remote',
          source: 'WhiteWind',
          url: postUrl,
          date: date,
          content: contentHtml,
          images: images,
          external: null
        });
      }
    }
    return posts;
  } catch (error) {
    console.error(`Error fetching WhiteWind for ${did}:`, error);
    return [];
  }
}

async function fetchBlog() {
  try {
    const url = 'https://matthaldane.com/feed.xml';
    console.log('Fetching blog entries from matthaldane.com...');
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Failed to fetch blog feed: ${res.statusText}`);
    }
    const xml = await res.text();
    const posts = [];
    const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
    let match;

    while ((match = entryRegex.exec(xml)) !== null) {
      const entry = match[1];

      const titleMatch = entry.match(/<title[^>]*>([\s\S]*?)<\/title>/);
      let title = titleMatch ? titleMatch[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/, '$1').trim() : '';
      title = title.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');

      const linkMatch = entry.match(/<link[^>]*href=["']([^"']*)["']/);
      const link = linkMatch ? linkMatch[1] : '';

      const dateMatch = entry.match(/<(?:published|updated)[^>]*>([\s\S]*?)<\/(?:published|updated)>/);
      const date = dateMatch ? dateMatch[1].trim() : '';

      const idMatch = entry.match(/<id>([\s\S]*?)<\/id>/);
      const idVal = idMatch ? idMatch[1].trim() : link;
      const id = 'blog-' + idVal.split('/').filter(Boolean).pop();

      const contentMatch = entry.match(/<content[^>]*>([\s\S]*?)<\/content>/) || entry.match(/<summary[^>]*>([\s\S]*?)<\/summary>/);
      let rawContent = contentMatch ? contentMatch[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/, '$1').trim() : '';

      rawContent = rawContent
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'");

      // Extract images from content block
      const images = [];
      const imgRegex = /<img[^>]+src=["']([^"']*)["'][^>]*alt=["']([^"']*)["']/g;
      let imgMatch;
      while ((imgMatch = imgRegex.exec(rawContent)) !== null) {
        let imgSrc = imgMatch[1];
        if (imgSrc.startsWith('/')) {
          imgSrc = 'https://matthaldane.com' + imgSrc;
        }
        images.push({
          url: imgSrc,
          alt: imgMatch[2] || ''
        });
      }

      // Strip tags for excerpt
      let excerpt = rawContent
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      if (excerpt.length > 280) {
        excerpt = excerpt.substring(0, 277) + '...';
      }

      // Format blog post html layout
      const contentHtml = `
        <h2 class="blog-title" style="margin-top: 0; margin-bottom: 8px; font-size: 1.15rem; font-weight: 600;"><a href="${link}" target="_blank" rel="noopener noreferrer">${title}</a></h2>
        <p>${excerpt}</p>
        <p style="margin-top: 12px; margin-bottom: 0; font-size: 0.85rem;"><a href="${link}" target="_blank" rel="noopener noreferrer" style="color: #D4C5B0; text-decoration: none;">Read full post →</a></p>
      `;

      posts.push({
        id: id,
        type: 'remote',
        source: 'Blog',
        url: link,
        date: date,
        content: contentHtml,
        images: images,
        external: null
      });
    }

    return posts;
  } catch (error) {
    console.error('Error fetching blog feed:', error);
    return [];
  }
}

async function main() {
  // Load existing archive
  let archive = [];
  try {
    if (fs.existsSync(ARCHIVE_PATH)) {
      const fileContent = fs.readFileSync(ARCHIVE_PATH, 'utf8');
      archive = JSON.parse(fileContent);
    }
  } catch (e) {
    console.error('Error reading archive.json:', e);
  }

  // Fetch from all sources
  const fetchPromises = [
    ...BLUESKY_DIDS.map(did => fetchBluesky(did)),
    ...BLUESKY_DIDS.map(did => fetchWhiteWind(did)),
    fetchBlog(),
    fetchMastodon()
  ];

  const results = await Promise.all(fetchPromises);
  const fetchedPosts = results.flat();

  // Merge into archive (overwrite existing IDs, add new ones)
  const archiveMap = new Map(archive.map(p => [p.id, p]));
  for (const post of fetchedPosts) {
    archiveMap.set(post.id, post); // Overwrites edits or inserts new posts
  }

  // Convert map back to array and sort descending by date
  const mergedArchive = Array.from(archiveMap.values());
  mergedArchive.sort((a, b) => new Date(b.date) - new Date(a.date));

  // Ensure directories exist
  const dir = path.dirname(ARCHIVE_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // Write back to archive.json
  fs.writeFileSync(ARCHIVE_PATH, JSON.stringify(mergedArchive, null, 2), 'utf8');
  console.log(`Successfully archived ${mergedArchive.length} posts.`);
}

main();
