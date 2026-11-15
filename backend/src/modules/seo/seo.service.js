import prisma from '../../config/database.js';
import env from '../../config/env.js';

/**
 * Service for technical SEO, dynamic XML sitemaps, and robots directives.
 */
class SeoService {
  /**
   * Generates a valid XML sitemap containing only public, approved indexable resources.
   *
   * @param {string} [overrideBaseUrl]
   * @returns {Promise<string>} Valid XML string
   */
  async generateSitemapXml(overrideBaseUrl) {
    const rawBaseUrl = overrideBaseUrl || env.frontendUrl || 'https://pjstudy.com';
    const baseUrl = rawBaseUrl.replace(/\/+$/, '');

    // Fetch approved, publicly indexable study notes from MySQL
    const approvedNotes = await prisma.note.findMany({
      where: {
        status: { in: ['PUBLISHED', 'APPROVED'] }
      },
      select: {
        id: true,
        slug: true,
        updatedAt: true,
        createdAt: true
      },
      orderBy: {
        updatedAt: 'desc'
      },
      take: 5000 // Bounded, scalable batch ceiling
    });

    const staticRoutes = [
      {
        url: `${baseUrl}/`,
        changefreq: 'daily',
        priority: '1.0',
        lastmod: new Date().toISOString().split('T')[0]
      },
      {
        url: `${baseUrl}/notes/explore`,
        changefreq: 'daily',
        priority: '0.9',
        lastmod: new Date().toISOString().split('T')[0]
      }
    ];

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    // 1. Static Indexable Routes
    for (const route of staticRoutes) {
      xml += '  <url>\n';
      xml += `    <loc>${this.escapeXml(route.url)}</loc>\n`;
      xml += `    <lastmod>${route.lastmod}</lastmod>\n`;
      xml += `    <changefreq>${route.changefreq}</changefreq>\n`;
      xml += `    <priority>${route.priority}</priority>\n`;
      xml += '  </url>\n';
    }

    // 2. Approved Public Notes Detail URLs
    for (const note of approvedNotes) {
      const noteUrl = `${baseUrl}/notes/${note.id}`;
      const lastmod = (note.updatedAt || note.createdAt || new Date())
        .toISOString()
        .split('T')[0];

      xml += '  <url>\n';
      xml += `    <loc>${this.escapeXml(noteUrl)}</loc>\n`;
      xml += `    <lastmod>${lastmod}</lastmod>\n`;
      xml += '    <changefreq>weekly</changefreq>\n';
      xml += '    <priority>0.8</priority>\n';
      xml += '  </url>\n';
    }

    xml += '</urlset>';
    return xml;
  }

  /**
   * Generates dynamic robots.txt pointing to the current environment sitemap.
   *
   * @param {string} [overrideBaseUrl]
   * @returns {string} Plaintext robots directives
   */
  generateRobotsTxt(overrideBaseUrl) {
    const rawBaseUrl = overrideBaseUrl || env.frontendUrl || 'https://pjstudy.com';
    const baseUrl = rawBaseUrl.replace(/\/+$/, '');

    return [
      '# ============================================================================== #',
      '# PJ STUDY ROBOTS CONFIGURATION                                                  #',
      '# ============================================================================== #',
      '',
      'User-agent: *',
      '',
      '# Public Discovery Pages',
      'Allow: /',
      'Allow: /notes',
      'Allow: /notes/explore',
      'Allow: /notes/*',
      '',
      '# Disallow Private & Administrative Workspaces',
      'Disallow: /dashboard',
      'Disallow: /app',
      'Disallow: /profile',
      'Disallow: /notifications',
      'Disallow: /admin',
      'Disallow: /my-notes',
      'Disallow: /notes/new',
      'Disallow: /notes/*/edit',
      'Disallow: /notes/recommended',
      'Disallow: /login',
      'Disallow: /register',
      'Disallow: /verify-email',
      'Disallow: /forgot-password',
      'Disallow: /reset-password',
      'Disallow: /unauthorized',
      'Disallow: /api/',
      '',
      `Sitemap: ${baseUrl}/sitemap.xml`,
      ''
    ].join('\n');
  }

  /**
   * XML character sanitizer.
   *
   * @param {string} str
   * @returns {string}
   */
  escapeXml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
}

export const seoService = new SeoService();
export default seoService;
