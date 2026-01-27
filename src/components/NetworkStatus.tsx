import { useState, useEffect } from "react";
import { WifiOff } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";

const NetworkStatus = () => {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [showBanner, setShowBanner] = useState(false);
    const { isRTL } = useLanguage();

    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            // Hide banner after 3 seconds when back online
            setTimeout(() => setShowBanner(false), 3000);
        };

        const handleOffline = () => {
            setIsOnline(false);
            setShowBanner(true);
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Check initial state
        if (!navigator.onLine) {
            setShowBanner(true);
        }

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    if (!showBanner) return null;

    return (
        <div
            className={`fixed top-0 left-0 right-0 z-50 px-4 py-3 text-center text-sm font-medium transition-all duration-300 ${isOnline
                    ? "bg-forest-medium text-white"
                    : "bg-destructive text-destructive-foreground"
                }`}
        >
            <div className="flex items-center justify-center gap-2">
                {!isOnline && <WifiOff className="w-4 h-4" />}
                <span>
                    {isOnline
                        ? isRTL
                            ? "اتصال اینترنت برقرار شد"
                            : "Back online"
                        : isRTL
                            ? "اتصال اینترنت قطع شده است"
                            : "You are offline"}
                </span>
            </div>
        </div>
    );
};

export default NetworkStatus;
