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
        const content = post.record ? post.record.text : '';

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
          images: images
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
    const statusesUrl = `https://${MASTODON_INSTANCE}/api/v1/accounts/${accountId}/statuses?exclude_replies=true&exclude_reblogs=true`;
    const statusesRes = await fetch(statusesUrl);
    if (!statusesRes.ok) {
      throw new Error(`Failed to fetch Mastodon statuses: ${statusesRes.statusText}`);
    }
    const statuses = await statusesRes.json();
    const posts = [];

    for (const status of statuses) {
      const date = status.created_at;
      const content = status.content; // HTML string
      const postUrl = status.url;

      // Extract images
      const images = [];
      if (status.media_attachments) {
        const mediaImgs = status.media_attachments.filter(m => m.type === 'image');
        for (const img of mediaImgs) {
          images.push({
            url: img.url,
            alt: img.description || ''
          });
        }
      }

      posts.push({
        id: `mastodon-${status.id}`,
        type: 'remote',
        source: 'Mastodon',
        url: postUrl,
        date: date,
        content: content,
        images: images
      });
    }

    return posts;
  } catch (error) {
    console.error('Error fetching Mastodon:', error);
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
