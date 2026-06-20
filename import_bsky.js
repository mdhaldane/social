const fs = require('fs');
const path = require('path');

const SOURCE_FILE = 'C:/Users/matth/.gemini/antigravity-cli/brain/507328db-3a12-460f-bd76-0914b20aa243/.system_generated/steps/97/content.md';
const OUTPUT_DIR = 'src/posts';
const IMAGE_DIR = 'src/images';

// Make sure output directories exist
fs.mkdirSync(OUTPUT_DIR, { recursive: true });
fs.mkdirSync(IMAGE_DIR, { recursive: true });

async function downloadImage(url, destPath) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const buffer = Buffer.from(await res.arrayBuffer());
    fs.writeFileSync(destPath, buffer);
    console.log(`Downloaded image to ${destPath}`);
    return true;
  } catch (err) {
    console.error(`Failed to download image ${url}:`, err.message);
    return false;
  }
}

async function run() {
  if (!fs.existsSync(SOURCE_FILE)) {
    console.error(`Source file not found at ${SOURCE_FILE}`);
    return;
  }

  const content = fs.readFileSync(SOURCE_FILE, 'utf8');
  // Find where the JSON starts
  const jsonStart = content.indexOf('{"feed":');
  if (jsonStart === -1) {
    console.error("JSON not found in content file");
    return;
  }
  const rawJson = content.slice(jsonStart).trim();
  const data = JSON.parse(rawJson);

  console.log(`Processing ${data.feed.length} feed entries...`);

  for (const item of data.feed) {
    const post = item.post;
    if (!post) continue;

    const uri = post.uri;
    const postId = uri.split('/').pop();
    const createdAt = post.record.createdAt;
    const dateObj = new Date(createdAt);
    const dateStr = dateObj.toISOString().split('T')[0];
    const filename = `${dateStr}-${postId}.md`;
    const filepath = path.join(OUTPUT_DIR, filename);

    let text = post.record.text || '';
    let markdownContent = '';

    // Handle images
    const imageRefs = [];
    if (post.embed && post.embed.$type === 'app.bsky.embed.images#view' && post.embed.images) {
      for (let i = 0; i < post.embed.images.length; i++) {
        const img = post.embed.images[i];
        const imageUrl = img.fullsize;
        const extension = imageUrl.includes('png') ? 'png' : 'jpg';
        // Generate a name from image ID or hash
        const imgFilename = `${postId}-img-${i}.${extension}`;
        const imgPath = path.join(IMAGE_DIR, imgFilename);
        
        console.log(`Downloading image: ${imageUrl}`);
        const success = await downloadImage(imageUrl, imgPath);
        if (success) {
          imageRefs.push({
            path: `/microblog/images/${imgFilename}`,
            alt: img.alt || ''
          });
        }
      }
    }

    // Handle external links
    let externalCard = '';
    if (post.embed && post.embed.$type === 'app.bsky.embed.external#view' && post.embed.external) {
      const ext = post.embed.external;
      externalCard = `\n\n> **[${ext.title}](${ext.uri})**\n> ${ext.description || ''}`;
    }

    // Compose markdown frontmatter
    let frontmatter = '---\n';
    frontmatter += `layout: micro.liquid\n`;
    frontmatter += `date: ${createdAt}\n`;
    frontmatter += `tags: posts\n`;
    frontmatter += `title: "Post ${postId}"\n`;
    frontmatter += '---\n';

    // Body content
    let body = text;
    
    // Add images to body
    if (imageRefs.length > 0) {
      body += '\n\n';
      for (const img of imageRefs) {
        body += `![${img.alt}](${img.path})\n`;
      }
    }

    if (externalCard) {
      body += externalCard;
    }

    fs.writeFileSync(filepath, frontmatter + body + '\n');
    console.log(`Wrote post to ${filepath}`);
  }

  console.log("All posts successfully imported.");
}

run();
