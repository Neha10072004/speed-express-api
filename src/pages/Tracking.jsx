import React, {
  useState
} from "react";

import TrackingComponent
  from "../components/Tracking";


export default function Tracking() {

  const [
    searchNumber,
    setSearchNumber
  ] = useState("");


  const [
    shipment,
    setShipment
  ] = useState(null);


  const [
    loading,
    setLoading
  ] = useState(false);


  const [
    error,
    setError
  ] = useState("");


  return (

    <TrackingComponent

      searchNumber={
        searchNumber
      }

      setSearchNumber={
        setSearchNumber
      }

      shipment={
        shipment
      }

      setShipment={
        setShipment
      }

      loading={
        loading
      }

      setLoading={
        setLoading
      }

      error={
        error
      }

      setError={
        setError
      }

    />

  );
}