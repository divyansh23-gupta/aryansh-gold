import { createFileRoute } from "@tanstack/react-router";
import { Hero } from "@/components/home/Hero";
import { FeaturedCollections } from "@/components/home/FeaturedCollections";
import { PopularCategories } from "@/components/home/PopularCategories";
import { TrendingCollection } from "@/components/home/TrendingCollection";
import { TopStyles } from "@/components/home/TopStyles";
import { TrendingLooks } from "@/components/home/TrendingLooks";
import { BrandStoryVideo } from "@/components/home/BrandStoryVideo";
import { FeaturedBanners } from "@/components/home/FeaturedBanners";
import { VisitStore } from "@/components/home/VisitStore";
import { WhyUs } from "@/components/home/WhyUs";
import { Testimonials } from "@/components/home/Testimonials";
import { Newsletter } from "@/components/home/Newsletter";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <>
      <Hero />
      <FeaturedCollections />
      <PopularCategories />
      <TrendingCollection />
      <TopStyles />
      <TrendingLooks />
      <BrandStoryVideo />
      <FeaturedBanners />
      <VisitStore />
      <WhyUs />
      <Testimonials />
      <Newsletter />
    </>
  );
}
