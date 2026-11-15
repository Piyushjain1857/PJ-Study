import { Router } from 'express';
import seoController from './seo.controller.js';

const router = Router();

router.get('/sitemap.xml', seoController.getSitemapXml);
router.get('/robots.txt', seoController.getRobotsTxt);

export default router;
