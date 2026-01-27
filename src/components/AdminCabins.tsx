import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Loader2, Plus, Pencil, Trash2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
    useAllCabins,
    useCreateCabin,
    useUpdateCabin,
    useDeleteCabin,
    useToggleCabinAvailability,
} from "@/hooks/useCabins";
import type { Cabin, CabinInsert, CabinUpdate } from "@/integrations/supabase/types";
import { toast } from "sonner";

interface CabinFormData {
    name_fa: string;
    name_en: string;
    slug: string;
    description_fa: string;
    description_en: string;
    capacity: number;
    size_sqm: number;
    base_price_irr: number;
    base_price_usd: number;
    features_fa: string;
    features_en: string;
    images: string;
    sort_order: number;
}

const AdminCabins = () => {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingCabin, setEditingCabin] = useState<Cabin | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [cabinToDelete, setCabinToDelete] = useState<number | null>(null);

    const {
        data: cabins,
        isLoading,
        isError,
        refetch
    } = useAllCabins();

    const createCabin = useCreateCabin();
    const updateCabin = useUpdateCabin();
    const deleteCabin = useDeleteCabin();
    const toggleAvailability = useToggleCabinAvailability();

    const { register, handleSubmit, reset, setValue } = useForm<CabinFormData>({
        defaultValues: {
            name_fa: "",
            name_en: "",
            slug: "",
            description_fa: "",
            description_en: "",
            capacity: 2,
            size_sqm: 60,
            base_price_irr: 0,
            base_price_usd: 0,
            features_fa: "",
            features_en: "",
            images: "",
            sort_order: 0,
        }
    });

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat("fa-IR").format(price);
    };

    const openCreateDialog = () => {
        setEditingCabin(null);
        reset({
            name_fa: "",
            name_en: "",
            slug: "",
            description_fa: "",
            description_en: "",
            capacity: 2,
            size_sqm: 60,
            base_price_irr: 0,
            base_price_usd: 0,
            features_fa: "",
            features_en: "",
            images: "",
            sort_order: cabins?.length || 0,
        });
        setIsDialogOpen(true);
    };

    const openEditDialog = (cabin: Cabin) => {
        setEditingCabin(cabin);
        reset({
            name_fa: cabin.name_fa,
            name_en: cabin.name_en,
            slug: cabin.slug || "",
            description_fa: cabin.description_fa || "",
            description_en: cabin.description_en || "",
            capacity: cabin.capacity,
            size_sqm: cabin.size_sqm,
            base_price_irr: cabin.base_price_irr,
            base_price_usd: Number(cabin.base_price_usd),
            features_fa: (cabin.features_fa || []).join("\n"),
            features_en: (cabin.features_en || []).join("\n"),
            images: (cabin.images || []).join("\n"),
            sort_order: cabin.sort_order || 0,
        });
        setIsDialogOpen(true);
    };

    const onSubmit = async (data: CabinFormData) => {
        try {
            const cabinData = {
                name_fa: data.name_fa,
                name_en: data.name_en,
                slug: data.slug || data.name_en.toLowerCase().replace(/\s+/g, "-"),
                description_fa: data.description_fa,
                description_en: data.description_en,
                capacity: data.capacity,
                size_sqm: data.size_sqm,
                base_price_irr: data.base_price_irr,
                base_price_usd: data.base_price_usd,
                features_fa: data.features_fa.split("\n").filter(f => f.trim()),
                features_en: data.features_en.split("\n").filter(f => f.trim()),
                images: data.images.split("\n").filter(i => i.trim()),
                sort_order: data.sort_order,
            };

            if (editingCabin) {
                await updateCabin.mutateAsync({
                    id: editingCabin.id,
                    updates: cabinData as CabinUpdate,
                });
                toast.success("کلبه با موفقیت ویرایش شد");
            } else {
                await createCabin.mutateAsync(cabinData as CabinInsert);
                toast.success("کلبه با موفقیت ایجاد شد");
            }

            setIsDialogOpen(false);
            reset();
        } catch (error) {
            console.error("Error saving cabin:", error);
            toast.error("خطا در ذخیره کلبه");
        }
    };

    const handleDeleteClick = (cabinId: number) => {
        setCabinToDelete(cabinId);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!cabinToDelete) return;

        try {
            await deleteCabin.mutateAsync(cabinToDelete);
            toast.success("کلبه با موفقیت حذف شد");
        } catch (error) {
            console.error("Error deleting cabin:", error);
            toast.error("خطا در حذف کلبه");
        } finally {
            setDeleteDialogOpen(false);
            setCabinToDelete(null);
        }
    };

    const handleToggleAvailability = async (cabinId: number, currentStatus: boolean) => {
        try {
            await toggleAvailability.mutateAsync({
                id: cabinId,
                is_available: !currentStatus
            });
            toast.success(currentStatus ? "کلبه غیرفعال شد" : "کلبه فعال شد");
        } catch (error) {
            console.error("Error toggling availability:", error);
            toast.error("خطا در تغییر وضعیت");
        }
    };

    if (isLoading) {
        return (
            <div className="p-8 text-center">
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-forest-medium" />
            </div>
        );
    }

    if (isError) {
        return (
            <div className="glass-card rounded-xl p-8 text-center flex flex-col items-center gap-4">
                <p className="text-destructive">خطا در دریافت لیست کلبه‌ها</p>
                <Button onClick={() => refetch()} variant="outline">
                    تلاش مجدد
                </Button>
            </div>
        );
    }

    return (
        <div className="glass-card rounded-xl overflow-hidden">
            <div className="p-4 border-b flex items-center justify-between">
                <h3 className="font-bold text-lg">مدیریت کلبه‌ها</h3>
                <Button onClick={openCreateDialog} className="bg-forest-medium hover:bg-forest-deep">
                    <Plus className="w-4 h-4 ml-2" />
                    افزودن کلبه
                </Button>
            </div>

            {cabins && cabins.length > 0 ? (
                <Table dir="rtl">
                    <TableHeader>
                        <TableRow>
                            <TableHead>نام</TableHead>
                            <TableHead>ظرفیت</TableHead>
                            <TableHead>متراژ</TableHead>
                            <TableHead>قیمت (تومان)</TableHead>
                            <TableHead>وضعیت</TableHead>
                            <TableHead>عملیات</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {cabins.map((cabin) => (
                            <TableRow key={cabin.id}>
                                <TableCell>
                                    <div>
                                        <p className="font-medium">{cabin.name_fa}</p>
                                        <p className="text-xs text-muted-foreground">{cabin.name_en}</p>
                                    </div>
                                </TableCell>
                                <TableCell>{cabin.capacity.toLocaleString("fa-IR")} نفر</TableCell>
                                <TableCell>{cabin.size_sqm.toLocaleString("fa-IR")} متر</TableCell>
                                <TableCell>{formatPrice(cabin.base_price_irr)}</TableCell>
                                <TableCell>
                                    <div dir="ltr" className="flex justify-end pr-4">
                                        <Switch
                                            checked={cabin.is_available}
                                            onCheckedChange={() => handleToggleAvailability(cabin.id, cabin.is_available)}
                                        />
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => openEditDialog(cabin)}
                                        >
                                            <Pencil className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="text-destructive border-destructive hover:bg-destructive/10"
                                            onClick={() => handleDeleteClick(cabin.id)}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            ) : (
                <div className="p-8 text-center text-muted-foreground">
                    هنوز کلبه‌ای ثبت نشده است
                </div>
            )}

            {/* Create/Edit Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            {editingCabin ? "ویرایش کلبه" : "افزودن کلبه جدید"}
                        </DialogTitle>
                    </DialogHeader>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="name_fa">نام فارسی *</Label>
                                <Input
                                    id="name_fa"
                                    {...register("name_fa", { required: true })}
                                    placeholder="کلبه ویلایی"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="name_en">نام انگلیسی *</Label>
                                <Input
                                    id="name_en"
                                    {...register("name_en", { required: true })}
                                    placeholder="Villa Cabin"
                                    dir="ltr"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="slug">Slug (آدرس صفحه)</Label>
                            <Input
                                id="slug"
                                {...register("slug")}
                                placeholder="villa-cabin"
                                dir="ltr"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="capacity">ظرفیت (نفر) *</Label>
                                <Input
                                    id="capacity"
                                    type="number"
                                    {...register("capacity", { required: true, valueAsNumber: true })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="size_sqm">متراژ (متر مربع) *</Label>
                                <Input
                                    id="size_sqm"
                                    type="number"
                                    {...register("size_sqm", { required: true, valueAsNumber: true })}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="base_price_irr">قیمت پایه (تومان) *</Label>
                                <Input
                                    id="base_price_irr"
                                    type="number"
                                    {...register("base_price_irr", { required: true, valueAsNumber: true })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="base_price_usd">قیمت پایه (دلار) *</Label>
                                <Input
                                    id="base_price_usd"
                                    type="number"
                                    {...register("base_price_usd", { required: true, valueAsNumber: true })}
                                    dir="ltr"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="description_fa">توضیحات فارسی</Label>
                                <Textarea
                                    id="description_fa"
                                    {...register("description_fa")}
                                    rows={3}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="description_en">توضیحات انگلیسی</Label>
                                <Textarea
                                    id="description_en"
                                    {...register("description_en")}
                                    rows={3}
                                    dir="ltr"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="features_fa">امکانات فارسی (هر خط یکی)</Label>
                                <Textarea
                                    id="features_fa"
                                    {...register("features_fa")}
                                    rows={4}
                                    placeholder="آشپزخانه کامل&#10;سه اتاق خواب&#10;سالن بزرگ"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="features_en">امکانات انگلیسی (هر خط یکی)</Label>
                                <Textarea
                                    id="features_en"
                                    {...register("features_en")}
                                    rows={4}
                                    dir="ltr"
                                    placeholder="Full kitchen&#10;Three bedrooms&#10;Large living room"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="images">آدرس تصاویر (هر خط یکی)</Label>
                            <Textarea
                                id="images"
                                {...register("images")}
                                rows={3}
                                dir="ltr"
                                placeholder="https://example.com/image1.jpg&#10;https://example.com/image2.jpg"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="sort_order">ترتیب نمایش</Label>
                            <Input
                                id="sort_order"
                                type="number"
                                {...register("sort_order", { valueAsNumber: true })}
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
                                disabled={createCabin.isPending || updateCabin.isPending}
                            >
                                {(createCabin.isPending || updateCabin.isPending) && (
                                    <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                                )}
                                <Save className="w-4 h-4 ml-2" />
                                {editingCabin ? "ذخیره تغییرات" : "ایجاد کلبه"}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>آیا مطمئن هستید؟</AlertDialogTitle>
                        <AlertDialogDescription>
                            این عمل غیرقابل بازگشت است. کلبه به همراه تمام اطلاعات مرتبط حذف خواهد شد.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-2">
                        <AlertDialogCancel>انصراف</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteConfirm}
                            className="bg-destructive hover:bg-destructive/90"
                        >
                            حذف کلبه
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default AdminCabins;
