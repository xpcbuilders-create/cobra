import { Router } from 'express';
import { formatSiteSettings, getOrCreateSiteSettings } from '../models/SiteSettings.js';

export function footerRoutes(requireAdmin: ReturnType<typeof import('../middleware/auth.js').requireAdmin>) {
  const r = Router();

  r.get('/', async (_req, res) => {
    const doc = await getOrCreateSiteSettings();
    const settings = formatSiteSettings(doc);
    res.json({ footer: settings.footer });
  });

  r.put('/', requireAdmin, async (req, res) => {
    const body = req.body as {
      tagline?: string;
      slogan?: string;
      supportEmail?: string;
      supportPhone?: string;
      supportHours?: string;
      whatsappLink?: string;
      facebookLink?: string;
      instagramLink?: string;
      twitterLink?: string;
      youtubeLink?: string;
      copyrightText?: string;
      quickLinks?: { label?: string; url?: string }[];
      trustBadges?: { label?: string; iconUrl?: string }[];
    };

    const quickLinks = (body.quickLinks ?? [])
      .filter((link) => link.label?.trim() && link.url?.trim())
      .slice(0, 6)
      .map((link) => ({
        label: link.label!.trim(),
        url: link.url!.trim(),
      }));

    const trustBadges = (body.trustBadges ?? [])
      .filter((badge) => badge.label?.trim())
      .slice(0, 4)
      .map((badge) => ({
        label: badge.label!.trim(),
        iconUrl: (badge.iconUrl ?? '').trim(),
      }));

    const doc = await getOrCreateSiteSettings();
    doc.footer = {
      ...doc.footer,
      tagline: body.tagline?.trim() ?? '',
      slogan: body.slogan?.trim() ?? '',
      supportEmail: body.supportEmail?.trim() ?? '',
      supportPhone: body.supportPhone?.trim() ?? '',
      supportHours: body.supportHours?.trim() ?? '',
      whatsappLink: body.whatsappLink?.trim() ?? '',
      facebookLink: body.facebookLink?.trim() ?? '',
      instagramLink: body.instagramLink?.trim() ?? '',
      twitterLink: body.twitterLink?.trim() ?? '',
      youtubeLink: body.youtubeLink?.trim() ?? '',
      copyrightText: body.copyrightText?.trim() ?? '',
      quickLinks,
      trustBadges,
    } as any;

    await doc.save();
    res.json({ footer: formatSiteSettings(doc).footer });
  });

  return r;
}
