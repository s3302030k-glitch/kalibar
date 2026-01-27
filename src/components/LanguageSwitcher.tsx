import { Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/hooks/useLanguage";

const LanguageSwitcher = () => {
  const { currentLanguage, toggleLanguage } = useLanguage();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleLanguage}
      className="flex items-center gap-2 text-foreground hover:bg-forest-medium/10"
    >
      <Globe className="w-4 h-4" />
      <span className="font-medium">
        {currentLanguage === 'fa' ? 'EN' : 'فا'}
      </span>
    </Button>
  );
};

export default LanguageSwitcher;
