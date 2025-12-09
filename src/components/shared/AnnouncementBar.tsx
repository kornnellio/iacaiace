'use client';

import { useEffect, useState } from 'react';
import { IAnnouncementBar } from '@/lib/database/models/models';

export const AnnouncementBar = () => {
  const [announcement, setAnnouncement] = useState<IAnnouncementBar | null>(null);

  useEffect(() => {
    const fetchAnnouncement = async () => {
      try {
        const response = await fetch('/api/announcement');
        const data = await response.json();
        if (data.announcement) {
          setAnnouncement(data.announcement);
        }
      } catch (error) {
        console.error('Error fetching announcement:', error);
      }
    };

    fetchAnnouncement();
  }, []);

  useEffect(() => {
    // Set the CSS variable for the announcement bar height
    document.documentElement.style.setProperty(
      '--announcement-height',
      announcement?.isEnabled ? '40px' : '0px'
    );

    return () => {
      document.documentElement.style.setProperty('--announcement-height', '0px');
    };
  }, [announcement?.isEnabled]);

  if (!announcement?.isEnabled) return null;

  return (
    <div 
      className="fixed top-0 left-0 w-full h-[40px] py-2 text-center z-[40] font-medium"
      style={{
        backgroundColor: announcement.backgroundColor,
        color: announcement.textColor
      }}
    >
      {announcement.text}
    </div>
  );
}; 