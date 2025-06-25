
"use client"

import * as React from "react"
import { format, parseISO, isValid } from "date-fns"
import { fr } from "date-fns/locale"
import { Line, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts"
import type { VitalRecord } from "@/types"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ChartTooltipContent } from "@/components/ui/chart"

interface VitalsChartProps {
  records: VitalRecord[]
}

type ChartDataPoint = {
  date: string
  [key: string]: any
}

// Helper to create a simple line chart component
const ReusableChart = ({ data, lines, yAxisLabel }: { data: ChartDataPoint[], lines: { key: string, color: string, name: string }[], yAxisLabel?: string }) => {
  if (data.length < 2) {
    return <div className="flex items-center justify-center h-48 text-sm text-muted-foreground">Données insuffisantes pour afficher le graphique.</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis
          dataKey="date"
          stroke="hsl(var(--muted-foreground))"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="hsl(var(--muted-foreground))"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `${value}`}
          label={{ value: yAxisLabel, angle: -90, position: 'insideLeft', fill: 'hsl(var(--muted-foreground))', fontSize: 12, dx: -10 }}
        />
        <Tooltip
          content={<ChartTooltipContent indicator="dot" />}
          cursor={{ fill: "hsl(var(--accent))", opacity: 0.1 }}
        />
        <Legend />
        {lines.map(line => (
          <Line
            key={line.key}
            type="monotone"
            dataKey={line.key}
            name={line.name}
            stroke={line.color}
            strokeWidth={2}
            dot={{ r: 4, fill: line.color, strokeWidth: 1, stroke: 'hsl(var(--background))' }}
            activeDot={{ r: 6 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
};

export default function VitalsChart({ records }: VitalsChartProps) {
  const chartData = React.useMemo(() => {
    return records
      .map(record => {
        const parsedDate = parseISO(record.date);
        if (!isValid(parsedDate)) return null;

        const dataPoint: ChartDataPoint = {
          date: format(parsedDate, 'dd/MM', { locale: fr }),
        };

        if (record.weight) dataPoint.weight = record.weight;
        if (record.bloodPressure) {
          const [systolic, diastolic] = record.bloodPressure.split('/').map(Number);
          if (!isNaN(systolic)) dataPoint.systolic = systolic;
          if (!isNaN(diastolic)) dataPoint.diastolic = diastolic;
        }
        if (record.heartRate) dataPoint.heartRate = record.heartRate;
        if (record.temperature) dataPoint.temperature = record.temperature;
        
        return dataPoint;
      })
      .filter(Boolean)
      .reverse() as ChartDataPoint[];
  }, [records]);

  const weightData = chartData.filter(d => d.weight !== undefined);
  const bloodPressureData = chartData.filter(d => d.systolic !== undefined && d.diastolic !== undefined);
  const heartRateData = chartData.filter(d => d.heartRate !== undefined);
  const temperatureData = chartData.filter(d => d.temperature !== undefined);

  return (
    <Card className="shadow-lg mb-6">
      <CardHeader>
        <CardTitle className="font-headline">Évolution des Constantes</CardTitle>
        <CardDescription>Visualisez les tendances de vos données de santé.</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="weight">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto">
            <TabsTrigger value="weight">Poids</TabsTrigger>
            <TabsTrigger value="bloodPressure">Tension</TabsTrigger>
            <TabsTrigger value="heartRate">Pouls</TabsTrigger>
            <TabsTrigger value="temperature">Temp.</TabsTrigger>
          </TabsList>
          <TabsContent value="weight" className="pt-4">
             <ReusableChart 
                data={weightData}
                lines={[{ key: 'weight', color: 'hsl(var(--primary))', name: 'Poids' }]}
                yAxisLabel="kg"
             />
          </TabsContent>
          <TabsContent value="bloodPressure" className="pt-4">
             <ReusableChart 
                data={bloodPressureData}
                lines={[
                    { key: 'systolic', color: 'hsl(var(--primary))', name: 'Systolique' },
                    { key: 'diastolic', color: 'hsl(var(--secondary))', name: 'Diastolique' }
                ]}
                yAxisLabel="mmHg"
            />
          </TabsContent>
          <TabsContent value="heartRate" className="pt-4">
             <ReusableChart 
                data={heartRateData}
                lines={[{ key: 'heartRate', color: 'hsl(var(--destructive))', name: 'Pouls' }]}
                yAxisLabel="bpm"
            />
          </TabsContent>
          <TabsContent value="temperature" className="pt-4">
            <ReusableChart 
                data={temperatureData}
                lines={[{ key: 'temperature', color: 'hsl(var(--accent))', name: 'Température' }]}
                yAxisLabel="°C"
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
