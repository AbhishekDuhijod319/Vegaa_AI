import * as React from "react";
import { Calendar } from "@/components/ui/calendar";
import { addDays } from "date-fns";

export function CalendarRange({ value, onChange }) {
    const [dateRange, setDateRange] = React.useState(value);

    React.useEffect(() => {
        if (value) {
            setDateRange(value);
        }
    }, [value]);

    const handleSelect = (range) => {
        setDateRange(range);
        if (onChange) {
            onChange(range);
        }
    };

    return (
        <div className="bg-white/60 dark:bg-black/40 backdrop-blur-xl rounded-xl shadow-lg border border-white/10 p-4 transition-all duration-300">
            <Calendar
                mode="range"
                defaultMonth={dateRange?.from}
                selected={dateRange}
                onSelect={handleSelect}
                numberOfMonths={2}
                className="rounded-lg"
            />
        </div>
    );
}
