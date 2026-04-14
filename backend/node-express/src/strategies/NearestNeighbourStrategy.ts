import { RouteStrategy, MatchWithCity, OptimisedRoute, City } from './RouteStrategy';
import { buildRoute } from '../utils/buildRoute';
import { calculateDistance } from '../utils/haversine';

/**
 * NearestNeighbourStrategy — YOUR TASK #3
 *
 * Route optimisation using nearest-neighbour heuristic.
 *
 * ============================================================
 * WHAT YOU NEED TO IMPLEMENT:
 * ============================================================
 *
 * 1. optimise() method - The nearest-neighbour algorithm:
 *    - Sort matches by kickoff date
 *    - Group matches by date
 *    - For each date, pick the match nearest to your current city
 *    - Track your current city as you process each match
 *
 * 2. validateRoute() method - Validation checks:
 *    - Must have at least 5 matches
 *    - Must visit all 3 countries (USA, Mexico, Canada)
 *    - Set feasibility, warnings, and country coverage on the route
 *
 * ============================================================
 * HELPER METHODS PROVIDED (no changes needed):
 * ============================================================
 *
 * - buildRoute(orderedMatches, strategyName) - Builds the route from ordered matches
 * - calculateDistance(lat1, lon1, lat2, lon2) - Calculates distance between coordinates
 *
 * ============================================================
 */
export class NearestNeighbourStrategy implements RouteStrategy {
  private static readonly STRATEGY_NAME = 'nearest-neighbour';
  private static readonly REQUIRED_COUNTRIES = ['USA', 'Mexico', 'Canada'];
  private static readonly MINIMUM_MATCHES = 5;

  // ============================================================
  //  Nearest Neighbour Algorithm
  // ============================================================
  //
  // TODO: Implement the nearest-neighbour selection
  //
  // Steps:
  //   1. Handle empty/null matches - return createEmptyRoute()
  //   2. Sort matches by kickoff date
  //   3. Group matches by date (use match.kickoff.split('T')[0])
  //   4. For each date (in sorted order):
  //      - If only 1 match that day, add it to orderedMatches
  //      - If multiple matches, pick the nearest to currentCity
  //   5. Track currentCity as you process each match
  //   6. Build and validate route using buildRoute() and validateRoute()
  //
  // Hints:
  //   - Use calculateDistance(lat1, lon1, lat2, lon2) for distance
  //   - Group by date: match.kickoff.split('T')[0]
  //   - The first match in chronological order is your starting point
  //
  // ============================================================

  optimise(matches: MatchWithCity[], originCity?: City): OptimisedRoute {
    // 1. Handle empty/null matches 
     if (!matches || matches.length === 0){
      return this.createEmptyRoute();
     }

     // 2. Sort all matches chronologically by kickoff date
     // I decided to use the spread operator here to create a shallow copy.
     // This allows for the data to be sorted without mutating the original array passed into the method.
     const sortedMatches = [...matches].sort((a,b) => 
      new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime()
    );
    
    // 3. Group matches by date
    const groupedByDate: Record<string, MatchWithCity[]> = {};
     // Keep track of the chronological ordere of dates
    const uniqueDates: string[] = [];

    for (const match of sortedMatches){
      const date = match.kickoff.split ('T')[0];
      if (!groupedByDate[date]){
        groupedByDate[date] = [];
        uniqueDates.push(date);
      }
      groupedByDate[date].push(match);
    } 

    const orderedMatches: MatchWithCity[] =[];
    let currentCity: City | undefined = originCity;

    // 4. & 5. Iterate through each date and apply the nearest neighbour heuristic
    for (const date of uniqueDates){
      const matchesOnDate = groupedByDate[date];

      // If there's only one match on this day then it must be selected
      if (matchesOnDate.length === 1){
          const selectedMatch = matchesOnDate[0];
          orderedMatches.push(selectedMatch);
          currentCity = selectedMatch.city;
      } else {
     
        // If there are multiple matches on the current day, we'll find the nearest one to our current city
        if (!currentCity){

            // A potential edge case: if no origin city has been provided and there are multiple matches on the first day, we'll default to the first match on the list.
            const selectedMatch = matchesOnDate[0];
            orderedMatches.push(selectedMatch);
            currentCity = selectedMatch.city;
        } else {
            let nearestMatch = matchesOnDate[0];
            let minDistance = Number.MAX_VALUE;

            for (const match of matchesOnDate){
              const distance = calculateDistance(
                currentCity.latitude,
                currentCity.longitude,
                match.city.latitude,
                match.city.longitude
              );

              if (distance < minDistance){
                minDistance = distance;
                nearestMatch = match;
              }
            }

            orderedMatches.push(nearestMatch);
            currentCity = nearestMatch.city;
        }
      }
    }

    // 6. Build the final route object and run the validation rules.
    const route = this.buildRoute(orderedMatches, originCity);
    this.validateRoute(route, orderedMatches);

    return route;
  }

