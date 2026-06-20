module.exports = async function() {
  const domain = "social.matthaldane.com";
  const token = "YOUR_TOKEN"; // Fallback placeholder
  
  // Use environment variable if available, otherwise fallback
  const activeToken = process.env.WEBMENTION_IO_TOKEN || token;
  
  if (activeToken === "YOUR_TOKEN" || !activeToken) {
    console.log("Webmention token not configured. Skipping webmention fetch.");
    return [];
  }

  try {
    const url = `https://webmention.io/api/mentions.jf2?domain=${domain}&token=${activeToken}`;
    console.log(`Fetching webmentions for ${domain}...`);
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Webmention.io API returned status: ${res.status}`);
    }
    const data = await res.json();
    return data.children || [];
  } catch (err) {
    console.error("Error fetching webmentions:", err);
    return [];
  }
};
