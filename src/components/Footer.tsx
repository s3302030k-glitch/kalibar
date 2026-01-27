import { TreePine, Phone, Mail, MapPin, Instagram } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/hooks/useLanguage";

const Footer = () => {
  const { t } = useTranslation();
  const { isRTL } = useLanguage();

  const quickLinks = isRTL 
    ? ["قوانین و مقررات", "سوالات متداول", "درباره ما"]
    : ["Terms & Conditions", "FAQ", "About Us"];

  return (
    <footer className="bg-forest-deep text-primary-foreground py-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {/* Logo & Description */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-primary-foreground/10 rounded-xl">
                <TreePine className="w-6 h-6 text-gold" />
              </div>
              <span className="text-xl font-bold">
                {isRTL ? "اقامتگاه جنگلی ارسباران" : "Arasbaran Forest Lodge"}
              </span>
            </div>
            <p className="text-primary-foreground/80 leading-relaxed">
              {t("footer.description")}
            </p>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-lg font-bold mb-4 text-gold">{t("footer.contact")}</h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-gold" />
                <span dir="ltr">{isRTL ? "۰۹۱۲۳۴۵۶۷۸۹" : "0912-345-6789"}</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-gold" />
                <span>info@forest-stay.ir</span>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-gold flex-shrink-0 mt-1" />
                <span>{t("location.addressValue")}</span>
              </li>
            </ul>
          </div>

          {/* Social & Quick Links */}
          <div>
            <h4 className="text-lg font-bold mb-4 text-gold">{t("footer.quickLinks")}</h4>
            <ul className="space-y-2 mb-6">
              {quickLinks.map((item) => (
                <li key={item}>
                  <a href="#" className="text-primary-foreground/80 hover:text-gold transition-colors">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
            
            <div className="flex items-center gap-3">
              <a
                href="#"
                className="p-3 bg-primary-foreground/10 rounded-xl hover:bg-gold transition-colors"
              >
                <Instagram className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-primary-foreground/20 mt-12 pt-8 text-center text-primary-foreground/60">
          <p>
            {isRTL 
              ? `© ۱۴۰۴ اقامتگاه جنگلی ارسباران. ${t("footer.rights")}`
              : `© 2025 Arasbaran Forest Lodge. ${t("footer.rights")}`
            }
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
