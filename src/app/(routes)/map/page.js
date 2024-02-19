"use client";

import MapComponent from "@/components/MapComponent";
import GraphComponent from "@/components/GraphComponent";
import { getProduction } from "@/utils/getFarmsProduction";
import { getWindSpeed } from "@/utils/getWindSpeed";
import TimeSliderComponent from "@/components/TimeSliderComponent";
import "../../../output.css";
import { useState, useEffect } from "react";

export default function Map() {
  const [energyData, setEnergyData] = useState(null);
  const [windData, setWindData] = useState(null);
  const [selectedPlant, setSelectedPlant] = useState(null);
  const [selectedTime, setSelectedTime] = useState(12);
  const [selectedDate, setSelectedDate] = useState("2021-06-19");

  const handleTimeChange = (newTime) => {
    setSelectedTime(newTime);
  };
  const handleDateChange = (newDate) => {
    const date = new Date(newDate);
    setSelectedDate(date);
  };
  const handleSelectPlant = (plant) => {
    setSelectedPlant(plant);
  };


  useEffect(() => {
    async function fetchData() {
      if (!selectedPlant || !selectedDate) return;
      const energy = await getProduction(selectedPlant.id, selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
      setEnergyData(energy);

      const wind = await getWindSpeed(selectedPlant.id, selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
      setWindData(wind);
    }

    fetchData();
  }, [selectedPlant, selectedDate]);

  return (
    <div>
      <div className="map-page-container">
        <div class="nav-margin flex column">
          {selectedPlant && <h1>{selectedPlant.name}</h1>}
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4">Energy Output</h2>
            <GraphComponent
              graphValues={energyData}
              chartTitle="Energy Output [MW]"
              selectedTime={selectedTime}
              selectedDate={selectedDate}
            />
          </div>
          <div>
            <h2 className="text-xl font-bold mb-4">Windspeed</h2>
            <GraphComponent
              graphValues={windData}
              chartTitle="Windspeed [m/s]"
              selectedTime={selectedTime}
              selectedDate={selectedTime}
            />
          </div>
        </div>

        <div>
          <MapComponent
            onSelectPlant={handleSelectPlant}
            selectedPlant={selectedPlant}
          >
            <TimeSliderComponent
              onTimeChange={handleTimeChange}
              onDateChange={handleDateChange}
            />
          </MapComponent>
        </div>
      </div>
    </div>
  );
}
