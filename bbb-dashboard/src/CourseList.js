import React, { useState, useEffect } from 'react';
import { getMeetings, joinMeeting, endMeeting } from './api';

const CourseList = () => {
    const [courses, setCourses] = useState([
        { id: '1702', name: 'DATABASE PROCESSING (Spring 2024)', meetingID: null, isActive: false, participants: 0 }
        // Add other courses here with bbb-context-id
    ]);

    // Fetch active meetings on load
    useEffect(() => {
        const fetchMeetings = async () => {
            const data = await getMeetings();
            const meetings = Array.from(data.getElementsByTagName('meeting'));

            // Update course status based on active meetings
            setCourses(prevCourses =>
                prevCourses.map(course => {
                    const meeting = meetings.find(
                        meeting => meeting.getElementsByTagName('bbb-context-id')[0]?.textContent === course.id
                    );

                    if (meeting) {
                        return {
                            ...course,
                            isActive: true,
                            meetingID: meeting.getElementsByTagName('meetingID')[0]?.textContent,
                            participants: meeting.getElementsByTagName('participantCount')[0]?.textContent || 0
                        };
                    } else {
                        return { ...course, isActive: false, participants: 0 };
                    }
                })
            );
        };

        fetchMeetings();
    }, []);

    const handleJoin = (meetingID) => {
        joinMeeting(meetingID, 'Your Name', 'attendee-password');
    };

    const handleEnd = (meetingID) => {
        endMeeting(meetingID, 'moderator-password').then((result) => {
            console.log('Meeting ended:', result);
            // Optionally refetch meetings
        });
    };

    return (
        <div>
            <h1>Course List</h1>
            <ul>
                {courses.map(course => (
                    <li key={course.id}>
                        <span>{course.name}</span>
                        <span style={{ marginLeft: '10px', color: course.isActive ? 'green' : 'red' }}>
                            {course.isActive ? '🟢' : '🔴'}
                        </span>
                        {course.isActive && <span style={{ marginLeft: '10px' }}>Participants: {course.participants}</span>}
                        {course.isActive ? (
                            <>
                                <button onClick={() => handleJoin(course.meetingID)}>Join Class</button>
                                <button onClick={() => handleEnd(course.meetingID)}>End Class</button>
                            </>
                        ) : (
                            <button disabled>No Active Class</button>
                        )}
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default CourseList;
