import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment-jalaali';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { useAllReservations } from '@/hooks/useBooking';
import { Loader2 } from 'lucide-react';

// Setup Jalali Moment
moment.loadPersian({ usePersianDigits: true, dialect: 'persian-modern' });
moment.locale('fa'); // Set locale to Persian

const localizer = momentLocalizer(moment);

const AdminCalendar = () => {
    const { data: reservations, isLoading } = useAllReservations();

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-96">
                <Loader2 className="w-8 h-8 animate-spin text-forest-medium" />
            </div>
        );
    }

    const events = reservations?.map((res: any) => ({
        id: res.id,
        title: `${res.guest_name} - ${res.cabins?.name_fa || 'کلبه'}`,
        start: new Date(res.check_in_date),
        end: new Date(res.check_out_date),
        status: res.status,
        resource: res,
    })) || [];

    const eventStyleGetter = (event: any) => {
        let backgroundColor = '#3174ad';
        if (event.status === 'confirmed') backgroundColor = '#10B981'; // Green
        if (event.status === 'pending') backgroundColor = '#F59E0B'; // Yellow
        if (event.status === 'cancelled') backgroundColor = '#EF4444'; // Red

        return {
            style: {
                backgroundColor,
                borderRadius: '5px',
                opacity: 0.8,
                color: 'white',
                border: '0px',
                display: 'block'
            }
        };
    };

    const formats = {
        monthHeaderFormat: 'jMMMM jYYYY',
        dayHeaderFormat: 'jD jMMMM dddd',
        dayRangeHeaderFormat: ({ start, end }: any, culture: any, localizer: any) =>
            `${localizer.format(start, 'jD jMMMM', culture)} - ${localizer.format(end, 'jD jMMMM', culture)}`,
        agendaDateFormat: 'jD jMMMM dddd',
        agendaTimeRangeFormat: ({ start, end }: any, culture: any, localizer: any) =>
            `${localizer.format(start, 'HH:mm', culture)} - ${localizer.format(end, 'HH:mm', culture)}`,
        dayFormat: 'dddd jD',
        weekdayFormat: 'dddd',
    };

    return (
        <div className="h-[600px] bg-white p-4 rounded-xl shadow-sm font-sans" dir="rtl">
            <Calendar
                localizer={localizer}
                events={events}
                startAccessor="start"
                endAccessor="end"
                style={{ height: 500, fontFamily: 'inherit' }}
                eventPropGetter={eventStyleGetter}
                rtl={true}
                culture="fa"
                formats={formats}
                messages={{
                    next: "بعدی",
                    previous: "قبلی",
                    today: "امروز",
                    month: "ماه",
                    week: "هفته",
                    day: "روز",
                    agenda: "لیست",
                    date: "تاریخ",
                    time: "زمان",
                    event: "رویداد",
                    noEventsInRange: "هیچ رویدادی در این بازه وجود ندارد",
                }}
            />
        </div>
    );
};

export default AdminCalendar;
