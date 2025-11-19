/**
 * MapView component for displaying facilities on Google Maps
 */

import { getBounds } from '../utils/geo.js';

export class MapView {
  constructor(container, apiKey, onMarkerClick) {
    this.container = container;
    this.apiKey = apiKey;
    this.onMarkerClick = onMarkerClick;
    this.map = null;
    this.markers = [];
    this.infoWindow = null;
    this.currentLocationMarker = null;
    this.currentLocationCircle = null;
  }

  async initialize() {
    // Load Google Maps API
    if (!window.google) {
      await this.loadGoogleMapsAPI();
    }

    // Create map
    this.map = new google.maps.Map(this.container, {
      center: { lat: 35.6812, lng: 139.7671 }, // Tokyo default
      zoom: 11,
      mapTypeControl: true,
      streetViewControl: false,
      fullscreenControl: true,
    });

    this.infoWindow = new google.maps.InfoWindow();
  }

  loadGoogleMapsAPI() {
    return new Promise((resolve, reject) => {
      if (window.google && window.google.maps) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${this.apiKey}`;
      script.async = true;
      script.defer = true;

      script.onload = () => {
        resolve();
      };

      script.onerror = () => {
        reject(new Error('Failed to load Google Maps API'));
      };

      document.head.appendChild(script);
    });
  }

  displayFacilities(facilities) {
    // Clear existing markers
    this.clearMarkers();

    if (!facilities || facilities.length === 0) {
      return;
    }

    // Create markers for each facility
    facilities.forEach((facility, index) => {
      const marker = new google.maps.Marker({
        position: { lat: facility.lat, lng: facility.lng },
        map: this.map,
        title: facility.name,
        animation: google.maps.Animation.DROP,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: '#ef4444',
          fillOpacity: 0.9,
          strokeColor: '#dc2626',
          strokeWeight: 2,
        },
      });

      // Add click listener
      marker.addListener('click', () => {
        this.showInfoWindow(marker, facility);
        if (this.onMarkerClick) {
          this.onMarkerClick(facility);
        }
      });

      this.markers.push(marker);
    });

    // Fit bounds to show all markers
    this.fitBounds(facilities);
  }

  showInfoWindow(marker, facility) {
    const content = `
      <div class="map-info-window">
        <h3>${facility.name}</h3>
        <p>${facility.prefecture} ${facility.city}</p>
        <p><strong>${facility.tattooPolicy}</strong></p>
        <p class="tags">${facility.tags.join(', ')}</p>
        <button class="info-details-btn" onclick="window.showFacilityDetail('${facility.id}')">
          詳細を見る
        </button>
      </div>
    `;

    this.infoWindow.setContent(content);
    this.infoWindow.open(this.map, marker);
  }

  clearMarkers() {
    this.markers.forEach(marker => marker.setMap(null));
    this.markers = [];
  }

  fitBounds(facilities) {
    if (!facilities || facilities.length === 0) return;

    const bounds = getBounds(facilities);
    if (bounds) {
      this.map.fitBounds({
        north: bounds.north,
        south: bounds.south,
        east: bounds.east,
        west: bounds.west,
      });

      // Don't zoom in too much for single facility
      if (facilities.length === 1) {
        setTimeout(() => {
          const currentZoom = this.map.getZoom();
          if (currentZoom > 15) {
            this.map.setZoom(15);
          }
        }, 100);
      }
    }
  }

  centerOnLocation(lat, lng, zoom = 12, accuracy = null) {
    if (this.map) {
      this.map.setCenter({ lat, lng });
      this.map.setZoom(zoom);

      // Show current location marker and accuracy circle
      this.showCurrentLocation(lat, lng, accuracy);
    }
  }

  showCurrentLocation(lat, lng, accuracy = null) {
    // Remove old markers if they exist
    if (this.currentLocationMarker) {
      this.currentLocationMarker.setMap(null);
    }
    if (this.currentLocationCircle) {
      this.currentLocationCircle.setMap(null);
    }

    // Create canvas-based target icon for current location
    const canvas = document.createElement('canvas');
    canvas.width = 40;
    canvas.height = 40;
    const ctx = canvas.getContext('2d');

    // Draw target icon
    ctx.fillStyle = '#2563eb';
    ctx.beginPath();
    ctx.arc(20, 20, 12, 0, Math.PI * 2);
    ctx.fill();

    // Draw center dot
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(20, 20, 5, 0, Math.PI * 2);
    ctx.fill();

    // Draw outer ring
    ctx.strokeStyle = '#1e40af';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(20, 20, 12, 0, Math.PI * 2);
    ctx.stroke();

    const targetIcon = {
      url: canvas.toDataURL(),
      scaledSize: new google.maps.Size(40, 40),
      anchor: new google.maps.Point(20, 20),
    };

    // Add target icon for current location
    this.currentLocationMarker = new google.maps.Marker({
      position: { lat, lng },
      map: this.map,
      title: '現在地',
      icon: targetIcon,
      zIndex: 100, // Ensure it's on top
    });

    // Show accuracy circle if accuracy data is available
    if (accuracy && accuracy > 0) {
      this.currentLocationCircle = new google.maps.Circle({
        map: this.map,
        center: { lat, lng },
        radius: accuracy, // Accuracy is in meters
        strokeColor: '#93c5fd',
        strokeOpacity: 0.5,
        strokeWeight: 1,
        fillColor: '#3b82f6',
        fillOpacity: 0.1,
      });
    }
  }

  highlightMarker(facilityId) {
    // Find and highlight the marker for the specified facility
    // This could be enhanced with custom marker icons or animations
  }
}
