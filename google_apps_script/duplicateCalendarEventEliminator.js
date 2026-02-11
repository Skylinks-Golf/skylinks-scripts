
function syncCalendarEvents() {
    var sourceCalendarId = "c_36bfd12a3644a341939a1f0aa2b73821f7409c053f776dc607cd3923383f4961@group.calendar.google.com"; 
    var destinationCalendarId = "c_d41119d4699ea8cac73f667ba57aed2a8e0849e9983445939ce729a1a7578d5c@group.calendar.google.com";

    var sourceCalendar = CalendarApp.getCalendarById(sourceCalendarId);
    var destinationCalendar = CalendarApp.getCalendarById(destinationCalendarId);

    if (!sourceCalendar || !destinationCalendar) {
        Logger.log("Error: One or both calendar IDs are incorrect.");
        return;
    }

    var now = new Date();
    var futureDate = new Date();
    futureDate.setDate(now.getDate() + 180); // Adjust as needed (sync events for the next 30 days)

    var sourceEvents = sourceCalendar.getEvents(now, futureDate);
    var destinationEvents = destinationCalendar.getEvents(now, futureDate);

    // Build a map of source events by title
    var sourceEventMap = {};
    sourceEvents.forEach(event => {
        sourceEventMap[event.getTitle()] = {
            startTime: event.getStartTime(),
            endTime: event.getEndTime(),
            location: event.getLocation(),
            description: event.getDescription(),
            guests: event.getGuestList().map(guest => guest.getEmail()).join(",")
        };
    });

    // Sync existing events in destination calendar
    destinationEvents.forEach(event => {
        var title = event.getTitle();

        if (sourceEventMap[title]) {
            var sourceEvent = sourceEventMap[title];

            // Check if start/end times differ, if so, update the event
            if (event.getStartTime().getTime() !== sourceEvent.startTime.getTime() ||
                event.getEndTime().getTime() !== sourceEvent.endTime.getTime()) {

                event.setTime(sourceEvent.startTime, sourceEvent.endTime);
                event.setLocation(sourceEvent.location);
                event.setDescription(sourceEvent.description);

                Logger.log("Updated event: " + title);
            }

            // Remove from the map to keep track of processed events
            delete sourceEventMap[title];
        } else {
            // Event exists in destination but not in source, so delete it
            event.deleteEvent();
            Logger.log("Deleted event: " + title);
        }
    });

    // Add new events from source that were not processed (i.e., don't exist in destination)
    for (var title in sourceEventMap) {
        var sourceEvent = sourceEventMap[title];

        destinationCalendar.createEvent(
            title,
            sourceEvent.startTime,
            sourceEvent.endTime,
            {
                location: sourceEvent.location,
                description: sourceEvent.description,
                guests: sourceEvent.guests
            }
        );
        Logger.log("Added new event: " + title);
    }
}