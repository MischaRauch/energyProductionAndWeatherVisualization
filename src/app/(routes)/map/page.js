"use client";

//import MapComponent from "@/components/MapComponent";
// Dynamically import the MapComponent with SSR disabled
import dynamic from "next/dynamic";
const MapComponentWithNoSSR = dynamic(
  () => import("@/components/MapComponent"),
  {
    ssr: false, // This line is key to making sure the import is client-side only
  }
);
import GraphComponent from "@/components/GraphComponent";
import {
  getProduction,
  getEnergyAfterIceLoss,
  getWindSpeed,
  getRelativeHumidity,
  getTemperature,
  getWindDirection,
} from "@/utils/getFarmsProduction";
import TimeSliderComponent from "@/components/TimeSliderComponent";
import SimpleListOfFarmsComponent from "@/components/SimpleListOfFarmsComponent";
import "../../../output.css";
import { useState, useEffect, useRef } from "react";
import { getFarmsMeta } from "@/utils/getFarmsMetaData";
import EnergyProductionLegendComponent from "@/components/EnergyProductionLegendComponent";
import EnergyAfterIceLossLegendComponent from "@/components/EnergyAfterIceLossLegendComponent";
import SelectWeatherDisplayComponent from "@/components/SelectWeatherDisplayComponent";
import EnergyIceLossSwitchButton from "@/components/EnergyIceLossSwitchButton";
import ModelSelectComponent from "@/components/ModelSelectComponent";
import MapLegendComponent from "@/components/MapLegendComponent";
import humidityLegendData from "@/data/humidity_legend_data.json";
import temperatureLegendData from "@/data/temperature_legend_data.json";
import windspeedLegendData from "@/data/windspeed_legend_data.json";
import SearchComponent from "@/components/SearchComponent";
import FilterPropertiesComponent from "@/components/FilterPropertiesComponent";
import PriceAreaComponent from "@/components/PriceAreaComponent";

