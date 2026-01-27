import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { supabaseAdmin } from "@/integrations/supabase/admin";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Loader2, Shield, UserCog, UserPlus, KeyRound } from "lucide-react";
import { toast } from "sonner";
import type { UserRole } from "@/utils/permissions";

interface UserWithRole {
    user_id: string;
    email: string;
    role: UserRole;
    created_at: string;
}

const ROLE_LABELS: Record<UserRole, string> = {
    super_admin: "مدیر ارشد",
    admin: "مدیر",
    moderator: "ناظر",
    viewer: "بازدیدکننده",
};

const ROLE_COLORS: Record<UserRole, "default" | "secondary" | "destructive" | "outline"> = {
    super_admin: "destructive",
    admin: "default",
    moderator: "secondary",
    viewer: "outline",
};

export const AdminUsers = () => {
    const queryClient = useQueryClient();
    const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
    const [newUserEmail, setNewUserEmail] = useState("");
    const [newUserPassword, setNewUserPassword] = useState("");
    const [newUserRole, setNewUserRole] = useState<UserRole>("viewer");
    const [resetPasswordUserId, setResetPasswordUserId] = useState<string | null>(null);
    const [newPassword, setNewPassword] = useState("");

    // Fetch all user roles with emails
    const { data: users, isLoading } = useQuery({
        queryKey: ["admin-users"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("user_roles")
                .select("user_id, role, created_at")
                .order("created_at", { ascending: false });

            if (error) throw error;

            // Fetch emails using admin client
            if (!supabaseAdmin) {
                return data.map(user => ({
                    ...user,
                    email: "N/A"
                })) as UserWithRole[];
            }

            // Get emails for all users
            const usersWithEmails = await Promise.all(
                data.map(async (userRole) => {
                    try {
                        const { data: { user } } = await supabaseAdmin.auth.admin.getUserById(userRole.user_id);
                        return {
                            ...userRole,
                            email: user?.email || "N/A"
                        };
                    } catch {
                        return {
                            ...userRole,
                            email: "N/A"
                        };
                    }
                })
            );

            return usersWithEmails as UserWithRole[];
        },
    });

    // Create new user
    const createUserMutation = useMutation({
        mutationFn: async ({ email, password, role }: { email: string; password: string; role: UserRole }) => {
            if (!supabaseAdmin) {
                throw new Error("Admin client not configured");
            }

            // Create user via Admin API (auto-confirmed)
            const { data, error } = await supabaseAdmin.auth.admin.createUser({
                email,
                password,
                email_confirm: true, // Auto-confirm email
                user_metadata: {
                    must_change_password: true,
                }
            });

            if (error) throw error;
            if (!data.user) throw new Error("Failed to create user");

            // Add role
            const { error: roleError } = await supabase
                .from("user_roles")
                .insert({ user_id: data.user.id, role });

            if (roleError) throw roleError;

            return data.user;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-users"] });
            toast.success("کاربر با موفقیت ایجاد شد");
            setNewUserEmail("");
            setNewUserPassword("");
            setNewUserRole("viewer");
        },
        onError: (error: any) => {
            console.error("Error creating user:", error);
            toast.error(error.message || "خطا در ایجاد کاربر");
        },
    });

    // Reset password mutation
    const resetPasswordMutation = useMutation({
        mutationFn: async ({ userId, password }: { userId: string; password: string }) => {
            if (!supabaseAdmin) {
                throw new Error("Admin client not configured. Please add VITE_SUPABASE_SERVICE_ROLE_KEY to .env");
            }

            const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
                password,
            });

            if (error) throw error;
        },
        onSuccess: () => {
            toast.success("رمز عبور با موفقیت تغییر یافت");
            setResetPasswordUserId(null);
            setNewPassword("");
        },
        onError: (error: any) => {
            console.error("Error resetting password:", error);
            toast.error(error.message || "خطا در تغییر رمز عبور");
        },
    });

    // Update user role
    const updateRoleMutation = useMutation({
        mutationFn: async ({ userId, role }: { userId: string; role: UserRole }) => {
            const { error } = await supabase
                .from("user_roles")
                .update({ role })
                .eq("user_id", userId);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-users"] });
            toast.success("نقش کاربر با موفقیت تغییر یافت");
            setUpdatingUserId(null);
        },
        onError: (error) => {
            console.error("Error updating role:", error);
            toast.error("خطا در تغییر نقش کاربر");
            setUpdatingUserId(null);
        },
    });

    const handleRoleChange = (userId: string, role: UserRole) => {
        setUpdatingUserId(userId);
        updateRoleMutation.mutate({ userId, role });
    };

    const handleCreateUser = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newUserEmail.trim()) {
            toast.error("لطفاً ایمیل را وارد کنید");
            return;
        }
        if (!newUserPassword.trim() || newUserPassword.length < 6) {
            toast.error("رمز عبور باید حداقل 6 کاراکتر باشد");
            return;
        }
        createUserMutation.mutate({ email: newUserEmail, password: newUserPassword, role: newUserRole });
    };

    const handleResetPassword = (userId: string) => {
        if (!newPassword.trim() || newPassword.length < 6) {
            toast.error("رمز عبور باید حداقل 6 کاراکتر باشد");
            return;
        }
        resetPasswordMutation.mutate({ userId, password: newPassword });
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-8">
                <Loader2 className="w-8 h-8 animate-spin text-forest-medium" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Invite User Card */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <UserPlus className="w-5 h-5" />
                        ایجاد کاربر جدید
                    </CardTitle>
                    <CardDescription>
                        کاربر جدید با ایمیل و رمز عبور ایجاد می‌شود
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleCreateUser} className="flex gap-4 items-end flex-wrap">
                        <div className="flex-1 min-w-[200px]">
                            <Label htmlFor="email">ایمیل</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="user@example.com"
                                value={newUserEmail}
                                onChange={(e) => setNewUserEmail(e.target.value)}
                                disabled={createUserMutation.isPending}
                            />
                        </div>
                        <div className="flex-1 min-w-[200px]">
                            <Label htmlFor="password">رمز عبور</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="حداقل 6 کاراکتر"
                                value={newUserPassword}
                                onChange={(e) => setNewUserPassword(e.target.value)}
                                disabled={createUserMutation.isPending}
                            />
                        </div>
                        <div className="w-[200px]">
                            <Label htmlFor="role">نقش</Label>
                            <Select
                                value={newUserRole}
                                onValueChange={(value) => setNewUserRole(value as UserRole)}
                                disabled={createUserMutation.isPending}
                            >
                                <SelectTrigger id="role">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="super_admin">مدیر ارشد</SelectItem>
                                    <SelectItem value="admin">مدیر</SelectItem>
                                    <SelectItem value="moderator">ناظر</SelectItem>
                                    <SelectItem value="viewer">بازدیدکننده</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <Button
                            type="submit"
                            disabled={createUserMutation.isPending}
                        >
                            {createUserMutation.isPending ? (
                                <>
                                    <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                                    در حال ایجاد...
                                </>
                            ) : (
                                <>
                                    <UserPlus className="w-4 h-4 ml-2" />
                                    ایجاد کاربر
                                </>
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {/* Users List Card */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <UserCog className="w-5 h-5" />
                        مدیریت کاربران و دسترسی‌ها
                    </CardTitle>
                    <CardDescription>
                        تعیین سطح دسترسی کاربران به پنل مدیریت
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border" dir="rtl">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="text-right">ایمیل</TableHead>
                                    <TableHead className="text-right">تاریخ ثبت</TableHead>
                                    <TableHead className="text-right">نقش فعلی</TableHead>
                                    <TableHead className="text-right">تغییر نقش</TableHead>
                                    <TableHead className="text-right">عملیات</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {users && users.length > 0 ? (
                                    users.map((user) => (
                                        <TableRow key={user.user_id}>
                                            <TableCell className="text-sm">
                                                {user.email}
                                            </TableCell>
                                            <TableCell>
                                                {new Date(user.created_at).toLocaleDateString("fa-IR-u-ca-persian")}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={ROLE_COLORS[user.role]}>
                                                    {ROLE_LABELS[user.role]}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Select
                                                    value={user.role}
                                                    onValueChange={(value) => handleRoleChange(user.user_id, value as UserRole)}
                                                    disabled={updatingUserId === user.user_id}
                                                >
                                                    <SelectTrigger className="w-[180px]">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="super_admin">
                                                            <div className="flex items-center gap-2">
                                                                <Shield className="w-4 h-4 text-red-500" />
                                                                مدیر ارشد
                                                            </div>
                                                        </SelectItem>
                                                        <SelectItem value="admin">
                                                            <div className="flex items-center gap-2">
                                                                <Shield className="w-4 h-4 text-blue-500" />
                                                                مدیر
                                                            </div>
                                                        </SelectItem>
                                                        <SelectItem value="moderator">
                                                            <div className="flex items-center gap-2">
                                                                <Shield className="w-4 h-4 text-yellow-500" />
                                                                ناظر
                                                            </div>
                                                        </SelectItem>
                                                        <SelectItem value="viewer">
                                                            <div className="flex items-center gap-2">
                                                                <Shield className="w-4 h-4 text-gray-500" />
                                                                بازدیدکننده
                                                            </div>
                                                        </SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </TableCell>
                                            <TableCell>
                                                <Dialog open={resetPasswordUserId === user.user_id} onOpenChange={(open) => !open && setResetPasswordUserId(null)}>
                                                    <DialogTrigger asChild>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => setResetPasswordUserId(user.user_id)}
                                                        >
                                                            <KeyRound className="w-4 h-4 ml-2" />
                                                            ریست رمز
                                                        </Button>
                                                    </DialogTrigger>
                                                    <DialogContent>
                                                        <DialogHeader>
                                                            <DialogTitle>تغییر رمز عبور</DialogTitle>
                                                            <DialogDescription>
                                                                رمز عبور جدید برای کاربر وارد کنید
                                                            </DialogDescription>
                                                        </DialogHeader>
                                                        <div className="space-y-4 py-4">
                                                            <div>
                                                                <Label htmlFor="new-password">رمز عبور جدید</Label>
                                                                <Input
                                                                    id="new-password"
                                                                    type="password"
                                                                    placeholder="حداقل 6 کاراکتر"
                                                                    value={newPassword}
                                                                    onChange={(e) => setNewPassword(e.target.value)}
                                                                />
                                                            </div>
                                                        </div>
                                                        <DialogFooter>
                                                            <Button
                                                                variant="outline"
                                                                onClick={() => {
                                                                    setResetPasswordUserId(null);
                                                                    setNewPassword("");
                                                                }}
                                                            >
                                                                انصراف
                                                            </Button>
                                                            <Button
                                                                onClick={() => handleResetPassword(user.user_id)}
                                                                disabled={resetPasswordMutation.isPending}
                                                            >
                                                                {resetPasswordMutation.isPending ? (
                                                                    <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                                                                ) : null}
                                                                تغییر رمز
                                                            </Button>
                                                        </DialogFooter>
                                                    </DialogContent>
                                                </Dialog>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center text-muted-foreground">
                                            هیچ کاربری یافت نشد
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    <div className="mt-6 p-4 bg-muted rounded-lg">
                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                            <Shield className="w-4 h-4" />
                            توضیحات سطوح دسترسی:
                        </h4>
                        <ul className="space-y-1 text-sm text-muted-foreground">
                            <li><strong>مدیر ارشد:</strong> دسترسی کامل به همه بخش‌ها + مدیریت کاربران</li>
                            <li><strong>مدیر:</strong> مدیریت رزروها، نظرات، قیمت‌ها و روزهای بسته</li>
                            <li><strong>ناظر:</strong> مشاهده رزروها و تایید نظرات</li>
                            <li><strong>بازدیدکننده:</strong> فقط مشاهده (بدون امکان ویرایش)</li>
                        </ul>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