  // ============================================================
  //  Validation — YOUR TASK
  // ============================================================
  //
  // TODO: Implement route validation
  //
  // Check the following constraints:
  //   1. Minimum matches - must have at least MINIMUM_MATCHES (5)
  //   2. Country coverage - must visit all REQUIRED_COUNTRIES (USA, Mexico, Canada)
  //
  // Set on the route:
  //   - route.feasible = true/false
  //   - route.warnings = list of warning messages
  //   - route.countriesVisited = list of countries
  //   - route.missingCountries = list of missing countries
  //
  // ============================================================

  private validateRoute(route: OptimisedRoute, matches: MatchWithCity[]): void {
    const warnings: string[] = [];
    let feasible = true;

    // Checks
    // 1. We check the minimum matches, must be at least 5.
    if (matches.length <NearestNeighbourStrategy.MINIMUM_MATCHES){
      feasible = false;
      warnings.push(`Must select at least ${NearestNeighbourStrategy.MINIMUM_MATCHES}`);
    }

    // 2. Country coverage. I decided on a set for tracking unique entries.
    const countriesVisitedSet = new Set<string>();
    for (const match of matches){
      countriesVisitedSet.add(match.city.country);
    } 

    const countriesVisited = Array.from(countriesVisitedSet);

    // Find any countries that are not currently in the visited set
    const missingCountries = NearestNeighbourStrategy.REQUIRED_COUNTRIES.filter(
      (country) => !countriesVisitedSet.has(country)
      );

      if (missingCountries.length > 0){
        feasible = false;
        warnings.push(`Must visit all required countries. Missing ${missingCountries.join(', ')}`)
      }

      // Update the route object 
      route.feasible = feasible;
      route.warnings = warnings;
      route.countriesVisited = countriesVisited;
      route.missingCountries = missingCountries;
    }
      
  // ============================================================
  //  Helper Methods (provided - no changes needed)
  // ============================================================

  /**
   * Creates an empty route with appropriate warnings.
   */
  private createEmptyRoute(): OptimisedRoute {
    return {
      stops: [],
      totalDistance: 0,
      strategy: NearestNeighbourStrategy.STRATEGY_NAME,
      feasible: false,
      warnings: ['No matches selected', `Must select at least ${NearestNeighbourStrategy.MINIMUM_MATCHES} matches`],
      countriesVisited: [],
      missingCountries: [...NearestNeighbourStrategy.REQUIRED_COUNTRIES],
    };
  }

  /**
   * Builds an optimised route from ordered matches, including origin city distance.
   */
  private buildRoute(orderedMatches: MatchWithCity[], originCity?: City): OptimisedRoute {
    const route = buildRoute(orderedMatches, NearestNeighbourStrategy.STRATEGY_NAME);

    // Add distance from origin city to first match
    if (originCity && route.stops.length > 0) {
      const firstStop = route.stops[0];
      const distanceFromOrigin = calculateDistance(
        originCity.latitude,
        originCity.longitude,
        firstStop.city.latitude,
        firstStop.city.longitude
      );
      firstStop.distanceFromPrevious = distanceFromOrigin;
      route.totalDistance += distanceFromOrigin;
    }

    return route;
  }
}