export default function Map() {
  const [energyData, setEnergyData] = useState(undefined);
  const [allEnergyData, setAllEnergyData] = useState(undefined);
  const [windData, setWindData] = useState(undefined);
  const [humidityData, setHumidityData] = useState(undefined);
  const [temperatureData, setTemperatureData] = useState(undefined);
  const [icelossData, setEnergyAfterIcelossData] = useState(undefined);
  const [percentageEnergyLossIcing, setPercentageEnergyLossIcing] =
    useState(undefined);
  const [windDirectionData, setWindDirectionData] = useState(undefined);
  const [selectedPlant, setSelectedPlant] = useState(undefined);
  const [selectedTime, setSelectedTime] = useState(0);
  const [selectedDate, setSelectedDate] = useState(new Date("2021-11-25"));
  const [plantsArray, setPlants] = useState([]);
  const [hoverInfo, setHoverInfo] = useState(undefined);
  const [selectedGraphs, setSelectedGraphs] = useState([
    "energy",
    "ice loss",
    "aggregated",
  ]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [currentSwitchOption, setCurrentSwitchOption] =
    useState("Energy Production");
  const [selectedLayer, setSelectedLayer] = useState(["WindSpeed"]);
  const [aggregateData, setAggregateData] = useState(undefined);
  const [totalCapacity, setTotalCapacity] = useState(0);
  const [selectedPriceArea, setSelectedPriceArea] = useState();

  const graphTypes = [
    "aggregated",
    "energy",
    "ice loss",
    "windspeed",
    "humidity",
    "temperature",
    "wind direction",
  ];

  // Add a state to keep track of the sorting
  const [sortConfig, setSortConfig] = useState({
    key: "name",
    direction: "asc",
  });
  const filterPropertiesRef = useRef(null);

  // Function to handle the sort order change
  const handleSortOrderChange = (selectedProperty, order) => {
    // If the selected model is "Alphabetical", then sort by the plant's name
    if (selectedProperty === "Alphabetically") {
      setSortConfig({ key: "name", direction: order });
    }
    if (selectedProperty === "Energy Production") {
      setSortConfig({ key: "production", direction: order });
    }
    if (selectedProperty === "Capacity") {
      setSortConfig({ key: "capacity_kw", direction: order });
    }
    if (selectedProperty === "North to South") {
      setSortConfig({ key: "latitude", direction: order });
    }
    if (selectedProperty === "West to East") {
      setSortConfig({ key: "longitude", direction: order });
    }
    if (selectedProperty === "Energy After Ice Loss") {
      setSortConfig({ key: "productionIceLoss", direction: order });
    }
    // Implement sorting logic for other cases if needed...
  };

  const handleSwitchChange = (option) => {
    setCurrentSwitchOption(option);
  };

  const handleLayerChange = (newLayer) => {
    setSelectedLayer(newLayer);
  };
  const handleTimeChange = (newTime) => {
    setSelectedTime(newTime);
  };
  const handleDateChange = (newDate) => {
    const date = new Date(newDate);
    setSelectedDate(date);
  };
  const handlePriceAreaChange = (newPriceArea) => {
    setSelectedPriceArea(newPriceArea);
  };

  const handlePlantSelect = (plant) => {
    setEnergyData(undefined);
    setWindData(undefined);
    setHumidityData(undefined);
    setTemperatureData(undefined);
    setEnergyAfterIcelossData(undefined);
    setWindDirectionData(undefined);
    setSelectedPlant(plant);
  };
  const handlePlantHover = (plant) => {
    setHoverInfo(plant);
  };
  const handleClickClose = () => {
    setSelectedPlant(undefined);
  };
  const handleGraphSelection = (graph) => {
    setSelectedGraphs((prevSelectedGraphs) => {
      if (prevSelectedGraphs.includes(graph)) {
        return prevSelectedGraphs.filter((g) => g !== graph);
      } else {
        return [...prevSelectedGraphs, graph];
      }
    });
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
    setButtonClass(!isDropdownOpen ? "bg-lightgray" : ""); // Add your desired class
  };

  const [buttonClass, setButtonClass] = useState("");

  const [searchInput, setSearchInput] = useState("");
  const [filteredPlantsArray, setFilteredPlantsArray] = useState(plantsArray);

  const handleSearchInputChange = (searchValue) => {
    setSearchInput(searchValue);

    const filteredArray = plantsArray.filter((plant) =>
      plant.name.toLowerCase().includes(searchValue.toLowerCase())
    );

    setFilteredPlantsArray(filteredArray);
  };
  useEffect(() => {
    // Fetch plants and handle sorting whenever sortConfig changes
    const fetchPlants = async () => {
      //let plants = await getFarmsMeta();

      plantsArray.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        // Check if the sorting is supposed to be numeric
        if (sortConfig.key !== "name") {
          // Assuming 'name' is the key for alphabetic sorting
          aValue = parseFloat(aValue);
          bValue = parseFloat(bValue);
        } else {
          // For alphabetic sorting, convert to lowercase for case-insensitive comparison
          aValue = aValue.toLowerCase();
          bValue = bValue.toLowerCase();
        }

        if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });

      let productionValues = plantsArray.map((plant) => plant.production);
      setAllEnergyData(productionValues); // Update your state or variable that holds allEnergyData
    };
    fetchPlants();
  }, [sortConfig]);

  useEffect(() => {
    // Define a new function that will fetch energy data for all plants
    const fetchEnergyDataForAllPlants = async (plants) => {
      let plantWithProduction = []; // Declare plantWithProduction here to increase its scope

      // Map over the plants and get the energy data for each plant
      const promises = plants.map((plant) =>
        getProduction(
          plant.id,
          selectedDate.getFullYear(),
          selectedDate.getMonth() + 1,
          selectedDate.getDate()
        )
      );

      // Resolve all the promises
      const results = await Promise.all(promises);
      // Update the state with the fetched energy data
      const resultsForHour = results.map((plantData) => {
        return plantData[selectedTime]
          ? parseFloat(plantData[selectedTime])
          : null;
      });
      //console.log(results);
      //console.log(resultsForHour);
      setAllEnergyData(resultsForHour);
      // Check if resultsForHour contains any non-null values
      if (resultsForHour.some((value) => value !== null)) {
        // Add 'production' field to each plant and create a new array for production values
        plantWithProduction = plants.map((plant, index) => {
          // Add the 'production' field to each plant object
          plant.production = resultsForHour[index];
          // Return the production value to build the productionValues array
          return plant;
        });
        const filteredMetaResult =
          selectedPriceArea && selectedPriceArea.length > 0
            ? plantWithProduction.filter((item) =>
                selectedPriceArea.includes(item.price_area)
              )
            : plantWithProduction;
        setPlants(filteredMetaResult);
      }
    };

    const fetchIceLossDataForAllPlants = async (plants) => {
      let plantWithIceLoss = []; // Declare plantWithProduction here to increase its scope

      // Map over the plants and get the energy data for each plant
      const promises = plants.map((plant) =>
        getEnergyAfterIceLoss(
          plant.id,
          selectedDate.getFullYear(),
          selectedDate.getMonth() + 1,
          selectedDate.getDate()
        )
      );

      // Resolve all the promises
      const results = await Promise.all(promises);
      // Update the state with the fetched energy data
      const resultsForHour = results.map((plantData) => {
        return plantData[selectedTime]
          ? parseFloat(plantData[selectedTime])
          : null;
      });
      //setAllIceLossData(resultsForHour);
      // Check if resultsForHour contains any non-null values
      if (resultsForHour.some((value) => value !== null)) {
        // Add 'production' field to each plant and create a new array for production values
        plantWithIceLoss = plants.map((plant, index) => {
          // Add the 'production' field to each plant object
          plant.productionIceLoss = resultsForHour[index];
          // Return the production value to build the productionValues array
          return plant;
        });
        const filteredMetaResult =
          selectedPriceArea && selectedPriceArea.length > 0
            ? plantWithIceLoss.filter((item) =>
                selectedPriceArea.includes(item.price_area)
              )
            : plantWithIceLoss;
        setPlants(filteredMetaResult);
      }
    };

    const fetchPlants = async () => {
      const plants = await getFarmsMeta();
      const filteredMetaResult =
        selectedPriceArea && selectedPriceArea.length > 0
          ? plants.filter((item) => selectedPriceArea.includes(item.price_area))
          : plants;
      setPlants(filteredMetaResult);
      // After fetching the plants, fetch the energy data for all plants
      fetchEnergyDataForAllPlants(plants);
      fetchIceLossDataForAllPlants(plants);
    };

    // Call the fetchPlants function when the component mounts
    fetchPlants();
  }, [selectedDate, selectedTime, selectedPriceArea]); // Dependence on selectedDate to re-fetch if it changes

  useEffect(() => {
    // Fetch plants and handle sorting whenever sortConfig changes
    const fetchPlants = async () => {
      //let plants = await getFarmsMeta();

      plantsArray.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        // Check if the sorting is supposed to be numeric
        if (sortConfig.key !== "name") {
          // Assuming 'name' is the key for alphabetic sorting
          aValue = parseFloat(aValue);
          bValue = parseFloat(bValue);
        } else {
          // For alphabetic sorting, convert to lowercase for case-insensitive comparison
          aValue = aValue.toLowerCase();
          bValue = bValue.toLowerCase();
        }

        if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });

      let productionValues = plantsArray.map((plant) => plant.production);
      setAllEnergyData(productionValues); // Update your state or variable that holds allEnergyData
    };

    fetchPlants();
  }, [sortConfig, selectedPriceArea]);

  useEffect(() => {
    // Define a new function that will fetch energy data for all plants
    const fetchEnergyDataForAllPlants = async (plants) => {
      let plantWithProduction = []; // Declare plantWithProduction here to increase its scope

      // Map over the plants and get the energy data for each plant
      const promises = plants.map((plant) =>
        getProduction(
          plant.id,
          selectedDate.getFullYear(),
          selectedDate.getMonth() + 1,
          selectedDate.getDate()
        )
      );

      // Resolve all the promises
      const results = await Promise.all(promises);
      // Update the state with the fetched energy data
      const resultsForHour = results.map((plantData) => {
        return plantData[selectedTime]
          ? parseFloat(plantData[selectedTime])
          : null;
      });
      setAllEnergyData(resultsForHour);
      // Check if resultsForHour contains any non-null values
      if (resultsForHour.some((value) => value !== null)) {
        // Add 'production' field to each plant and create a new array for production values
        plantWithProduction = plants.map((plant, index) => {
          // Add the 'production' field to each plant object
          plant.production = resultsForHour[index];
          // Return the production value to build the productionValues array
          return plant;
        });
        const filteredMetaResult =
          selectedPriceArea && selectedPriceArea.length > 0
            ? plantWithProduction.filter((item) =>
                selectedPriceArea.includes(item.price_area)
              )
            : plantWithProduction;
        setPlants(filteredMetaResult);
      }
    };

    const fetchIceLossDataForAllPlants = async (plants) => {
      let plantWithIceLoss = []; // Declare plantWithProduction here to increase its scope

      // Map over the plants and get the energy data for each plant
      const promises = plants.map((plant) =>
        getEnergyAfterIceLoss(
          plant.id,
          selectedDate.getFullYear(),
          selectedDate.getMonth() + 1,
          selectedDate.getDate()
        )
      );

      // Resolve all the promises
      const results = await Promise.all(promises);
      // Update the state with the fetched energy data
      const resultsForHour = results.map((plantData) => {
        return plantData[selectedTime]
          ? parseFloat(plantData[selectedTime])
          : null;
      });
      //setAllIceLossData(resultsForHour);
      // Check if resultsForHour contains any non-null values
      if (resultsForHour.some((value) => value !== null)) {
        // Add 'production' field to each plant and create a new array for production values
        plantWithIceLoss = plants.map((plant, index) => {
          // Add the 'production' field to each plant object
          plant.productionIceLoss = resultsForHour[index];
          // Return the production value to build the productionValues array
          return plant;
        });
        const filteredMetaResult =
          selectedPriceArea && selectedPriceArea.length > 0
            ? plantWithIceLoss.filter((item) =>
                selectedPriceArea.includes(item.price_area)
              )
            : plantWithIceLoss;
        setPlants(filteredMetaResult);
      }
    };

    const fetchPlants = async () => {
      const plants = await getFarmsMeta();
      const filteredMetaResult =
        selectedPriceArea && selectedPriceArea.length > 0
          ? plants.filter((item) => selectedPriceArea.includes(item.price_area))
          : plants;
      setPlants(filteredMetaResult);
      // After fetching the plants, fetch the energy data for all plants
      fetchEnergyDataForAllPlants(plants);
      fetchIceLossDataForAllPlants(plants);
    };

    // Call the fetchPlants function when the component mounts
    fetchPlants();
  }, [selectedDate, selectedTime, selectedPriceArea]); // Dependence on selectedDate to re-fetch if it changes

  useEffect(() => {
    // Fetch plants and handle sorting whenever sortConfig changes
    const fetchPlants = async () => {
      //let plants = await getFarmsMeta();

      plantsArray.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        // Check if the sorting is supposed to be numeric
        if (sortConfig.key !== "name") {
          // Assuming 'name' is the key for alphabetic sorting
          aValue = parseFloat(aValue);
          bValue = parseFloat(bValue);
        } else {
          // For alphabetic sorting, convert to lowercase for case-insensitive comparison
          aValue = aValue.toLowerCase();
          bValue = bValue.toLowerCase();
        }

        if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });

      let productionValues = plantsArray.map((plant) => plant.production);
      setAllEnergyData(productionValues); // Update your state or variable that holds allEnergyData
    };

    fetchPlants();
  }, [sortConfig, selectedPriceArea]);

  useEffect(() => {
    // Define a new function that will fetch energy data for all plants
    const fetchEnergyDataForAllPlants = async (plants) => {
      let plantWithProduction = []; // Declare plantWithProduction here to increase its scope

      // Map over the plants and get the energy data for each plant
      const promises = plants.map((plant) =>
        getProduction(
          plant.id,
          selectedDate.getFullYear(),
          selectedDate.getMonth() + 1,
          selectedDate.getDate()
        )
      );

      // Resolve all the promises
      const results = await Promise.all(promises);
      // Update the state with the fetched energy data
      const resultsForHour = results.map((plantData) => {
        return plantData[selectedTime]
          ? parseFloat(plantData[selectedTime])
          : null;
      });
      setAllEnergyData(resultsForHour);
      // Check if resultsForHour contains any non-null values
      if (resultsForHour.some((value) => value !== null)) {
        // Add 'production' field to each plant and create a new array for production values
        plantWithProduction = plants.map((plant, index) => {
          // Add the 'production' field to each plant object
          plant.production = resultsForHour[index];
          // Return the production value to build the productionValues array
          return plant;
        });
        const filteredMetaResult =
          selectedPriceArea && selectedPriceArea.length > 0
            ? plantWithProduction.filter((item) =>
                selectedPriceArea.includes(item.price_area)
              )
            : plantWithProduction;
        setPlants(filteredMetaResult);
      }
    };

    const fetchIceLossDataForAllPlants = async (plants) => {
      let plantWithIceLoss = []; // Declare plantWithProduction here to increase its scope

      // Map over the plants and get the energy data for each plant
      const promises = plants.map((plant) =>
        getEnergyAfterIceLoss(
          plant.id,
          selectedDate.getFullYear(),
          selectedDate.getMonth() + 1,
          selectedDate.getDate()
        )
      );

      // Resolve all the promises
      const results = await Promise.all(promises);
      // Update the state with the fetched energy data
      const resultsForHour = results.map((plantData) => {
        return plantData[selectedTime]
          ? parseFloat(plantData[selectedTime])
          : null;
      });
      //setAllIceLossData(resultsForHour);
      // Check if resultsForHour contains any non-null values
      if (resultsForHour.some((value) => value !== null)) {
        // Add 'production' field to each plant and create a new array for production values
        plantWithIceLoss = plants.map((plant, index) => {
          // Add the 'production' field to each plant object
          plant.productionIceLoss = resultsForHour[index];
          // Return the production value to build the productionValues array
          return plant;
        });
        const filteredMetaResult =
          selectedPriceArea && selectedPriceArea.length > 0
            ? plantWithIceLoss.filter((item) =>
                selectedPriceArea.includes(item.price_area)
              )
            : plantWithIceLoss;
        setPlants(filteredMetaResult);
      }
    };

    const fetchPlants = async () => {
      const plants = await getFarmsMeta();
      const filteredMetaResult =
        selectedPriceArea && selectedPriceArea.length > 0
          ? plants.filter((item) => selectedPriceArea.includes(item.price_area))
          : plants;
      setPlants(filteredMetaResult);
      // After fetching the plants, fetch the energy data for all plants
      fetchEnergyDataForAllPlants(plants);
      fetchIceLossDataForAllPlants(plants);
    };

    // Call the fetchPlants function when the component mounts
    fetchPlants();
    setSortConfig("Alphabetically");
    //TODO change the appereance of the filterPropertiesComponent so that it displays Alphabetically
    // Call the resetSelectedProperty method to reset the selectedProperty to 'Alphabetically'
    filterPropertiesRef.current?.resetSelectedProperty?.();
  }, [selectedDate, selectedTime, selectedPriceArea]); // Dependence on selectedDate to re-fetch if it changes

  useEffect(() => {
    async function fetchDataForSelectedPlant() {
      if (!selectedPlant || !selectedDate) return;

      const energy = await getProduction(
        selectedPlant.id,
        selectedDate.getFullYear(),
        selectedDate.getMonth() + 1,
        selectedDate.getDate()
      );
      setEnergyData(energy);

      const energyAfterIceloss = await getEnergyAfterIceLoss(
        selectedPlant.id,
        selectedDate.getFullYear(),
        selectedDate.getMonth() + 1,
        selectedDate.getDate()
      );
      setEnergyAfterIcelossData(energyAfterIceloss);

      const wind = await getWindSpeed(
        selectedPlant.id,
        selectedDate.getFullYear(),
        selectedDate.getMonth() + 1,
        selectedDate.getDate()
      );
      setWindData(wind);

      const humidity = await getRelativeHumidity(
        selectedPlant.id,
        selectedDate.getFullYear(),
        selectedDate.getMonth() + 1,
        selectedDate.getDate()
      );
      setHumidityData(humidity);

      const temperature = await getTemperature(
        selectedPlant.id,
        selectedDate.getFullYear(),
        selectedDate.getMonth() + 1,
        selectedDate.getDate()
      );
      setTemperatureData(temperature);
      const windDirection = await getWindDirection(
        selectedPlant.id,
        selectedDate.getFullYear(),
        selectedDate.getMonth() + 1,
        selectedDate.getDate()
      );
      setWindDirectionData(windDirection);
    }

    async function fetchAggregateData(plants) {
      if (!selectedDate || !plants) return;

      // Reset aggregateData when selectedDate or plants list changes
      let localAggregateData = new Array(24).fill(0);
      let capacitySum = 0;

      for (const plant of plants) {
        capacitySum += Number(plant.capacity_kw);
        const energyDataStr = await getProduction(
          plant.id,
          selectedDate.getFullYear(),
          selectedDate.getMonth() + 1,
          selectedDate.getDate()
        );

        const energyData = energyDataStr.map(Number);
        localAggregateData = localAggregateData.map((sum, index) => {
          const currentEnergy = energyData[index] || 0;
          return sum + currentEnergy;
        });
      }

      setAggregateData(localAggregateData);
      setTotalCapacity(capacitySum);
    }

    async function fetchPlantsAndAggregateData() {
      const plants = await getFarmsMeta();
      const filteredMetaResult =
        selectedPriceArea && selectedPriceArea.length > 0
          ? plants.filter((item) => selectedPriceArea.includes(item.price_area))
          : plants;
      setPlants(filteredMetaResult);

      // Now passing the freshly fetched plants directly to fetchAggregateData
      fetchAggregateData(filteredMetaResult);
    }

    // Fetch metadata for all plants and then fetch and aggregate data for all plants
    fetchPlantsAndAggregateData();

    // Fetch data for the selected plant
    fetchDataForSelectedPlant();
  }, [selectedPlant, selectedDate, selectedPriceArea]);

  const [weatherData, setWeatherData] = useState([]);

  function calculatePercentage(obj1, obj2) {
    if (obj1 !== undefined && obj2 !== undefined) {
      const result = [];
      for (const key in obj1) {
        if (obj1.hasOwnProperty(key) && obj2.hasOwnProperty(key)) {
          // Ensure the divisor is not 0 to avoid division by zero
          const divisor = parseFloat(obj2[key]);
          if (divisor !== 0) {
            const dividend = parseFloat(obj1[key]);
            const rate = 1 - dividend / divisor; // -1 because is the inverted
            result[key] = (rate * 100).toString();
          } else {
            // Handle the case where the divisor is 0, maybe set it to null or some other value
            result[key] = "0"; // or another appropriate value
          }
        }
      }
      return result;
    }
  }

  useEffect(() => {
    switch (selectedLayer[0]) {
      case "RelativeHumidity":
        setWeatherData(humidityLegendData);
        break;
      case "Temperature":
        setWeatherData(temperatureLegendData);
        break;
      case "WindSpeed":
        setWeatherData(windspeedLegendData);
        break;

      default:
        setWeatherData(windspeedLegendData);
    }
  }, [selectedLayer, selectedPriceArea]);

  return (
    <div>
      <div className="ml-16 grid grid-col-2 vh-100">
        <div className="overflow-y map-col">
          {selectedPlant && (
            <div className="py-5">
              <div className="flex justify-end w-full">
                <button className="mr-4" onClick={handleClickClose}>
                  <img
                    className="w-25"
                    src="/assets/icons/back-arrow.svg"
                  ></img>
                </button>
              </div>

              <div>
                {selectedGraphs.includes("aggregated") && (
                  <>
                    <h2 className="mt-0 mb-0">All farms</h2>
                    <GraphComponent
                      graphValues={aggregateData}
                      chartTitle="Aggregate Energy Output"
                      selectedTime={selectedTime}
                      selectedDate={selectedDate}
                      maxCapacity={totalCapacity}
                      yAxisTitle="MW"
                      lineColor="rgb(95, 190, 179)"
                      lineBackgroundColor="rgb(95, 190, 179, 0.35)"
                    />
                  </>
                )}
              </div>
              <div className="flex justify-between items-end w-ful pr-2">
                <h1 className=" mt-2 mb-0 font-blue">{selectedPlant.name}</h1>
                <div>
                  <button
                    onClick={toggleDropdown}
                    className={`  bg-lightgray  flex items-center lightgray-hover px-2 rounded-md py-2 z-50 ${buttonClass}`}
                  >
                    <span className="mr-2">Choose graphs</span>
                    <img
                      src="/assets/icons/arrow-w.svg"
                      alt="Dropdown Indicator"
                    />
                  </button>
                  {isDropdownOpen && (
                    <div className="absolute  bg-lightgray shadow-md z-10  p-3 background-effect bottom-border pr-2">
                      {graphTypes.map((type) => (
                        <div key={type} className="flex items-center">
                          <input
                            type="checkbox"
                            id={type}
                            checked={selectedGraphs.includes(type)}
                            onChange={() => handleGraphSelection(type)}
                            className="mr-2"
                          />
                          <label htmlFor={type}>{type}</label>
                        </div>
                      ))}
                    </div>
                  )}{" "}
                </div>
              </div>

              {selectedGraphs.includes("energy") && (
                <GraphComponent
                  graphValues={energyData}
                  selectedTime={selectedTime}
                  selectedDate={selectedDate}
                  maxCapacity={selectedPlant.capacity_kw}
                  chartTitle="Energy Output w/o Iceloss"
                  yAxisTitle="MW"
                  lineColor="rgb(95, 190, 179)"
                  lineBackgroundColor="rgb(95, 190, 179, 0.35)"
                  icelossData={icelossData}
                />
              )}

              <div>
                {selectedGraphs.includes("ice loss") && (
                  <GraphComponent
                    graphValues={calculatePercentage(icelossData, energyData)}
                    chartTitle="% Energy loss due to Icing "
                    selectedTime={selectedTime}
                    selectedDate={selectedDate}
                    yAxisTitle="%"
                    lineColor="rgb(255, 99, 132)"
                    lineBackgroundColor="rgb(255, 99, 132, 0.35)"
                  />
                )}
              </div>
              <div>
                {selectedGraphs.includes("windspeed") && (
                  <GraphComponent
                    graphValues={windData}
                    chartTitle="Windspeed"
                    selectedTime={selectedTime}
                    selectedDate={selectedDate}
                    yAxisTitle="m/s"
                    lineColor="rgb(199, 218, 242)"
                    lineBackgroundColor="rgb(199, 218, 242, 0.35)"
                  />
                )}
              </div>
              <div>
                {selectedGraphs.includes("humidity") && (
                  <GraphComponent
                    graphValues={humidityData}
                    chartTitle="Humidity"
                    selectedTime={selectedTime}
                    selectedDate={selectedDate}
                    yAxisTitle="RH"
                    lineColor="rgb(199, 218, 242)"
                    lineBackgroundColor="rgb(199, 218, 242, 0.35)"
                  />
                )}
              </div>
              <div>
                {selectedGraphs.includes("temperature") && (
                  <GraphComponent
                    graphValues={temperatureData}
                    chartTitle="Temperature"
                    selectedTime={selectedTime}
                    selectedDate={selectedDate}
                    yAxisTitle="°C"
                    lineColor="rgb(199, 218, 242)"
                    lineBackgroundColor="rgb(199, 218, 242, 0.35)"
                  />
                )}
              </div>
              <div>
                {selectedGraphs.includes("wind direction") && (
                  <GraphComponent
                    graphValues={windDirectionData}
                    chartTitle="Wind Direction"
                    selectedTime={selectedTime}
                    selectedDate={selectedDate}
                    yAxisTitle="degrees"
                    lineColor="rgb(199, 218, 242)"
                    lineBackgroundColor="rgb(199, 218, 242, 0.35)"
                  />
                )}
              </div>
            </div>
          )}
          {!selectedPlant && (
            <div className="py-5">
              <h2 className="mt-0 mb-0"> All farms</h2>
              <div className="mb-8">
                {selectedGraphs.includes("aggregated") && (
                  <GraphComponent
                    graphValues={aggregateData}
                    chartTitle="Aggregate Energy Output"
                    selectedTime={selectedTime}
                    selectedDate={selectedDate}
                    maxCapacity={totalCapacity}
                    yAxisTitle="MW"
                    lineColor="rgb(95, 190, 179)"
                    lineBackgroundColor="rgb(95, 190, 179, 0.35)"
                  />
                )}
              </div>

              <SearchComponent onSearchChange={handleSearchInputChange} />
              <FilterPropertiesComponent
                ref={filterPropertiesRef}
                onSortOrderChange={handleSortOrderChange}
              />
              <PriceAreaComponent onPriceAreaChange={handlePriceAreaChange} />
              <SimpleListOfFarmsComponent
                plantsArray={searchInput ? filteredPlantsArray : plantsArray}
                energyData={allEnergyData}
                hoverInfo={hoverInfo}
                onSelectPlant={handlePlantSelect}
                onHoverPlant={handlePlantHover}
              />
            </div>
          )}
        </div>

        <div className="w-full map-col relative">
          <div
            className="absolute top-0 right-0 z-50 mt-4 mr-4 p-4 flex flex-col items-end"
            style={{ padding: "0px" }}
          >
            <ModelSelectComponent />
            <SelectWeatherDisplayComponent onLayerChange={handleLayerChange} />
            <MapLegendComponent
              weatherData={weatherData}
              visible={selectedLayer.length >= 1}
            ></MapLegendComponent>
          </div>
          <MapComponentWithNoSSR
            className="mr-2"
            onSelectPlant={handlePlantSelect}
            selectedPlant={selectedPlant}
            plantsArray={searchInput ? filteredPlantsArray : plantsArray}
            hoverInfo={hoverInfo}
            icelossPercentage={percentageEnergyLossIcing}
            //energyOutput={results}
            selectedDate={selectedDate}
            selectedTime={selectedTime}
            switchOption={currentSwitchOption}
            selectedLayer={selectedLayer}
            allEnergyData={allEnergyData}
          >
            <div className="flex flex-col items-end w-full">
              <div className="flex flex-col items-end">
                <EnergyIceLossSwitchButton
                  onSwitchChange={handleSwitchChange}
                />
                {currentSwitchOption === "Energy Production" ? (
                  <EnergyProductionLegendComponent />
                ) : (
                  <EnergyAfterIceLossLegendComponent />
                )}
              </div>
              <TimeSliderComponent
                onTimeChange={handleTimeChange}
                onDateChange={handleDateChange}
              />
            </div>
          </MapComponentWithNoSSR>
        </div>
      </div>
    </div>
  );
}

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}
