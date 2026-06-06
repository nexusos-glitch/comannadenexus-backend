import { RefObject } from 'react';
export const useVideoProgress = (id: string, ref: RefObject<HTMLVideoElement | null>, b: boolean) => ({
  getProgress: () => 0,
  saveProgress: () => {}
});
