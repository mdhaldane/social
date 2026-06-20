const fs = require('fs');
const path = require('path');

// Try loading dotenv
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
    
    // Group webmentions by target URL
    const mentionsByTarget = {};
    if (data.children && Array.isArray(data.children)) {
      data.children.forEach(mention => {
        const target = mention['wm-target'];
        if (!target) return;
        
        // Normalize the target URL
        let targetUrl = target.trim();
        
        if (!mentionsByTarget[targetUrl]) {
          mentionsByTarget[targetUrl] = [];
        }
        
        // Normalize type
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
