import React, { useEffect, useState } from "react";
import { useLoadScript, GoogleMap } from "@react-google-maps/api";
import { AnimatePresence, motion } from "framer-motion";
import Container from "react-bootstrap/Container";

import { libraries, mapContainerStyle, center, options } from "./mapConfig";
import { getLocations, postLocation } from "../../requests";
import MarkerLogic from "./MarkerLogic";
import Pin from "./Pin";
import HoverEffect from "./HoverEffect";

import styles from "./MapContainer.module.css";

const initialFormState = {
  name: "",
  description: "",
};

function Map({
  filteredMarkers,
  hoveredMarker,
  // panTo,
  setFilteredMarkers,
  setHoveredMarker,
  setMarkers,
  setSelectedMarker,
  selectedMarker,
  markers,
  isSidebarOpen,
}) {
  const [isPinShown, setIsPinShown] = useState(false);
  const [pinPos, setPinPos] = useState({});
  const [pixelPos, setPixelPos] = useState({ x: 0, y: 0 });
  const [mousePos, setMousePos] = useState({});
  const [hoveredQueue, setHoveredQueue] = useState([]);
  const [isPinHoverEffectShown, setIsPinHoverEffectShown] = useState(true);
  const [isPinEditOpen, setIsPinEditOpen] = useState(false);
  const [address, setAddress] = useState("");
  const [markerForm, setMarkerForm] = useState(initialFormState);
  const [isMarkerFormValid, setIsMarkerFormValid] = useState(false);

  const mapRef = React.useRef();
  const panTo = React.useCallback(({ lat, lng }) => {
    mapRef.current.panTo({ lat, lng });
  });

  useEffect(() => {
    if (hoveredMarker) {
      setHoveredQueue((current) => [...current, hoveredMarker]);
    } else {
      setHoveredQueue((current) =>
        current.filter((marker) => current[current.length - 1].id === marker.id)
      );
    }
  }, [hoveredMarker]);

  useEffect(() => {
    const fetchMarkers = async () => {
      const res = await getLocations();
      setMarkers(res.data);
      setFilteredMarkers(res.data);
    };
    fetchMarkers();
  }, []);

  useEffect(() => {
    setFilteredMarkers(markers);
  }, [markers]);

  useEffect(() => {
    console.log("eeeeee");
    setIsPinShown(false);
  }, [isSidebarOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setMarkerForm((current) => {
      const updatedState = { ...current, [name]: value };
      return updatedState;
    });
    if (formValidation() !== isMarkerFormValid && formValidation()) {
      formValidation()
        ? setIsMarkerFormValid(true)
        : setIsMarkerFormValid(false);
    }
  };

  const formValidation = () => {
    return markerForm.name.length > 5 && markerForm.description.length > 10;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const res = await postLocation({
      ...markerForm,
      lat: pinPos.lat,
      lng: pinPos.lng,
    });
    console.log(res);
    if (!res.errors) {
      setMarkers((current) => {
        const updatedState = [...current, res.data.location];
        return updatedState;
      });
      setIsPinShown(false);
      setMarkerForm(initialFormState);
      setSelectedMarker(null);
    }
  };

  const onMapClick = React.useCallback((event) => {
    console.log(mapRef.current.__gm.pixelBounds);
    if (event.pixel) {
      setPixelPos({
        x: -1 * (mapRef.current.__gm.pixelBounds.Pa - event.pixel.x),
        y: -1 * (mapRef.current.__gm.pixelBounds.Oa - event.pixel.y),
      });
    }

    if (selectedMarker) {
      setIsPinShown(false);
    } else {
      setIsPinShown(true);
      setPinPos({ lat: event.latLng.lat(), lng: event.latLng.lng() });
    }

    selectedMarker ? setIsPinShown(false) : setIsPinShown(true);

    setPinPos({ lat: event.latLng.lat(), lng: event.latLng.lng() });
    setSelectedMarker(null);
  }, []);

  const onMapLoad = React.useCallback((map) => (mapRef.current = map), []);

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    libraries,
  });

  const selectModalAnimation = () => {
    if (isSidebarOpen && selectedMarker) {
      return "showPartial";
    } else if (selectedMarker) {
      return "show";
    } else {
      return "hidden";
    }
  };

  if (loadError) return "Error Loading Maps";
  if (!isLoaded) return "Loading Maps";

  return (
    <div>
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        zoom={13}
        center={center}
        options={options}
        onClick={onMapClick}
        onLoad={onMapLoad}
        onMouseMove={(e) => {
          setMousePos(e.pixel);
        }}
        onZoomChanged={(e) => {
          setIsPinHoverEffectShown(false);
        }}
        onDragStart={() => {
          setIsPinHoverEffectShown(false);
          setIsPinEditOpen(false);
        }}
      >
        {hoveredQueue.map(() => (
          <HoverEffect
            mousePos={mousePos}
            marker={hoveredMarker}
            selectedMarker={selectedMarker}
            setSelectedMarker={setSelectedMarker}
            hoveredMarker={hoveredMarker}
          />
        ))}
        {filteredMarkers.map((marker) => (
          <MarkerLogic
            marker={marker}
            hoveredMarker={hoveredMarker}
            // panTo={panTo}
            setHoveredMarker={setHoveredMarker}
            setSelectedMarker={setSelectedMarker}
            selectedMarker={selectedMarker}
            setIsPinShown={setIsPinShown}
            isPinShown={isPinShown}
            setAddress={setAddress}
          />
        ))}

        {isPinShown && (
          <Pin
            pixelPos={pixelPos}
            setPixelPos={setPixelPos}
            mousePos={mousePos}
            pinPos={pinPos}
            setPinPos={setPinPos}
            setIsPinShown={setIsPinShown}
            isPinShown={isPinShown}
            isPinHoverEffectShown={isPinHoverEffectShown}
            setIsPinHoverEffectShown={setIsPinHoverEffectShown}
            isPinEditOpen={isPinEditOpen}
            setIsPinEditOpen={setIsPinEditOpen}
            panTo={panTo}
            mapRef={mapRef}
            isSidebarOpen={isSidebarOpen}
            setSelectedMarker={setSelectedMarker}
            address={address}
            setAddress={setAddress}
          />
        )}
      </GoogleMap>

      <AnimatePresence>
        {selectedMarker && (
          <motion.div
            className={styles.select__div}
            animate={selectModalAnimation()}
            variants={displayAnimation}
            initial={"hidden"}
            transition={{ duration: 0.2 }}
            exit={"exit"}
          >
            <p
              className={styles.x__icon}
              onClick={() => {
                setSelectedMarker(null);
              }}
            >
              ✖️
            </p>

            <Container
              style={{
                marginTop: "18px",
                paddingLeft: "80px",
                paddingRight: "80px",
              }}
            >
              {selectedMarker.id ? (
                <>
                  <h2>{selectedMarker.name}</h2>
                  <h2>{selectedMarker.description}</h2>
                </>
              ) : (
                <>
                  <h1 style={{ width: "400px", background: "red" }}>
                    {address}
                  </h1>
                  <form>
                    <label>Name</label>
                    <br />
                    <input
                      type="text"
                      name="name"
                      value={markerForm.name}
                      onChange={handleChange}
                    />
                    <br />
                    <label>Description</label>
                    <br />
                    <textarea
                      type="text"
                      name="description"
                      value={markerForm.description}
                      onChange={handleChange}
                    />
                    <br />
                    <button
                      disabled={!isMarkerFormValid}
                      type="submit"
                      onClick={onSubmit}
                    >
                      submit
                    </button>
                  </form>
                </>
              )}
            </Container>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const displayAnimation = {
  hidden: {
    width: "0%",
    // scaleX: 0,
    transition: {
      ease: [0.16, 1, 0.3, 1],
      duration: 0.4,
    },
  },
  showPartial: {
    width: "66.66vw",
    // scaleX: 1,
    // zIndex: 200,
    transition: {
      delay: 0.2,
      ease: [0.16, 1, 0.3, 1],
      duration: 0.4,
    },
  },
  show: {
    width: "100%",
    // scaleX: 1,
    transition: {
      delay: 0.2,
      ease: [0.16, 1, 0.3, 1],
      duration: 0.4,
    },
  },
  exit: {
    scaleX: 0,
    transition: {
      delay: 0.2,
      ease: [0.16, 1, 0.3, 1],
    },
  },
};
export default Map;
