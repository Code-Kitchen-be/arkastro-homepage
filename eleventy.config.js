module.exports = function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy('assets');
  eleventyConfig.addPassthroughCopy('main.js');
  eleventyConfig.addPassthroughCopy('CNAME');
  eleventyConfig.addPassthroughCopy('styles.css');

  // Build-time year for the footer; main.js also refreshes it in the browser
  // so a quiet New Year never leaves a stale copyright on the live site.
  eleventyConfig.addGlobalData('currentYear', () => new Date().getFullYear());

  eleventyConfig.setServerOptions({
    watch: ['styles.css'],
  });

  return {
    dir: {
      input: 'src/pages',
      includes: '../_includes',
      layouts: '../_layouts',
      data: '../_data',
      output: '_site',
    },
    htmlTemplateEngine: 'njk',
    markdownTemplateEngine: 'njk',
    dataTemplateEngine: 'njk',
    templateFormats: ['njk', 'html', 'md'],
  };
};
