import { useState, useRef } from "react";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import CabinCard from "@/components/CabinCard";
import CabinFilter from "@/components/CabinFilter";
import BookingModal from "@/components/BookingModal";
import Footer from "@/components/Footer";
import LocationMap from "@/components/LocationMap";
import ReviewsSection from "@/components/ReviewsSection";
import { useCabins } from "@/hooks/useCabins";
import type { Cabin } from "@/integrations/supabase/types";
import { TreePine, Wifi, Car, Coffee, Shield, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/hooks/useLanguage";

type FilterType = "all" | "small" | "large";

const Index = () => {
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [selectedCabin, setSelectedCabin] = useState<Cabin | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const cabinsRef = useRef<HTMLElement>(null);
  const { t } = useTranslation();
  const { isRTL, isLoading: langLoading } = useLanguage();

  // Fetch cabins from database
  const { data: cabins = [], isLoading: cabinsLoading } = useCabins();

  const filteredCabins = cabins.filter((cabin) => {
    if (activeFilter === "small") return cabin.size_sqm === 60;
    if (activeFilter === "large") return cabin.size_sqm === 110;
    return true;
  });

  const handleReserve = (cabin: Cabin) => {
    setSelectedCabin(cabin);
    setIsModalOpen(true);
  };

  const scrollToCabins = () => {
    cabinsRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const amenities = [
    { icon: Wifi, title: t("amenities.wifi"), description: t("amenities.wifiDesc") },
    { icon: Car, title: t("amenities.parking"), description: t("amenities.parkingDesc") },
    { icon: Coffee, title: t("amenities.breakfast"), description: t("amenities.breakfastDesc") },
    { icon: Shield, title: t("amenities.security"), description: t("amenities.securityDesc") },
  ];

  // Show loading state while detecting language or loading cabins
  if (langLoading || cabinsLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-forest-medium mx-auto mb-4" />
          <p className="text-muted-foreground">{isRTL ? 'در حال بارگذاری...' : 'Loading...'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <Hero onScrollToCabins={scrollToCabins} />

      {/* Amenities Section */}
      <section id="amenities" className="py-20 bg-secondary">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-forest-deep mb-4">
              {t("amenities.title")}
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {t("amenities.subtitle")}
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {amenities.map((amenity, index) => (
              <div
                key={index}
                className="glass-card rounded-xl p-6 text-center hover-lift"
              >
                <div className="w-14 h-14 bg-forest-medium/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <amenity.icon className="w-7 h-7 text-forest-medium" />
                </div>
                <h3 className="font-bold text-foreground mb-2">{amenity.title}</h3>
                <p className="text-sm text-muted-foreground">{amenity.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Cabins Section */}
      <section id="cabins" ref={cabinsRef} className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-forest-medium/10 px-4 py-2 rounded-full mb-4">
              <TreePine className="w-5 h-5 text-forest-medium" />
              <span className="text-forest-medium text-sm font-medium">
                {t("cabins.badge")}
              </span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-forest-deep mb-4">
              {t("cabins.title")}
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {t("cabins.subtitle")}
            </p>
          </div>

          <CabinFilter
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredCabins.map((cabin, index) => (
              <div
                key={cabin.id}
                className="animate-slide-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CabinCard cabin={cabin} onReserve={handleReserve} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Reviews Section */}
      <ReviewsSection />

      {/* Location Map Section */}
      <LocationMap />

      {/* CTA Section */}
      <section className="py-20 forest-gradient">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
            {t("cta.title")}
          </h2>
          <p className="text-primary-foreground/80 max-w-2xl mx-auto mb-8">
            {t("cta.subtitle")}
          </p>
          <button
            onClick={scrollToCabins}
            className="bg-gold hover:bg-gold-light text-accent-foreground font-semibold px-8 py-4 rounded-xl transition-all shadow-medium"
          >
            {t("cta.button")}
          </button>
        </div>
      </section>

      <Footer />

      <BookingModal
        cabin={selectedCabin}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
};

export default Index;
