"use client"

import { Bar, Line } from "react-chartjs-2"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  type ChartOptions,
} from "chart.js"

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend)

interface ChartData {
  name: string
  value: number
}

interface ChartProps {
  data: ChartData[]
}

export function LineChart({ data }: ChartProps) {
  const chartData = {
    labels: data.map((item) => item.name),
    datasets: [
      {
        label: "Score",
        data: data.map((item) => item.value),
        borderColor: "hsl(var(--primary))",
        backgroundColor: "hsl(var(--primary) / 0.1)",
        tension: 0.4,
        fill: true,
        borderWidth: 3,
      },
    ],
  }

  const options: ChartOptions<"line"> = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        mode: "index",
        intersect: false,
        backgroundColor: "hsl(var(--card))",
        titleColor: "hsl(var(--foreground))",
        bodyColor: "hsl(var(--foreground))",
        borderColor: "hsl(var(--border))",
        borderWidth: 1,
      },
    },
    scales: {
      y: {
        min: 0,
        max: 100,
        ticks: {
          stepSize: 20,
          color: "hsl(var(--muted-foreground))",
        },
        grid: {
          color: "hsl(var(--border))",
        },
      },
      x: {
        ticks: {
          color: "hsl(var(--muted-foreground))",
        },
        grid: {
          color: "hsl(var(--border))",
        },
      },
    },
    elements: {
      point: {
        radius: 4,
        hoverRadius: 6,
        backgroundColor: "hsl(var(--primary))",
        borderColor: "hsl(var(--background))",
        borderWidth: 2,
      },
    },
    animation: {
      duration: 2000,
      easing: "easeOutQuart",
    },
  }

  return <Line data={chartData} options={options} height={300} />
}

export function BarChart({ data }: ChartProps) {
  const chartData = {
    labels: data.map((item) => item.name),
    datasets: [
      {
        label: "Score",
        data: data.map((item) => item.value),
        backgroundColor: [
          "hsl(var(--primary) / 0.7)",
          "hsl(var(--primary) / 0.8)",
          "hsl(var(--primary) / 0.9)",
          "hsl(var(--primary))",
          "hsl(280 83.3% 40.8% / 0.9)",
        ],
        borderRadius: 8,
        borderWidth: 0,
        hoverBackgroundColor: "hsl(var(--primary))",
      },
    ],
  }

  const options: ChartOptions<"bar"> = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        mode: "index",
        intersect: false,
        backgroundColor: "hsl(var(--card))",
        titleColor: "hsl(var(--foreground))",
        bodyColor: "hsl(var(--foreground))",
        borderColor: "hsl(var(--border))",
        borderWidth: 1,
      },
    },
    scales: {
      y: {
        min: 0,
        max: 100,
        ticks: {
          stepSize: 20,
          color: "hsl(var(--muted-foreground))",
        },
        grid: {
          color: "hsl(var(--border))",
        },
      },
      x: {
        ticks: {
          color: "hsl(var(--muted-foreground))",
        },
        grid: {
          color: "hsl(var(--border))",
        },
      },
    },
    animation: {
      duration: 2000,
      easing: "easeOutQuart",
    },
  }

  return <Bar data={chartData} options={options} height={300} />
}

