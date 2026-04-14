import { NearestNeighbourStrategy } from '../src/strategies/NearestNeighbourStrategy';
import { MatchWithCity, City } from '../src/strategies/RouteStrategy';

/**
 * NearestNeighbourStrategyTest — YOUR TASK #4
 *
 * ============================================================
 * WHAT YOU NEED TO IMPLEMENT:
 * ============================================================
 *
 * Write unit tests for the NearestNeighbourStrategy.
 * Each test has a TODO comment explaining what to test.
 *
 */

describe('NearestNeighbourStrategy', () => {
  let strategy: NearestNeighbourStrategy;

  // It's good practice to setup mock data to ensure that our unit tests are predictable and entirely seperate from the actual database and external API states.
  const mockCityUSA: City = { id: 'c1', name: 'New York', country: 'USA', latitude: 40.7128, longitude: -74.0060, stadium: 'MetLife Stadium', accommodation_per_night: 200 };
  const mockCityCanada: City = { id: 'c2', name: 'Toronto', country: 'Canada', latitude: 43.6510, longitude: -79.3470, stadium: 'BMO Field', accommodation_per_night: 150 };
  const mockCityMexico: City = { id: 'c3', name: 'Mexico City', country: 'Mexico', latitude: 19.4326, longitude: -99.1332, stadium: 'Estadio Azteca', accommodation_per_night: 100 };

  // Helper function to keep our tests DRY, i.e. Don't Repeat Yourself.
  // Allows matches with different dates and cities to be easily generated for the tests without duplicating the boilerplate team objects in every test.
  const createMockMatch = (id: string, dateStr: string, city: City): MatchWithCity => ({
    id,
    homeTeam: { id: 't1', name: 'Team A', code: 'TMA', group: 'A' },
    awayTeam: { id: 't2', name: 'Team B', code: 'TMB', group: 'A' },
    city: city,
    kickoff: dateStr,
    group: 'A',
    matchDay: 1,
    ticketPrice: 100
  });

  beforeEach(() => {
    // Resets the strategy instance before each new test to ensure there are state leaks between tests.
    strategy = new NearestNeighbourStrategy();
  });


  // Test 1
  it('should return a valid route for multiple matches (happy path)', () => {
    // Arrange: Create an array of 5 matches across all 3 countries
    const matches: MatchWithCity[] =[
      createMockMatch('1', '2026-06-10T12:00:00Z', mockCityUSA),
      createMockMatch('2', '2026-06-12T12:00:00Z', mockCityCanada),
      createMockMatch('3', '2026-06-15T12:00:00Z', mockCityMexico),
      createMockMatch('4', '2026-06-18T12:00:00Z', mockCityUSA),
      createMockMatch('5', '2026-06-20T12:00:00Z', mockCityCanada)
    ];

    // Act
    const result = strategy.optimise(matches);

    // Assert: verify the algorithim correctectly calculated a route that satisfies all constraints.
    expect(result.stops.length).toBe(5);
    expect(result.totalDistance).toBeGreaterThan(0);
    expect(result.strategy).toBe('nearest-neighbour');

    // Feasible must be true as we've satisfied the 5-match and 3-country minimum
    expect(result.feasible).toBe(true);
    expect(result.missingCountries?.length).toBe(0);
  });


  // Test 2
  it('should return an empty route for empty matches', () => {
    // Arrange: An empty array representing an edge case where no matches are provided
    const matches: MatchWithCity[] =[];

    // Act 
    const result = strategy.optimise(matches); 

     // Assert: verify the strategy handles the empty array gracefully without throwing an exception, and correctly flags it as unfeasible.
    expect(result.stops.length).toBe(0);
    expect(result.totalDistance).toBe(0);
    expect(result.feasible).toBe(false);
    expect(result.warnings).toContain('No matches selected');
  });


  // Test 3
   it('should return zero distance for a single match', () => {
    // Arrange
    const matches: MatchWithCity[] =[
      createMockMatch('1', '2026-06-10T12:00:00Z', mockCityUSA)
    ];

    // Act
    const result = strategy.optimise(matches);

    // Assert: With only one match, there is no travel between cities, so the totalDostance must be 0.
    expect(result.stops.length).toBe(1);
    expect(result.totalDistance).toBe(0);

    // It should be marked as unfeasible because it violates both the 5-match and 3-country rules.
    expect(result.feasible).toBe(false);
    expect(result.warnings?.length).toBeGreaterThan(0);
  });
});