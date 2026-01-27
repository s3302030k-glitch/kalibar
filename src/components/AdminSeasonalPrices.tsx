import { useState } from "react";
import { useForm } from "react-hook-form";
import { Loader2, Plus, Pencil, Trash2, Save, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

interface SeasonalPrice {
    id: string;
    cabin_id: number;
    season_name_fa: string;
    season_name_en: string;
    season_type: string;
    start_date: string;
    end_date: string;
    price_irr: number;
    price_usd: number;
    is_active: boolean;
    cabins?: { name_fa: string };
}

interface SeasonalPriceFormData {
    cabin_id: string;
    season_name_fa: string;
    season_name_en: string;
    season_type: string;
    start_date: string;
    end_date: string;
    price_irr: number;
    price_usd: number;
}

// SeasonType from DB: 'off_season' | 'regular' | 'high_season' | 'peak' | 'special'
const seasonTypes = [
    { value: "off_season", label: "خارج فصل" },
    { value: "regular", label: "معمولی" },
    { value: "high_season", label: "فصل شلوغ" },
    { value: "peak", label: "اوج فصل" },
    { value: "special", label: "ویژه" },
];

const AdminSeasonalPrices = () => {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingPrice, setEditingPrice] = useState<SeasonalPrice | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [priceToDelete, setPriceToDelete] = useState<string | null>(null);

    const queryClient = useQueryClient();
    const { data: cabins } = useAllCabins();

    const { register, handleSubmit, reset, setValue, watch } = useForm<SeasonalPriceFormData>({
        defaultValues: {
            cabin_id: "",
            season_name_fa: "",
            season_name_en: "",
            season_type: "peak",
            start_date: "",
            end_date: "",
            price_irr: 0,
            price_usd: 0,
        }
    });

    // Fetch seasonal prices
    const { data: prices, isLoading } = useQuery({
        queryKey: ["seasonal-prices"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("seasonal_prices")
                .select("*, cabins:cabin_id(name_fa)")
                .order("start_date", { ascending: true });

            if (error) throw error;
            return data as unknown as SeasonalPrice[];
        }
    });

    // Create mutation
    const createMutation = useMutation({
        mutationFn: async (data: SeasonalPriceFormData) => {
            const { error } = await supabase.from("seasonal_prices").insert({
                cabin_id: parseInt(data.cabin_id),
                season_name_fa: data.season_name_fa,
                season_name_en: data.season_name_en,
                season_type: data.season_type as "off_season" | "regular" | "high_season" | "peak" | "special",
                start_date: data.start_date,
                end_date: data.end_date,
                price_irr: data.price_irr,
                price_usd: data.price_usd,
            });
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["seasonal-prices"] });
            toast.success("قیمت فصلی با موفقیت ایجاد شد");
            setIsDialogOpen(false);
            reset();
        },
        onError: () => toast.error("خطا در ایجاد قیمت فصلی")
    });

    // Update mutation
    const updateMutation = useMutation({
        mutationFn: async ({ id, data }: { id: string; data: SeasonalPriceFormData }) => {
            const { error } = await supabase.from("seasonal_prices")
                .update({
                    cabin_id: parseInt(data.cabin_id),
                    season_name_fa: data.season_name_fa,
                    season_name_en: data.season_name_en,
                    season_type: data.season_type as "off_season" | "regular" | "high_season" | "peak" | "special",
                    start_date: data.start_date,
                    end_date: data.end_date,
                    price_irr: data.price_irr,
                    price_usd: data.price_usd,
                })
                .eq("id", id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["seasonal-prices"] });
            toast.success("قیمت فصلی با موفقیت ویرایش شد");
            setIsDialogOpen(false);
            reset();
        },
        onError: () => toast.error("خطا در ویرایش قیمت فصلی")
    });

    // Delete mutation
    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from("seasonal_prices").delete().eq("id", id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["seasonal-prices"] });
            toast.success("قیمت فصلی با موفقیت حذف شد");
        },
        onError: () => toast.error("خطا در حذف قیمت فصلی")
    });

    const formatPrice = (price: number) => new Intl.NumberFormat("fa-IR").format(price);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("fa-IR-u-ca-persian");
    };

    const getSeasonLabel = (type: string) => {
        return seasonTypes.find(s => s.value === type)?.label || type;
    };

    const openCreateDialog = () => {
        setEditingPrice(null);
        reset({
            cabin_id: "",
            season_name_fa: "",
            season_name_en: "",
            season_type: "peak",
            start_date: "",
            end_date: "",
            price_irr: 0,
            price_usd: 0,
        });
        setIsDialogOpen(true);
    };

    const openEditDialog = (price: SeasonalPrice) => {
        setEditingPrice(price);
        reset({
            cabin_id: price.cabin_id.toString(),
            season_name_fa: price.season_name_fa,
            season_name_en: price.season_name_en,
            season_type: price.season_type,
            start_date: price.start_date,
            end_date: price.end_date,
            price_irr: price.price_irr,
            price_usd: price.price_usd,
        });
        setIsDialogOpen(true);
    };

    const onSubmit = (data: SeasonalPriceFormData) => {
        if (editingPrice) {
            updateMutation.mutate({ id: editingPrice.id, data });
        } else {
            createMutation.mutate(data);
        }
    };

    const handleDeleteClick = (id: string) => {
        setPriceToDelete(id);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = () => {
        if (priceToDelete) {
            deleteMutation.mutate(priceToDelete);
        }
        setDeleteDialogOpen(false);
        setPriceToDelete(null);
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
                    <Calendar className="w-5 h-5 text-forest-medium" />
                    <h3 className="font-bold text-lg">قیمت‌های فصلی</h3>
                </div>
                <Button onClick={openCreateDialog} className="bg-forest-medium hover:bg-forest-deep">
                    <Plus className="w-4 h-4 ml-2" />
                    افزودن قیمت فصلی
                </Button>
            </div>

            {prices && prices.length > 0 ? (
                <Table dir="rtl">
                    <TableHeader>
                        <TableRow>
                            <TableHead>نام فصل</TableHead>
                            <TableHead>کلبه</TableHead>
                            <TableHead>تاریخ شروع</TableHead>
                            <TableHead>تاریخ پایان</TableHead>
                            <TableHead>قیمت (تومان)</TableHead>
                            <TableHead>عملیات</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {prices.map((price) => (
                            <TableRow key={price.id}>
                                <TableCell>{price.season_name_fa}</TableCell>
                                <TableCell>{price.cabins?.name_fa || "-"}</TableCell>
                                <TableCell>{formatDate(price.start_date)}</TableCell>
                                <TableCell>{formatDate(price.end_date)}</TableCell>
                                <TableCell>{formatPrice(price.price_irr)}</TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => openEditDialog(price)}
                                        >
                                            <Pencil className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="text-destructive border-destructive hover:bg-destructive/10"
                                            onClick={() => handleDeleteClick(price.id)}
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
                    هنوز قیمت فصلی تعریف نشده است
                </div>
            )}

            {/* Create/Edit Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>
                            {editingPrice ? "ویرایش قیمت فصلی" : "افزودن قیمت فصلی"}
                        </DialogTitle>
                    </DialogHeader>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div className="space-y-2">
                            <Label>کلبه *</Label>
                            <Select
                                value={watch("cabin_id")}
                                onValueChange={(v) => setValue("cabin_id", v)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="انتخاب کلبه" />
                                </SelectTrigger>
                                <SelectContent>
                                    {cabins?.map((cabin) => (
                                        <SelectItem key={cabin.id} value={cabin.id.toString()}>
                                            {cabin.name_fa}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="season_name_fa">نام فارسی *</Label>
                                <Input
                                    id="season_name_fa"
                                    {...register("season_name_fa", { required: true })}
                                    placeholder="تعطیلات نوروز"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="season_name_en">نام انگلیسی *</Label>
                                <Input
                                    id="season_name_en"
                                    {...register("season_name_en", { required: true })}
                                    placeholder="Nowruz Holiday"
                                    dir="ltr"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>نوع فصل *</Label>
                            <Select
                                value={watch("season_type")}
                                onValueChange={(v) => setValue("season_type", v)}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {seasonTypes.map((season) => (
                                        <SelectItem key={season.value} value={season.value}>
                                            {season.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="start_date">تاریخ شروع *</Label>
                                <Input
                                    id="start_date"
                                    type="date"
                                    {...register("start_date", { required: true })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="end_date">تاریخ پایان *</Label>
                                <Input
                                    id="end_date"
                                    type="date"
                                    {...register("end_date", { required: true })}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="price_irr">قیمت (تومان) *</Label>
                                <Input
                                    id="price_irr"
                                    type="number"
                                    {...register("price_irr", { required: true, valueAsNumber: true })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="price_usd">قیمت (دلار) *</Label>
                                <Input
                                    id="price_usd"
                                    type="number"
                                    {...register("price_usd", { required: true, valueAsNumber: true })}
                                />
                            </div>
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
                                disabled={createMutation.isPending || updateMutation.isPending}
                            >
                                {(createMutation.isPending || updateMutation.isPending) && (
                                    <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                                )}
                                <Save className="w-4 h-4 ml-2" />
                                {editingPrice ? "ذخیره تغییرات" : "ایجاد"}
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
                            این قیمت فصلی حذف خواهد شد.
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

export default AdminSeasonalPrices;
