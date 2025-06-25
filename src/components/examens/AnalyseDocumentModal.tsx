
"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, Upload, AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { analyzeTestResultPhoto, type AnalyzeTestResultPhotoOutput } from '@/ai/flows/analyze-test-result-photo-flow';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

interface AnalyseDocumentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onComplete: (data: AnalyzeTestResultPhotoOutput) => void;
}

export default function AnalyseDocumentModal({ isOpen, onClose, onComplete }: AnalyseDocumentModalProps) {
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const getCameraPermission = useCallback(async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setHasCameraPermission(false);
      return null;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      setHasCameraPermission(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      return stream;
    } catch (error) {
      setHasCameraPermission(false);
      toast({
        variant: 'destructive',
        title: 'Accès Caméra Refusé',
        description: 'Veuillez autoriser l\'accès à la caméra.',
      });
      return null;
    }
  }, [toast]);

  useEffect(() => {
    let stream: MediaStream | null = null;
    if (isOpen) {
      getCameraPermission().then(s => {
        stream = s;
      });
    }
    return () => {
      stream?.getTracks().forEach(track => track.stop());
    };
  }, [isOpen, getCameraPermission]);

  const captureAndAnalyze = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (video.videoWidth === 0 || video.videoHeight === 0) {
        toast({ title: "Erreur Caméra", description: "La source vidéo n'est pas prête. Veuillez réessayer.", variant: "destructive" });
        return;
      }
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
        const dataUri = canvas.toDataURL('image/jpeg');
        handleAnalysis(dataUri);
      }
    }
  };

  const handleFileAndAnalyze = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUri = e.target?.result as string;
        handleAnalysis(dataUri);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalysis = async (dataUri: string) => {
    setIsLoading(true);
    try {
      const result = await analyzeTestResultPhoto({ photoDataUri: dataUri });
      toast({
        title: "Analyse Réussie",
        description: "Les informations ont été extraites.",
      });
      onComplete(result);
    } catch (error) {
      toast({
        title: "Erreur d'analyse",
        description: "L'IA n'a pas pu analyser le document. Assurez-vous que l'image est claire.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Analyser un Document d'Examen</DialogTitle>
          <DialogDescription>
            Utilisez votre caméra pour prendre une photo d'un résultat d'examen ou importez une image. L'IA extraira les informations.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="relative w-full aspect-[4/3] bg-muted rounded-md overflow-hidden flex items-center justify-center">
            <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
            <canvas ref={canvasRef} className="hidden" />
            {hasCameraPermission === false && (
              <Alert variant="destructive" className="m-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Accès Caméra Requis</AlertTitle>
                <AlertDescription>
                  Veuillez autoriser l'accès à la caméra pour utiliser cette fonctionnalité.
                </AlertDescription>
              </Alert>
            )}
             {isLoading && (
              <div className="absolute inset-0 bg-background/80 flex flex-col items-center justify-center">
                  <Loader2 className="animate-spin h-8 w-8 text-primary" />
                  <p className="mt-2 text-sm text-muted-foreground">Analyse en cours...</p>
              </div>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <Button onClick={captureAndAnalyze} disabled={!hasCameraPermission || isLoading}>
              <Camera className="mr-2" />
              Analyser avec la Caméra
            </Button>
            <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isLoading}>
              <Upload className="mr-2" /> Analyser un Fichier
            </Button>
            <input type="file" ref={fileInputRef} accept="image/*" className="hidden" onChange={handleFileAndAnalyze} />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="secondary" onClick={onClose} disabled={isLoading}>
            Annuler
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
