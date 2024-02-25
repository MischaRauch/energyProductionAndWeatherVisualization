"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import "mapbox-gl/dist/mapbox-gl.css";
import * as WeatherLayersClient from "weatherlayers-gl/client";
import * as WeatherLayers from "weatherlayers-gl";
import { MapboxOverlay } from "@deck.gl/mapbox";
import { ClipExtension } from "@deck.gl/extensions";
import MapGL, { Popup, Marker } from "react-map-gl";
import MarkerIcon from "./MarkerIcon";
import { getProductionInHour } from "@/utils/getFarmsProduction";


function MapComponent({
  onSelectPlant,
  selectedPlant,
  children,
  plantsArray,
  onHoverPlant,
  hoverInfo,
  selectedDate,
  selectedTime,
}) {
  const [viewState, setViewState] = useState({
    latitude: 60.472,
    longitude: 8.4689,
    zoom: 3,
  });
  const popupRef = useRef(null);
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
  const [energyData, setEnergyData] = useState(null); // Initialize state to hold your data


  const windSpeedPalette = [
    [0, "#ffffff"], // white
    // [10, '#85ff73'], // green
    // [12, '#f6ff73'], // yellow
    // [17, '#ffde73'], // orange
    [30, "#f76060"], // red
  ];

  const WLConfig = {
    // particle layer
    particleWidth: 2,
    particleMaxAge: 25,
    particlePalette: windSpeedPalette,
    particleOpacity: 0.8,
    patricleSpeedFactor: 5,
    imageSmoothing: 5,
    imageUnscale: [-127, 128],
    // raster layer
    rasterOpacity: 0.1,
    // common properties for all layers
    extensions: [new ClipExtension()],
    clipBounds: [-181, -85.051129, 181, 85.051129],
    // // markers
    // markerClassName: 'custom-marker',
    // markerBgImgUrl: 'url(/assets/pin.svg)',
    // markerWidth: '30px',
    // markerHeight: '30px',
    // markerBgSize: '100%',
  };

  const handleMarkerClick = (plant) => {
    if (selectedPlant && plant.id === selectedPlant.id) {
      // Deselect the currently selected plant
      onSelectPlant(undefined);
    } else {
      // Select the clicked plant
      onSelectPlant(plant);
    }
  };

  const handleMoveStart = () => {
    onSelectPlant(undefined);
  };

  const handlePlantHover = (plant) => {
    onHoverPlant(plant);
  };

  const onMapLoad = useCallback(async (event) => {
    const map = event.target;

    const weatherLayersToken =
      process.env.NEXT_PUBLIC_WEATHERLAYERS_ACCESS_TOKEN;

    const client = new WeatherLayersClient.Client({
      accessToken: weatherLayersToken,
    });

    try {
      const rebaseWindImage = await WeatherLayers.loadTextureData(
        "./assets/weather-images/20211125_wind.png"
      );

      const deckOverlay = new MapboxOverlay({
        interleaved: true,
        layers: [
          new WeatherLayers.ParticleLayer({
            id: "particle",
            // data properties
            image: rebaseWindImage,
            // image2,
            //imageWeight,
            // imageType: "VECTOR",
            imageUnscale: WLConfig.imageUnscale,
            bounds: [-180, -90, 180, 90],
            width: WLConfig.particleWidth,
            maxAge: WLConfig.particleMaxAge,
            palette: WLConfig.particlePalette,
            opacity: WLConfig.particleOpacity,
            speedFactor: WLConfig.patricleSpeedFactor,
            extensions: WLConfig.extensions,
            clipBounds: WLConfig.clipBounds,
            imageSmoothing: WLConfig.imageSmoothing,
          }),
          // new WeatherLayers.RasterLayer({
          //   id: 'raster',
          //   // data properties
          //   image,
          //   image2,
          //   imageWeight,
          //   imageType,
          //   imageUnscale,
          //   bounds,
          //   // style properties
          //   palette,
          //   opacity: WLConfig.rasterOpacity,
          //   extensions: WLConfig.extensions,
          //   clipBounds: WLConfig.clipBounds,
          // }),
        ],
      });

      map.addControl(deckOverlay);
    } catch (error) {
      console.error("Failed to load weather data:", error);
    }
  }, []);

  const getMarkerColorFilter = (plant) => {
    const key=plant.id; 
    const current_energy = energyData[key];
    const casted_energy = Number(current_energy); 
    const capacity = plant.capacity_kw/1000; 
    const ratio = current_energy / capacity; 
    //const ratio = 9.57;
    //return '#ff0000'; 
   // Linearly interpolate the color components
   console.log('plant id: ',plant.id,  '  energy: ', casted_energy, '  capacity: ', capacity, ' ratio: ', ratio)

   
   if (ratio > 1){
    return '#44ce1b';
   } else if ( ratio > 0.8){
    return '#3BCA6D'; 
   }else if (ratio > 0.6){
    return '#bbdb44'; 
   } else if (ratio > 0.4){
    return '#7e379'; 
   }else if (ratio > 0.2){
    return '#f2a134'; 
   } else{
    return '#e51f1f';
   }
  } 

    

  useEffect(() => {
    popupRef.current?.trackPointer();
    
    async function fetchData() {
        const year = selectedDate.getFullYear();
        const month = selectedDate.getMonth() + 1;
        const day = selectedDate.getDate();
       

        const energyPromises = plantsArray.map(async (item) => {  
            try {
                const energy = await getProductionInHour(item.id, year, month, day, selectedTime);
                return energy;
            } catch (error) {
                console.error(`Failed to fetch energy data for plant ${item.id}`, error);
                return [0]; // Return 0 for this plant if there's an error
            }
        });

        // Resolve all promises and set the state
        Promise.all(energyPromises).then(energyResults => {
            setEnergyData(energyResults);
        });

    }

    if (selectedDate) {
        fetchData();
    }
}, [selectedDate, selectedTime]);

  return (
    <div className="relative w-full h-full">
      <MapGL
        {...viewState}
        onMove={(evt) => setViewState(evt.viewState)}
        onMoveStart={handleMoveStart}
        style={{ width: "100%", height: "100%" }}
        mapStyle="mapbox://styles/iv24/clsq58r47006b01pk05dpavbj"
        projection={"mercator"}
        mapboxAccessToken={mapboxToken}
        onViewportChange={(nextViewport) => setViewport(nextViewport)}
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
              onMouseEnter={() => {
                handlePlantHover(plant);
              }}
              onMouseLeave={() => handlePlantHover(undefined)}
              onClick={() => handleMarkerClick(plant)}
              style={{ cursor: "pointer" }}
            >
              {
              (selectedPlant && selectedPlant.id === plant.id) ||
              (hoverInfo && hoverInfo.id === plant.id) ? (
                <img
                  src="/assets/pin_selected.svg"
                  alt="Selected Marker"
                  style={{ width: "30px", height: "30px" }}
                />
              ) : (
                <MarkerIcon getMarkerColorFilter={() => getMarkerColorFilter(plant)} />
              )
            }

              
            </div>
          </Marker>
        ))}

        {hoverInfo && (
          <Popup
            latitude={hoverInfo.latitude}
            longitude={hoverInfo.longitude}
            closeButton={false}
            closeOnClick={false}
            ref={popupRef}
            anchor="bottom"
            className="z-50"
            offset={30}
            maxWidth="500px"
          >
              <h1 className="text-lg font-bold mb-2">{hoverInfo.name}</h1>
              <p className="mb-1">
                Capacity:{" "}
                <span className="font-semibold">
                  {hoverInfo.capacity_kw / 1000} MW
                </span>
              </p>
              <p className="mb-1">
                Latitude:{" "}
                <span className="font-semibold">{Number(hoverInfo.latitude).toFixed(2)}</span>
              </p>
              <p className="mb-1">
                Longitude:{" "}
                <span className="font-semibold">{Number(hoverInfo.longitude).toFixed(2)}</span>
              </p>
              <p>
                ID: <span className="font-semibold">{hoverInfo.id}</span>
              </p>
          </Popup>
        )}

        <div className="absolute inset-x-0 bottom-0 p-4 flex justify-center">
          {children}
        </div>
      </MapGL>
    </div>
  );
}

export default MapComponent;
