const fs = require("fs");
const path = require("path");
require('dotenv').config();

module.exports = function(eleventyConfig) {
  // Passthrough copy for CSS and Images
  eleventyConfig.addPassthroughCopy("src/css");
  eleventyConfig.addPassthroughCopy("src/images");

  // Date formatting filter
  eleventyConfig.addFilter("dateToISO", function(dateVal) {
    if (!dateVal) return "";
    let date;
    if (dateVal === "now") {
      date = new Date();
    } else {
      date = new Date(dateVal);
    }
    if (isNaN(date.getTime())) {
      console.warn(`Invalid date value parsed in dateToISO filter: ${dateVal}`);
      return new Date().toISOString();
    }
    return date.toISOString();
  });

  // Custom unified collection
  eleventyConfig.addCollection("unifiedFeed", function(collectionApi) {
    // 1. Fetch local markdown posts
    const localPosts = collectionApi.getFilteredByGlob("src/posts/*.md");
    
    // 2. Map local posts to the unified schema
    const mappedLocal = localPosts.map(post => ({
      id: `local-${post.fileSlug}`,
      type: 'local',
      source: 'social.matthaldane.com',
      url: post.url,
      date: post.date,
      get content() {
        return post.templateContent;
      },
      images: []
    }));

    // 3. Load remote archive.json
    const archivePath = path.join(__dirname, "src/_data/archive.json");
    let remotePosts = [];
    if (fs.existsSync(archivePath)) {
      try {
        remotePosts = JSON.parse(fs.readFileSync(archivePath, "utf8"));
      } catch (err) {
        console.error("Error reading archive.json in .eleventy.js:", err);
      }
    }

    // 4. Combine and sort descending by date
    const combined = [...mappedLocal, ...remotePosts];
    combined.sort((a, b) => new Date(b.date) - new Date(a.date));

    return combined;
  });

  return {
    markdownTemplateEngine: "liquid",
    htmlTemplateEngine: "liquid",
    dataTemplateEngine: "liquid",
    dir: {
      input: "src",
      output: "_site",
      includes: "_includes"
    }
  };
};
