import { useEffect, useRef, useCallback } from 'react';

interface UseIdleTimerOptions {
    timeout: number; // milliseconds
    onIdle: () => void;
    onWarning?: () => void;
    warningTime?: number; // milliseconds before timeout to show warning
}

export const useIdleTimer = ({
    timeout,
    onIdle,
    onWarning,
    warningTime = 60000, // 1 minute before timeout
}: UseIdleTimerOptions) => {
    const timeoutId = useRef<NodeJS.Timeout>();
    const warningTimeoutId = useRef<NodeJS.Timeout>();

    const resetTimer = useCallback(() => {
        // Clear existing timers
        if (timeoutId.current) clearTimeout(timeoutId.current);
        if (warningTimeoutId.current) clearTimeout(warningTimeoutId.current);

        // Set warning timer
        if (onWarning && warningTime < timeout) {
            warningTimeoutId.current = setTimeout(() => {
                onWarning();
            }, timeout - warningTime);
        }

        // Set idle timer
        timeoutId.current = setTimeout(() => {
            onIdle();
        }, timeout);
    }, [timeout, onIdle, onWarning, warningTime]);

    useEffect(() => {
        // Events that indicate user activity
        const events = [
            'mousedown',
            'mousemove',
            'keypress',
            'scroll',
            'touchstart',
            'click',
        ];

        // Reset timer on any activity
        const handleActivity = () => {
            resetTimer();
        };

        // Add event listeners
        events.forEach((event) => {
            document.addEventListener(event, handleActivity);
        });

        // Start initial timer
        resetTimer();

        // Cleanup
        return () => {
            events.forEach((event) => {
                document.removeEventListener(event, handleActivity);
            });
            if (timeoutId.current) clearTimeout(timeoutId.current);
            if (warningTimeoutId.current) clearTimeout(warningTimeoutId.current);
        };
    }, [resetTimer]);

    return { resetTimer };
};
