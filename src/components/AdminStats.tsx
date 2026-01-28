import { useAllReservations } from '@/hooks/useBooking';
import { Loader2, DollarSign, Users, Calendar } from 'lucide-react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell
} from 'recharts';

const AdminStats = () => {
    const { data: reservations, isLoading } = useAllReservations();

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-forest-medium" />
            </div>
        );
    }

    // 1. Calculate Total Revenue
    const totalRevenue = reservations?.reduce((acc: number, curr: any) => {
        return acc + (curr.payment_status === 'paid' ? (curr.final_price_irr || 0) : 0);
    }, 0) || 0;

    // 2. Calculate Occupancy by Cabin (Simple count of bookings)
    const occupancyData = reservations?.reduce((acc: any, curr: any) => {
        const cabinName = curr.cabins?.name_fa || 'Unknown';
        if (!acc[cabinName]) acc[cabinName] = 0;
        acc[cabinName] += 1;
        return acc;
    }, {}) || {};

    const pieData = Object.keys(occupancyData).map(key => ({
        name: key,
        value: occupancyData[key]
    }));

    // 3. Revenue by Month
    const revenueByMonth = reservations?.reduce((acc: any, curr: any) => {
        if (curr.payment_status !== 'paid') return acc;
        const month = new Date(curr.created_at).toLocaleDateString('fa-IR', { month: 'long' });
        if (!acc[month]) acc[month] = 0;
        acc[month] += (curr.final_price_irr || 0);
        return acc;
    }, {}) || {};

    const barData = Object.keys(revenueByMonth).map(key => ({
        name: key,
        revenue: revenueByMonth[key]
    }));

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

    return (
        <div className="space-y-8" dir="rtl">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-6 rounded-xl shadow-sm border flex items-center gap-4">
                    <div className="p-3 bg-green-100 text-green-600 rounded-full">
                        <DollarSign className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">درآمد کل</p>
                        <h3 className="text-xl font-bold">{totalRevenue.toLocaleString()} ریال</h3>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border flex items-center gap-4">
                    <div className="p-3 bg-blue-100 text-blue-600 rounded-full">
                        <Calendar className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">تعداد کل رزروها</p>
                        <h3 className="text-xl font-bold">{reservations?.length || 0}</h3>
                    </div>
                </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Revenue Chart */}
                <div className="bg-white p-6 rounded-xl shadow-sm border">
                    <h3 className="text-lg font-bold mb-4">درآمد ماهانه (ریال)</h3>
                    <div className="h-[300px]" dir="ltr">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={barData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip formatter={(value) => Number(value).toLocaleString()} />
                                <Bar dataKey="revenue" fill="#10B981" name="درآمد" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Occupancy Chart */}
                <div className="bg-white p-6 rounded-xl shadow-sm border">
                    <h3 className="text-lg font-bold mb-4">سهم رزرو کلبه‌ها</h3>
                    <div className="h-[300px]" dir="ltr">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={100}
                                    fill="#8884d8"
                                    dataKey="value"
                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                >
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminStats;
