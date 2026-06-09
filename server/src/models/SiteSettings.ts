import mongoose from 'mongoose';

const bannerSchema = new mongoose.Schema(
  {
    imageUrl: { type: String, required: true, trim: true },
    link: { type: String, default: '', trim: true },
  },
  { _id: false }
);

const newArrivalSchema = new mongoose.Schema(
  {
    imageUrl: { type: String, required: true, trim: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const footerLinkSchema = new mongoose.Schema(
  {
    label: { type: String, default: '', trim: true },
    url: { type: String, default: '', trim: true },
  },
  { _id: false }
);

const footerColumnSchema = new mongoose.Schema(
  {
    title: { type: String, default: '', trim: true },
    links: {
      type: [footerLinkSchema],
      default: [],
      validate: {
        validator: (v: unknown[]) => v.length <= 6,
        message: 'Maximum 6 footer links allowed per column',
      },
    },
  },
  { _id: false }
);

const socialLinkSchema = new mongoose.Schema(
  {
    label: { type: String, default: '', trim: true },
    url: { type: String, default: '', trim: true },
  },
  { _id: false }
);

const trustBadgeSchema = new mongoose.Schema(
  {
    label: { type: String, default: '', trim: true },
    iconUrl: { type: String, default: '', trim: true },
  },
  { _id: false }
);

const siteSettingsSchema = new mongoose.Schema(
  {
    key: { type: String, default: 'main', unique: true },
    shopName: { type: String, default: 'My Shop', trim: true },
    logoUrl: { type: String, default: '', trim: true },
    loginLogoUrl: { type: String, default: '', trim: true },
    senderEmail: { type: String, default: '', trim: true },
    banners: {
      type: [bannerSchema],
      validate: {
        validator: (v: unknown[]) => v.length <= 6,
        message: 'Maximum 6 banner images allowed',
      },
      default: [],
    },
    newArrivals: {
      type: [newArrivalSchema],
      validate: {
        validator: (v: unknown[]) => v.length <= 3,
        message: 'Maximum 3 new arrivals sections allowed',
      },
      default: [],
    },
    footer: {
      description: { type: String, default: '', trim: true },
      tagline: { type: String, default: '', trim: true },
      slogan: { type: String, default: '', trim: true },
      supportEmail: { type: String, default: '', trim: true },
      supportPhone: { type: String, default: '', trim: true },
      supportHours: { type: String, default: '', trim: true },
      whatsappLink: { type: String, default: '', trim: true },
      facebookLink: { type: String, default: '', trim: true },
      instagramLink: { type: String, default: '', trim: true },
      twitterLink: { type: String, default: '', trim: true },
      youtubeLink: { type: String, default: '', trim: true },
      copyrightText: { type: String, default: '', trim: true },
      quickLinks: {
        type: [footerLinkSchema],
        default: [],
      },
      addressLines: {
        type: [String],
        default: [],
      },
      columns: {
        type: [footerColumnSchema],
        default: [],
      },
      socialLinks: {
        type: [socialLinkSchema],
        default: [],
      },
      trustBadges: {
        type: [trustBadgeSchema],
        default: [],
      },
    },
  },
  { timestamps: true }
);

export type SiteSettingsDoc = mongoose.InferSchemaType<typeof siteSettingsSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const SiteSettings = mongoose.model('SiteSettings', siteSettingsSchema);

export const SITE_KEY = 'main';

export async function getOrCreateSiteSettings() {
  let doc = await SiteSettings.findOne({ key: SITE_KEY });
  if (!doc) {
    doc = await SiteSettings.create({ key: SITE_KEY });
  }
  return doc;
}

export function formatSiteSettings(doc: SiteSettingsDoc) {
  return {
    shopName: doc.shopName,
    logoUrl: doc.logoUrl,
    loginLogoUrl: doc.loginLogoUrl ?? '',
    senderEmail: doc.senderEmail ?? '',
    banners: doc.banners.map((b, i) => ({
      imageUrl: b.imageUrl,
      link: b.link ?? '',
      order: i,
    })),
    newArrivals: doc.newArrivals.map((section) => ({
      imageUrl: section.imageUrl,
      title: section.title,
      description: section.description,
    })),
    footer: {
      description: doc.footer?.description ?? '',
      tagline: doc.footer?.tagline ?? '',
      slogan: doc.footer?.slogan ?? '',
      supportEmail: doc.footer?.supportEmail ?? '',
      supportPhone: doc.footer?.supportPhone ?? '',
      supportHours: doc.footer?.supportHours ?? '',
      whatsappLink: doc.footer?.whatsappLink ?? '',
      facebookLink: doc.footer?.facebookLink ?? '',
      instagramLink: doc.footer?.instagramLink ?? '',
      twitterLink: doc.footer?.twitterLink ?? '',
      youtubeLink: doc.footer?.youtubeLink ?? '',
      copyrightText: doc.footer?.copyrightText ?? '',
      quickLinks: (doc.footer?.quickLinks ?? []).map((link) => ({
        label: link.label ?? '',
        url: link.url ?? '',
      })),
      addressLines: doc.footer?.addressLines ?? [],
      columns: (doc.footer?.columns ?? []).map((col) => ({
        title: col.title ?? '',
        links: (col.links ?? []).map((link) => ({
          label: link.label ?? '',
          url: link.url ?? '',
        })),
      })),
      socialLinks: (doc.footer?.socialLinks ?? []).map((item) => ({
        label: item.label ?? '',
        url: item.url ?? '',
      })),
      trustBadges: (doc.footer?.trustBadges ?? []).map((item) => ({
        label: item.label ?? '',
        iconUrl: item.iconUrl ?? '',
      })),
    },
  };
}
