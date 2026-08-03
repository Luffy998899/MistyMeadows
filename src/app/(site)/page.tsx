import { Testimonials } from "@/components/Testimonials";
import { VideoSection } from "@/components/VideoSection";
import { AmenitiesGrid } from "@/components/home/AmenitiesGrid";
import { AvailabilityBar } from "@/components/home/AvailabilityBar";
import { CallBand } from "@/components/home/CallBand";
import { CelebrationsBand } from "@/components/home/CelebrationsBand";
import { FacilitiesPanel } from "@/components/home/FacilitiesPanel";
import { FeatureBand } from "@/components/home/FeatureBand";
import { GalleryStrip } from "@/components/home/GalleryStrip";
import { HeroSlider } from "@/components/home/HeroSlider";
import { NearbyBand } from "@/components/home/NearbyBand";
import { NewsletterBand } from "@/components/home/NewsletterBand";
import { PanoramaBand } from "@/components/home/PanoramaBand";
import { QuoteBand } from "@/components/home/QuoteBand";
import { WelcomeBand } from "@/components/home/WelcomeBand";
import {
  getDining,
  getFacilities,
  getGallery,
  getRooms,
  getSettings,
  getTestimonials,
  getVideos,
} from "@/lib/content";
import { HERO_SLIDES, IMAGES } from "@/lib/media-library";

export default async function HomePage() {
  const [settings, rooms, facilities, dining, testimonials, gallery, videos] =
    await Promise.all([
      getSettings(),
      getRooms(),
      getFacilities(),
      getDining(),
      getTestimonials(),
      getGallery(),
      getVideos(),
    ]);

  const homeVideos = videos.filter((v) => v.placement === "home" || v.placement === "both");

  const amenities = facilities.filter((f) => f.category === "facility");
  const benefits = facilities.filter((f) => f.category === "booking_benefit");

  /*
    Every band prefers an owner-managed picture and falls back to the
    photograph shipped for that slot, so the page is never short of imagery
    but the admin panel still wins wherever it has been used.
  */
  const heroSlides = gallery
    .filter((g) => g.category === "hero" && g.media)
    .map((g) => g.media!);
  const slides = heroSlides.length > 0 ? heroSlides : HERO_SLIDES;

  // The slider photographs are already the top of the page, so the strip
  // draws from everything else the owner has published.
  const galleryPlates = gallery
    .filter((g) => g.media && g.category !== "hero")
    .map((g) => g.media!);
  const strip =
    galleryPlates.length >= 8
      ? galleryPlates
      : [
          IMAGES.suiteLounge,
          IMAGES.terraceValley,
          IMAGES.restaurantHall,
          IMAGES.roomTerrace,
          IMAGES.celebrations,
          IMAGES.roomOutlook,
          IMAGES.restaurantTable,
          IMAGES.welcome,
        ];

  const roomsImage = rooms[0]?.image ?? IMAGES.roomLuxury;
  const diningImage = dining.find((d) => d.image)?.image ?? IMAGES.restaurantHall;

  return (
    <>
      <HeroSlider
        slides={slides}
        eyebrow={settings.legal_name}
        headline={
          <>
            The valley, from
            <br />
            <em className="italic">every window</em>
          </>
        }
        sub={settings.tagline}
      />

      <AvailabilityBar />

      <WelcomeBand settings={settings} media={settings.hero_media ?? IMAGES.welcome} />

      <FeatureBand
        id="rooms"
        eyebrow="Luxurious"
        title="Rooms & Suites"
        body="Five ways to stay, and every one of them faces the valley. Balconies wide enough to eat breakfast on, terraces that look straight down the pine slopes, and a premium suite with its own sitting room for a family travelling together."
        href="/rooms"
        cta="See the rooms"
        media={roomsImage}
        side="right"
        accent={["Valley view", "Private balcony", "Room service", "Wi-Fi"]}
      />

      <FeatureBand
        id="glance"
        eyebrow="At a glance"
        title="A resort at 5,800 feet"
        body="Kumarhatti sits on the Nahan road just below Kasauli — an hour and a half from Chandigarh, five and a half from Delhi. Close enough for a weekend, far enough that the only thing you hear at night is the wind through the pines."
        href="/about"
        cta="Explore more"
        media={IMAGES.heroHillside}
        side="left"
      />

      <PanoramaBand
        media={IMAGES.panorama}
        caption="The entrance, the gardens and the old sandstone carving by the door"
      />

      <VideoSection
        videos={homeVideos}
        eyebrow="Watch"
        title="The resort, on film"
        lead="A few minutes of the property, the valley and the terrace — better than any amount of description."
      />

      <QuoteBand>
        Surrounded by tall pine and spectacular mountains, the resort offers
        majestic views of the valley from every room — a peaceful place to
        unwind, relax and take your time over it.
      </QuoteBand>

      <FeatureBand
        id="terrace"
        eyebrow="An open-air table"
        title="The valley terrace"
        body="Tables set out on the open terrace, the whole valley below them, and the kitchen sending out Indian, Chinese and Continental all day. It is where most guests end up for breakfast, and where they stay until it gets cold."
        href="/dining"
        cta="Dining & rates"
        media={IMAGES.terraceValley}
        side="right"
        ground="on-mint"
      />

      <FeatureBand
        id="restaurant"
        eyebrow="Multi-cuisine"
        title="The restaurant"
        body="A hundred covers under the valley windows, a fixed thali at the centre of the menu, and day-picnic packages for groups coming up for the afternoon. Vegetarian and non-vegetarian, priced plainly."
        href="/dining"
        cta="See the menu rates"
        media={diningImage}
        side="left"
      />

      <CelebrationsBand media={IMAGES.celebrations} />

      <FacilitiesPanel facilities={amenities} media={IMAGES.roomBalcony} />

      <NearbyBand media={IMAGES.heroPines} />

      <GalleryStrip images={strip} />

      <Testimonials testimonials={testimonials} />

      <AmenitiesGrid benefits={benefits} note={settings.booking_note} />

      <CallBand settings={settings} />

      <NewsletterBand />
    </>
  );
}
