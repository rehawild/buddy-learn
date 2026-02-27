export interface Participant {
  id: string;
  name: string;
  initials: string;
  color: string;
  isMuted: boolean;
  isCameraOff: boolean;
  isSelf?: boolean;
}
