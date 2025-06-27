
"use client";

import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { checkDrugInteractions, type DrugInteractionOutput } from '@/ai/flows/drug-interaction-flow';
import type { Medication, Patient } from '@/types';
import { Loader2, Beaker, ShieldAlert, ShieldCheck } from 'lucide-react';
import useLocalStorage from '@/hooks/useLocalStorage';

interface InteractionCheckerProps {
  isOpen: boolean;
  onClose: () => void;
  medications: Medication[];
}

const getSeverityClass = (severity: 'Mineure' | 'Modérée' | 'Sévère') => {
  switch (severity) {
    case 'Sévère': return 'text-red-600 border-red-500 bg-red-50 dark:text-red-400 dark:border-red-600 dark:bg-red-900/20';
    case 'Modérée': return 'text-orange-600 border-orange-500 bg-orange-50 dark:text-orange-400 dark:border-orange-600 dark:bg-orange-900/20';
    case 'Mineure': return 'text-yellow-600 border-yellow-500 bg-yellow-50 dark:text-yellow-400 dark:border-yellow-600 dark:bg-yellow-900/20';
    default: return 'text-gray-600 border-gray-300 bg-gray-50 dark:text-gray-400 dark:border-gray-600 dark:bg-gray-900/20';
  }
};

export default function InteractionChecker({ isOpen, onClose, medications }: InteractionCheckerProps) {
  const [patients] = useLocalStorage<Patient[]>('patients', []);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<DrugInteractionOutput | null>(null);
  const { toast } = useToast();

  const selectablePatients = useMemo(() => {
    const patientIdsWithMeds = new Set(medications.map(m => m.patientId).filter(Boolean));
    return patients.filter(p => patientIdsWithMeds.has(p.id));
  }, [medications, patients]);

  const medicationsForSelectedPatient = useMemo(() => {
    if (!selectedPatientId) return [];
    return medications.filter(med => med.patientId === selectedPatientId);
  }, [selectedPatientId, medications]);

  const handleCheckInteractions = async () => {
    if (!selectedPatientId || medicationsForSelectedPatient.length < 2) {
      toast({
        title: "Données insuffisantes",
        description: "Veuillez sélectionner un patient avec au moins deux médicaments enregistrés.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setResult(null);
    toast({
        title: "Analyse en cours...",
        description: "L'IA vérifie les interactions. Veuillez patienter.",
    });

    try {
      const medicationNames = medicationsForSelectedPatient.map(m => m.name);
      const response = await checkDrugInteractions({ medications: medicationNames });
      
      if (response) {
          setResult(response);
          toast({
            title: "Analyse terminée",
            description: response.summary || "Les résultats sont disponibles."
          });
      } else {
          throw new Error("L'IA n'a pas retourné de réponse valide.");
      }
    } catch (error) {
      console.error("Error checking drug interactions:", error);
      toast({
        title: "Erreur de l'IA",
        description: "Impossible de vérifier les interactions. Assurez-vous que votre clé API est valide et que le service est disponible.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    onClose();
    // Reset state on close after animation
    setTimeout(() => {
        setSelectedPatientId(null);
        setResult(null);
        setIsLoading(false);
    }, 300);
  };
  
  // Reset results when patient changes
  React.useEffect(() => {
      setResult(null);
  }, [selectedPatientId]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Beaker className="h-6 w-6 text-primary"/> Vérificateur d'Interactions Médicamenteuses</DialogTitle>
          <DialogDescription>
            Sélectionnez un patient pour analyser les interactions potentielles entre ses médicaments enregistrés.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="patient-select">Patient</Label>
            <Select onValueChange={setSelectedPatientId} value={selectedPatientId || ''}>
              <SelectTrigger id="patient-select">
                <SelectValue placeholder="Sélectionner un patient..." />
              </SelectTrigger>
              <SelectContent>
                {selectablePatients.length > 0 ? selectablePatients.map(p => <SelectItem key={p.id} value={p.id}>{p.firstName} {p.lastName}</SelectItem>) : <SelectItem value="none" disabled>Aucun patient avec médicament</SelectItem>}
              </SelectContent>
            </Select>
          </div>

          {selectedPatientId && (
            <div>
              <Label>Médicaments à analyser pour ce patient</Label>
              <div className="mt-2 text-sm p-3 border rounded-md bg-muted/50 space-y-1 min-h-[60px]">
                {medicationsForSelectedPatient.length > 0 ? (
                  medicationsForSelectedPatient.map(m => <p key={m.id}>- {m.name}</p>)
                ) : (
                  <p className="text-muted-foreground">Aucun médicament enregistré pour ce patient.</p>
                )}
              </div>
            </div>
          )}

          {result && (
             <div className="mt-4 space-y-3">
              <h3 className="font-semibold">Résultats de l'analyse IA</h3>
              {result.hasInteractions ? (
                <Alert variant="destructive">
                  <ShieldAlert className="h-4 w-4" />
                  <AlertTitle>Interactions Potentielles Détectées</AlertTitle>
                  <AlertDescription>{result.summary}</AlertDescription>
                </Alert>
              ) : (
                <Alert>
                  <ShieldCheck className="h-4 w-4" />
                  <AlertTitle>Aucune Interaction Détectée</AlertTitle>
                  <AlertDescription>{result.summary}</AlertDescription>
                </Alert>
              )}

              {result.interactions.length > 0 && (
                <Accordion type="single" collapsible className="w-full">
                  {result.interactions.map((interaction, index) => (
                    <AccordionItem key={index} value={`item-${index}`}>
                      <AccordionTrigger className={`text-left font-semibold ${getSeverityClass(interaction.severity).split(' ')[0]}`}>
                        Interaction ({interaction.severity}): {interaction.medicationsInvolved.join(' + ')}
                      </AccordionTrigger>
                      <AccordionContent className="space-y-2">
                         <div className={`p-3 border rounded-md ${getSeverityClass(interaction.severity)}`}>
                            <p><strong>Description :</strong> {interaction.description}</p>
                            <p className="mt-2"><strong>Recommandation :</strong> {interaction.recommendation}</p>
                         </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              )}
             </div>
          )}

        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleClose}>Fermer</Button>
          <Button type="button" onClick={handleCheckInteractions} disabled={isLoading || !selectedPatientId || medicationsForSelectedPatient.length < 2}>
            {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analyse...</> : "Lancer l'analyse"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
