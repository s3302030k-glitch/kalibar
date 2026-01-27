import { useState } from "react";
import { useForm } from "react-hook-form";
import { Loader2, Plus, Trash2, Save, Ban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useAllCabins } from "@/hooks/useCabins";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface BlockedDate {
    id: string;
    date: string;
    reason_fa: string | null;
    reason_en: string | null;
    cabin_id: number | null;
    cabins?: { name_fa: string } | null;
}

interface BlockedDateFormData {
    cabin_id: string;
    date: string;
    reason_fa: string;
    reason_en: string;
}

const AdminBlockedDates = () => {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [dateToDelete, setDateToDelete] = useState<string | null>(null);

    const queryClient = useQueryClient();
    const { data: cabins } = useAllCabins();

    const { register, handleSubmit, reset, setValue, watch } = useForm<BlockedDateFormData>({
        defaultValues: {
            cabin_id: "all",
            date: "",
            reason_fa: "",
            reason_en: "",
        }
    });

    // Fetch blocked dates
    const { data: blockedDates, isLoading } = useQuery({
        queryKey: ["blocked-dates"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("blocked_dates")
                .select("*, cabins:cabin_id(name_fa)")
                .order("date", { ascending: true });

            if (error) throw error;
            return data as unknown as BlockedDate[];
        }
    });

    // Create mutation
    const createMutation = useMutation({
        mutationFn: async (data: BlockedDateFormData) => {
            const { error } = await supabase.from("blocked_dates").insert({
                cabin_id: data.cabin_id === "all" ? null : parseInt(data.cabin_id),
                date: data.date,
                reason_fa: data.reason_fa || null,
                reason_en: data.reason_en || null,
            });
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["blocked-dates"] });
            toast.success("روز مسدود با موفقیت ثبت شد");
            setIsDialogOpen(false);
            reset();
        },
        onError: () => toast.error("خطا در ثبت روز مسدود")
    });

    // Delete mutation
    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from("blocked_dates").delete().eq("id", id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["blocked-dates"] });
            toast.success("روز مسدود حذف شد");
        },
        onError: () => toast.error("خطا در حذف روز مسدود")
    });

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("fa-IR-u-ca-persian");
    };

    const openCreateDialog = () => {
        reset({
            cabin_id: "all",
            date: "",
            reason_fa: "",
            reason_en: "",
        });
        setIsDialogOpen(true);
    };

    const onSubmit = (data: BlockedDateFormData) => {
        createMutation.mutate(data);
    };

    const handleDeleteClick = (id: string) => {
        setDateToDelete(id);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = () => {
        if (dateToDelete) {
            deleteMutation.mutate(dateToDelete);
        }
        setDeleteDialogOpen(false);
        setDateToDelete(null);
    };

    if (isLoading) {
        return (
            <div className="p-8 text-center">
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-forest-medium" />
            </div>
        );
    }

    return (
        <div className="glass-card rounded-xl overflow-hidden">
            <div className="p-4 border-b flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Ban className="w-5 h-5 text-destructive" />
                    <h3 className="font-bold text-lg">روزهای مسدود</h3>
                </div>
                <Button onClick={openCreateDialog} className="bg-forest-medium hover:bg-forest-deep">
                    <Plus className="w-4 h-4 ml-2" />
                    افزودن روز مسدود
                </Button>
            </div>

            {blockedDates && blockedDates.length > 0 ? (
                <Table dir="rtl">
                    <TableHeader>
                        <TableRow>
                            <TableHead>تاریخ</TableHead>
                            <TableHead>کلبه</TableHead>
                            <TableHead>دلیل</TableHead>
                            <TableHead>عملیات</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {blockedDates.map((item) => (
                            <TableRow key={item.id}>
                                <TableCell>{formatDate(item.date)}</TableCell>
                                <TableCell>
                                    {item.cabins?.name_fa || (
                                        <span className="text-muted-foreground">همه کلبه‌ها</span>
                                    )}
                                </TableCell>
                                <TableCell>{item.reason_fa || "-"}</TableCell>
                                <TableCell>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="text-destructive border-destructive hover:bg-destructive/10"
                                        onClick={() => handleDeleteClick(item.id)}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            ) : (
                <div className="p-8 text-center text-muted-foreground">
                    هیچ روز مسدودی ثبت نشده است
                </div>
            )}

            {/* Create Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>افزودن روز مسدود</DialogTitle>
                    </DialogHeader>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div className="space-y-2">
                            <Label>کلبه</Label>
                            <Select
                                value={watch("cabin_id")}
                                onValueChange={(v) => setValue("cabin_id", v)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="انتخاب کلبه" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">همه کلبه‌ها</SelectItem>
                                    {cabins?.map((cabin) => (
                                        <SelectItem key={cabin.id} value={cabin.id.toString()}>
                                            {cabin.name_fa}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="date">تاریخ *</Label>
                            <Input
                                id="date"
                                type="date"
                                {...register("date", { required: true })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="reason_fa">دلیل فارسی (اختیاری)</Label>
                            <Textarea
                                id="reason_fa"
                                {...register("reason_fa")}
                                placeholder="مثلاً: تعمیرات، رزرو خصوصی"
                                rows={2}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="reason_en">دلیل انگلیسی (اختیاری)</Label>
                            <Textarea
                                id="reason_en"
                                {...register("reason_en")}
                                placeholder="e.g., Maintenance, Private booking"
                                rows={2}
                                dir="ltr"
                            />
                        </div>

                        <div className="flex justify-end gap-3 pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsDialogOpen(false)}
                            >
                                انصراف
                            </Button>
                            <Button
                                type="submit"
                                className="bg-forest-medium hover:bg-forest-deep"
                                disabled={createMutation.isPending}
                            >
                                {createMutation.isPending && (
                                    <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                                )}
                                <Save className="w-4 h-4 ml-2" />
                                ثبت
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>آیا مطمئن هستید؟</AlertDialogTitle>
                        <AlertDialogDescription>
                            این روز مسدود حذف خواهد شد.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-2">
                        <AlertDialogCancel>انصراف</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteConfirm}
                            className="bg-destructive hover:bg-destructive/90"
                        >
                            حذف
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default AdminBlockedDates;
