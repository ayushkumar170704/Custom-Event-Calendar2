import React, { useState, useEffect, useRef } from 'react';
import { Calendar, Clock, Plus, Edit, Trash2, Search, ChevronLeft, ChevronRight, X, Save, AlertTriangle } from 'lucide-react';

const EventCalendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [showEventForm, setShowEventForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [draggedEvent, setDraggedEvent] = useState(null);
  const [conflicts, setConflicts] = useState([]);
  
  const dragRef = useRef(null);
  const formRef = useRef(null);

  const eventColors = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'
  ];

  // Load events from localStorage on component mount
  useEffect(() => {
    const savedEvents = localStorage.getItem('calendarEvents');
    if (savedEvents) {
      setEvents(JSON.parse(savedEvents));
    }
  }, []);

  // Save events to localStorage whenever events change
  useEffect(() => {
    localStorage.setItem('calendarEvents', JSON.stringify(events));
  }, [events]);

  // Generate calendar days
  const generateCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days = [];
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 41);

    for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
      days.push(new Date(date));
    }

    return days;
  };

  // Generate recurring events
  const generateRecurringEvents = (event) => {
    const recurringEvents = [];
    const startDate = new Date(event.date);
    const endDate = new Date();
    endDate.setFullYear(endDate.getFullYear() + 1); // Generate events for next year

    let currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      if (currentDate > startDate) {
        recurringEvents.push({
          ...event,
          id: `${event.id}_${currentDate.getTime()}`,
          date: currentDate.toISOString().split('T')[0],
          isRecurring: true,
          originalId: event.id
        });
      }

      switch (event.recurrence) {
        case 'daily':
          currentDate.setDate(currentDate.getDate() + 1);
          break;
        case 'weekly':
          currentDate.setDate(currentDate.getDate() + 7);
          break;
        case 'monthly':
          currentDate.setMonth(currentDate.getMonth() + 1);
          break;
        case 'custom':
          currentDate.setDate(currentDate.getDate() + (event.customInterval || 1));
          break;
        default:
          return recurringEvents;
      }
    }

    return recurringEvents;
  };

  // Get all events including recurring ones
  const getAllEvents = () => {
    let allEvents = [...events];
    
    events.forEach(event => {
      if (event.recurrence && event.recurrence !== 'none') {
        allEvents = [...allEvents, ...generateRecurringEvents(event)];
      }
    });

    return allEvents;
  };

  // Get events for a specific date
  const getEventsForDate = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    return getAllEvents().filter(event => event.date === dateStr);
  };

  // Check for conflicts
  const checkConflicts = (newEvent, excludeId = null) => {
    const eventDate = newEvent.date;
    const eventTime = newEvent.time;
    
    return getAllEvents().filter(event => 
      event.id !== excludeId && 
      event.date === eventDate && 
      event.time === eventTime
    );
  };

  // Handle event form submission
  const handleEventSubmit = (eventData) => {
    const conflictingEvents = checkConflicts(eventData, editingEvent?.id);
    
    if (conflictingEvents.length > 0) {
      setConflicts(conflictingEvents);
      return;
    }

    if (editingEvent) {
      setEvents(events.map(event => 
        event.id === editingEvent.id ? { ...eventData, id: editingEvent.id } : event
      ));
    } else {
      const newEvent = {
        ...eventData,
        id: Date.now().toString(),
      };
      setEvents([...events, newEvent]);
    }

    setShowEventForm(false);
    setEditingEvent(null);
    setConflicts([]);
  };

  // Handle event deletion
  const handleDeleteEvent = (eventId) => {
    setEvents(events.filter(event => event.id !== eventId));
    setShowEventForm(false);
    setEditingEvent(null);
  };

  // Handle drag start
  const handleDragStart = (e, event) => {
    setDraggedEvent(event);
    e.dataTransfer.effectAllowed = 'move';
  };

  // Handle drop
  const handleDrop = (e, targetDate) => {
    e.preventDefault();
    if (!draggedEvent) return;

    const newDate = targetDate.toISOString().split('T')[0];
    const conflictingEvents = checkConflicts({...draggedEvent, date: newDate}, draggedEvent.id);
    
    if (conflictingEvents.length > 0) {
      setConflicts(conflictingEvents);
      return;
    }

    if (draggedEvent.isRecurring) {
      // For recurring events, create a new individual event
      const newEvent = {
        ...draggedEvent,
        id: Date.now().toString(),
        date: newDate,
        isRecurring: false,
        originalId: undefined
      };
      setEvents([...events, newEvent]);
    } else {
      // For regular events, update the date
      setEvents(events.map(event =>
        event.id === draggedEvent.id ? { ...event, date: newDate } : event
      ));
    }

    setDraggedEvent(null);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  // Filter events based on search
  const filteredEvents = getAllEvents().filter(event =>
    event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const days = generateCalendarDays();
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center space-x-3">
              <Calendar className="w-8 h-8" />
              <h1 className="text-3xl font-bold">Event Calendar</h1>
            </div>
            <button
              onClick={() => {
                setShowEventForm(true);
                setEditingEvent(null);
                setSelectedDate(new Date());
              }}
              className="flex items-center space-x-2 bg-white text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span>Add Event</span>
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search events..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
          </div>
        </div>

        {/* Calendar Navigation */}
        <div className="flex justify-between items-center p-6 border-b">
          <button
            onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          
          <h2 className="text-2xl font-semibold text-gray-800">
            {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h2>
          
          <button
            onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>

        {/* Calendar Grid */}
        <div className="p-6">
          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-2 mb-4">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center font-semibold text-gray-600 py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-2">
            {days.map((day, index) => {
              const dayStr = day.toISOString().split('T')[0];
              const dayEvents = getEventsForDate(day).filter(event => 
                filteredEvents.some(fe => fe.id === event.id)
              );
              const isCurrentMonth = day.getMonth() === currentDate.getMonth();
              const isToday = dayStr === today;

              return (
                <div
                  key={index}
                  className={`min-h-32 p-2 border rounded-lg transition-colors cursor-pointer ${
                    isCurrentMonth ? 'bg-white hover:bg-gray-50' : 'bg-gray-50 text-gray-400'
                  } ${isToday ? 'ring-2 ring-blue-500 bg-blue-50' : ''}`}
                  onClick={() => {
                    setSelectedDate(day);
                    setShowEventForm(true);
                    setEditingEvent(null);
                  }}
                  onDrop={(e) => handleDrop(e, day)}
                  onDragOver={handleDragOver}
                >
                  <div className="text-sm font-semibold mb-1">{day.getDate()}</div>
                  <div className="space-y-1">
                    {dayEvents.slice(0, 3).map(event => (
                      <div
                        key={event.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, event)}
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingEvent(event);
                          setShowEventForm(true);
                        }}
                        className="text-xs p-1 rounded truncate cursor-move hover:opacity-80 transition-opacity"
                        style={{ backgroundColor: event.color || eventColors[0], color: 'white' }}
                      >
                        {event.time && <Clock className="inline w-3 h-3 mr-1" />}
                        {event.title}
                      </div>
                    ))}
                    {dayEvents.length > 3 && (
                      <div className="text-xs text-gray-500 text-center">
                        +{dayEvents.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Event Form Modal */}
      {showEventForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto" ref={formRef}>
            <EventForm
              event={editingEvent}
              selectedDate={selectedDate}
              onSubmit={handleEventSubmit}
              onCancel={() => {
                setShowEventForm(false);
                setEditingEvent(null);
                setConflicts([]);
              }}
              onDelete={handleDeleteEvent}
              eventColors={eventColors}
              conflicts={conflicts}
              onResolveConflict={() => setConflicts([])}
            />
          </div>
        </div>
      )}
    </div>
  );
};

const EventForm = ({ event, selectedDate, onSubmit, onCancel, onDelete, eventColors, conflicts, onResolveConflict }) => {
  const [formData, setFormData] = useState({
    title: event?.title || '',
    date: event?.date || (selectedDate ? selectedDate.toISOString().split('T')[0] : ''),
    time: event?.time || '',
    description: event?.description || '',
    recurrence: event?.recurrence || 'none',
    customInterval: event?.customInterval || 1,
    color: event?.color || eventColors[0]
  });

  const handleSubmit = () => {
    if (!formData.title.trim()) return;
    onSubmit(formData);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold text-gray-800">
          {event ? 'Edit Event' : 'Add Event'}
        </h3>
        <button onClick={onCancel} className="p-2 hover:bg-gray-100 rounded-lg">
          <X className="w-5 h-5" />
        </button>
      </div>

      {conflicts.length > 0 && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center text-red-800 mb-2">
            <AlertTriangle className="w-5 h-5 mr-2" />
            <span className="font-semibold">Event Conflict Detected!</span>
          </div>
          <p className="text-red-700 text-sm mb-3">
            The following events conflict with your new event:
          </p>
          {conflicts.map(conflict => (
            <div key={conflict.id} className="text-sm text-red-600 mb-1">
              • {conflict.title} at {conflict.time}
            </div>
          ))}
          <button
            onClick={onResolveConflict}
            className="mt-2 px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
          >
            Create Anyway
          </button>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Event Title</label>
          <input
            type="text"
            required
            value={formData.title}
            onChange={(e) => handleChange('title', e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter event title"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
            <input
              type="date"
              required
              value={formData.date}
              onChange={(e) => handleChange('date', e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Time</label>
            <input
              type="time"
              value={formData.time}
              onChange={(e) => handleChange('time', e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter event description"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Recurrence</label>
          <select
            value={formData.recurrence}
            onChange={(e) => handleChange('recurrence', e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="none">No Recurrence</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="custom">Custom</option>
          </select>
        </div>

        {formData.recurrence === 'custom' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Repeat every (days)</label>
            <input
              type="number"
              min="1"
              value={formData.customInterval}
              onChange={(e) => handleChange('customInterval', parseInt(e.target.value))}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
          <div className="flex space-x-2">
            {eventColors.map(color => (
              <button
                key={color}
                type="button"
                onClick={() => handleChange('color', color)}
                className={`w-8 h-8 rounded-full border-2 ${
                  formData.color === color ? 'border-gray-800' : 'border-gray-300'
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>

        <div className="flex justify-between pt-4">
          {event && (
            <button
              type="button"
              onClick={() => onDelete(event.id)}
              className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete</span>
            </button>
          )}
          <div className="flex space-x-3 ml-auto">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>{event ? 'Update' : 'Create'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

function App() {
  return (
    <div className="App">
      <EventCalendar />
    </div>
  );
}

export default App;