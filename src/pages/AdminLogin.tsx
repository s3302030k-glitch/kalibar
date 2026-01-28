import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { TreePine, Mail, Lock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { user, isAdmin, loading, userRole, signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Login attempt starting...");
    setIsLoading(true);

    const { error } = await signIn(email, password);
    console.log("SignIn result:", { error });

    if (error) {
      console.error("Login error:", error);
      toast.error("ایمیل یا رمز عبور اشتباه است");
      setIsLoading(false);
      return;
    }

    // Wait for auth state to update
    console.log("Login successful, redirecting...");
    toast.success("ورود موفق!");

    // Wait a bit for auth context to update
    setTimeout(() => {
      setIsLoading(false);
      console.log("Redirecting to admin panel...");
      navigate("/admin");
    }, 100);
  };

  // If already logged in and context is ready, redirect
  // But don't block render if just loading
  useEffect(() => {
    if (!loading && user && (isAdmin || userRole)) {
      console.log("Already logged in, redirecting...", { isAdmin, userRole });
      navigate("/admin");
    }
  }, [loading, user, isAdmin, userRole, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-forest-light/20 to-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="glass-card rounded-2xl p-8 shadow-medium">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 mb-4">
              <div className="inline-flex items-center gap-2 mb-4">
                <img src="/logo.png" alt="Arasbaran Logo" className="w-20 h-20 object-contain drop-shadow-md" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-forest-deep mb-2">
              ورود مدیریت
            </h1>
            <p className="text-muted-foreground">
              اقامتگاه جنگلی ارسباران
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">ایمیل</Label>
              <div className="relative">
                <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                  className="pr-10"
                  dir="ltr"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">رمز عبور</Label>
              <div className="relative">
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pr-10"
                  dir="ltr"
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-forest-medium hover:bg-forest-deep"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                  در حال ورود...
                </>
              ) : (
                "ورود"
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <a
              href="/"
              className="text-sm text-forest-medium hover:text-forest-deep transition-colors"
            >
              بازگشت به سایت
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
