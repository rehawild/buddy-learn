export interface Participant {
  id: string;
  name: string;
  initials: string;
  color: string;
  isMuted: boolean;
  isCameraOff: boolean;
  isSelf?: boolean;
}

export const fakeParticipants: Participant[] = [
  { id: "self", name: "You", initials: "YO", color: "hsl(168 60% 48%)", isMuted: false, isCameraOff: false, isSelf: true },
  { id: "p1", name: "Sarah Chen", initials: "SC", color: "hsl(280 60% 55%)", isMuted: true, isCameraOff: false },
  { id: "p2", name: "Alex Rivera", initials: "AR", color: "hsl(28 90% 58%)", isMuted: false, isCameraOff: true },
  { id: "p3", name: "Jordan Park", initials: "JP", color: "hsl(200 70% 50%)", isMuted: true, isCameraOff: false },
  { id: "p4", name: "Prof. Williams", initials: "PW", color: "hsl(340 65% 50%)", isMuted: false, isCameraOff: false },
];

export const fakeChatMessages = [
  { sender: "Sarah Chen", text: "Can everyone see the slides?", time: "2:01 PM" },
  { sender: "Prof. Williams", text: "Yes, looks good!", time: "2:01 PM" },
  { sender: "Jordan Park", text: "👍", time: "2:02 PM" },
  { sender: "Alex Rivera", text: "Ready when you are", time: "2:02 PM" },
];
