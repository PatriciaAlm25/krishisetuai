import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../supabase';
import { getCoordinates } from '../../utils/geocoding';
import './Logistics.css';

// Fix for default Leaflet marker icons not loading in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom farmer icon
const farmerIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Component to recenter map when coordinates change
function RecenterMap({ bounds }) {
  const map = useMap();
  useEffect(() => {
    if (bounds && bounds.length > 0) {
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [bounds, map]);
  return null;
}

export default function Logistics() {
  const { currentUser, userProfile } = useAuth();
  const isFarmer = userProfile?.role === 'farmer';
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  
  // Map Data
  const [farmerCoords, setFarmerCoords] = useState(null);
  const [buyerCoords, setBuyerCoords] = useState(null);
  const [routePath, setRoutePath] = useState([]);
  const [routeStats, setRouteStats] = useState(null);
  const [mapBounds, setMapBounds] = useState([]);

  // Transport Sharing
  const [sharingOpportunities, setSharingOpportunities] = useState([]);

  useEffect(() => {
    fetchActiveOrders();
  }, [currentUser]);

  const fetchActiveOrders = async () => {
    if (!currentUser) return;
    try {
      // Fetch orders based on role
      const filterField = isFarmer ? 'farmer_id' : 'buyer_id';
      
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          products ( location, crop_name, farmer_name )
        `)
        .eq(filterField, currentUser.uid)
        .in('status', ['pending', 'confirmed', 'on_the_way', 'arrived'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
      checkForSharingOpportunities(data || []);
    } catch (err) {
      console.error("Error fetching logistics orders:", err);
    } finally {
      setLoading(false);
    }
  };

  const checkForSharingOpportunities = (allOrders) => {
    // Group by delivery address or region
    const groups = {};
    allOrders.forEach(order => {
      // Very basic grouping: exact match of the first 10 chars, or city name
      const region = order.delivery_address ? order.delivery_address.split(',')[0].trim() : 'Unknown';
      if (!groups[region]) groups[region] = [];
      groups[region].push(order);
    });

    const opportunities = Object.entries(groups)
      .filter(([region, ordersInRegion]) => ordersInRegion.length > 1)
      .map(([region, ordersInRegion]) => ({
        region,
        count: ordersInRegion.length,
        potentialSavings: (ordersInRegion.length - 1) * 150 // Rough estimation
      }));
      
    setSharingOpportunities(opportunities);
  };

  const handleOrderSelect = async (order) => {
    setSelectedOrder(order);
    setRoutePath([]);
    setRouteStats(null);
    setMapBounds([]);

    // 1. Get coordinates for Farmer and Buyer
    const farmerLocationStr = order.products?.location;
    const buyerLocationStr = order.delivery_address;

    if (!farmerLocationStr || !buyerLocationStr) {
      alert("Missing location data for this order.");
      return;
    }

    const fCoords = await getCoordinates(farmerLocationStr);
    const bCoords = await getCoordinates(buyerLocationStr);

    if (fCoords) setFarmerCoords(fCoords);
    if (bCoords) setBuyerCoords(bCoords);

    if (!fCoords || !bCoords) {
      const failed = !fCoords && !bCoords ? "Both farmer and buyer" : (!fCoords ? "Farmer" : "Buyer");
      console.warn(`[Logistics] Geocoding failed for: ${failed} address.`);
      alert(`Note: Could not fully geolocate ${failed} address. Markers may be approximate or missing, and routing is unavailable.`);
      
      if (fCoords || bCoords) {
        const center = fCoords || bCoords;
        setMapBounds([[center.lat, center.lng], [center.lat, center.lng]]);
      }
      return;
    }

    setFarmerCoords(fCoords);
    setBuyerCoords(bCoords);
    setMapBounds([
      [fCoords.lat, fCoords.lng],
      [bCoords.lat, bCoords.lng]
    ]);

    // 2. Fetch Route from OpenRouteService
    const apiKey = import.meta.env.VITE_ORS_API_KEY;
    if (!apiKey || apiKey === 'your_ors_key_here') {
      console.warn("OpenRouteService API key missing. Skipping routing.");
      return;
    }

    try {
      const response = await fetch(
        `https://api.openrouteservice.org/v2/directions/driving-car?api_key=${apiKey}&start=${fCoords.lng},${fCoords.lat}&end=${bCoords.lng},${bCoords.lat}`
      );
      const data = await response.json();

      if (data.features && data.features.length > 0) {
        // ORS returns [lng, lat], Leaflet needs [lat, lng]
        const coords = data.features[0].geometry.coordinates.map(coord => [coord[1], coord[0]]);
        const distanceKm = (data.features[0].properties.segments[0].distance / 1000).toFixed(1);
        const durationMin = (data.features[0].properties.segments[0].duration / 60).toFixed(0);
        
        setRoutePath(coords);
        setRouteStats({
          distance: distanceKm,
          duration: durationMin,
          cost: Math.round(distanceKm * 10) // ₹10 per km
        });
      }
    } catch (err) {
      console.error("Routing error:", err);
    }
  };

  return (
    <div className="logistics-container">
      <h2 className="gradient-text">Smart Logistics Hub</h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: '20px' }}>
        {isFarmer 
          ? "Optimize your delivery routes, track distances, and discover transport sharing opportunities."
          : "Track your incoming deliveries, view farmer locations, and see estimated arrival times."}
      </p>

      {sharingOpportunities.length > 0 && (
        <div className="transport-sharing-alert" style={{ marginBottom: '24px' }}>
          <div className="sharing-icon">🤝</div>
          <div className="sharing-content">
            <h4>Transport Sharing Opportunity!</h4>
            <p>You have {sharingOpportunities[0].count} orders going to the <strong>{sharingOpportunities[0].region}</strong> area.</p>
            <p style={{ fontWeight: 600, marginTop: '4px' }}>Deliver together to save approximately ₹{sharingOpportunities[0].potentialSavings} in transport costs.</p>
          </div>
        </div>
      )}

      <div className="logistics-layout">
        {/* Left Sidebar - Order List */}
        <div className="orders-list-section">
          <h3 style={{ marginBottom: '8px' }}>{isFarmer ? 'Active Deliveries' : 'Incoming Orders'}</h3>
          {loading ? (
            <p>Loading orders...</p>
          ) : orders.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>No active orders need delivery right now.</p>
          ) : (
            orders.map(order => (
              <div 
                key={order.id} 
                className={`order-card ${selectedOrder?.id === order.id ? 'selected' : ''}`}
                onClick={() => handleOrderSelect(order)}
              >
                <div className="order-header">
                  <span className="order-title">{order.products?.crop_name || 'Unknown Crop'}</span>
                  <span className={`order-status ${order.status}`}>{order.status}</span>
                </div>
                <div className="order-details">
                  <span><strong>{isFarmer ? 'Buyer' : 'Farmer'}:</strong> {isFarmer ? order.buyer_name : 'Verified Farmer'}</span>
                  <span><strong>Qty:</strong> {order.quantity_ordered} kg</span>
                  <span><strong>{isFarmer ? 'To' : 'From'}:</strong> {isFarmer ? order.delivery_address?.substring(0, 30) : order.products?.location?.substring(0, 30)}...</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Right Area - Map and Stats */}
        <div className="map-section">
          {routeStats && (
            <div className="route-summary">
              <div className="summary-item">
                <span className="summary-icon">📏</span>
                <span className="summary-value">{routeStats.distance} km</span>
                <span className="summary-label">Total Distance</span>
              </div>
              <div className="summary-item">
                <span className="summary-icon">⏱️</span>
                <span className="summary-value">{routeStats.duration} min</span>
                <span className="summary-label">Estimated Time</span>
              </div>
              <div className="summary-item">
                <span className="summary-icon">💸</span>
                <span className="summary-value">₹{routeStats.cost}</span>
                <span className="summary-label">Est. Fuel/Delivery Cost</span>
              </div>
            </div>
          )}

          <div className="map-container">
            <MapContainer 
              center={[20.5937, 78.9629]} // Default to India center
              zoom={5} 
              style={{ height: '100%', width: '100%', zIndex: 1 }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              
              <RecenterMap bounds={mapBounds} />

              {farmerCoords && (
                <Marker position={[farmerCoords.lat, farmerCoords.lng]} icon={farmerIcon}>
                  <Popup>
                    <strong>{isFarmer ? 'Your Farm' : 'Farmer Location'}</strong><br/>
                    {selectedOrder?.products?.location}
                  </Popup>
                </Marker>
              )}

              {buyerCoords && (
                <Marker position={[buyerCoords.lat, buyerCoords.lng]}>
                  <Popup>
                    <strong>{isFarmer ? 'Delivery Location' : 'Your Address'}</strong><br/>
                    {selectedOrder?.delivery_address}
                  </Popup>
                </Marker>
              )}

              {routePath.length > 0 && (
                <Polyline 
                  positions={routePath} 
                  color="#3b82f6" 
                  weight={5} 
                  opacity={0.8} 
                  dashArray="10, 10" 
                />
              )}
            </MapContainer>
          </div>
          
          {!selectedOrder && (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '-10px' }}>
              Select an order from the list to map the delivery route.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
