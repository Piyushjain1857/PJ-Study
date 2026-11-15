import seoService from './seo.service.js';

class SeoController {
  /**
   * GET /sitemap.xml
   * Streams dynamic XML sitemap of public approved notes.
   */
  getSitemapXml = async (req, res, next) => {
    try {
      const xml = await seoService.generateSitemapXml();
      res.setHeader('Content-Type', 'application/xml; charset=utf-8');
      res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=14400');
      return res.status(200).send(xml);
    } catch (err) {
      return next(err);
    }
  };

  /**
   * GET /robots.txt
   * Returns crawler directives.
   */
  getRobotsTxt = (req, res) => {
    const robots = seoService.generateRobotsTxt();
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    return res.status(200).send(robots);
  };
}

export const seoController = new SeoController();
export default seoController;
