import { render, screen } from '@testing-library/react';
import RouteMap from '../src/components/RouteMap';
import { OptimisedRoute, City, ItineraryStop } from '../src/types';
import '@testing-library/jest-dom';

// We need to mock the map components since real maps require a physical browser DOM to calculate pixel coordinates,
// which would crash the likes of JSDOM.
 
jest.mock('react-leaflet', () => ({
  MapContainer: ({ children }: any) => <div data-testid="map-container">{children}</div>,
  TileLayer: () => <div data-testid="tile-layer" />,
  Marker: ({ children }: any) => <div data-testid="marker">{children}</div>,
  Popup: ({ children }: any) => <div data-testid="popup">{children}</div>,
  Polyline: () => <div data-testid="polyline" />
}));

describe('RouteMap', () => {

  // Setting up a factory helper, aligning with DRY principles
  const createMockCity = (id: string, name: string): City => ({
    id, name, country: 'USA', latitude: 40, longitude: -70, stadium: 'Stadium', accommodationPerNight: 100
  });

  const createMockStop = (stopNum: number, cityId: string) => ({
    stopNumber: stopNum,
    city: { 
      id: cityId, 
      name: `City ${cityId}`, 
      country: 'USA', 
      latitude: 0, 
      longitude: 0, 
      stadium: 'Stadium', 
      accommodationPerNight: 100 
    },
    match: { 
      homeTeam: { name: 'Team A' }, 
      awayTeam: { name: 'Team B' }, 
      kickoff: '2026-06-10T12:00:00Z' 
    } as any,
    distanceFromPrevious: 0
  });

  // Default empty fields to satisfy the TypeScript interface
  const defaultRouteFields = {
    warnings: [],
    countriesVisited: [],
    missingCountries: []
  };

  it('should render placeholder message when route is null', () => {
    // Arrange: Render RouteMap with route={null}
    render(<RouteMap route={null} originCity={null} />);

    // Assert: Verify placeholder message is displayed gracefully
    expect(screen.getByText(/Validate a route to see it displayed/i)).toBeInTheDocument();
  });

  it('should render a map container when route is provided', () => {
    const mockRoute: OptimisedRoute = { 
      stops: [], 
      totalDistance: 0, 
      strategy: 'test', 
      feasible: true,
      ...defaultRouteFields 
    };

    // Act: Render RouteMap with the route
    render(<RouteMap route={mockRoute} originCity={null} />);

    // Assert: Verify MapContainer is rendered via our mock data-testid
     expect(screen.getByTestId('map-container')).toBeDefined();
  });

   it('should render a marker for each stop in the route', () => {
    const mockRoute: OptimisedRoute = {
      stops: [
        createMockStop(1, 'c1'),
        createMockStop(2, 'c2'),
        createMockStop(3, 'c3'),
      ],
      totalDistance: 1000,
      strategy: 'test',
      feasible: true,
      ...defaultRouteFields
    };

    render(<RouteMap route={mockRoute} originCity={null} />);
    
    // We expect 3 markers because we used 3 unique city IDs
    expect(screen.getAllByTestId('marker')).toHaveLength(3);
  });

   it('should handle route with empty stops array gracefully', () => {
    const mockRoute: OptimisedRoute = { 
      stops: [], 
      totalDistance: 0, 
      strategy: 'test', 
      feasible: false,
      ...defaultRouteFields
    };

    render(<RouteMap route={mockRoute} originCity={null} />);

    expect(screen.getByTestId('map-container')).toBeInTheDocument();
    const markers = screen.queryAllByTestId('marker');
    expect(markers).toHaveLength(0);
  });
});
