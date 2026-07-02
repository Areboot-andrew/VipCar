'use client';

import React, { useState } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import uk from 'date-fns/locale/uk';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Calendar as CalendarIcon, Clock, MapPin, User, Car as CarIcon, FileText } from 'lucide-react';

const locales = {
  'uk': uk,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

type Car = {
  id: string;
  make: string;
  model: string;
};

type Booking = {
  id: string;
  carId: string;
  routeFrom: string;
  routeTo: string;
  dateStart: string;
  dateEnd: string;
  client: { name: string, phone: string | null };
  status: string;
};

export default function DashboardCalendar({ cars, bookings }: { cars: Car[], bookings: Booking[] }) {
  const [selectedEvent, setSelectedEvent] = useState<any>(null);

  // Map bookings to react-big-calendar event format
  const events = bookings.map(b => {
    const car = cars.find(c => c.id === b.carId);
    return {
      id: b.id,
      title: `${car ? car.make + ' ' + car.model : 'Авто'} | ${b.client.name}`,
      start: new Date(b.dateStart),
      end: new Date(b.dateEnd),
      allDay: false,
      resource: b,
      car: car
    };
  });

  const eventStyleGetter = (event: any, start: Date, end: Date, isSelected: boolean) => {
    let backgroundColor = '#1b1b1c';
    let borderColor = 'rgba(255,255,255,0.1)';
    let color = '#fff';

    if (event.resource.status === 'CONFIRMED' || event.resource.status === 'COMPLETED') {
      backgroundColor = '#e9c349';
      color = '#000';
      borderColor = '#d4af37';
    } else if (event.resource.status === 'CANCELLED') {
      backgroundColor = 'rgba(255,0,0,0.2)';
      color = '#ff4444';
      borderColor = 'rgba(255,0,0,0.3)';
    } else {
      backgroundColor = 'rgba(233,195,73,0.15)';
      color = '#e9c349';
      borderColor = 'rgba(233,195,73,0.4)';
    }

    return {
      style: {
        backgroundColor,
        color,
        border: `1px solid ${borderColor}`,
        borderRadius: '8px',
        opacity: 0.9,
        fontWeight: 'bold' as const,
        display: 'block'
      }
    };
  };

  return (
    <div className="bg-[#13131a] rounded-3xl border border-white/5 overflow-hidden shadow-2xl flex flex-col mb-12">
      
      {/* Header */}
      <div className="p-6 border-b border-white/5 flex items-center justify-between bg-[#080818]">
        <div className="flex items-center gap-3">
          <CalendarIcon className="text-[#e9c349]" size={28} />
          <h2 className="text-2xl font-bold text-white m-0 tracking-wide">Календар Бронювань</h2>
        </div>
      </div>

      {/* Calendar Area */}
      <div className="p-6 h-[700px] custom-calendar-wrapper">
        <style>{`
          .rbc-calendar { font-family: inherit; color: #c7c6ca; }
          .rbc-toolbar button { color: #fff; background: rgba(255,255,255,0.05); border-radius: 8px; border: 1px solid rgba(255,255,255,0.1); transition: all 0.2s; margin-right: 8px; }
          .rbc-toolbar button:hover { background: rgba(233,195,73,0.1); color: #e9c349; border-color: rgba(233,195,73,0.3); }
          .rbc-toolbar button.rbc-active { background: #e9c349; color: #000; border-color: #d4af37; font-weight: bold; }
          .rbc-header { padding: 10px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; font-size: 12px; border-bottom: 1px solid rgba(255,255,255,0.1); }
          .rbc-month-view, .rbc-time-view, .rbc-agenda-view { border: 1px solid rgba(255,255,255,0.05); border-radius: 12px; overflow: hidden; background: #080818; }
          .rbc-day-bg + .rbc-day-bg { border-left: 1px solid rgba(255,255,255,0.05); }
          .rbc-month-row + .rbc-month-row { border-top: 1px solid rgba(255,255,255,0.05); }
          .rbc-off-range-bg { background: rgba(255,255,255,0.02); }
          .rbc-today { background: rgba(233,195,73,0.05); }
          .rbc-event { transition: transform 0.2s; }
          .rbc-event:hover { transform: scale(1.02); z-index: 10; }
          .rbc-time-content { border-top: 1px solid rgba(255,255,255,0.05); }
          .rbc-time-header-content { border-left: 1px solid rgba(255,255,255,0.05); }
          .rbc-timeslot-group { border-bottom: 1px solid rgba(255,255,255,0.02); }
          .rbc-time-view .rbc-allday-cell { border-bottom: 1px solid rgba(255,255,255,0.05); }
        `}</style>

        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          culture="uk"
          messages={{
            next: "Наступний",
            previous: "Попередній",
            today: "Сьогодні",
            month: "Місяць",
            week: "Тиждень",
            day: "День",
            agenda: "Список",
            date: "Дата",
            time: "Час",
            event: "Рейс",
            noEventsInRange: "Немає бронювань у цьому періоді."
          }}
          eventPropGetter={eventStyleGetter}
          onSelectEvent={(event) => setSelectedEvent(event)}
          views={['month', 'week', 'day', 'agenda']}
          defaultView="week"
        />
      </div>

      {/* Selected Event Details (Modal/Overlay replacement) */}
      {selectedEvent && (
        <div className="p-6 bg-[#1a1a24] border-t border-white/10 flex flex-col md:flex-row gap-8 items-center relative">
          <button onClick={() => setSelectedEvent(null)} className="absolute top-4 right-4 text-[#8a8a93] hover:text-white">✕</button>
          
          <div className="flex-1">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <FileText className="text-[#e9c349]" size={20} />
              Деталі бронювання
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-[#8a8a93] mb-1 flex items-center gap-1"><User size={12}/> Клієнт</p>
                <p className="text-white font-bold text-sm">{selectedEvent.resource.client.name}</p>
                <p className="text-[#c7c6ca] text-xs">{selectedEvent.resource.client.phone}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-[#8a8a93] mb-1 flex items-center gap-1"><CarIcon size={12}/> Авто</p>
                <p className="text-white font-bold text-sm">{selectedEvent.car?.make} {selectedEvent.car?.model}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-[#8a8a93] mb-1 flex items-center gap-1"><MapPin size={12}/> Маршрут</p>
                <p className="text-white font-bold text-sm truncate">{selectedEvent.resource.routeFrom}</p>
                <p className="text-[#c7c6ca] text-xs truncate">➔ {selectedEvent.resource.routeTo}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-[#8a8a93] mb-1 flex items-center gap-1"><Clock size={12}/> Час</p>
                <p className="text-white font-bold text-sm">{new Date(selectedEvent.start).toLocaleString('uk-UA', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</p>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col gap-2 shrink-0">
             <div className="text-center p-2 rounded-lg bg-black/50 border border-white/5">
                <p className="text-[10px] uppercase tracking-widest text-[#8a8a93] mb-1">Статус</p>
                <p className={`font-bold text-sm ${selectedEvent.resource.status === 'CONFIRMED' ? 'text-[#e9c349]' : selectedEvent.resource.status === 'PENDING' ? 'text-white' : 'text-red-400'}`}>
                  {selectedEvent.resource.status}
                </p>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
