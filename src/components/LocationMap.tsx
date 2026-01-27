import { MapPin } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/hooks/useLanguage";

const LocationMap = () => {
  const { t } = useTranslation();
  const { isRTL } = useLanguage();

  // Coordinates: 38°51'52.4"N 47°03'25.3"E
  const lat = 38.864556;
  const lng = 47.057028;
  
  const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.02}%2C${lat - 0.01}%2C${lng + 0.02}%2C${lat + 0.01}&layer=mapnik&marker=${lat}%2C${lng}`;
  const fullMapUrl = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=15/${lat}/${lng}`;

  return (
    <section className="py-20 bg-secondary">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-forest-medium/10 px-4 py-2 rounded-full mb-4">
            <MapPin className="w-5 h-5 text-forest-medium" />
            <span className="text-forest-medium text-sm font-medium">
              {t("location.badge")}
            </span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-forest-deep mb-4">
            {t("location.title")}
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {t("location.subtitle")}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Map */}
          <div className="lg:col-span-2">
            <div className="glass-card rounded-2xl overflow-hidden shadow-medium">
              <iframe
                src={mapUrl}
                className="w-full h-[400px] border-0"
                loading="lazy"
                title={isRTL ? "موقعیت اقامتگاه جنگلی ارسباران" : "Arasbaran Forest Lodge Location"}
              />
              <a
                href={fullMapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-center py-3 bg-forest-medium/5 hover:bg-forest-medium/10 text-forest-medium font-medium transition-colors"
              >
                {t("location.viewLarger")}
              </a>
            </div>
          </div>

          {/* Location Info */}
          <div className="glass-card rounded-2xl p-8 flex flex-col justify-center">
            <h3 className="text-xl font-bold text-forest-deep mb-6">{t("location.routeInfo")}</h3>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-forest-medium/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-5 h-5 text-forest-medium" />
                </div>
                <div>
                  <p className="font-medium text-foreground">{t("location.address")}</p>
                  <p className="text-sm text-muted-foreground">
                    {t("location.addressValue")}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-forest-medium/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <span className="text-forest-medium font-bold text-sm">📍</span>
                </div>
                <div>
                  <p className="font-medium text-foreground">{t("location.coordinates")}</p>
                  <p className="text-sm text-muted-foreground font-mono" dir="ltr">
                    38°51'52.4"N 47°03'25.3"E
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-forest-medium/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <span className="text-forest-medium font-bold text-sm">🚗</span>
                </div>
                <div>
                  <p className="font-medium text-foreground">{t("location.distance")}</p>
                  <p className="text-sm text-muted-foreground">
                    {t("location.distanceValue")}
                  </p>
                </div>
              </div>
            </div>

            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-8 bg-forest-medium hover:bg-forest-deep text-primary-foreground font-semibold px-6 py-3 rounded-xl transition-all text-center"
            >
              {t("location.googleMaps")}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LocationMap;
