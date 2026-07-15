export const calendarService = {
  async createHomeSamplingEvent(
    patientName: string,
    address: string,
    scheduledAt: Date
  ): Promise<string> {
    console.log(
      `[Google Calendar] Mock creating event for patient at ${address} on ${scheduledAt}`
    );
    return `mock_gcal_event_${Math.random().toString(36).substring(2, 11)}`;
  },
};
