/**
 * Every managed content type is described here once, and the generic list
 * and edit screens under /admin/[resource] read from it. Adding a field to
 * the admin panel means adding a line to this file, not writing a new page.
 */

export type FieldType =
  | "text"
  | "slug"
  | "textarea"
  | "number"
  | "boolean"
  | "media"
  | "tags"
  | "date"
  | "datetime"
  | "select";

export type Field = {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  help?: string;
  rows?: number;
  options?: { value: string; label: string }[];
  /** For `slug`: the field to derive from when left blank. */
  from?: string;
  min?: number;
  max?: number;
};

export type Resource = {
  key: string;
  table: string;
  label: string;
  singular: string;
  /** Column used as the row title in the list view. */
  titleField: string;
  /** Extra columns shown in the list. */
  listFields?: { name: string; label: string }[];
  fields: Field[];
  /** Public URL pattern for a "view on site" link, `:slug` interpolated. */
  publicPath?: string;
  blurb?: string;
  /**
   * Show the bulk uploader on this resource's list screen. Set to the table
   * each uploaded file should also be inserted into, or `true` to upload to
   * the media library only.
   */
  bulkUpload?: "gallery_items" | true;
};

const PUBLISHED: Field = {
  name: "published",
  label: "Visible on the website",
  type: "boolean",
  help: "Turn off to hide this without deleting it.",
};

const SORT: Field = {
  name: "sort_order",
  label: "Order",
  type: "number",
  help: "Lower numbers appear first.",
};

const ICON_OPTIONS = [
  "peak",
  "dining",
  "conference",
  "clubhouse",
  "parking",
  "spa",
  "wifi",
  "view",
  "bed",
].map((value) => ({ value, label: value }));

