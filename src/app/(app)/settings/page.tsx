
"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useAuth } from '@/context/AuthContext';
import useLocalStorage from '@/hooks/useLocalStorage';
import { useToast } from '@/hooks/use-toast';
import { APP_INFO } from '@/lib/constants';
import Link from 'next/link';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { EmailConfigSchema } from '@/lib/schemas';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ShieldCheck, Mail, RotateCcw, Info, Brain, Download, Upload, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

// Specific schema for the PIN form on the settings page
const settingsPinFormSchema = z.object({
  pin: z.string().min(4, "Le PIN doit comporter au moins 4 chiffres.").max(8, "Le PIN ne doit pas dépasser 8 chiffres."),
  confirmPin: z.string().min(4, "La confirmation du PIN est requise."),
}).refine(data => data.pin === data.confirmPin, {
    message: "Les PINs ne correspondent pas.",
    path: ["confirmPin"],
});

type PinFormData = z.infer<typeof settingsPinFormSchema>;
type EmailFormData = { email: string };

const backupKeys = ['consultations', 'medications', 'appointments', 'medicalTests', 'patients', 'vitalRecords', 'backupEmail', 'app-pin', 'app-lock-enabled'];
const dataKeysToReset = ['consultations', 'medications', 'appointments', 'medicalTests', 'patients', 'vitalRecords', 'backupEmail'];


