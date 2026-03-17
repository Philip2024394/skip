import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Mic, Square, Play, Pause, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/shared/components/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface VoiceRecorderProps {
  voiceUrl: string | null;
  userId: string;
  onSaved: (url: string | null) => void;
}

const MAX_DURATION = 30;

const VoiceRecorder = ({ voiceUrl, userId, onSaved }: VoiceRecorderProps) => {
  const [recording, setRecording] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [playProgress, setPlayProgress] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        await uploadVoice(blob);
      };

      mediaRecorder.start();
      setRecording(true);
      setElapsed(0);

      timerRef.current = setInterval(() => {
        setElapsed((prev) => {
          if (prev >= MAX_DURATION - 1) {
            stopRecording();
            return MAX_DURATION;
          }
          return prev + 1;
        });
      }, 1000);
    } catch {
      toast.error("Microphone access denied");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setRecording(false);
  };

  const uploadVoice = async (blob: Blob) => {
    setUploading(true);
    const path = `${userId}/voice-intro.webm`;

    const { error } = await supabase.storage
      .from("voice-intros")
      .upload(path, blob, { upsert: true, contentType: "audio/webm" });

    if (error) {
      toast.error("Upload failed: " + error.message);
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from("voice-intros").getPublicUrl(path);
    // Append cache-buster
    const url = urlData.publicUrl + "?t=" + Date.now();
    onSaved(url);
    setUploading(false);
    toast.success("Voice intro saved! 🎤");
  };

  const deleteVoice = async () => {
    const path = `${userId}/voice-intro.webm`;
    await supabase.storage.from("voice-intros").remove([path]);
    onSaved(null);
    toast.success("Voice intro removed");
  };

  const togglePlay = () => {
    if (!voiceUrl) return;

    if (playing && audioRef.current) {
      audioRef.current.pause();
      setPlaying(false);
      return;
    }

    const audio = new Audio(voiceUrl);
    audioRef.current = audio;

    audio.onended = () => {
      setPlaying(false);
      setPlayProgress(0);
    };

    audio.ontimeupdate = () => {
      if (audio.duration) {
        setPlayProgress((audio.currentTime / audio.duration) * 100);
      }
    };

    audio.play();
    setPlaying(true);
  };

  return (
    <div className="glass rounded-xl p-3 space-y-2">
      <div className="flex items-center gap-2">
        <Mic className="w-4 h-4 text-primary" />
        <p className="text-foreground text-sm font-medium">Voice Intro</p>
        <span className="text-muted-foreground text-[10px]">30 sec max</span>
      </div>

      {recording ? (
        <div className="flex items-center gap-3">
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 1 }}
            className="w-3 h-3 rounded-full bg-destructive"
          />
          <span className="text-foreground text-sm font-mono">{elapsed}s / {MAX_DURATION}s</span>
          <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-destructive rounded-full transition-all"
              style={{ width: `${(elapsed / MAX_DURATION) * 100}%` }}
            />
          </div>
          <Button size="sm" variant="outline" onClick={stopRecording} className="h-7 px-2 border-border">
            <Square className="w-3 h-3" />
          </Button>
        </div>
      ) : uploading ? (
        <div className="flex items-center gap-2 justify-center py-2">
          <Loader2 className="w-4 h-4 animate-spin text-primary" />
          <span className="text-muted-foreground text-xs">Uploading...</span>
        </div>
      ) : voiceUrl ? (
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={togglePlay} className="h-7 px-2 border-border">
            {playing ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
          </Button>
          <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full gradient-love rounded-full transition-all"
              style={{ width: `${playProgress}%` }}
            />
          </div>
          <Button size="sm" variant="outline" onClick={deleteVoice} className="h-7 px-2 border-border text-destructive">
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      ) : (
        <Button
          variant="outline"
          onClick={startRecording}
          className="w-full h-9 text-sm border-border rounded-xl"
        >
          <Mic className="w-4 h-4 mr-2 text-primary" /> Record Voice Intro
        </Button>
      )}
    </div>
  );
};

export default VoiceRecorder;
