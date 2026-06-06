import React, { useState, useEffect, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import { createClient } from '@supabase/supabase-js';
import { useAppStore } from './store/useAppStore';
import { useVideoProgress } from './hooks/useVideoProgress';
import { toast } from 'sonner';

// Modular Imports
import { VideoCanvas } from './components/VideoCanvas';
import { ControlBar } from './components/ControlBar';
import { VideoInfo } from './components/VideoInfo';
import { CommentEngine } from './components/CommentEngine';
import { SideIntelligence } from './components/SideIntelligence';
import { GiftModal } from './components/GiftModal';
import { RealTimeGiftNotifier } from './RealTimeGiftNotifier';

// =================================================================
// NEXUS CLIENT UTILITY
// Handles the communication between this App (Node) and the Hub (CommandNexus)
// =================================================================
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const NexusClient = {
  async sendHeartbeat(nodeId: string, metrics: Record<string, number>) {
    try {
      const { error } = await supabase.rpc('handle_heartbeat', {
        node_id: nodeId,
        metrics: metrics
      });
      if (error) throw error;
      return { success: true };
    } catch (err) {
      console.error(`[Nexus] Heartbeat failed for ${nodeId}:`, err);
      return { success: false, error: err };
    }
  },

  async fetchConfigs(nodeId: string) {
    try {
      const { data, error } = await supabase
        .from('configs')
        .select('config_key, config_value')
        .eq('node_id', nodeId);

      if (error) throw error;

      const configMap: Record<string, string> = {};
      data?.forEach(item => {
        configMap[item.config_key] = item.config_value;
      });
      return configMap;
    } catch (err) {
      console.error(`[Nexus] Config fetch failed for ${nodeId}:`, err);
      return null;
    }
  }
};

// =================================================================
// MAIN PAGE COMPONENT
// =================================================================
export const VideoPlayerPage: React.FC = () => {
  const store = useAppStore();
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // --- HUB CONFIGURATION ---
  const NODE_ID = "video-app-01"; 
  const [hubConfig, setHubConfig] = useState<Record<string, string>>({});

  // --- STATE MANAGEMENT ---
  const [isPlaying, setIsPlaying] = useState(true);
  const [vol, setVol] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isBuffering, setIsBuffering] = useState(false);
  const [isTheater, setIsTheater] = useState(false);
  const [showGiftModal, setShowGiftModal] = useState(false);
  const [showControls, setShowControls] = useState(true);

  const { getProgress, saveProgress } = useVideoProgress(store.currentVideoId, videoRef, true);

  // Resolve Current Video
  const currentVideo = React.useMemo(() => {
    const all = [...store.customUploadedVideos, ...store.youtubeVideos];
    return all.find(v => v.id === store.currentVideoId) || all[0];
  }, [store.customUploadedVideos, store.youtubeVideos, store.currentVideoId]);

  // =================================================================
  // NEXUS HUB INTEGRATION LOOPS
  // =================================================================

  // LOOP 1: SYNC CONFIGS (Listen for Hub Tweaks)
  useEffect(() => {
    const syncConfigs = async () => {
      const configs = await NexusClient.fetchConfigs(NODE_ID);
      if (configs) {
        setHubConfig(configs);
        // Applying "Tweaks" from the Hub to the App's CSS/Behavior
        if (configs.accent_color) {
          document.documentElement.style.setProperty('--primary', configs.accent_color);
        }
      }
    };

    syncConfigs(); // Initial sync on load
    const interval = setInterval(syncConfigs, 60000); // Update tweaks every minute
    return () => clearInterval(interval);
  }, []);

  // LOOP 2: TELEMETRY STREAM (Report Health to Hub)
  useEffect(() => {
    const sendTelemetry = async () => {
      // Collecting operational data to send to CommandNexus Dashboard
      const metrics = {
        active_users: Math.floor(Math.random() * 100), // Replace with real analytics if available
        buffer_rate: isBuffering ? 1 : 0,
        playback_progress: Math.round((currentTime / (duration || 1)) * 100),
        cpu_stress: Math.random() * 10, // Simulated stress metric
      };

      await NexusClient.sendHeartbeat(NODE_ID, metrics);
    };

    const interval = setInterval(sendTelemetry, 30000); // Ping the hub every 30 seconds
    return () => clearInterval(interval);
  }, [isBuffering, currentTime, duration]);

  // =================================================================
  // CORE LOGIC HANDLERS
  // =================================================================
  const togglePlay = () => {
    if (videoRef.current) {
      isPlaying ? videoRef.current.pause() : videoRef.current.play().catch(() => {});
      setIsPlaying(!isPlaying);
    }
  };

  const handleSeek = (time: number) => {
    setCurrentTime(time);
    if (videoRef.current) videoRef.current.currentTime = time;
  };

  return (
    <div className="p-4 md:p-8 space-y-8 bg-black min-h-screen text-white font-sans">
      {/* Navigation */}
      <div className="flex items-center gap-2 text-muted-foreground hover:text-white transition-colors cursor-pointer mb-2" onClick={() => store.setVideo(null)}>
        <span className="text-[10px] uppercase font-black tracking-widest">← Return to Nexus Hub</span>
      </div>

      <div className={`grid grid-cols-1 gap-8 ${isTheater ? "grid-cols-1" : "lg:grid-cols-3"}`}>
        
        {/* COLUMN 1: THE MEDIA CORE */}
        <div className={`${isTheater ? "col-span-1" : "lg:col-span-2"} space-y-6`}>
          <div 
            className={`relative bg-neutral-950 rounded-[2.5rem] border border-white/5 overflow-hidden group shadow-2xl transition-all ${isTheater ? "aspect-[21/9] w-full" : "aspect-video"}`}
            onMouseMove={() => setShowControls(true)}
          >
            <RealTimeGiftNotifier isLiveStream={false} />
            
            <VideoCanvas 
              videoRef={videoRef}
              currentVideo={currentVideo}
              isPlaying={isPlaying}
              isMuted={isMuted}
              vol={vol}
              isBuffering={isBuffering}
              setIsBuffering={setIsBuffering}
              setCurrentTime={setCurrentTime}
              setDuration={setDuration}
              onPlayToggle={togglePlay}
            />

            <ControlBar 
              showControls={showControls}
              currentTime={currentTime}
              duration={duration}
              isPlaying={isPlaying}
              onPlayToggle={togglePlay}
              onSeek={handleSeek}
              vol={vol}
              setVol={setVol}
              isMuted={isMuted}
              setIsMuted={setIsMuted}
              setIsTheater={setIsTheater}
              isTheater={isTheater}
            />
          </div>

          <VideoInfo 
            video={currentVideo} 
            onOpenGifts={() => setShowGiftModal(true)} 
          />

          <CommentEngine video={currentVideo} />
        </div>

        {/* COLUMN 2: INTELLIGENCE SIDEBAR */}
        <div className="lg:col-span-1 space-y-6">
          <SideIntelligence 
            videos={[...store.customUploadedVideos, ...store.youtubeVideos]} 
            currentId={store.currentVideoId}
            onVideoSelect={(id) => store.setVideo(id)}
          />
        </div>
      </div>

      <GiftModal 
        isOpen={showGiftModal} 
        onClose={() => setShowGiftModal(false)} 
        memberCoins={store.memberCoins}
        deductCoins={store.deductCoins}
      />
    </div>
  );
};
