
// src/components/charts/BarChart.tsx

'use client'

import { Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

interface BarChartProps {
  title: string
  labels: string[]
  data: number[]
  label: string
  color?: string
}

export default function BarChart({
  title,
  labels,
  data,
  label,
  color = 'rgb(34, 197, 94)', // green-500
}: BarChartProps) {
  const chartData = {
    labels,
    datasets: [
      {
        label,
        data,
        backgroundColor: color,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
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
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0,
        },
      },
    },
  }

  return (
    <div style={{ height: '300px' }}>
      <Bar data={chartData} options={options} />
    </div>
  )
}