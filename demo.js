
    import { WEATHER_LAYERS_ACCESS_TOKEN, MAPBOX_ACCESS_TOKEN } from '../auth.js';
    import { NO_DATA, initConfig, initGui, cssToColor, waitForDeck, isMetalWebGl2 } from '../config.js';
    import { BASEMAP_VECTOR_STYLE_URL, updateBasemapVectorStyle } from '../basemap.js';
    import { InfoControl } from '../info-control.js';
    import { FpsControl } from '../fps-control.js';

    const datetimeRange = WeatherLayers.offsetDatetimeRange(new Date().toISOString(), 0, 24);
    const client = window.client = new WeatherLayersClient.Client({
      accessToken: WEATHER_LAYERS_ACCESS_TOKEN,
    });

    window.addEventListener('DOMContentLoaded', async () => {
      const LICENSE = await (await fetch('../license.json')).json();
      WeatherLayers.setLicense(LICENSE);
      
      const datasets = await client.loadCatalog();
      const config = await initConfig({ datasets, deckgl: true, webgl2: true });
      let gui;

      // Mapbox
      const map = new mapboxgl.Map({
        container: 'mapbox',
        accessToken: MAPBOX_ACCESS_TOKEN,
        style: BASEMAP_VECTOR_STYLE_URL,
        center: [30, 10],
        zoom: 1,
      });
      updateBasemapVectorStyle(map);
      await new Promise(resolve => map.on('load', resolve));

      // overlaid deck.gl
      const deckLayer = new deck.MapboxOverlay({
        interleaved: false,
        layers: [],
      });
      map.addControl(deckLayer);
      const deckgl = window.deckgl = await waitForDeck(() => deckLayer._deck);;

      // info panels
      const infoControl = new InfoControl();
      infoControl.prependTo(document.getElementById('top-left'));
      deckgl.setProps({ onViewStateChange: ({ viewState }) => infoControl.update(viewState) });

      // logo
      const logoControl = new WeatherLayers.LogoControl();
      logoControl.prependTo(document.getElementById('bottom-left'));

      // legend
      const legendControl = new WeatherLayers.LegendControl();
      legendControl.prependTo(document.getElementById('bottom-left'));

      // timeline
      const timelineControl = new WeatherLayers.TimelineControl({
        onPreload: datetimes => Promise.all(datetimes.map(datetime => client.loadDatasetData(config.dataset, datetime))),
        onUpdate: datetime => {
          config.datetime = datetime || NO_DATA;
          update();
        },
      });
      timelineControl.prependTo(document.getElementById('bottom-left'));

      // tooltip
      const tooltipControl = new WeatherLayers.TooltipControl({ directionFormat: WeatherLayers.DirectionFormat.CARDINAL3, followCursor: true });
      tooltipControl.addTo(deckgl.getCanvas().parentElement);
      deckgl.setProps({ onHover: event => tooltipControl.updatePickingInfo(event) });

      // attribution
      const attributionControl = new WeatherLayers.AttributionControl();
      attributionControl.prependTo(document.getElementById('bottom-right'));

      // FPS meter
      const fpsControl = new FpsControl();
      fpsControl.prependTo(document.getElementById('bottom-right'));

      // config
      async function update() {
        const dataset = config.dataset !== NO_DATA ? config.dataset : undefined;
        const {title, unitFormat, attribution, palette} = await client.loadDataset(dataset, { unitSystem: config.unitSystem });
        const {datetimes} = await client.loadDatasetSlice(dataset, datetimeRange);
        const datetime = config.datetime !== NO_DATA && datetimes[0] <= config.datetime && config.datetime <= datetimes[datetimes.length - 1] ? config.datetime : datetimes[0];
        const {image, image2, imageWeight, imageType, imageUnscale, bounds} = await client.loadDatasetData(dataset, datetime, { datetimeInterpolate: config.datetimeInterpolate });

        config.datetimes = datetimes;
        config.datetime = datetime;

        deckgl.setProps({
          layers: [
            new WeatherLayers.RasterLayer({
              id: 'raster',
              // data properties
              image,
              image2,
              imageSmoothing: config.imageSmoothing,
              imageInterpolation: config.imageInterpolation,
              imageWeight,
              imageType,
              imageUnscale,
              imageMinValue: config.imageMinValue > 0 ? config.imageMinValue : null,
              imageMaxValue: config.imageMaxValue > 0 ? config.imageMaxValue : null,
              bounds,
              // style properties
              visible: config.raster.enabled,
              palette: config.raster.palette ? palette : null,
              opacity: config.raster.opacity,
              pickable: !isMetalWebGl2(),
              extensions: [new deck.ClipExtension()],
              clipBounds: [-181, -85.051129, 181, 85.051129],
            }),
            new WeatherLayers.ContourLayer({
              id: 'contour',
              // data properties
              image,
              image2,
              imageSmoothing: config.imageSmoothing,
              imageInterpolation: config.imageInterpolation,
              imageWeight,
              imageType,
              imageUnscale,
              imageMinValue: config.imageMinValue > 0 ? config.imageMinValue : null,
              imageMaxValue: config.imageMaxValue > 0 ? config.imageMaxValue : null,
              bounds,
              // style properties
              visible: config.contour.enabled,
              interval: config.contour.interval,
              majorInterval: config.contour.majorInterval,
              width: config.contour.width,
              color: cssToColor(config.contour.color),
              palette: config.contour.palette ? palette : null,
              opacity: config.contour.opacity,
              extensions: [new deck.ClipExtension()],
              clipBounds: [-181, -85.051129, 181, 85.051129],
            }),
            new WeatherLayers.HighLowLayer({
              id: 'highLow',
              // data properties
              image,
              image2,
              imageSmoothing: config.imageSmoothing,
              imageInterpolation: config.imageInterpolation,
              imageWeight,
              imageType,
              imageUnscale,
              imageMinValue: config.imageMinValue > 0 ? config.imageMinValue : null,
              imageMaxValue: config.imageMaxValue > 0 ? config.imageMaxValue : null,
              bounds,
              // style properties
              visible: config.highLow.enabled && !timelineControl.running,
              unitFormat,
              radius: config.highLow.radius,
              textSize: config.highLow.textSize,
              textColor: cssToColor(config.highLow.textColor),
              textOutlineColor: cssToColor(config.highLow.textOutlineColor),
              palette: config.highLow.palette ? palette : null,
              textOutlineWidth: config.highLow.textOutlineWidth,
              opacity: config.highLow.opacity,
            }),
            new WeatherLayers.GridLayer({
              id: 'grid',
              // data properties
              image,
              image2,
              imageSmoothing: config.imageSmoothing,
              imageInterpolation: config.imageInterpolation,
              imageWeight,
              imageType,
              imageUnscale,
              imageMinValue: config.imageMinValue > 0 ? config.imageMinValue : null,
              imageMaxValue: config.imageMaxValue > 0 ? config.imageMaxValue : null,
              bounds,
              // style properties
              visible: config.grid.enabled,
              style: config.grid.style,
              density: config.grid.density,
              unitFormat,
              textSize: config.grid.textSize,
              textColor: cssToColor(config.grid.textColor),
              textOutlineWidth: config.grid.textOutlineWidth,
              textOutlineColor: cssToColor(config.grid.textOutlineColor),
              iconBounds: config.grid.iconBounds,
              iconSize: config.grid.iconSize,
              iconColor: cssToColor(config.grid.iconColor),
              palette: config.grid.palette ? palette : null,
              opacity: config.grid.opacity,
            }),
            new WeatherLayers.ParticleLayer({
              id: 'particle',
              // data properties
              image,
              image2,
              imageSmoothing: config.imageSmoothing,
              imageInterpolation: config.imageInterpolation,
              imageWeight,
              imageType,
              imageUnscale,
              imageMinValue: config.imageMinValue > 0 ? config.imageMinValue : null,
              imageMaxValue: config.imageMaxValue > 0 ? config.imageMaxValue : null,
              bounds,
              // style properties
              visible: config.particle.enabled,
              numParticles: config.particle.numParticles,
              maxAge: config.particle.maxAge,
              speedFactor: config.particle.speedFactor,
              width: config.particle.width,
              color: cssToColor(config.particle.color),
              palette: config.particle.palette ? palette : null,
              opacity: config.particle.opacity,
              animate: config.particle.animate,
              extensions: [new deck.ClipExtension()],
              clipBounds: [-181, -85.051129, 181, 85.051129],
              getPolygonOffset: () => [0, -1000],
            }),
          ],
        });

        legendControl.updateConfig({ title, unitFormat, palette });
        timelineControl.updateConfig({ datetimes, datetime, datetimeInterpolate: config.datetimeInterpolate });
        tooltipControl.updateConfig({ unitFormat });
        attributionControl.updateConfig({ attribution });
      }
      await update();
      gui = initGui(config, update, { deckgl, webgl2: true });
    });
  