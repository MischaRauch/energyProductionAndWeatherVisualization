"use client";
import React, { useState, useEffect } from "react";

import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    PointElement,
    LineElement,
    Colors,
} from "chart.js";
import { Line } from "react-chartjs-2";
import annotationPlugin from "chartjs-plugin-annotation";

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    annotationPlugin,
    Colors
);

function GraphIcelossComponenet({
    energyData, // New prop for energy data
    icelossData, // New prop for iceloss data
    chartTitle,
    selectedTime,
    selectedDate,
}) {
    const [isLoading, setIsLoading] = useState(true);
    const selectedLabel = `PH${selectedTime}`;
    const chartData = {
        labels: [
            "PH1", "PH2", "PH3", "PH4", "PH5", "PH6", "PH7", "PH8", "PH9", "PH10",
            "PH11", "PH12", "PH13", "PH14", "PH15", "PH16", "PH17", "PH18", "PH19",
            "PH20", "PH21", "PH22", "PH23", "PH24",
        ],
        datasets: [
            {
                label: 'Energy',
                data: !isLoading ? energyData : Array(24).fill(0),
                borderColor: !isLoading ? "rgb(135, 211, 184)" : "rgb(30, 30, 30)",
                backgroundColor: "rgb(135, 211, 184, 0.25)",
            },
            {
                label: 'Ice Loss',
                data: !isLoading ? icelossData : Array(24).fill(0),
                borderColor: 'rgb(255, 99, 132)', // Red color for iceloss
                backgroundColor: "rgb(135, 211, 184, 0.25)",
            },
        ],
    };
    // Options remain unchanged
    const options = {
        maintainAspectRatio: false,
        stepped: true,
        scales: {
            y: {
                grid: {
                    color: "rgb(98,98,98)",
                },
                ticks: {
                    color: "rgb(214,214,214)",
                },
                beginAtZero: true,
            },
            x: {
                grid: {
                    color: "rgb(98,98,98)",
                },
                ticks: {
                    color: "rgb(214,214,214)",
                },
            },
        },
        plugins: {
            legend: {
                labels: {
                    color: "rgb(214,214,214)",
                    fontSize: 18,
                },
            },
            annotation: {
                annotations: {
                    line1: {
                        type: "line",
                        yMin: 0,
                        yMax: "max",
                        xMin: chartData.labels.indexOf(selectedLabel),
                        xMax: chartData.labels.indexOf(selectedLabel),
                        //colors controlling the timeslider
                        borderColor: "rgba(255, 99, 132)",
                        borderWidth: 3,
                    },
                },
            },
        },
    };

    useEffect(() => {
        if ((energyData && energyData.length > 0) || (icelossData && icelossData.length > 0)) {
            setIsLoading(false);
        } else {
            console.log("loading");
            setIsLoading(true);
        }
    }, [energyData, icelossData]);

    // Render logic remains unchanged
    return (
        <div className="graph">
            {isLoading ? (
                <div className="animate-pulse">Loading...</div>
            ) : (
                <Line data={chartData} options={options} />
            )}
        </div>
    );
}
export default GraphIcelossComponenet;