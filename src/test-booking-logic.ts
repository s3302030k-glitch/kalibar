
// Helper: Get booked dates for calendar
const getBookedDates = (reservations: { check_in_date: string; check_out_date: string }[]): Date[] => {
    const bookedDates: Date[] = [];

    reservations.forEach((reservation) => {
        // Parse YYYY-MM-DD manually to ensure local midnight and avoid UTC shifts
        const [startYear, startMonth, startDay] = reservation.check_in_date.split('-').map(Number);
        const [endYear, endMonth, endDay] = reservation.check_out_date.split('-').map(Number);

        // Create dates using local time constructor (Month is 0-indexed)
        const checkIn = new Date(startYear, startMonth - 1, startDay);
        const checkOut = new Date(endYear, endMonth - 1, endDay);

        const currentDate = new Date(checkIn);
        while (currentDate < checkOut) {
            bookedDates.push(new Date(currentDate));
            currentDate.setDate(currentDate.getDate() + 1);
        }
    });

    return bookedDates;
};

// Helper: Check if a date is booked
const isDateBooked = (date: Date, bookedDates: Date[]): boolean => {
    return bookedDates.some(
        (bookedDate) =>
            bookedDate.getFullYear() === date.getFullYear() &&
            bookedDate.getMonth() === date.getMonth() &&
            bookedDate.getDate() === date.getDate()
    );
};

console.log("---------------------------------------------------");
console.log("🧪 GAP RESERVATION LOGIC TEST");
console.log("---------------------------------------------------");

// Scenario:
// Booking A: 7-8 (Check-in 7, Check-out 8). Occupies 7.
// Booking B: 9-13 (Check-in 9, Check-out 13). Occupies 9, 10, 11, 12.
// Gap: 8 (Free).
// Target Booking: 8-9.

const reservations = [
    { check_in_date: "2026-01-27", check_out_date: "2026-01-28" }, // "7-8 Bahman" (Approx Jan 27-28)
    { check_in_date: "2026-01-29", check_out_date: "2026-02-01" }  // "9-13 Bahman" (Approx Jan 29+)
];

const bookedDates = getBookedDates(reservations);
const startDates = reservations.map(r => {
    const [y, m, d] = r.check_in_date.split('-').map(Number);
    return new Date(y, m - 1, d);
});

console.log(`📅 Generated ${bookedDates.length} booked dates.`);
console.log(`🚀 Generated ${startDates.length} start dates.`);

// Target Gap Booking: Check-in 28th (8 Bahman), Check-out 29th (9 Bahman)
const gapCheckIn = new Date(2026, 0, 28); // Jan 28
const gapCheckOut = new Date(2026, 0, 29); // Jan 29

function testDate(d: Date, label: string) {
    const isBooked = isDateBooked(d, bookedDates);
    const isNextCheckIn = isDateBooked(d, startDates);

    // BookingModal Logic:
    // if (isBooked && !isNextCheckIn) { disabled }
    const isDisabled = isBooked && !isNextCheckIn;

    console.log(`\nTesting ${label} (${d.toDateString()}):`);
    console.log(`   - Is Booked? ${isBooked}`);
    console.log(`   - Is Start Date? ${isNextCheckIn}`);
    console.log(`   - DISABLED? ${isDisabled}  <-- CRITICAL CHECK`);
}

// 1. Can I select Jan 28 as Check-in?
testDate(gapCheckIn, "Gap Check-in (Jan 28)");

// 2. Can I select Jan 29 as Check-out?
testDate(gapCheckOut, "Gap Check-out (Jan 29)");

console.log("---------------------------------------------------");
