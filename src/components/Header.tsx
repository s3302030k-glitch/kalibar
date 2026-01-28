import { useState, useEffect } from "react";
import { TreePine, Phone, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useLanguage } from "@/hooks/useLanguage";

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { t } = useTranslation();
  const { isRTL } = useLanguage();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
      setIsMobileMenuOpen(false);
    }
  };

  const navItems = [
    { key: "hero", label: t("header.home") },
    { key: "cabins", label: t("header.cabins") },
    { key: "amenities", label: t("header.amenities") },
    { key: "contact", label: t("header.contact") },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled
        ? "bg-background/95 backdrop-blur-md shadow-soft py-3"
        : "bg-transparent py-5"
        }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => scrollToSection('hero')}>
            <img
              src="/logo.png"
              alt="Arasbaran Logo"
              className={`w-10 h-10 object-contain transition-all duration-300 ${!isScrolled ? "brightness-0 invert" : ""}`}
            />
            <span className={`text-xl font-bold ${isScrolled ? "text-forest-deep" : "text-primary-foreground"}`}>
              {isRTL ? "اقامتگاه جنگلی ارسباران" : "Arasbaran Forest Lodge"}
            </span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              <button
                key={item.key}
                onClick={() => scrollToSection(item.key)}
                className={`font-medium transition-colors hover:text-gold ${isScrolled ? "text-foreground" : "text-primary-foreground"
                  }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* CTA Button & Language Switcher */}
          <div className="hidden md:flex items-center gap-4">
            <LanguageSwitcher className={isScrolled ? "text-foreground" : "text-primary-foreground"} />
            <Button
              className={`rounded-xl font-semibold ${isScrolled
                ? "bg-forest-medium hover:bg-forest-deep text-primary-foreground"
                : "bg-gold hover:bg-gold-light text-accent-foreground"
                }`}
            >
              <Phone className={`w-4 h-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
              {isRTL ? "۰۹۱۲۳۴۵۶۷۸۹" : "0912-345-6789"}
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <X className={`w-6 h-6 ${isScrolled ? "text-foreground" : "text-primary-foreground"}`} />
            ) : (
              <Menu className={`w-6 h-6 ${isScrolled ? "text-foreground" : "text-primary-foreground"}`} />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden mt-4 p-4 bg-background rounded-xl shadow-medium animate-scale-in">
            <nav className="flex flex-col gap-4">
              {navItems.map((item) => (
                <button
                  key={item.key}
                  onClick={() => scrollToSection(item.key)}
                  className="font-medium text-foreground hover:text-forest-medium py-2 text-start"
                >
                  {item.label}
                </button>
              ))}
              <div className="py-2">
                <LanguageSwitcher />
              </div>
              <Button className="bg-forest-medium hover:bg-forest-deep text-primary-foreground rounded-xl mt-2">
                <Phone className={`w-4 h-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                {t("header.contact")}
              </Button>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
