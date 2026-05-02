import { useState, useRef, useCallback } from 'react';
import { RecordingStatus } from '../types';

export const useAudioRecorder = () => {
  const [recordingStatus, setRecordingStatus] = useState<RecordingStatus>(RecordingStatus.IDLE);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = () => {
        if (!mediaRecorderRef.current) return;
        const blob = new Blob(audioChunksRef.current, { type: mediaRecorderRef.current.mimeType });
        const url = URL.createObjectURL(blob);
        setAudioBlob(blob);
        setAudioURL(url);
        setRecordingStatus(RecordingStatus.STOPPED);
        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setRecordingStatus(RecordingStatus.RECORDING);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Microphone access was denied. Please allow microphone access in your browser settings to use this feature.");
      setRecordingStatus(RecordingStatus.IDLE);
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && recordingStatus === RecordingStatus.RECORDING) {
      mediaRecorderRef.current.stop();
    }
  }, [recordingStatus]);

  const resetRecording = useCallback(() => {
    setAudioURL(null);
    setAudioBlob(null);
    setRecordingStatus(RecordingStatus.IDLE);
    audioChunksRef.current = [];
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current = null;
    }
  }, []);

  return {
    recordingStatus,
    audioURL,
    audioBlob,
    startRecording,
    stopRecording,
    resetRecording,
  };
};