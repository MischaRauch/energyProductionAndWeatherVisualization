"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import "mapbox-gl/dist/mapbox-gl.css";
import * as WeatherLayersClient from "weatherlayers-gl/client";
import * as WeatherLayers from "weatherlayers-gl";
import { MapboxOverlay } from "@deck.gl/mapbox";
import { ClipExtension } from "@deck.gl/extensions";
import MapGL, { Popup, Marker } from "react-map-gl";
import MarkerIconComponent from "./MarkerIconComponent";
import { getProductionInHour, getProductionAfterIceLossInHour } from "@/utils/getFarmsProduction";
import EnergyIceLossSwitchButton from './EnergyIceLossSwitchButton';


function MapComponent({
  onSelectPlant,
  selectedPlant,
  children,
  plantsArray,
  onHoverPlant,
  hoverInfo,
  selectedDate,
  selectedTime,
  onSwitchChange,
  selectedLayer,
}) {
  const [viewState, setViewState] = useState({
    latitude: 60.472,
    longitude: 8.4689,
    zoom: 3.8,
  });

  const [switchOption, setSwitchOption] = useState('Energy Production');
  const popupRef = useRef(null);
  const mapRef = useRef(null);
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
  const [map, setMap] = useState(null);
  const [energyData, setEnergyData] = useState(null);
  const [energyDataAfterIceLoss, setenergyDataAfterIceLoss] = useState(null);

  const windSpeedPalette = [
    [0, [204, 229, 255]], // light blue
    [5, [100, 149, 237]], // cobalt blue
    [10, [60, 179, 113]], // sea green
    [15, [255, 193, 37]], // golden yellow
    [20, [255, 69, 0]], // red-orange
    [25, [148, 0, 211]], // dark violet
  ];

  const temperaturePalette = [
    [-40, [0, 0, 255]], // deep blue
    [-30, [100, 149, 237]], // deeper blue
    [-20, [135, 206, 250]], // blue
    [-10, [173, 216, 230]], // light blue
    [0, [255, 255, 255]], // white
    [10, [255, 255, 0]], // yellow
    [20, [255, 165, 0]], // orange
    [30, [255, 69, 0]], // red-orange
    [40, [255, 0, 0]], // red
  ];

  const humidityPalette = [
    [0, [255, 139, 0]], // deep orange
    [20, [255, 179, 71]], // lighter orange
    [40, [255, 214, 102]], // soft yellow
    [60, [204, 229, 255]], // light blue
    [80, [100, 149, 237]], // cobalt blue
    [100, [0, 0, 255]], // deep blue
  ];

  const WLConfig = {
    // particle layer
    particleWidth: 2,
    particleMaxAge: 25,
    palette: windSpeedPalette,
    particleOpacity: 0.8,
    particleSpeedFactor: 5,
    imageSmoothing: 5,
    imageUnscale: [-127, 128],
    // raster layer
    rasterOpacity: 0.5,
    // common properties for all layers
    extensions: [new ClipExtension()],
    clipBounds: [-23.5, 29.5, 45.0, 70.5],
    bounds: [-23.5, 29.5, 45.0, 70.5],

    tempPalette: temperaturePalette,
    tempUnscale: [-40, 40],

    humPalette: humidityPalette,
    humUnscale: [0, 100],
  };

  const deckOverlay = new MapboxOverlay({
    interleaved: true,
    layers: []
  });

  const handleMarkerClick = (plant, event) => {
    // Prevent the map click event from firing when a marker is clicked
    event.stopPropagation();

    if (selectedPlant && plant.id === selectedPlant.id) { // deselects it 
      onSelectPlant(undefined);
    } else { // selects a plant 
      onSelectPlant(plant);

    }
  };

  const handleMapClick = (event) => {
    // Use the map reference to check if the click was on the canvas
    if (mapRef.current && mapRef.current.getMap()) {
      const map = mapRef.current.getMap();
      const canvas = map.getCanvas();
      if (event.target === map) { // clicked on map - deselect farm 
        onSelectPlant(undefined);
      }
    }
  };

  const handlePlantHover = (plant) => {
    onHoverPlant(plant);
  };

  const onMapLoad = useCallback(async (event) => {
    const newMap = event.target;
    setMap(newMap);

  }, []);

  const setWeatherLayers = async (activeWeatherImages, activeWeatherOptions) => {
    const weatherLayersToken =
      process.env.NEXT_PUBLIC_WEATHERLAYERS_ACCESS_TOKEN;

    const client = new WeatherLayersClient.Client({
      accessToken: weatherLayersToken,
    });

    // only add overlay once
    if (!map.hasControl(deckOverlay)) {
      map.addControl(deckOverlay);
    }

    try {
      const rebaseWindImage = await WeatherLayers.loadTextureData(
        activeWeatherImages.wind
      );

      const rebaseTempImage = await WeatherLayers.loadTextureData(
        activeWeatherImages.temp
      );

      const rebaseHumImage = await WeatherLayers.loadTextureData(
        activeWeatherImages.hum
      );

      map.addControl(deckOverlay);
      const layers = [
        ...(activeWeatherOptions.wind ? [
          new WeatherLayers.RasterLayer({
            id: "raster",
            image: rebaseWindImage,
            imageType: "VECTOR",
            imageUnscale: WLConfig.imageUnscale,
            palette: WLConfig.palette,

            opacity: WLConfig.rasterOpacity,
            extensions: WLConfig.extensions,
            clipBounds: WLConfig.clipBounds,
            bounds: WLConfig.bounds,
            imageSmoothing: WLConfig.imageSmoothing,
          })
        ] : []),
        ...(activeWeatherOptions.wind ? [
          new WeatherLayers.ParticleLayer({
            id: "particle",
            image: rebaseWindImage,
            imageUnscale: WLConfig.imageUnscale,
            width: WLConfig.particleWidth,
            maxAge: WLConfig.particleMaxAge,
            palette: WLConfig.palette,
            opacity: WLConfig.particleOpacity,
            speedFactor: WLConfig.particleSpeedFactor,
            extensions: WLConfig.extensions,
            clipBounds: WLConfig.clipBounds,
            bounds: WLConfig.bounds,
            imageSmoothing: WLConfig.imageSmoothing,
          })
        ] : []),
        ...(activeWeatherOptions.temp ? [
          new WeatherLayers.RasterLayer({
            id: "raster",
            image: rebaseTempImage,
            imageUnscale: WLConfig.tempUnscale,
            palette: WLConfig.tempPalette,
            opacity: WLConfig.rasterOpacity,
            extensions: WLConfig.extensions,
            clipBounds: WLConfig.clipBounds,
            bounds: WLConfig.bounds,
            imageSmoothing: WLConfig.imageSmoothing,
          })
        ] : []),
        ...(activeWeatherOptions.hum ? [
          new WeatherLayers.RasterLayer({
            id: "raster",
            image: rebaseHumImage,
            imageUnscale: WLConfig.humUnscale,
            palette: WLConfig.humPalette,
            opacity: WLConfig.rasterOpacity,
            extensions: WLConfig.extensions,
            clipBounds: WLConfig.clipBounds,
            bounds: WLConfig.bounds,
            imageSmoothing: WLConfig.imageSmoothing,
          })
        ] : []),
      ];


      deckOverlay.setProps({
        layers
      });
    } catch (error) {
      console.error("Something went wrong when adding weather layers or retrieving image(s): ", error);
    }
  }

  // handle switch changes of energy and ice loss 
  const handleSwitchChange = (option) => {
    setSwitchOption(option);
    onSwitchChange(option); // Directly use onSwitchChange without props.
  };

  const getMarkerColor = (plant) => {
    if (switchOption == 'Ice Loss') {
      return markerIceLoss(plant.id);
    } else if (switchOption == 'Energy Production') {
      return markerEnergyProduction(plant.id, plant.capacity_kw)
    }
  };

  const markerIceLoss = (plantID) => {
    const energy = energyData[plantID - 1];
    const energyIceLoss = energyDataAfterIceLoss[plantID - 1];

    // Check if energy is zero or not a number (NaN) - if so: the iceLoss is 0, so the plant is not affected by it 
    if (!energy || isNaN(energy) || energy == 0.0) {
      console.log(plantID, 'Invalid energy value:', energy);
      return '#3BCA6D'; 
    }

    const ratio = 1 -(energyIceLoss / energy); // the ratio represents the percentage of energy lost due to icing

    if (ratio > 0.9) { // loss of energy due to icing is very high 
      return "#e51f1f"; 
    } else if (ratio > 0.7) {
      return "#f2a134"; 
    } else if (ratio > 0.5) {
      return "#f7e379";
    } else if (ratio > 0.3) {
      return "#bbdb44";
    } else {
      return "#3BCA6D";
    }
  };

  const markerEnergyProduction = (plantID, capacity_kw) => {
    if (energyData == null) {
      return 0;
    }
    const current_energy = energyData[plantID - 1];
    const casted_energy = Number(current_energy);
    const capacity = capacity_kw / 1000; // From KW to MW
    const ratio = casted_energy / capacity;

    if (ratio > 0.8) { // farm is producing almost a full capacity 
      return "#3BCA6D";
    } else if (ratio > 0.6) {
      return "#bbdb44";
    } else if (ratio > 0.4) {
      return "#f7e379";
    } else if (ratio > 0.2) {
      return "#f2a134";
    } else {
      return "#e51f1f";
    }
  };

  useEffect(() => {
    if (map) {
      // Initialize a new state for active layers
      const newActiveLayers = {
        wind: false,
        temp: false,
        hum: false,
      };

      // Iterate over the selectedLayer array and update newActiveLayers accordingly
      selectedLayer.forEach((layer) => {
        if (layer === "WindSpeed") {
          newActiveLayers.wind = true;
        } else if (layer === "Temperature") {
          newActiveLayers.temp = true;
        } else if (layer === "RelativeHumidity") {
          newActiveLayers.hum = true;
        }
      });

      popupRef.current?.trackPointer();

      const prefix = "./assets/weather_data/";
      const numTemp = parseInt(selectedTime, 10) - 1;
      const number = numTemp < 10 ? `0${numTemp}` : `${numTemp}`;
      const activeWeatherImages = {
        wind: prefix + "wind/wind_20211125" + number + ".png",
        temp: prefix + "temperature/temperature_20211125" + number + ".png",
        hum: prefix + "humidity/humidity_20211125" + number + ".png"
      };

      setWeatherLayers(activeWeatherImages,newActiveLayers);

      async function fetchData() {
        const year = selectedDate.getFullYear();
        const month = selectedDate.getMonth() + 1;
        const day = selectedDate.getDate();

        // Current energy production 
        const energyPromises = plantsArray.map(async (item) => {
          try {
            const energy = await getProductionInHour(
              item.id,
              year,
              month,
              day,
              selectedTime
            );
            return energy;
          } catch (error) {
            console.error(
              `Failed to fetch energy data for plant ${item.id}`,
              error
            );
            return [0]; // Return 0 for this plant if there's an error
          }
        });

        // Resolve all promises and set the state
        Promise.all(energyPromises).then((energyResults) => {
          setEnergyData(energyResults);
        });

        // Energy after Ice Loss
        const energyAfterIceLossPromises = plantsArray.map(async (item) => {
          try {
            const energy = await getProductionAfterIceLossInHour(
              item.id,
              year,
              month,
              day,
              selectedTime
            );
            return energy;
          } catch (error) {
            console.error(
              `Failed to fetch energy data after ice loss for plant ${item.id}`,
              error
            );
            return [0]; // Return 0 for this plant if there's an error
          }
        });

        // Resolve all promises and set the state
        Promise.all(energyAfterIceLossPromises).then((energyResults) => {
          setenergyDataAfterIceLoss(energyResults);
        });


      }





      if (selectedDate) {
        fetchData();
      }
    }
  }, [selectedLayer, selectedDate, selectedTime, map]);

  function formatCoordinates(coordinate, type) {
    const degrees = Math.abs(coordinate);
    const direction =
      coordinate >= 0
        ? type === "latitude"
          ? "N"
          : "E"
        : type === "latitude"
          ? "S"
          : "W";

    // Use toFixed(4) to get 4 decimal places for the degrees
    const formattedCoordinate = degrees.toFixed(4);

    // Return the formatted string
    return `${formattedCoordinate}° ${direction}`;
  }

  return (
    <div className="relative w-full h-full">
      <MapGL
        {...viewState}
        ref={mapRef}
        onMove={(evt) => setViewState(evt.viewState)}
        //onMoveStart={handleMoveStart}
        onClick={handleMapClick} // Use the new handler for map clicks
        style={{ width: "100%", height: "100%" }}
        mapStyle="mapbox://styles/iv24/clsq58r47006b01pk05dpavbj"
        projection={"mercator"}
        mapboxAccessToken={mapboxToken}
        //onViewportChange={(nextViewport) => setViewport(nextViewport)}
        onLoad={onMapLoad}
      >
        {plantsArray.map((plant) => (
          <Marker
            key={plant.id}
            latitude={plant.latitude}
            longitude={plant.longitude}
            anchor="bottom"
          >
            <div
              onMouseEnter={() => handlePlantHover(plant)}
              onMouseLeave={() => handlePlantHover(undefined)}
              onClick={(event) => handleMarkerClick(plant, event)} // Pass the event to the click handler
              style={{ cursor: "pointer" }}
            >
              {(selectedPlant && selectedPlant.id === plant.id) ||
                (hoverInfo && hoverInfo.id === plant.id) ? (
                <img
                  src="/assets/pin_selected.svg"
                  style={{ width: "30px", height: "30px" }}
                />
              ) : (
                <MarkerIconComponent
                  getMarkerColor={() =>
                    getMarkerColor(plant)
                  }
                  style={{ opacity: 0.7, width: "30px", height: "30px" }}
                />
              )}
            </div>
          </Marker>
        ))}

        {hoverInfo && (
          <div>
            <Popup
              latitude={hoverInfo.latitude}
              longitude={hoverInfo.longitude}
              closeButton={false}
              closeOnClick={false}
              ref={popupRef}
              anchor="top"
              offsetTop={-30}
            >
              <div>
                <p className="font-bold text-xxl mb-1">{hoverInfo.name}</p>
                <p className="text-xs font-thin mb-2">
                  {formatCoordinates(hoverInfo.latitude, "latitude")},{" "}
                  {formatCoordinates(hoverInfo.longitude, "longitude")}
                </p>
                <p>
                  <b>Capacity:</b>{" "}
                  <span className="font-blue">
                    {hoverInfo.capacity_kw / 1000} MW
                  </span>
                </p>
                <p>
                  <b>Current energy output:</b>{" "}
                  <span className="font-blue">XX kWh</span>
                </p>
                <p>
                  <b>Current ice-loss:</b> <span className="font-red">x%</span>
                </p>
                <p>
                  <b>Current wind speed:</b>{" "}
                  <span className="font-blue">12 m/s</span>
                </p>
              </div>
            </Popup>
          </div>
        )}

        <div className="absolute inset-x-0 bottom-0 p-4 flex justify-center">
          {children}
        </div>
        <div className="absolute top-0 right-0 m-4">
          <EnergyIceLossSwitchButton onSwitchChange={handleSwitchChange} />
        </div>
      </MapGL>
    </div>
  );
}

export default MapComponent;
