import { google } from 'googleapis';
import { env } from '../config/env.js';
const getOAuthClient = (redirectUri) => {
    return new google.auth.OAuth2(env.GOOGLE_CLIENT_ID, env.GOOGLE_CLIENT_SECRET, redirectUri || env.GOOGLE_REDIRECT_URI);
};
export const calendarService = {
    getAuthUrl(state, isCalendar) {
        const redirectUri = isCalendar
            ? env.GOOGLE_REDIRECT_URI.replace('/google/callback', '/google/calendar/callback')
            : env.GOOGLE_REDIRECT_URI;
        const oauth2Client = getOAuthClient(redirectUri);
        const scopes = isCalendar
            ? ['https://www.googleapis.com/auth/calendar.events', 'https://www.googleapis.com/auth/userinfo.email']
            : ['openid', 'email', 'profile'];
        return oauth2Client.generateAuthUrl({
            access_type: 'offline',
            prompt: 'consent',
            scope: scopes,
            state: state,
        });
    },
    async getTokensFromCode(code, isCalendar = false) {
        const redirectUri = isCalendar
            ? env.GOOGLE_REDIRECT_URI.replace('/google/callback', '/google/calendar/callback')
            : env.GOOGLE_REDIRECT_URI;
        const oauth2Client = getOAuthClient(redirectUri);
        const { tokens } = await oauth2Client.getToken(code);
        return tokens;
    },
    async getGoogleProfile(accessToken) {
        const oauth2Client = getOAuthClient();
        oauth2Client.setCredentials({ access_token: accessToken });
        const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
        const { data } = await oauth2.userinfo.get();
        return data;
    },
    async getCalendarClient(refreshToken) {
        const oauth2Client = getOAuthClient();
        oauth2Client.setCredentials({ refresh_token: refreshToken });
        return google.calendar({ version: 'v3', auth: oauth2Client });
    },
    async createHomeSamplingEvent(refreshToken, patientName, address, scheduledAt) {
        const calendar = await this.getCalendarClient(refreshToken);
        const start = new Date(scheduledAt);
        const end = new Date(start.getTime() + 60 * 60 * 1000); // 1 hour duration
        const response = await calendar.events.insert({
            calendarId: 'primary',
            requestBody: {
                summary: `LabLink AI Home Sampling: ${patientName}`,
                description: `Home sampling collection appointment.\nAddress: ${address}`,
                start: { dateTime: start.toISOString() },
                end: { dateTime: end.toISOString() },
            },
        });
        return response.data.id || '';
    },
    async createPatientInLabEvent(refreshToken, testNames, scheduledAt) {
        const calendar = await this.getCalendarClient(refreshToken);
        const start = new Date(scheduledAt);
        const end = new Date(start.getTime() + 60 * 60 * 1000); // 1 hour duration
        const response = await calendar.events.insert({
            calendarId: 'primary',
            requestBody: {
                summary: `LabLink AI Appointment: ${testNames.join(', ')}`,
                description: `Your in-lab booking is scheduled.\nTests: ${testNames.join(', ')}`,
                start: { dateTime: start.toISOString() },
                end: { dateTime: end.toISOString() },
            },
        });
        return response.data.id || '';
    },
    async deleteEvent(refreshToken, eventId) {
        const calendar = await this.getCalendarClient(refreshToken);
        try {
            await calendar.events.delete({
                calendarId: 'primary',
                eventId: eventId,
            });
        }
        catch (err) {
            if (err.code !== 410 && err.code !== 404) {
                throw err;
            }
        }
    },
    async checkFreeBusy(refreshToken, email, start, end) {
        const oauth2Client = getOAuthClient();
        oauth2Client.setCredentials({ refresh_token: refreshToken });
        const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
        const response = await calendar.freebusy.query({
            requestBody: {
                timeMin: start.toISOString(),
                timeMax: end.toISOString(),
                items: [{ id: 'primary' }],
            },
        });
        const calendars = response.data.calendars;
        if (calendars && calendars['primary'] && calendars['primary'].busy) {
            return calendars['primary'].busy.length > 0;
        }
        return false;
    }
};
