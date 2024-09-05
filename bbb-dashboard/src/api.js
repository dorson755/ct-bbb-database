import sha1 from 'sha1';

const BBB_BASE_URL = "https://bbb.cybertech242-online.com/bigbluebutton/api";
const BBB_SECRET = "6e5qNuCuwbboDlxnEqHNn74XdCil07gDuAqDNLp9y4";

// Utility function to generate the checksum
const generateChecksum = (apiCall) => {
    return sha1(apiCall + BBB_SECRET);
};

// Get active meetings
export const getMeetings = async () => {
    const apiCall = 'getMeetings';
    const checksum = generateChecksum(`${apiCall}`);
    const url = `${BBB_BASE_URL}/${apiCall}?checksum=${checksum}`;

    const response = await fetch(url);
    const data = await response.text();
    return new window.DOMParser().parseFromString(data, "text/xml");
};

// Join a meeting
export const joinMeeting = async (meetingID, fullName, password) => {
    const apiCall = `join?fullName=${fullName}&meetingID=${meetingID}&password=${password}`;
    const checksum = generateChecksum(apiCall);
    const url = `${BBB_BASE_URL}/${apiCall}&checksum=${checksum}`;

    window.location.href = url; // Redirect to meeting
};

// End a meeting
export const endMeeting = async (meetingID, moderatorPW) => {
    const apiCall = `end?meetingID=${meetingID}&password=${moderatorPW}`;
    const checksum = generateChecksum(apiCall);
    const url = `${BBB_BASE_URL}/${apiCall}&checksum=${checksum}`;

    const response = await fetch(url);
    return response.text();
};
