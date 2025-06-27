"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Hospital, AlertTriangle } from 'lucide-react';

const PHARMACY_URL = 'https://anacburkina.org/article-else-where-541/oua/pharmacies-de-garde-du-jours/show';

export default function PharmaciesPage() {
  return (
    <div className="container mx-auto p-4 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Hospital className="h-6 w-6 text-primary" />
            Pharmacies de Garde
          </CardTitle>
          <CardDescription>
            Consultez la liste officielle des pharmacies de garde fournie par l'ANAC Burkina.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="w-full h-[75vh] border rounded-md overflow-hidden bg-muted">
             <iframe
              src={PHARMACY_URL}
              title="Pharmacies de Garde"
              className="w-full h-full"
              sandbox="allow-scripts allow-same-origin"
            />
          </div>
           <Alert variant="destructive" className="mt-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Note de Compatibilité</AlertTitle>
              <AlertDescription>
                Certains sites web peuvent bloquer l'affichage dans un cadre comme celui-ci pour des raisons de sécurité. Si la page ne s'affiche pas, vous devrez la consulter directement dans votre navigateur.
              </AlertDescription>
            </Alert>
        </CardContent>
      </Card>
    </div>
  );
}
