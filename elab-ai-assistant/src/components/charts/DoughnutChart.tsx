// src/components/charts/DoughnutChart.tsx

'use client'

import { Doughnut } from 'react-chartjs-2'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'

ChartJS.register(ArcElement, Tooltip, Legend)

interface DoughnutChartProps {
  title: string
  labels: string[]
  data: number[]
  colors?: string[]
}

export default function DoughnutChart({
  title,
  labels,
  data,
  colors = [
    'rgb(59, 130, 246)', // blue
    'rgb(34, 197, 94)', // green
    'rgb(251, 146, 60)', // orange
    'rgb(168, 85, 247)', // purple
    'rgb(236, 72, 153)', // pink
  ],
}: DoughnutChartProps) {
  const chartData = {
    labels,
    datasets: [
      {
        data,
        backgroundColor: colors,
        borderWidth: 2,
        borderColor: '#fff',
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
      title: {
        display: true,
        text: title,
        font: {
          size: 16,
          weight: 'bold' as const,
        },
      },
    },
  }

  return (
    <div style={{ height: '300px' }}>
      <Doughnut data={chartData} options={options} />
    </div>
  )
}