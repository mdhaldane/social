module.exports = function(eleventyConfig) {
  // Passthrough file copy for CSS and images
  eleventyConfig.addPassthroughCopy("src/css");
  eleventyConfig.addPassthroughCopy("src/images");

  // Custom Liquid filter dateToISO
  eleventyConfig.addLiquidFilter("dateToISO", function(dateVal) {
    const date = (dateVal === "now" || !dateVal) ? new Date() : ((dateVal instanceof Date) ? dateVal : new Date(dateVal));
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