export const RESOURCES: Resource[] = [
  {
    key: "rooms",
    table: "rooms",
    label: "Rooms & suites",
    singular: "Room",
    titleField: "name",
    publicPath: "/rooms/:slug",
    blurb: "The room types shown on the website, in order.",
    listFields: [
      { name: "rate_inr", label: "Rate" },
      { name: "max_guests", label: "Sleeps" },
    ],
    fields: [
      { name: "name", label: "Room name", type: "text", required: true },
      {
        name: "slug",
        label: "Web address",
        type: "slug",
        from: "name",
        help: "Leave blank to generate from the room name.",
      },
      { name: "image_id", label: "Main photograph", type: "media" },
      {
        name: "summary",
        label: "Short summary",
        type: "textarea",
        rows: 2,
        help: "One line, shown in listings.",
      },
      { name: "description", label: "Full description", type: "textarea", rows: 6 },
      {
        name: "rate_inr",
        label: "Nightly rate (₹)",
        type: "number",
        min: 0,
        help: "Leave blank to show “Rates on request”.",
      },
      { name: "rate_note", label: "Rate note", type: "text" },
      { name: "max_guests", label: "Sleeps", type: "number", min: 1, max: 60 },
      { name: "size_note", label: "Room size", type: "text" },
      {
        name: "features",
        label: "Features",
        type: "tags",
        help: "One per line — e.g. Valley view, Private balcony.",
      },
      SORT,
      PUBLISHED,
    ],
  },
  {
    key: "apartments",
    table: "apartments",
    label: "Long-stay apartments",
    singular: "Apartment",
    titleField: "name",
    blurb: "Independent accommodation let by the month.",
    listFields: [
      { name: "block", label: "Block" },
      { name: "rate_monthly_inr", label: "Per month" },
    ],
    fields: [
      { name: "name", label: "Apartment", type: "text", required: true },
      { name: "block", label: "Block", type: "text" },
      { name: "detail", label: "Detail", type: "textarea", rows: 2 },
      { name: "rate_monthly_inr", label: "Monthly rate (₹)", type: "number", min: 0 },
      { name: "image_id", label: "Photograph", type: "media" },
      SORT,
      PUBLISHED,
    ],
  },
  {
    key: "facilities",
    table: "facilities",
    label: "Facilities & benefits",
    singular: "Facility",
    titleField: "name",
    blurb:
      "On-site facilities, plus the “booking direct” points shown lower down the home page.",
    listFields: [{ name: "category", label: "Type" }],
    fields: [
      {
        name: "category",
        label: "Type",
        type: "select",
        required: true,
        options: [
          { value: "facility", label: "On-site facility" },
          { value: "booking_benefit", label: "Booking-direct benefit" },
        ],
      },
      { name: "name", label: "Name", type: "text", required: true },
      { name: "description", label: "Description", type: "textarea", rows: 2 },
      {
        name: "image_id",
        label: "Photograph",
        type: "media",
        help: "Optional. On-site facilities show it on the home page and the facilities page; booking-direct benefits are icon-only and ignore it.",
      },
      { name: "icon", label: "Icon", type: "select", options: ICON_OPTIONS },
      SORT,
      PUBLISHED,
    ],
  },
  {
    key: "dining",
    table: "dining_items",
    label: "Dining",
    singular: "Menu item",
    titleField: "name",
    blurb: "Thalis, picnic packages and anything else priced on the dining page.",
    listFields: [
      { name: "category", label: "Group" },
      { name: "price_note", label: "Price" },
    ],
    fields: [
      {
        name: "category",
        label: "Group",
        type: "select",
        required: true,
        options: [
          { value: "thali", label: "Thali" },
          { value: "picnic", label: "Day picnic package" },
          { value: "other", label: "Other" },
        ],
      },
      { name: "name", label: "Name", type: "text", required: true },
      { name: "detail", label: "What is included", type: "textarea", rows: 2 },
      {
        name: "price_note",
        label: "Price",
        type: "text",
        help: "Written out, e.g. “350 + GST per thali”.",
      },
      { name: "image_id", label: "Photograph", type: "media" },
      SORT,
      PUBLISHED,
    ],
  },
  {
    key: "testimonials",
    table: "testimonials",
    label: "Testimonials",
    singular: "Testimonial",
    titleField: "author",
    blurb: "Guest reviews shown on the home and about pages.",
    listFields: [
      { name: "headline", label: "Headline" },
      { name: "rating", label: "Rating" },
    ],
    fields: [
      { name: "author", label: "Guest name", type: "text", required: true },
      { name: "headline", label: "Headline", type: "text" },
      { name: "quote", label: "Review", type: "textarea", rows: 7, required: true },
      { name: "rating", label: "Rating out of 5", type: "number", min: 1, max: 5 },
      { name: "source", label: "Source", type: "text", help: "e.g. Google, TripAdvisor." },
      { name: "stay_date", label: "When they stayed", type: "text" },
      SORT,
      PUBLISHED,
    ],
  },
  {
    key: "attractions",
    table: "attractions",
    label: "Attractions",
    singular: "Attraction",
    titleField: "name",
    blurb:
      "Places to visit near the resort, shown on /attractions in this order. " +
      "Upload a photograph for each one — until you do, the page draws a " +
      "labelled placeholder in its place.",
    listFields: [
      { name: "category", label: "Type" },
      { name: "distance_note", label: "Distance" },
    ],
    fields: [
      { name: "name", label: "Place", type: "text", required: true },
      {
        name: "slug",
        label: "Web address",
        type: "slug",
        from: "name",
        help: "Used for the link that jumps to this place on the page.",
      },
      {
        name: "image_id",
        label: "Photograph",
        type: "media",
        help: "Upload your own photograph of the place. None are supplied — these are public landmarks, not the resort.",
      },
      {
        name: "category",
        label: "Type",
        type: "text",
        help: "Shown above the name, e.g. Temples, Colonial history, Walks & treks.",
      },
      {
        name: "distance_note",
        label: "Distance",
        type: "text",
        help: "Free text, e.g. “From Solan · 11 km (30 min drive)”. Correct these whenever you like.",
      },
      {
        name: "summary",
        label: "One-line summary",
        type: "textarea",
        rows: 2,
        help: "Used in listings and search results.",
      },
      { name: "description", label: "Description", type: "textarea", rows: 6 },
      {
        name: "highlights",
        label: "Highlights",
        type: "tags",
        help: "One per line — e.g. Christ Church, The Mall, Monkey Point.",
      },
      {
        name: "visit_note",
        label: "Before you go",
        type: "textarea",
        rows: 3,
        help: "Opening hours, entry rules, anything a guest should know first.",
      },
      { name: "map_url", label: "Map link", type: "text" },
      SORT,
      PUBLISHED,
    ],
  },
  {
    key: "videos",
    table: "videos",
    label: "Videos",
    singular: "Video",
    titleField: "title",
    blurb:
      "Films of the resort. Either upload a file or paste a YouTube or Vimeo link — " +
      "one of the two is required. Choose where each one plays.",
    listFields: [{ name: "placement", label: "Shown on" }],
    fields: [
      { name: "title", label: "Title", type: "text", required: true },
      {
        name: "description",
        label: "Short description",
        type: "textarea",
        rows: 2,
      },
      {
        name: "placement",
        label: "Shown on",
        type: "select",
        required: true,
        options: [
          { value: "home", label: "The home page" },
          { value: "gallery", label: "The gallery page" },
          { value: "both", label: "Both" },
        ],
      },
      {
        name: "media_id",
        label: "Upload a video file",
        type: "media",
        help: "MP4 or WebM. Leave blank if you are using a YouTube or Vimeo link instead.",
      },
      {
        name: "embed_url",
        label: "…or a YouTube / Vimeo link",
        type: "text",
        help: "Paste the normal watch or share link — youtube.com/watch?v=…, youtu.be/…, or vimeo.com/…",
      },
      {
        name: "poster_id",
        label: "Cover image",
        type: "media",
        help: "The still shown before the video plays. Worth setting for uploads: the first frame is usually dark.",
      },
      SORT,
      PUBLISHED,
    ],
  },
  {
    key: "gallery",
    table: "gallery_items",
    label: "Gallery",
    singular: "Gallery image",
    titleField: "caption",
    bulkUpload: "gallery_items",
    blurb: "Photographs on the gallery page, grouped by category.",
    listFields: [{ name: "category", label: "Category" }],
    fields: [
      { name: "media_id", label: "Photograph", type: "media", required: true },
      { name: "caption", label: "Caption", type: "text" },
      {
        name: "category",
        label: "Category",
        type: "text",
        help: "Images are grouped under this heading, e.g. Rooms, Views, Dining.",
      },
      SORT,
      PUBLISHED,
    ],
  },
  {
    key: "offers",
    table: "offers",
    label: "Offers",
    singular: "Offer",
    titleField: "title",
    blurb: "Seasonal packages and rates.",
    listFields: [{ name: "valid_to", label: "Valid until" }],
    fields: [
      { name: "title", label: "Offer title", type: "text", required: true },
      { name: "slug", label: "Web address", type: "slug", from: "title" },
      { name: "image_id", label: "Photograph", type: "media" },
      { name: "summary", label: "Short summary", type: "textarea", rows: 2 },
      { name: "body", label: "Details", type: "textarea", rows: 6 },
      { name: "terms", label: "Terms & conditions", type: "textarea", rows: 3 },
      { name: "valid_from", label: "Valid from", type: "date" },
      { name: "valid_to", label: "Valid until", type: "date" },
      {
        name: "announce",
        label: "Announce this offer over the site",
        type: "boolean",
        help: "Opens in a panel a moment after the page loads. Guests can close it, and it stays closed for them. Only the first announced offer that is currently valid is shown.",
      },
      {
        name: "announce_version",
        label: "Announcement version",
        type: "number",
        min: 1,
        help: "Add one to this after changing the wording, to show the panel again to guests who already closed it.",
      },
      SORT,
      PUBLISHED,
    ],
  },
  {
    key: "journal",
    table: "posts",
    label: "News & events",
    singular: "Post",
    titleField: "title",
    publicPath: "/journal/:slug",
    blurb: "Announcements and upcoming events.",
    listFields: [
      { name: "category", label: "Category" },
      { name: "event_date", label: "Event date" },
    ],
    fields: [
      { name: "title", label: "Title", type: "text", required: true },
      { name: "slug", label: "Web address", type: "slug", from: "title" },
      {
        name: "category",
        label: "Category",
        type: "select",
        options: [
          { value: "News", label: "News" },
          { value: "Event", label: "Event" },
          { value: "Offer", label: "Offer" },
        ],
      },
      { name: "image_id", label: "Photograph", type: "media" },
      { name: "excerpt", label: "Standfirst", type: "textarea", rows: 2 },
      {
        name: "body",
        label: "Body",
        type: "textarea",
        rows: 12,
        help: "Leave a blank line between paragraphs.",
      },
      { name: "event_date", label: "Event date", type: "date" },
      {
        name: "published_at",
        label: "Publish date",
        type: "datetime",
        help: "A future date keeps the post hidden until then.",
      },
      PUBLISHED,
    ],
  },
];

export function findResource(key: string): Resource | undefined {
  return RESOURCES.find((resource) => resource.key === key);
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
