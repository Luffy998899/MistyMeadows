export type MediaKind = "image" | "video";

export type Media = {
  id: string;
  storage_path: string;
  public_url: string;
  kind: MediaKind;
  alt: string;
  title: string | null;
  width: number | null;
  height: number | null;
  size_bytes: number | null;
  created_at: string;
};

export type Room = {
  id: string;
  slug: string;
  name: string;
  summary: string;
  description: string;
  rate_inr: number | null;
  rate_note: string | null;
  max_guests: number;
  size_note: string | null;
  features: string[];
  image_id: string | null;
  gallery_ids: string[];
  sort_order: number;
  published: boolean;
  image?: Media | null;
};

export type Apartment = {
  id: string;
  name: string;
  block: string | null;
  detail: string;
  rate_monthly_inr: number | null;
  image_id: string | null;
  sort_order: number;
  published: boolean;
  image?: Media | null;
};

export type FacilityCategory = "facility" | "booking_benefit";

export type Facility = {
  id: string;
  category: FacilityCategory;
  name: string;
  description: string;
  icon: string;
  sort_order: number;
  published: boolean;
};

export type DiningItem = {
  id: string;
  category: string;
  name: string;
  detail: string;
  price_note: string | null;
  image_id: string | null;
  sort_order: number;
  published: boolean;
  image?: Media | null;
};

export type Testimonial = {
  id: string;
  author: string;
  headline: string | null;
  quote: string;
  rating: number;
  source: string | null;
  stay_date: string | null;
  sort_order: number;
  published: boolean;
};

export type GalleryItem = {
  id: string;
  media_id: string;
  caption: string;
  category: string;
  sort_order: number;
  published: boolean;
  media?: Media | null;
};

export type Offer = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  body: string;
  terms: string | null;
  valid_from: string | null;
  valid_to: string | null;
  image_id: string | null;
  sort_order: number;
  published: boolean;
  image?: Media | null;
};

export type Post = {
  id: string;
  slug: string;
  title: string;
  category: string;
  excerpt: string;
  body: string;
  image_id: string | null;
  event_date: string | null;
  published_at: string | null;
  published: boolean;
  image?: Media | null;
};

export type EnquiryStatus = "new" | "contacted" | "confirmed" | "closed";

export type Enquiry = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  check_in: string | null;
  check_out: string | null;
  guests: number | null;
  room_id: string | null;
  room_name: string | null;
  message: string;
  status: EnquiryStatus;
  admin_note: string | null;
  source: string;
  mail_sent: boolean;
  mail_error: string | null;
  created_at: string;
};

export type Socials = {
  facebook?: string;
  instagram?: string;
  twitter?: string;
  youtube?: string;
  tripadvisor?: string;
  linkedin?: string;
};

export type SiteSettings = {
  brand_name: string;
  legal_name: string;
  tagline: string;
  intro: string;
  address_lines: string[];
  map_url: string | null;
  map_embed_url: string | null;
  phones: string[];
  whatsapp: string | null;
  emails: string[];
  socials: Socials;
  hero_media_id: string | null;
  hero_video_url: string | null;
  logo_media_id: string | null;
  copyright_text: string;
  booking_note: string | null;
  hero_media?: Media | null;
  logo_media?: Media | null;
};

export type MailSettings = {
  smtp_host: string | null;
  smtp_port: number | null;
  smtp_secure: boolean;
  smtp_user: string | null;
  smtp_password: string | null;
  from_name: string | null;
  from_email: string | null;
  notify_emails: string[];
  reply_to: string | null;
};
