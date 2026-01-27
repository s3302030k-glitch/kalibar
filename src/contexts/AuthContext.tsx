import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";
import { useIdleTimer } from "@/hooks/useIdleTimer";
import { hasPermission, type UserRole, type Permission } from "@/utils/permissions";
import { toast } from "sonner";

interface AuthContextType {
    user: User | null;
    session: Session | null;
    loading: boolean;
    authReady: boolean;
    isAdmin: boolean;
    isAdminLoading: boolean;
    userRole: UserRole | null;
    hasPermission: (permission: Permission) => boolean;
    signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
    signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
    signOut: () => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const IDLE_TIMEOUT = 15 * 60 * 1000; // 15 minutes
const WARNING_TIME = 60 * 1000; // 1 minute before timeout

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(false);
    const [authReady, setAuthReady] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const [isAdminLoading, setIsAdminLoading] = useState(false);
    const [userRole, setUserRole] = useState<UserRole | null>(null);

    const clearAuthState = useCallback(() => {
        setSession(null);
        setUser(null);
        setIsAdmin(false);
        setIsAdminLoading(false);
        setUserRole(null);
    }, []);

    const handleIdleLogout = useCallback(async () => {
        toast.error("نشست شما به دلیل عدم فعالیت منقضی شد");
        await supabase.auth.signOut();
        clearAuthState();
        window.location.href = "/admin/login";
    }, [clearAuthState]);

    const handleIdleWarning = useCallback(() => {
        toast.warning("شما ۱ دقیقه دیگر به دلیل عدم فعالیت خارج خواهید شد");
    }, []);

    // Idle timer - only active when user is logged in
    useIdleTimer({
        timeout: IDLE_TIMEOUT,
        onIdle: handleIdleLogout,
        onWarning: handleIdleWarning,
        warningTime: WARNING_TIME,
    });

    const getUserRole = useCallback(async (userId: string): Promise<UserRole | null> => {
        try {
            const { data, error } = await supabase
                .from("user_roles")
                .select("role")
                .eq("user_id", userId)
                .maybeSingle();

            if (error || !data) return null;
            return data.role as UserRole;
        } catch {
            return null;
        }
    }, []);

    const checkPermission = useCallback((permission: Permission): boolean => {
        return hasPermission(userRole, permission);
    }, [userRole]);

    useEffect(() => {
        let mounted = true;

        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (!mounted) return;

            if (session) {
                setSession(session);
                setUser(session.user);

                getUserRole(session.user.id).then(role => {
                    if (mounted) {
                        setUserRole(role);
                        // Check if user is admin (for backward compatibility)
                        setIsAdmin(role === 'admin' || role === 'super_admin');
                        setAuthReady(true);
                    }
                });
            } else {
                setAuthReady(true);
            }
        });

        // Listen for auth changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            if (!mounted) return;

            setSession(session);
            setUser(session?.user ?? null);
            setAuthReady(true);

            if (session?.user) {
                setIsAdminLoading(true);
                getUserRole(session.user.id).then(role => {
                    if (mounted) {
                        setUserRole(role);
                        setIsAdmin(role === 'admin' || role === 'super_admin');
                        setIsAdminLoading(false);
                    }
                });
            } else {
                setUserRole(null);
                setIsAdmin(false);
                setIsAdminLoading(false);
            }
        });

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, [getUserRole]);

    const signIn = async (email: string, password: string) => {
        setLoading(true);
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        setLoading(false);
        return { error };
    };

    const signUp = async (email: string, password: string) => {
        setLoading(true);
        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: { emailRedirectTo: window.location.origin },
        });
        setLoading(false);
        return { error };
    };

    const signOut = async () => {
        setLoading(true);
        const { error } = await supabase.auth.signOut();
        clearAuthState();
        setLoading(false);
        return { error };
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                session,
                loading,
                authReady,
                isAdmin,
                isAdminLoading,
                userRole,
                hasPermission: checkPermission,
                signIn,
                signUp,
                signOut,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuthContext = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuthContext must be used within an AuthProvider");
    }
    return context;
};

