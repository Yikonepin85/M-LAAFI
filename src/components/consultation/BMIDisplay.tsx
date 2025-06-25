
"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BMI_CATEGORIES, type BMICategory } from '@/lib/constants';
import { cn } from '@/lib/utils';

interface BMIDisplayProps {
  weight?: number; // in kg
  height?: number; // in cm
}

export function calculateBMI(weight?: number, height?: number): number | null {
  if (!weight || !height || weight <= 0 || height <= 0) {
    return null;
  }
  const heightInMeters = height / 100;
  return parseFloat((weight / (heightInMeters * heightInMeters)).toFixed(2));
}

export function getBMICategory(bmi: number | null): BMICategory | null {
  if (bmi === null) return null;
  return BMI_CATEGORIES.find(cat => bmi >= cat.min && bmi <= cat.max) || null;
}

const BMIDisplay: React.FC<BMIDisplayProps> = ({ weight, height }) => {
  const bmi = calculateBMI(weight, height);
  const bmiCategory = getBMICategory(bmi);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Indice de Masse Corporelle (IMC)</CardTitle>
      </CardHeader>
      <CardContent>
        {bmi !== null && bmiCategory ? (
          <div className="space-y-2">
            <p className="text-3xl font-bold text-center">
              {bmi}
            </p>
            <div className={cn("rounded-md p-3 text-center font-medium", bmiCategory.colorClass)}>
              {bmiCategory.emoji} {bmiCategory.label}
            </div>
          </div>
        ) : (
          <p className="text-muted-foreground text-center">
            Entrez le poids et la taille pour calculer l'IMC.
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default BMIDisplay;
