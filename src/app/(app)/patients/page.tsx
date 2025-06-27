
"use client";

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import FormModal from '@/components/shared/FormModal';
import type { Patient } from '@/types';
import PatientForm from '@/components/patient/PatientForm';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Edit3, Trash2, Users, Cake, Search } from 'lucide-react';
import { format, parseISO, differenceInYears, isValid } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import useLocalStorage from '@/hooks/useLocalStorage';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import Link from 'next/link';
import { Input } from '@/components/ui/input';

type PatientFormData = Omit<Patient, 'id'>;

const getAgeFromBirthDate = (birthDateString: string): number | null => {
    if (!birthDateString) return null;
    const birthDate = parseISO(birthDateString);
    if (!isValid(birthDate)) return null;
    return differenceInYears(new Date(), birthDate);
}

export default function PatientsPage() {
  const [patients, setPatients] = useLocalStorage<Patient[]>('patients', []);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();
  const router = useRouter();

  const filteredAndSortedPatients = useMemo(() =>
    patients
      .filter(patient => {
        const fullName = `${patient.firstName} ${patient.lastName}`.toLowerCase();
        return fullName.includes(searchQuery.toLowerCase());
      })
      .sort((a, b) => 
        a.lastName.localeCompare(b.lastName) || a.firstName.localeCompare(b.firstName)
      ),
  [patients, searchQuery]);

  const handleFormSubmit = (data: PatientFormData) => {
    setIsSubmitting(true);
    setTimeout(() => {
      if (editingPatient) {
        setPatients(prev => prev.map(p => p.id === editingPatient.id ? { ...editingPatient, ...data } : p));
        toast({ title: "Patient Modifié", description: "Les informations du patient ont été mises à jour." });
      } else {
        const newPatient: Patient = { ...data, id: Date.now().toString() };
        setPatients(prev => [newPatient, ...prev]);
        toast({ title: "Patient Ajouté", description: "Nouveau patient enregistré." });
      }
      setIsModalOpen(false);
      setEditingPatient(null);
      setIsSubmitting(false);
    }, 500);
  };

  const openAddModal = () => {
    setEditingPatient(null);
    setIsModalOpen(true);
  };

  const openEditModal = (patient: Patient) => {
    setEditingPatient(patient);
    setIsModalOpen(true);
  };

  const handleDeletePatient = (id: string) => {
    // In a real app, we would check for dependencies in consultations, etc.
    setPatients(prev => prev.filter(p => p.id !== id));
    toast({ title: "Patient Supprimé", description: "Le patient a été supprimé de la liste.", variant: "destructive" });
  };
  
  const handleEditClick = (e: React.MouseEvent, patient: Patient) => {
    e.preventDefault();
    e.stopPropagation();
    openEditModal(patient);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <div className="container mx-auto p-4 min-h-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold font-headline">Gestion des Patients</h2>
        <Button onClick={openAddModal}>
          Ajouter
        </Button>
      </div>

      <div className="mb-6 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Rechercher un patient par nom..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      <FormModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingPatient(null); }}
        title={editingPatient ? "Modifier Patient" : "Ajouter un Patient"}
        onSubmit={() => document.querySelector<HTMLFormElement>('#patient-form-in-modal form')?.requestSubmit()}
        isSubmitting={isSubmitting}
        submitButtonText={editingPatient ? "Sauvegarder" : "Ajouter Patient"}
      >
        <div id="patient-form-in-modal">
          <PatientForm
            onSubmit={handleFormSubmit}
            initialData={editingPatient || undefined}
            isSubmitting={isSubmitting}
          />
        </div>
      </FormModal>

      {patients.length === 0 ? (
        <Card className="text-center p-8 bg-card shadow-lg">
          <CardContent>
            <Users className="mx-auto h-12 w-12 text-primary mb-4" />
            <p className="text-lg text-muted-foreground">Aucun patient enregistré.</p>
            <p className="text-sm text-muted-foreground mt-2">Cliquez sur "Ajouter" pour commencer.</p>
          </CardContent>
        </Card>
      ) : filteredAndSortedPatients.length === 0 ? (
        <Card className="text-center p-8 bg-card shadow-lg">
          <CardContent>
            <Search className="mx-auto h-12 w-12 text-primary mb-4" />
            <p className="text-lg text-muted-foreground">Aucun patient trouvé</p>
            <p className="text-sm text-muted-foreground mt-2">Aucun patient ne correspond à votre recherche "{searchQuery}".</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAndSortedPatients.map(patient => {
            const age = getAgeFromBirthDate(patient.birthDate);
            const birthDate = parseISO(patient.birthDate);
            return (
              <Link href={`/patients/${patient.id}`} key={patient.id} className="group block rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                <Card className="shadow-lg h-full flex flex-col transition-shadow duration-300 group-hover:shadow-xl">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="font-headline">{patient.firstName} {patient.lastName}</CardTitle>
                      <div className="flex space-x-1">
                        <Button variant="ghost" size="icon" onClick={(e) => handleEditClick(e, patient)} aria-label="Modifier">
                          <Edit3 className="h-5 w-5" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10" aria-label="Supprimer" onClick={handleDeleteClick}>
                              <Trash2 className="h-5 w-5" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent onClick={e => e.stopPropagation()}>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Êtes-vous sûr?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Cette action est irréversible. La suppression d'un patient ne supprimera pas ses consultations ou autres données associées existantes, qui deviendront orphelines.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Annuler</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeletePatient(patient.id)} className="bg-destructive hover:bg-destructive/90">
                                Supprimer
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                     <CardDescription>{patient.sex}{age !== null ? `, ${age} ans` : ''}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-grow">
                     <div className="flex items-center text-sm text-muted-foreground">
                          <Cake className="mr-2 h-4 w-4" />
                          <span>Né(e) le: {isValid(birthDate) ? format(birthDate, "d MMMM yyyy", { locale: fr }) : "Date invalide"}</span>
                      </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
