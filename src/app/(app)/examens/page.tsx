
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import MedicalTestForm from '@/components/examens/MedicalTestForm';
import FormModal from '@/components/shared/FormModal';
import type { MedicalTest, Consultation } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, Edit3, Trash2, FlaskConical, User, CalendarDays, Info, FileText, ClipboardList, ScanLine } from 'lucide-react';
import { format, parseISO, isValid } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import useLocalStorage from '@/hooks/useLocalStorage';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import AnalyseDocumentModal from '@/components/examens/AnalyseDocumentModal';
import type { AnalyzeTestResultPhotoOutput } from '@/ai/flows/analyze-test-result-photo-flow';

type MedicalTestFormData = Omit<MedicalTest, 'id'>;

export default function ExamensPage() {
  const [medicalTests, setMedicalTests] = useLocalStorage<MedicalTest[]>('medicalTests', []);
  const [consultations] = useLocalStorage<Consultation[]>('consultations', []);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false);
  const [editingTest, setEditingTest] = useState<MedicalTest | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [prefillDataForNewTest, setPrefillDataForNewTest] = useState<Partial<MedicalTestFormData> | undefined>(undefined);


  useEffect(() => {
    const consultationIdParam = searchParams.get('consultationId');
    if (consultationIdParam) {
      const patientFullNameParam = searchParams.get('patientFullName');
      const notesParam = searchParams.get('notes'); 

      const dataToPrefill: Partial<MedicalTestFormData> = {
        patientFullName: patientFullNameParam || '',
        consultationId: consultationIdParam,
        prescribedDate: format(new Date(), 'yyyy-MM-dd'),
        status: "Prescrit",
        notes: notesParam || `Examen prescrit suite à la consultation du ${format(new Date(), "PPP", { locale: fr })}.`,
        results: '',
        resultsDate: '',
      };
      setPrefillDataForNewTest(dataToPrefill);
      setEditingTest(null);
      setIsModalOpen(true);
      
      router.replace('/examens', { scroll: false });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);


  const sortedMedicalTests = useMemo(() => [...medicalTests].sort((a, b) => {
    if (!a.prescribedDate || !b.prescribedDate) return 0;
    const dateA = parseISO(a.prescribedDate);
    const dateB = parseISO(b.prescribedDate);
    if (isValid(dateB) && !isValid(dateA)) return -1;
    if (!isValid(dateB) && isValid(dateA)) return 1;
    if (!isValid(dateB) && !isValid(dateA)) return 0;
    return dateB.getTime() - dateA.getTime();
  }), [medicalTests]);

  const handleFormSubmit = (data: MedicalTestFormData) => {
    setIsSubmitting(true);
    setTimeout(() => {
      let finalData = { ...data };
      if (finalData.prescribedDate) {
        finalData.prescribedDate = new Date(finalData.prescribedDate).toISOString();
      }
      if (finalData.resultsDate) {
        finalData.resultsDate = new Date(finalData.resultsDate).toISOString();
      } else {
        finalData.resultsDate = undefined;
      }

      if (editingTest && !prefillDataForNewTest) {
        setMedicalTests(prev => prev.map(t => t.id === editingTest.id ? { ...editingTest, ...finalData } : t));
        toast({ title: "Examen Modifié", description: "Les informations de l'examen ont été mises à jour." });
      } else {
        const newTest: MedicalTest = { 
          ...finalData, 
          id: Date.now().toString(),
          consultationId: prefillDataForNewTest?.consultationId || finalData.consultationId,
          patientFullName: prefillDataForNewTest?.patientFullName || finalData.patientFullName,
        };
        setMedicalTests(prev => [newTest, ...prev]);
        toast({ title: "Examen Ajouté", description: "Nouvel examen enregistré." });
      }
      setIsModalOpen(false);
      setEditingTest(null);
      setPrefillDataForNewTest(undefined);
      setIsSubmitting(false);
    }, 500);
  };

  const handleAnalysisComplete = (data: AnalyzeTestResultPhotoOutput) => {
    setIsAnalysisModalOpen(false);

    const resultsText = data.keyResults.length > 0
        ? data.keyResults.map(r => `${r.parameter}: ${r.value} ${r.unit || ''} (Réf: ${r.referenceRange || 'N/A'})`).join('\n')
        : '';
    const notesText = `Résultats extraits par IA. Résumé: ${data.summary}`;

    const dataToPrefill: Partial<MedicalTestFormData> = {
        name: data.testName,
        patientFullName: data.patientName,
        prescribedDate: data.testDate && isValid(parseISO(data.testDate)) ? format(parseISO(data.testDate), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
        status: resultsText ? "Résultats disponibles" : "Prescrit",
        results: resultsText,
        notes: notesText,
    };
    
    setPrefillDataForNewTest(dataToPrefill);
    setEditingTest(null);
    setIsModalOpen(true);
  };

  const openAddModal = () => {
    setEditingTest(null);
    setPrefillDataForNewTest(undefined);
    setIsModalOpen(true);
  };

  const openEditModal = (test: MedicalTest) => {
    setEditingTest(test);
    setPrefillDataForNewTest(undefined);
    setIsModalOpen(true);
  };

  const handleDeleteTest = (id: string) => {
    setMedicalTests(prev => prev.filter(t => t.id !== id));
    toast({ title: "Examen Supprimé", description: "L'examen a été supprimé.", variant: "destructive" });
  };
  
  return (
    <div className="container mx-auto p-4 min-h-full">
      <div className="flex flex-wrap justify-between items-center mb-6 gap-2">
        <h2 className="text-2xl font-bold font-headline">Gestion des Examens Médicaux</h2>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setIsAnalysisModalOpen(true)}>
            <ScanLine className="mr-2 h-4 w-4" /> Ajouter par Analyse IA
          </Button>
          <Button onClick={openAddModal}>
            Ajouter Manuellement
          </Button>
        </div>
      </div>
      
      <AnalyseDocumentModal
        isOpen={isAnalysisModalOpen}
        onClose={() => setIsAnalysisModalOpen(false)}
        onComplete={handleAnalysisComplete}
      />
      
      <FormModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingTest(null); setPrefillDataForNewTest(undefined);}}
        title={editingTest ? "Modifier Examen" : "Ajouter un Examen"}
        onSubmit={() => document.querySelector<HTMLFormElement>('#medicaltest-form-in-modal form')?.requestSubmit()}
        isSubmitting={isSubmitting}
      >
        <div id="medicaltest-form-in-modal">
          <MedicalTestForm
            onSubmit={handleFormSubmit}
            initialData={editingTest || (prefillDataForNewTest as MedicalTestFormData) || undefined}
            isSubmitting={isSubmitting}
          />
        </div>
      </FormModal>

      {sortedMedicalTests.length === 0 ? (
        <Card className="text-center p-8 bg-card shadow-lg">
          <CardContent>
            <FlaskConical className="mx-auto h-12 w-12 text-primary mb-4" />
            <p className="text-lg text-muted-foreground">Aucun examen médical enregistré.</p>
            <p className="text-sm text-muted-foreground mt-2">Cliquez sur "Ajouter" pour commencer.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {sortedMedicalTests.map(test => {
            const prescribedDate = test.prescribedDate ? parseISO(test.prescribedDate) : null;
            const resultsDate = test.resultsDate ? parseISO(test.resultsDate) : null;
            const linkedConsultation = test.consultationId ? consultations.find(c => c.id === test.consultationId) : null;
            const consultationDate = linkedConsultation?.createdAt ? parseISO(linkedConsultation.createdAt) : null;

            return (
              <Card key={test.id} className="shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="font-headline">{test.name}</CardTitle>
                    <div className="flex space-x-2">
                      <Button variant="ghost" size="icon" onClick={() => openEditModal(test)} aria-label="Modifier">
                        <Edit3 className="h-5 w-5" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10" aria-label="Supprimer">
                            <Trash2 className="h-5 w-5" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Êtes-vous sûr?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Cette action est irréversible et supprimera définitivement cet examen.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Annuler</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteTest(test.id)} className="bg-destructive hover:bg-destructive/90">
                              Supprimer
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                  <CardDescription className="flex items-center text-sm">
                    <User className="mr-2 h-4 w-4 text-primary" /> Patient: {test.patientFullName}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="flex items-center"><CalendarDays className="mr-2 h-4 w-4 text-primary" /> Prescrit le: {prescribedDate && isValid(prescribedDate) ? format(prescribedDate, "PPP", { locale: fr }) : 'Date invalide'}</p>
                  <p className="flex items-center"><Info className="mr-2 h-4 w-4 text-primary" /> Statut: <span className={`font-semibold ml-1 ${test.status === "Résultats disponibles" ? "text-green-600" : ""}`}>{test.status}</span></p>
                  
                  {linkedConsultation && consultationDate && isValid(consultationDate) && (
                    <p className="text-xs text-muted-foreground pt-1 flex items-center">
                      <ClipboardList className="mr-2 h-3 w-3" />
                      <span>
                        Prescrit lors de la consultation du {format(consultationDate, 'PPP', { locale: fr })}
                      </span>
                    </p>
                  )}
                  
                  {test.results && (
                    <div className="mt-3 pt-3 border-t">
                      <h4 className="text-sm font-semibold flex items-center mb-1">
                        <FileText className="mr-2 h-4 w-4 text-accent" /> Résultats
                        {resultsDate && isValid(resultsDate) && (
                          <span className="text-xs text-muted-foreground ml-1"> (du {format(resultsDate, "PPP", { locale: fr })})</span>
                        )}
                      </h4>
                      <p className="text-sm whitespace-pre-wrap bg-muted/30 p-2 rounded-md">{test.results}</p>
                    </div>
                  )}

                  {test.notes && <p className="text-sm mt-2 border-t pt-2"><strong>Notes Générales:</strong> {test.notes}</p>}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
