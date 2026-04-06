const axios = require('axios');
const cheerio = require('cheerio');
// Note: puppeteer is loaded lazily inside runLighthouseAudit to avoid failing
// module load when Puppeteer isn't installed (optional cleanup step may remove it).

// Verify website structure and content
exports.verifyWebsite = async (url) => {
  try {
    // Normalize URL
    if (!url.startsWith('http')) {
      url = 'https://' + url;
    }

    // Fetch website HTML
    const response = await axios.get(url, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ProfileBrandingBot/1.0)'
      }
    });

    const html = response.data;
    const $ = cheerio.load(html);

    // Check for key pages
    const verification = {
      hasAboutPage: false,
      hasPortfolio: false,
      hasBlog: false,
      hasContactPage: false,
      blogPostCount: 0
    };

    // Check navigation links
    const links = [];
    $('a').each((i, element) => {
      const href = $(element).attr('href');
      const text = $(element).text().toLowerCase().trim();
      if (href) {
        links.push({ href, text });
      }
    });

    // Detect About page
    verification.hasAboutPage = links.some(link => 
      link.text.includes('about') || 
      link.href.includes('about') ||
      link.href.includes('/me')
    );

    // Detect Portfolio page
    verification.hasPortfolio = links.some(link =>
      link.text.includes('portfolio') ||
      link.text.includes('projects') ||
      link.text.includes('work') ||
      link.href.includes('portfolio') ||
      link.href.includes('projects')
    );

    // Detect Blog
    verification.hasBlog = links.some(link =>
      link.text.includes('blog') ||
      link.text.includes('articles') ||
      link.href.includes('blog') ||
      link.href.includes('articles')
    );

    // Detect Contact page
    verification.hasContactPage = links.some(link =>
      link.text.includes('contact') ||
      link.href.includes('contact')
    ) || $('form').length > 0;

    // Count blog posts (if blog page detected)
    if (verification.hasBlog) {
      try {
        const blogUrl = links.find(link => 
          link.href.includes('blog') || link.href.includes('articles')
        )?.href;
        
        if (blogUrl) {
          const fullBlogUrl = new URL(blogUrl, url).href;
          const blogResponse = await axios.get(fullBlogUrl, { timeout: 10000 });
          const $blog = cheerio.load(blogResponse.data);
          
          // Count articles (common selectors)
          verification.blogPostCount = Math.max(
            $blog('article').length,
            $blog('.post').length,
            $blog('.blog-post').length
          );
        }
      } catch (err) {
        console.log('Could not fetch blog page:', err.message);
      }
    }

    return verification;
  } catch (error) {
    console.error('Website verification error:', error);
    throw new Error('Failed to verify website');
  }
};

// Run Lighthouse audit (optional, requires more setup)
exports.runLighthouseAudit = async (url) => {
  try {
    let puppeteer;
    try {
      puppeteer = require('puppeteer');
    } catch (e) {
      console.warn('puppeteer not available — skipping Lighthouse audit');
      return {
        performance: 0,
        accessibility: 80,
        bestPractices: 80,
        seo: 80
      };
    }

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    // Basic performance check
    const page = await browser.newPage();
    const startTime = Date.now();
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });
    const loadTime = Date.now() - startTime;

    await browser.close();

    // Simplified scores (real Lighthouse would be more comprehensive)
    const performanceScore = Math.max(0, Math.min(100, 100 - (loadTime / 50)));

    return {
      performance: Math.round(performanceScore),
      accessibility: 80, // Default values
      bestPractices: 80,
      seo: 80
    };
  } catch (error) {
    console.error('Lighthouse audit error:', error);
    return {
      performance: 0,
      accessibility: 0,
      bestPractices: 0,
      seo: 0
    };
  }
};