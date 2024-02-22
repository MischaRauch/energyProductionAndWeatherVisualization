"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import "mapbox-gl/dist/mapbox-gl.css";
import * as WeatherLayersClient from 'weatherlayers-gl/client';
import * as WeatherLayers from 'weatherlayers-gl';
import { MapboxOverlay } from '@deck.gl/mapbox';
import { ClipExtension } from '@deck.gl/extensions';
import MapGL, { Popup, Marker } from 'react-map-gl';


function MapComponent({onSelectPlant, selectedPlant, children, plantsArray, onHoverPlant, hoverInfo}) {
  const [viewState, setViewState] = useState({
    latitude: 60.4720,
    longitude: 8.4689,
    zoom: 3,
  });
  const popupRef = useRef(null);
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
  
  const windSpeedPalette = [
    [0, '#ffffff'], // white
    // [10, '#85ff73'], // green
    // [12, '#f6ff73'], // yellow
    // [17, '#ffde73'], // orange
    [30, '#f76060'] // red
  ];
  const WLConfig = {
    // particle layer
    particleWidth: 2,
    particleMaxAge: 25,
    particlePalette: windSpeedPalette,
    particleOpacity: 0.8,
    patricleSpeedFactor: 5,
    imageSmoothing: 5,
    // raster layer
    rasterOpacity: 0.5,
    // common properties for all layers
    extensions: [new ClipExtension()],
    clipBounds: [-181, -85.051129, 181, 85.051129],
    // // markers
    // markerClassName: 'custom-marker',
    // markerBgImgUrl: 'url(/assets/pin.svg)',
    // markerWidth: '30px',
    // markerHeight: '30px',
    // markerBgSize: '100%',
  }

  const handleMarkerClick = (plant) => {
    if (selectedPlant && plant.id === selectedPlant.id) {
      // Deselect the currently selected plant
      onSelectPlant(undefined);
    } else {
      // Select the clicked plant
      onSelectPlant(plant);
    }
  };

  const handlePlantHover = (plant) => {
    onHoverPlant(plant);
  }
  

  const onMapLoad = useCallback(async (event) => {
    const map = event.target;

    const weatherLayersToken = process.env.NEXT_PUBLIC_WEATHERLAYERS_ACCESS_TOKEN;

    const client = new WeatherLayersClient.Client({
      accessToken: weatherLayersToken,
    });

    const dataset = 'gfs/wind_100m_above_ground';
    const datetimeRange = WeatherLayers.offsetDatetimeRange(new Date().toISOString(), 0, 24);

    try {
      // const { title, unitFormat, attribution, referenceDatetimeRange, palette } = await client.loadDataset(dataset);
      const datetimes = await client.loadDatasetSlice(dataset, datetimeRange);
      const datetime = datetimes[0];
      const { image, image2, imageWeight, imageType, imageUnscale, bounds } = await client.loadDatasetData(dataset, datetime);

      const rebaseWindImage = await WeatherLayers.loadTextureData('./assets/weather-images/20211125_wind.png');

      const rebaseTempImage = await WeatherLayers.loadTextureData(
        "./assets/weather-images/20211125_temp.png"
      );

      const deckOverlay = new MapboxOverlay({
        interleaved: true,
        layers: [
<<<<<<< Updated upstream
          new WeatherLayers.ParticleLayer({
            id: 'particle',
            // data properties
            image: rebaseWindImage,
            // image2,
            imageWeight,
            imageType,
            imageUnscale,
            bounds,
            width: WLConfig.particleWidth,
            maxAge: WLConfig.particleMaxAge,
            palette: WLConfig.particlePalette,
            opacity: WLConfig.particleOpacity,
            speedFactor: WLConfig.patricleSpeedFactor,
            extensions: WLConfig.extensions,
            clipBounds: WLConfig.clipBounds,
            imageSmoothing: WLConfig.imageSmoothing
          }),
          // new WeatherLayers.RasterLayer({
          //   id: 'raster',
=======
          // new WeatherLayers.ParticleLayer({
          //   id: "particle",
>>>>>>> Stashed changes
          //   // data properties
          //   image: rebaseWindImage,
          //   // image2,
          //   //imageWeight,
          //   // imageType: "VECTOR",
          //   imageUnscale: WLConfig.imageUnscale,
          //   bounds: [-180, -90, 180, 90],
          //   width: WLConfig.particleWidth,
          //   maxAge: WLConfig.particleMaxAge,
          //   palette: WLConfig.particlePalette,
          //   opacity: WLConfig.particleOpacity,
          //   speedFactor: WLConfig.patricleSpeedFactor,
          //   extensions: WLConfig.extensions,
          //   clipBounds: WLConfig.clipBounds,
          //   imageSmoothing: WLConfig.imageSmoothing,
          // }),
          new WeatherLayers.RasterLayer({
            id: "raster",
            // data properties
            image: rebaseTempImage,
            // imageUnscale: WLConfig.imageUnscale,
            palette: WLConfig.particlePalette,
            opacity: WLConfig.rasterOpacity,
            extensions: WLConfig.extensions,
            clipBounds: WLConfig.clipBounds,
          }),

          // new WeatherLayers.HighLowLayer({
          //   id: "highLow",
          //   // data properties
          //   image: rebaseTempImage,
          //   imageUnscale: WLConfig.imageUnscale,
          //   bounds: [-180, -90, 180, 90],
          //   // style properties
          //   radius: 1000, // km
          // }),
        ],
      });

      map.addControl(deckOverlay);
    } catch (error) {
      console.error("Failed to load weather data:", error);
    }
  }, []);

  useEffect(() => {
    popupRef.current?.trackPointer();
  }, []);
    

  return (
    <div className="relative w-full h-full">
      <MapGL
      {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        style={{width: '100%', height: '100%'}}
        mapStyle="mapbox://styles/iv24/clsq58r47006b01pk05dpavbj"
        projection={"mercator"}
        mapboxAccessToken={mapboxToken}
        onViewportChange={nextViewport => setViewport(nextViewport)}
        onLoad={onMapLoad}
      >
        {plantsArray.map(plant => (
          <Marker
            key={plant.id}
            latitude={plant.latitude}
            longitude={plant.longitude}
            anchor="bottom"
          >
            <div
              onMouseEnter={() =>{
                handlePlantHover(plant)
              }}
              onMouseLeave={() => handlePlantHover(undefined)}
              onClick={() => handleMarkerClick(plant)}
              style={{ cursor: 'pointer' }}
            >
              <img src ={(selectedPlant && selectedPlant.id == plant.id) || (hoverInfo && hoverInfo.id == plant.id) ? "/assets/pin_selected.svg" : "/assets/pin.svg"} alt="Marker" style={{ width: '30px', height: '30px'}}/>
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
            <div className="p-4 rounded-lg max-w-xs text-sm" style={{ backgroundColor: '#272727' }}>
              <h1 className="text-lg font-bold mb-2">{hoverInfo.name}</h1>
              <p className="mb-1">Capacity: <span className="font-semibold">{hoverInfo.capacity_kw} kw</span></p>
              <p className="mb-1">Latitude: <span className="font-semibold">{hoverInfo.latitude}</span></p>
              <p className="mb-1">Longitude: <span className="font-semibold">{hoverInfo.longitude}</span></p>
              <p>ID: <span className="font-semibold">{hoverInfo.id}</span></p>
            </div>
          </Popup>
        )}

        <div className="absolute inset-x-0 bottom-0 p-4 flex justify-center">
          {children}
        </div>
      </MapGL>
    </div>
  );
};

export default MapComponent;