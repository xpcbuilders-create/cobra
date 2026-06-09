import { Router } from 'express';
import { formatSiteSettings, getOrCreateSiteSettings } from '../models/SiteSettings.js';

export function siteRoutes() {
  const r = Router();

  r.get('/', async (_req, res) => {
    const doc = await getOrCreateSiteSettings();
    res.json(formatSiteSettings(doc));
  });

  return r;
}
