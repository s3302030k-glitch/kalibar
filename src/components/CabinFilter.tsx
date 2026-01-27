import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/hooks/useLanguage";

type FilterType = "all" | "small" | "large";

interface CabinFilterProps {
  activeFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
}

const CabinFilter = ({ activeFilter, onFilterChange }: CabinFilterProps) => {
  const { t } = useTranslation();
  const { isRTL } = useLanguage();

  const filters: { value: FilterType; label: string; description: string }[] = [
    { 
      value: "all", 
      label: t("cabins.all"), 
      description: isRTL ? "۱۰ کلبه" : "10 cabins" 
    },
    { 
      value: "small", 
      label: isRTL ? "۶۰ متری" : "60 sqm", 
      description: isRTL ? "۶ کلبه" : "6 cabins" 
    },
    { 
      value: "large", 
      label: isRTL ? "۱۱۰ متری" : "110 sqm", 
      description: isRTL ? "۴ کلبه" : "4 cabins" 
    },
  ];

  return (
    <div className="flex flex-wrap justify-center gap-3 mb-8">
      {filters.map((filter) => (
        <Button
          key={filter.value}
          variant={activeFilter === filter.value ? "default" : "outline"}
          onClick={() => onFilterChange(filter.value)}
          className={`
            px-6 py-5 rounded-xl transition-all
            ${activeFilter === filter.value 
              ? "bg-forest-medium hover:bg-forest-deep text-primary-foreground shadow-soft" 
              : "border-border hover:border-forest-light hover:bg-secondary"
            }
          `}
        >
          <span className="font-semibold">{filter.label}</span>
          <span className={`${isRTL ? 'mr-2' : 'ml-2'} text-sm ${activeFilter === filter.value ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
            ({filter.description})
          </span>
        </Button>
      ))}
    </div>
  );
};

export default CabinFilter;
