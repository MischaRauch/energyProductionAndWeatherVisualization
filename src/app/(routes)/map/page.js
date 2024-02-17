"use client"

import MapComponent from "@/components/MapComponent";
import GraphComponent from "@/components/GraphComponent";
import { getProduction } from "@/utils/getFarmsProduction";
import { getWindSpeed } from "@/utils/getWindSpeed";
import TimeSliderComponent from "@/components/TimeSliderComponent";
import '../../../output.css';
import { useState, useEffect } from "react";

export default function Map() {
  const [energyData, setEnergyData] = useState(null);
  const [windData, setWindData] = useState(null);
  const [selectedPlant, setSelectedPlant] = useState(null);
  const [selectedTime, setSelectedTime] = useState(12);
  const [selectedDate, setSelectedDate] = useState('2021-06-19');

  const handleTimeChange = (newTime) => {
    setSelectedTime(newTime);
  }
  const handleDayChange = (newDay) => {
    setSelectedDate(newDay);
  }
  const handleSelectPlant = (plant) => {
    setSelectedPlant(plant);
  };

    useEffect(() => {
      async function fetchData() {
        if(!selectedPlant) return;
        const energy = await getProduction(selectedPlant.id, 2021, 6, 19);
        setEnergyData(energy);

        const wind = await getWindSpeed(selectedPlant.id, 2021, 6, 19);
        setWindData(wind);
      }
      
      fetchData();
  }, [selectedPlant]);

  return (
    <div>
      {selectedPlant && <h1>Selected plant is {selectedPlant.name}</h1>}
      <div className="grid grid-cols-2 gap-4">
          <div class="flex flex-col space-y-4">
              <div className="mb-8">
                  <h1 className="text-xl font-bold mb-4">Energy Output</h1>
                  <GraphComponent graphValues={energyData} chartTitle="Energy Output" selectedTime={selectedTime} selectedDate={selectedDate} />
              </div>
              <div>
                  <h1 className="text-xl font-bold mb-4">Windspeed</h1>
                  <GraphComponent graphValues={windData} chartTitle="Windspeed" selectedTime={selectedTime} selectedDate={selectedTime}/>
              </div>
          </div>

          <div>
              <MapComponent onSelectPlant={handleSelectPlant} selectedPlant={selectedPlant}>
                <TimeSliderComponent onTimeChange={handleTimeChange} onDateChange={handleDayChange} />
              </MapComponent>
          </div>
      </div>
    </div>
  );


  
  
  
    
    
    
}
