import { Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/hooks/useLanguage";

import { cn } from "@/lib/utils";

interface LanguageSwitcherProps {
  className?: string;
}

const LanguageSwitcher = ({ className }: LanguageSwitcherProps) => {
  const { currentLanguage, toggleLanguage } = useLanguage();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleLanguage}
      className={cn(
        "flex items-center gap-2 hover:bg-forest-medium/10 transition-colors",
        className
      )}
    >
      <Globe className="w-4 h-4" />
      <span className="font-medium">
        {currentLanguage === 'fa' ? 'EN' : 'فا'}
      </span>
    </Button>
  );
};

export default LanguageSwitcher;
