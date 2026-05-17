import { useEffect, useState } from "react";
import { socket } from "../utils/socket";

export interface ProgressUpdate {
  jobId: string;
  gameId: string;
  progress: number;
  currentPhase: string;
  details: string;
}

export const useJobProgress = (jobId?: string, gameId?: string) => {
  const [progress, setProgress] = useState<ProgressUpdate | null>(null);
  const [isConnected, setIsConnected] = useState(socket.connected);

  useEffect(() => {
    if (!jobId && !gameId) return;

    function onConnect() {
      setIsConnected(true);
      if (jobId) socket.emit("join_job", jobId);
      if (gameId) socket.emit("join_game", gameId);
    }

    function onDisconnect() {
      setIsConnected(false);
    }

    function onProgressUpdate(update: ProgressUpdate) {
      if ((jobId && update.jobId === jobId) || (gameId && update.gameId === gameId)) {
        setProgress(update);
      }
    }

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("progress_update", onProgressUpdate);

    socket.connect();

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("progress_update", onProgressUpdate);
      if (jobId) socket.emit("leave_job", jobId);
      if (gameId) socket.emit("leave_game", gameId);
      socket.disconnect();
    };
  }, [jobId, gameId]);

  return { progress, isConnected };
};