export default function SettingsPage() {
  const { isLockEnabled, toggleLockFeature, setPin: setAuthPin, pin: currentPin } = useAuth();
  const [backupEmail, setBackupEmail] = useLocalStorage<string>('backupEmail', '');
  const { toast } = useToast();
  
  const [isImportConfirmOpen, setIsImportConfirmOpen] = useState(false);
  const [dataToImport, setDataToImport] = useState<string | null>(null);
  const importFileInputRef = React.useRef<HTMLInputElement>(null);

  const pinForm = useForm<PinFormData>({
    resolver: zodResolver(settingsPinFormSchema),
    defaultValues: { pin: '', confirmPin: '' },
  });

  const emailForm = useForm<EmailFormData>({
    resolver: zodResolver(EmailConfigSchema),
    defaultValues: { email: backupEmail || '' },
  });
  
  React.useEffect(() => {
    emailForm.setValue('email', backupEmail);
  }, [backupEmail, emailForm]);


  const handleToggleLock = (checked: boolean) => {
    if (checked && !currentPin) {
      toast({ title: "Aucun PIN défini", description: "Veuillez d'abord définir un PIN.", variant: "destructive" });
      return;
    }
    toggleLockFeature(checked);
    toast({ title: `Verrouillage ${checked ? 'activé' : 'désactivé'}` });
  };

  const handleSetPin = (data: PinFormData) => {
    setAuthPin(data.pin);
    pinForm.reset();
    toast({ title: "PIN mis à jour", description: "Votre PIN a été modifié avec succès." });
  };
  
  const handleSetBackupEmail = (data: EmailFormData) => {
    setBackupEmail(data.email);
    toast({ title: "Email de sauvegarde mis à jour", description: `Sauvegarde configurée pour ${data.email}.` });
  };

  const handleResetData = () => {
    dataKeysToReset.forEach(key => {
      localStorage.removeItem(key);
    });
    toast({ title: "Données Réinitialisées", description: "Toutes les données de l'application ont été effacées (sauf le PIN).", variant:"destructive" });
    setTimeout(() => window.location.reload(), 1000);
  };

  const handleExportData = () => {
    try {
      const backupData: { [key: string]: any } = {};
      backupKeys.forEach(key => {
        const item = localStorage.getItem(key);
        if (item !== null) {
          backupData[key] = JSON.parse(item);
        }
      });
      
      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(backupData, null, 2))}`;
      const link = document.createElement("a");
      link.href = jsonString;
      link.download = `mlaafi_backup_${format(new Date(), 'yyyy-MM-dd')}.json`;
      link.click();
      
      toast({ title: "Exportation réussie", description: "Votre fichier de sauvegarde a été téléchargé." });

    } catch (error) {
      console.error("Erreur lors de l'exportation:", error);
      toast({ title: "Erreur d'exportation", description: "Impossible de créer le fichier de sauvegarde.", variant: "destructive" });
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result;
        if (typeof text !== 'string') throw new Error("Le fichier est invalide.");
        
        const parsedData = JSON.parse(text);
        const hasValidKeys = Object.keys(parsedData).some(key => backupKeys.includes(key));

        if (!hasValidKeys) {
          throw new Error("Le fichier de sauvegarde ne semble pas valide.");
        }
        
        setDataToImport(text);
        setIsImportConfirmOpen(true);

      } catch (error: any) {
        toast({ title: "Erreur d'importation", description: error.message || "Impossible de lire le fichier.", variant: "destructive" });
      } finally {
        if (importFileInputRef.current) {
          importFileInputRef.current.value = "";
        }
      }
    };
    reader.readAsText(file);
  };
  
  const handleConfirmImport = () => {
    if (!dataToImport) return;
    try {
      const parsedData = JSON.parse(dataToImport);
      Object.keys(parsedData).forEach(key => {
        if (backupKeys.includes(key)) {
          localStorage.setItem(key, JSON.stringify(parsedData[key]));
        }
      });
      toast({ title: "Importation réussie", description: "Vos données ont été restaurées. L'application va redémarrer." });
      
      setTimeout(() => window.location.reload(), 1500);

    } catch (error) {
      console.error("Erreur lors de l'importation:", error);
      toast({ title: "Erreur d'importation", description: "Une erreur est survenue lors de la restauration.", variant: "destructive" });
    } finally {
      setIsImportConfirmOpen(false);
      setDataToImport(null);
    }
  };


  return (
    <div className="container mx-auto p-4 space-y-8">
      <h2 className="text-2xl font-bold font-headline text-primary">Paramètres</h2>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center"><ShieldCheck className="mr-2 h-6 w-6 text-primary" /> Sécurité</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between space-x-2 p-3 border rounded-md">
            <Label htmlFor="lock-switch" className="text-base">Activer le verrouillage par PIN</Label>
            <Switch id="lock-switch" checked={isLockEnabled} onCheckedChange={handleToggleLock} />
          </div>
           {!currentPin && (
            <p className="text-sm text-muted-foreground p-3 border border-input rounded-md">
              Veuillez définir un PIN ci-dessous pour pouvoir activer cette fonctionnalité.
            </p>
           )}
          
          <Form {...pinForm}>
            <form onSubmit={pinForm.handleSubmit(handleSetPin)} className="space-y-4 p-3 border rounded-md">
              <p className="font-medium">{currentPin ? 'Changer le PIN' : 'Définir un PIN'}</p>
              <FormField
                control={pinForm.control}
                name="pin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nouveau PIN</FormLabel>
                    <FormControl><Input type="password" placeholder="••••" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={pinForm.control}
                name="confirmPin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirmer le nouveau PIN</FormLabel>
                    <FormControl><Input type="password" placeholder="••••" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full sm:w-auto">
                {currentPin ? 'Changer PIN' : 'Définir PIN'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
      
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center"><Brain className="mr-2 h-6 w-6 text-accent" /> Recommandations IA</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">Obtenez des conseils personnalisés basés sur vos données de santé.</p>
          <Link href="/recommendations" passHref>
            <Button className="w-full sm:w-auto" variant="outline">
              Accéder aux recommandations IA
            </Button>
          </Link>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center"><Mail className="mr-2 h-6 w-6 text-primary" /> Sauvegarde Cloud</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...emailForm}>
            <form onSubmit={emailForm.handleSubmit(handleSetBackupEmail)} className="space-y-4">
              <FormField
                control={emailForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Adresse email pour la sauvegarde</FormLabel>
                    <FormControl><Input type="email" placeholder="votre.email@example.com" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full sm:w-auto">Sauvegarder Email</Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center"><RotateCcw className="mr-2 h-6 w-6 text-primary" /> Gestion des Données</CardTitle>
          <CardDescription>Exporter, importer ou réinitialiser les données de votre application. Les sauvegardes sont locales (sur votre appareil).</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Button variant="outline" onClick={handleExportData}><Download className="mr-2 h-4 w-4"/> Exporter les données</Button>
            <Button asChild variant="outline">
              <Label htmlFor="import-file" className="cursor-pointer"><Upload className="mr-2 h-4 w-4"/> Importer des données</Label>
            </Button>
            <input type="file" id="import-file" ref={importFileInputRef} accept=".json" className="hidden" onChange={handleFileChange} />
          </div>
          <div className="pt-4 border-t">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="w-full"><Trash2 className="mr-2 h-4 w-4"/> Réinitialiser les données</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Êtes-vous absolument sûr?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Cette action est irréversible. Toutes vos données (consultations, médicaments, etc.) seront effacées. Votre PIN et les paramètres de verrouillage ne seront pas affectés.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                  <AlertDialogAction onClick={handleResetData} className="bg-destructive hover:bg-destructive/90">
                    Oui, tout supprimer
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
      
      <AlertDialog open={isImportConfirmOpen} onOpenChange={setIsImportConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer l'importation</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir importer ces données ? Cette action remplacera toutes les données existantes dans l'application. Cette opération est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDataToImport(null)}>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmImport}>
              Oui, importer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center"><Info className="mr-2 h-6 w-6 text-primary" /> Informations sur l'application</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p><strong>Application:</strong> M'LAAFI</p>
          <p><strong>Développé par:</strong> {APP_INFO.developer}</p>
          <p><strong>Email:</strong> <a href={`mailto:${APP_INFO.email}`} className="text-primary hover:underline">{APP_INFO.email}</a></p>
          <div>
            <strong>Téléphones:</strong>
            <ul className="list-disc list-inside ml-4">
              {APP_INFO.phones.map(phone => <li key={phone}><a href={`tel:${phone}`} className="text-primary hover:underline">{phone}</a></li>)}
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
