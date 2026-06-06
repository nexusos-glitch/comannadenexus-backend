export const useAppStore = () => ({
  currentVideoId: '1',
  customUploadedVideos: [],
  youtubeVideos: [{ id: '1', title: 'Demo Video' }],
  memberCoins: 100,
  deductCoins: (amt: number) => {},
  setVideo: (id: string | null) => {}
});
