'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';

interface AnnouncementFormState {
  text: string;
  backgroundColor: string;
  textColor: string;
  isEnabled: boolean;
}

export default function AnnouncementPage() {
  const [announcement, setAnnouncement] = useState<AnnouncementFormState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchAnnouncement();
  }, []);

  const fetchAnnouncement = async () => {
    try {
      const response = await fetch('/api/announcement');
      const data = await response.json();
      if (data.announcement) {
        const { text, backgroundColor, textColor, isEnabled } = data.announcement;
        setAnnouncement({ text, backgroundColor, textColor, isEnabled });
      } else {
        // Set default values if no announcement exists
        setAnnouncement({
          text: 'Site-ul este în construcție. Vă mulțumim pentru înțelegere!',
          backgroundColor: '#FBBF24',
          textColor: '#000000',
          isEnabled: false,
        });
      }
    } catch (error) {
      console.error('Error fetching announcement:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch announcement settings',
        variant: 'destructive',
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!announcement) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/announcement', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(announcement),
      });

      if (!response.ok) throw new Error('Failed to update announcement');

      toast({
        title: 'Success',
        description: 'Announcement settings updated successfully',
      });
    } catch (error) {
      console.error('Error updating announcement:', error);
      toast({
        title: 'Error',
        description: 'Failed to update announcement settings',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!announcement) return null;

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Announcement Bar Settings</h1>
      
      <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
        <div className="space-y-2">
          <Label htmlFor="enabled">Enable Announcement Bar</Label>
          <Switch
            id="enabled"
            checked={announcement.isEnabled}
            onCheckedChange={(checked) =>
              setAnnouncement({ ...announcement, isEnabled: checked })
            }
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="text">Announcement Text</Label>
          <Input
            id="text"
            value={announcement.text}
            onChange={(e) =>
              setAnnouncement({ ...announcement, text: e.target.value })
            }
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="backgroundColor">Background Color</Label>
            <div className="flex gap-2">
              <Input
                id="backgroundColor"
                type="color"
                value={announcement.backgroundColor}
                onChange={(e) =>
                  setAnnouncement({
                    ...announcement,
                    backgroundColor: e.target.value,
                  })
                }
                required
              />
              <Input
                value={announcement.backgroundColor}
                onChange={(e) =>
                  setAnnouncement({
                    ...announcement,
                    backgroundColor: e.target.value,
                  })
                }
                placeholder="#000000"
                className="font-mono"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="textColor">Text Color</Label>
            <div className="flex gap-2">
              <Input
                id="textColor"
                type="color"
                value={announcement.textColor}
                onChange={(e) =>
                  setAnnouncement({
                    ...announcement,
                    textColor: e.target.value,
                  })
                }
                required
              />
              <Input
                value={announcement.textColor}
                onChange={(e) =>
                  setAnnouncement({
                    ...announcement,
                    textColor: e.target.value,
                  })
                }
                placeholder="#FFFFFF"
                className="font-mono"
              />
            </div>
          </div>
        </div>

        <div className="pt-4">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>

      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-4">Preview</h2>
        <div
          className="w-full py-2 text-center font-medium"
          style={{
            backgroundColor: announcement.backgroundColor,
            color: announcement.textColor,
          }}
        >
          {announcement.text}
        </div>
      </div>
    </div>
  );
} 
