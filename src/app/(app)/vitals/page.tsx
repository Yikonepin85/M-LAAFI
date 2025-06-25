
"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import FormModal from '@/components/shared/FormModal';
import type { VitalRecord } from '@/types';
import VitalRecordForm from '@/components/vitals/VitalRecordForm';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Edit3, Trash2, CalendarDays, HeartPulse as VitalsIcon, FileText } from 'lucide-react';
import { format, parseISO, isValid } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import useLocalStorage from '@/hooks/useLocalStorage';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import VitalsChart from '@/components/vitals/VitalsChart';

type VitalRecordFormData = Omit<VitalRecord, 'id'>;

export default function VitalsPage() {
  const [vitalRecords, setVitalRecords] = useLocalStorage<VitalRecord[]>('vitalRecords', []);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<VitalRecord | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();

  const sortedVitalRecords = useMemo(() =>
    [...vitalRecords].sort((a, b) => {
      if (!a.date || !b.date) return 0;
      const dateA = parseISO(a.date);
      const dateB = parseISO(b.date);
      if (isValid(dateB) && !isValid(dateA)) return -1;
      if (!isValid(dateB) && isValid(dateA)) return 1;
      if (!isValid(dateB) && !isValid(dateA)) return 0;
      return dateB.getTime() - dateA.getTime();
    }),
  [vitalRecords]);
  
  const openAddModal = () => {
    setEditingRecord(null);
    setIsModalOpen(true);
  };
  
  useEffect(() => {
    if (searchParams.get('action') === 'add') {
      openAddModal();
      router.replace('/vitals', { scroll: false });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const handleFormSubmit = (data: VitalRecordFormData) => {
    setIsSubmitting(true);
    // Simulate API delay
    setTimeout(() => {
      if (editingRecord) {
        setVitalRecords(prev => prev.map(r => r.id === editingRecord.id ? { ...editingRecord, ...data } : r));
        toast({ title: "Relevé Modifié", description: "Le relevé de constantes a été mis à jour." });
      } else {
        const newRecord: VitalRecord = { ...data, id: Date.now().toString() };
        setVitalRecords(prev => [newRecord, ...prev]);
        toast({ title: "Relevé Ajouté", description: "Nouveau relevé de constantes enregistré." });
      }
      setIsModalOpen(false);
      setEditingRecord(null);
      setIsSubmitting(false);
    }, 500);
  };

  const openEditModal = (record: VitalRecord) => {
    setEditingRecord(record);
    setIsModalOpen(true);
  };

  const handleDeleteRecord = (id: string) => {
    setVitalRecords(prev => prev.filter(r => r.id !== id));
    toast({ title: "Relevé Supprimé", description: "Le relevé de constantes a été supprimé.", variant: "destructive" });
  };

  return (
    <div className="container mx-auto p-4 min-h-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold font-headline">Suivi des Constantes Vitales</h2>
        <Button onClick={openAddModal}>
          Ajouter
        </Button>
      </div>

      <FormModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingRecord(null); }}
        title={editingRecord ? "Modifier Relevé" : "Ajouter un Relevé de Constantes"}
        onSubmit={() => document.querySelector<HTMLFormElement>('#vitalrecord-form-in-modal form')?.requestSubmit()}
        isSubmitting={isSubmitting}
        submitButtonText={editingRecord ? "Sauvegarder Modifications" : "Ajouter Relevé"}
      >
        <div id="vitalrecord-form-in-modal">
          <VitalRecordForm
            onSubmit={handleFormSubmit}
            initialData={editingRecord || undefined}
            isSubmitting={isSubmitting}
          />
        </div>
      </FormModal>

      {sortedVitalRecords.length > 0 && <VitalsChart records={sortedVitalRecords} />}
      
      <div className="mt-6">
        <h3 className="text-xl font-bold font-headline mb-4">Historique des Relevés</h3>
        {sortedVitalRecords.length === 0 ? (
          <Card className="text-center p-8 bg-card shadow-lg">
            <CardContent>
              <VitalsIcon className="mx-auto h-12 w-12 text-primary mb-4" />
              <p className="text-lg text-muted-foreground">Aucun relevé de constantes enregistré.</p>
              <p className="text-sm text-muted-foreground mt-2">Cliquez sur "Ajouter" pour commencer.</p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Poids</TableHead>
                    <TableHead>Tension</TableHead>
                    <TableHead>Pouls</TableHead>
                    <TableHead>Temp.</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedVitalRecords.map(record => {
                    const recordDate = record.date ? parseISO(record.date) : null;
                    return (
                      <TableRow key={record.id}>
                        <TableCell className="font-medium">
                          {recordDate && isValid(recordDate) ? format(recordDate, "PPP", { locale: fr }) : "Date invalide"}
                        </TableCell>
                        <TableCell>{record.weight ? `${record.weight} kg` : 'N/A'}</TableCell>
                        <TableCell>{record.bloodPressure || 'N/A'}</TableCell>
                        <TableCell>{record.heartRate ? `${record.heartRate} bpm` : 'N/A'}</TableCell>
                        <TableCell>{record.temperature ? `${record.temperature} °C` : 'N/A'}</TableCell>
                        <TableCell>
                          {record.notes ? (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <FileText className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="max-w-xs">{record.notes}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          ) : (
                            <span className="text-muted-foreground text-xs">Aucune</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end items-center space-x-1">
                            <Button variant="ghost" size="icon" onClick={() => openEditModal(record)} aria-label="Modifier" className="h-8 w-8">
                              <Edit3 className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8" aria-label="Supprimer">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Êtes-vous sûr?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Cette action est irréversible et supprimera définitivement ce relevé de constantes.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeleteRecord(record.id)} className="bg-destructive hover:bg-destructive/90">
                                    Supprimer
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
