
"use client";

import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { getHealthRecommendations, type HealthRecommendationsInput, type HealthRecommendationsOutput } from '@/ai/flows/health-recommendations';
import { Brain, Sparkles, Loader2, Pill, CalendarCheck2, HeartPulse, Volume2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import useLocalStorage from '@/hooks/useLocalStorage';
import type { Medication, Appointment, VitalRecord } from '@/types';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function RecommendationsPage() {
  const [medicationsData] = useLocalStorage<Medication[]>('medications', []);
  const [appointmentsData] = useLocalStorage<Appointment[]>('appointments', []);
  const [vitalsData] = useLocalStorage<VitalRecord[]>('vitalRecords', []);

  const [recommendations, setRecommendations] = useState<HealthRecommendationsOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const hasData = useMemo(() => medicationsData.length > 0 || appointmentsData.length > 0 || vitalsData.length > 0, [medicationsData, appointmentsData, vitalsData]);

  const handleSubmit = async () => {
    setIsLoading(true);
    setRecommendations(null);

    // Format Medications
    const formattedMedications = medicationsData.length > 0
      ? medicationsData
          .map(med => `${med.name} (du ${format(parseISO(med.startDate), 'P', { locale: fr })} au ${format(parseISO(med.endDate), 'P', { locale: fr })})`)
          .join(',\n')
      : 'Aucun médicament enregistré.';

    // Format Appointments
    const formattedAppointments = appointmentsData.length > 0
      ? appointmentsData
          .map(appt => `RDV avec ${appt.doctorName} (${appt.specialty || 'Généraliste'}) le ${format(parseISO(appt.dateTime), 'PPPPp', { locale: fr })}`)
          .join('\n')
      : 'Aucun rendez-vous enregistré.';

    // Format Vitals and Vitals History
    const sortedVitals = [...vitalsData].sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime());
    
    let latestVitalsString = 'Aucune constante vitale enregistrée.';
    let historyString = 'Aucun historique de constantes vitales.';

    if (sortedVitals.length > 0) {
      const latestVitals = sortedVitals[0];
      latestVitalsString = [
        latestVitals.weight ? `Poids: ${latestVitals.weight}kg` : null,
        latestVitals.bloodPressure ? `Tension: ${latestVitals.bloodPressure}` : null,
        latestVitals.heartRate ? `Pouls: ${latestVitals.heartRate}bpm` : null,
        latestVitals.temperature ? `Température: ${latestVitals.temperature}°C` : null,
      ].filter(Boolean).join(', ') + ` (le ${format(parseISO(latestVitals.date), 'P', { locale: fr })})`;

      historyString = sortedVitals.slice(0, 5) // Take last 5 records
        .map(rec => {
          const date = format(parseISO(rec.date), 'P', { locale: fr });
          const parts = [
             rec.weight ? `Poids: ${rec.weight}kg` : null,
             rec.bloodPressure ? `Tension: ${rec.bloodPressure}` : null,
             rec.heartRate ? `Pouls: ${rec.heartRate}bpm` : null,
          ].filter(Boolean).join(', ');
          return `${date}: ${parts || 'Aucune donnée majeure.'}`;
        })
        .join('\n');
    }

    const input: HealthRecommendationsInput = {
      medications: formattedMedications,
      appointments: formattedAppointments,
      vitals: latestVitalsString,
      vitalsHistory: historyString,
    };

    try {
      const result = await getHealthRecommendations(input);
      setRecommendations(result);
      toast({
        title: "Recommandations Générées",
        description: "Vos recommandations personnalisées sont prêtes.",
      });
    } catch (error) {
      console.error("Error fetching recommendations:", error);
      toast({
        title: "Erreur de recommandation",
        description: "Impossible d'obtenir des recommandations pour le moment. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 space-y-8">
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center text-2xl font-bold font-headline">
            <Brain className="mr-3 h-8 w-8 text-primary" />
            Recommandations Santé par IA
          </CardTitle>
          <CardDescription>
            Obtenez des conseils personnalisés en analysant vos données de santé enregistrées dans l'application.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              L'IA utilisera vos consultations, médicaments, et constantes vitales pour générer des recommandations et identifier des tendances.
            </p>
            {!hasData && (
                 <p className="text-sm text-orange-600 p-3 bg-orange-50 border border-orange-200 rounded-md">
                   Pour de meilleurs résultats, ajoutez d'abord des données (consultations, médicaments, constantes vitales).
                 </p>
            )}
            <Button onClick={handleSubmit} disabled={isLoading} className="w-full">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Génération en cours...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Générer mes recommandations
                </>
              )}
            </Button>
          </div>
        </CardContent>
        <CardFooter>
            <p className="text-xs text-muted-foreground">
                Ces recommandations sont générées par une IA et ne remplacent pas un avis médical professionnel. Consultez toujours votre médecin pour des questions de santé.
            </p>
        </CardFooter>
      </Card>
      
      {recommendations && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center text-xl font-headline text-primary">
                <Sparkles className="mr-2 h-6 w-6"/> Vos Recommandations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {recommendations.audioDataUri && (
                <div className="mb-4">
                    <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                        <Volume2 className="h-5 w-5"/> Écouter le résumé
                    </h3>
                    <audio controls src={recommendations.audioDataUri} className="w-full">
                        Votre navigateur ne supporte pas l'élément audio.
                    </audio>
                </div>
            )}
            <div>
              <h3 className="text-lg font-semibold mb-2">Recommandations :</h3>
              <ScrollArea className="h-40 rounded-md border p-3 bg-muted/20">
                <pre className="whitespace-pre-wrap text-sm font-sans">{recommendations.recommendations}</pre>
              </ScrollArea>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Raisonnement :</h3>
               <ScrollArea className="h-40 rounded-md border p-3 bg-muted/20">
                <pre className="whitespace-pre-wrap text-sm font-sans">{recommendations.reasoning}</pre>
              </ScrollArea>
            </div>
          </CardContent>
        </Card>
      )}

      {!isLoading && !recommendations && (
         <Card className="text-center p-8 border-2 border-dashed bg-card shadow-lg">
          <CardContent className="flex flex-col items-center">
             <div className="p-3 bg-primary/10 rounded-full mb-4">
                <Pill className="h-8 w-8 text-primary" />
             </div>
             <div className="p-3 bg-primary/10 rounded-full mb-4 -mt-4 ml-12">
                <CalendarCheck2 className="h-8 w-8 text-primary" />
             </div>
              <div className="p-3 bg-primary/10 rounded-full mb-4 -mt-4 mr-12">
                <HeartPulse className="h-8 w-8 text-primary" />
             </div>
            <p className="text-lg text-muted-foreground">Vos recommandations personnalisées apparaîtront ici.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
