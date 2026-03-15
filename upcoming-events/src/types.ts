export interface MeetupEventNode {
  id: string;
  title: string;
  eventUrl: string;
  description?: string;
  dateTime: string;
  endTime: string;
  status: string;
  featuredEventPhoto?: { highResUrl?: string };
  displayPhoto?: { highResUrl?: string };
}

export interface MeetupEvent {
  id: string;
  title: string;
  eventUrl: string;
  description: string;
  dateTime: string;
  endTime: string;
  status: string;
  imageUrl?: string;
}
