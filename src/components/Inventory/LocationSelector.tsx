import { MapPin } from 'lucide-react';
import { Location } from '../../types';

interface LocationSelectorProps {
  locations: Location[];
  selectedLocation: string | null;
  onLocationChange: (locationId: string) => void;
}

export default function LocationSelector({
  locations,
  selectedLocation,
  onLocationChange
}: LocationSelectorProps) {
  return (
    <div>
      <label className="label flex items-center">
        <MapPin className="h-4 w-4 mr-1" />
        Location
      </label>
      <select
        value={selectedLocation || ''}
        onChange={(e) => onLocationChange(e.target.value)}
        className="input"
        required
      >
        <option value="">Select a location</option>
        {locations.map(location => (
          <option key={location.id} value={location.id}>
            {location.name}
          </option>
        ))}
      </select>
    </div>
  );
}
