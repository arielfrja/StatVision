import { useEffect, useState } from "react";
import { getDatabase, ref, onValue, off } from "firebase/database";
import { app } from "../firebase-config";

export interface ProgressUpdate {
  jobId: string;
  gameId: string;
  progress: number;
  status: string;
  details: string;
}

/**
 * useJobProgress Hook
 * 
 * Replaces Socket.io with Firebase Realtime Database for production scaling.
 * Listens to the `/jobs/{jobId}` path for live status and progress updates.
 */
export const useJobProgress = (jobId?: string, gameId?: string) => {
  const [progress, setProgress] = useState<ProgressUpdate | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // If we have a gameId but no jobId, we might want to list jobs for that game.
    // For now, we prioritize listening to a specific jobId if provided.
    const targetId = jobId || gameId;
    if (!targetId) return;

    const db = getDatabase(app);
    const jobRef = ref(db, `jobs/${targetId}`);

    setIsConnected(true);

    const unsubscribe = onValue(jobRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setProgress({
          jobId: targetId,
          gameId: data.gameId || '',
          progress: data.progress || 0,
          status: data.status || 'PENDING',
          details: data.details || ''
        });
      }
    }, (error) => {
      console.error("[Firebase_Hook_Error]", error);
      setIsConnected(false);
    });

    return () => {
      off(jobRef);
      setIsConnected(false);
    };
  }, [jobId, gameId]);

  return { progress, isConnected };
};
