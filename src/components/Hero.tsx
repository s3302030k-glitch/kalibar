import heroImage from "@/assets/hero-forest.jpg";
import { TreePine, MapPin, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/hooks/useLanguage";

interface HeroProps {
  onScrollToCabins: () => void;
}

const Hero = ({ onScrollToCabins }: HeroProps) => {
  const { t } = useTranslation();
  const { isRTL } = useLanguage();

  return (
    <section className="relative h-screen min-h-[600px] flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src={heroImage}
          alt={isRTL ? "اقامتگاه جنگلی ارسباران" : "Arasbaran Forest Lodge"}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-foreground/50 via-foreground/30 to-foreground/70" />
      </div>
      
      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 text-center">
        <div className="animate-slide-up">
          <div className="inline-flex items-center gap-2 bg-primary-foreground/10 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
            <TreePine className="w-5 h-5 text-gold" />
            <span className="text-primary-foreground text-sm font-medium">
              {t("hero.badge")}
            </span>
          </div>
          
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-primary-foreground mb-6 leading-tight">
            {t("hero.title1")}
            <br />
            <span className="text-gold">{t("hero.title2")}</span>
            {t("hero.title3") && <> {t("hero.title3")}</>}
          </h1>
          
          <p className="text-lg md:text-xl text-primary-foreground/90 max-w-2xl mx-auto mb-8">
            {t("hero.subtitle")}
            <br />
            {t("hero.subtitle2")}
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <Button
              size="lg"
              onClick={onScrollToCabins}
              className="bg-gold hover:bg-gold-light text-accent-foreground font-semibold px-8 py-6 text-lg rounded-xl shadow-medium"
            >
              <Calendar className={`w-5 h-5 ${isRTL ? 'ml-2' : 'mr-2'}`} />
              {t("hero.bookOnline")}
            </Button>
            
            <Button
              variant="outline"
              size="lg"
              className="bg-primary-foreground/20 backdrop-blur-sm border-gold/50 text-gold hover:bg-primary-foreground/30 hover:border-gold px-8 py-6 text-lg rounded-xl"
            >
              <MapPin className={`w-5 h-5 ${isRTL ? 'ml-2' : 'mr-2'}`} />
              {t("hero.viewLocation")}
            </Button>
          </div>
        </div>
        
        {/* Stats */}
        <div className="animate-fade-in grid grid-cols-3 gap-4 max-w-lg mx-auto">
          {[
            { number: isRTL ? "۱۰" : "10", label: t("hero.cabin") },
            { number: isRTL ? "۶۰-۱۱۰" : "60-110", label: t("hero.sqm") },
            { number: isRTL ? "۲-۶" : "2-6", label: t("hero.capacity") },
          ].map((stat, index) => (
            <div
              key={index}
              className="bg-primary-foreground/10 backdrop-blur-sm rounded-xl p-4"
            >
              <div className="text-2xl md:text-3xl font-bold text-gold">
                {stat.number}
              </div>
              <div className="text-sm text-primary-foreground/80">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-primary-foreground/50 rounded-full flex justify-center">
          <div className="w-1.5 h-3 bg-primary-foreground/50 rounded-full mt-2" />
        </div>
      </div>
    </section>
  );
};

export default Hero;
