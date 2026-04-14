import { Router } from 'express';
import * as MatchModel from '../models/Match';
import * as CityModel from '../models/City';
import { NearestNeighbourStrategy } from '../strategies/NearestNeighbourStrategy';
import { DateOnlyStrategy } from '../strategies/DateOnlyStrategy';
import * as FlightPriceModel from '../models/FlightPrice';
import * as CostCalculator from '../utils/CostCalculator';
import * as BestValueFinder from '../bonus/BestValueFinder';

const router = Router();

/**
 * Route Optimisation Routes — YOUR TASKS #3 and #5
 */

// ============================================================
//  POST /api/route/optimise — YOUR TASK #3
// ============================================================
//
// TODO: Implement this endpoint
//
// Request body: { matchIds: ["match-1", "match-5", "match-12", ...], originCityId: "city-atlanta" }
//
// Steps:
//   1. Extract matchIds and originCityId from req.body
//   2. Fetch the full match data: MatchModel.getByIds(matchIds)
//   3. Fetch origin city: CityModel.getById(originCityId)
//   4. Create a strategy instance: new NearestNeighbourStrategy()
//      (or new DateOnlyStrategy() to test with the working example first)
//   5. Call strategy.optimise(matches, originCity)
//   6. Return the optimised route as JSON
//
// TIP: Start by using DateOnlyStrategy to verify your endpoint works,
// then switch to NearestNeighbourStrategy once you've implemented it.
//
// ============================================================

/*
 * Extract the matchIds and originCityId from the request body.
 * We use simple input validation to ensure that the server doesn't crash from incorrectly formed requests.
 * Fetches the releveant match and cities using the respective models.
 * The NearestNeighbourStrategy is applied to determine the optimal travel routes.
 * 
*/

router.post('/optimise', async (req, res) => {
  
  try{
    const {matchIds, originCityId} = req.body;

    // Verify that the incoming data (payload) contains an array of match IDs and the city they originated in, as a string.
    if (!Array.isArray(matchIds) || typeof originCityId !== 'string'){
      // We return a 400 bad request as a response to a bad request, i.e. an improperly formed request, before the database retrieves any data.
      return res.status(400).json({
        error: 'Invalid payload: expected matchIds (an array of strings) and originCityId (string).'
      });
    }

    // Fetch the necessary data
    const matches = await MatchModel.getByIds(matchIds);
    const originCity = await CityModel.getById(originCityId);

    // Check that the origin city exists, return a 404 error code if not found.
    if (!originCity){
      return res.status(404).json({error: `Origin city with ID ${originCityId} not found.`});
    }

    // Instantiate the strategy and run the optimisation algorithim
    const strategy = new NearestNeighbourStrategy();
    const optimisedRoute = strategy.optimise(matches, originCity);

    // Returns the successfully optimised route.
    res.status(200).json(optimisedRoute);
  

    // Error handling to allow the program to gracefully manage any failures.
  } catch (error){
    console.error('Error optimising route:', error);
    res.status(500).json({ error: 'Failed to optimise route'})
  }
});

// ============================================================
//  POST /api/route/budget — YOUR TASK #5
// ============================================================
//
// TODO: Implement this endpoint
//
// Request body:
// {
//   "budget": 5000.00,
//   "matchIds": ["match-1", "match-5", "match-12", ...],
//   "originCityId": "city-atlanta"
// }
//
// Steps:
//   1. Extract budget, matchIds, and originCityId from req.body
//   2. Fetch matches by IDs: MatchModel.getByIds(matchIds)
//   3. Fetch origin city: CityModel.getById(originCityId)
//   4. Fetch all flight prices from the database
//   5. Use the CostCalculator to calculate the budget result
//   6. Return the BudgetResult as JSON
//
// Hint: Import and use the CostCalculator from '../utils/CostCalculator'
//
// IMPORTANT CONSTRAINTS:
//   - User MUST attend at least 1 match in each country (USA, Mexico, Canada)
//   - If the budget is insufficient, return feasible=false with:
//     - minimumBudgetRequired: the actual cost
//     - suggestions: ways to reduce cost
//   - If countries are missing, return feasible=false with:
//     - missingCountries: list of countries not covered
//
// ============================================================


 /*
   * Extract budget, matchIds, and originCityId from req.body.
   * Basic validation ensures the calculator doesn't crash from bad input types.
   */
router.post('/budget', async (req, res) => {
 
  try {
    const { budget, matchIds, originCityId } = req.body;

    if (typeof budget !== 'number' || !Array.isArray(matchIds) || typeof originCityId !== 'string') {
      return res.status(400).json({ 
        error: 'Invalid payload: expected budget (number), matchIds (array), and originCityId (string).' 
      });
    }

    // Fetch matches, origin city, and flight prices concurrently.
    // Using Promise.all allows for all 3 queries to be run at the same time.
    const [matches, originCity, flightPrices] = await Promise.all([
      MatchModel.getByIds(matchIds),
      CityModel.getById(originCityId),
      FlightPriceModel.getAll()
    ]);

    // Ensure the origin city exists
    if (!originCity) {
      return res.status(404).json({ error: `Origin city with ID ${originCityId} not found.` });
    }

    // Ensure we actually found some matches
    if (!matches || matches.length === 0) {
      return res.status(400).json({ error: 'No valid matches found for the provided matchIds.' });
    }

    // Instantiate the CostCalculator and calculate the budget result.
    // This delegates the complex business constraints to the dedicated utility class.
     const budgetResult = CostCalculator.calculate(
      matches, 
      budget, 
      originCityId, 
      flightPrices, 
      originCity
    );

    // Return the BudgetResult as JSON
    res.status(200).json(budgetResult);

  } catch (error) {
    console.error('Error calculating budget:', error);
    res.status(500).json({ error: 'Failed to calculate budget' });
  }
});

// ============================================================
//  POST /api/route/best-value — BONUS CHALLENGE #1
// ============================================================
//
// TODO: Implement this endpoint (BONUS)
//
// Request body:
// {
//   "budget": 5000.00,
//   "originCityId": "city-atlanta"
// }
//
// Steps:
//   1. Extract budget and originCityId from req.body
//   2. Fetch all matches: MatchModel.getAll()
//   3. Fetch origin city: CityModel.getById(originCityId)
//   4. Fetch all flight prices from the database
//   5. Use the BestValueFinder to find the best combination
//   6. Return the BestValueResult as JSON
//
// Hint: Import and use the BestValueFinder from '../bonus/BestValueFinder'
//
// ============================================================

router.post('/best-value', async (req, res) => {
  try {
    const { budget, originCityId } = req.body;

    if (typeof budget !== 'number' || typeof originCityId !== 'string') {
      return res.status(400).json({ error: 'Invalid payload.' });
    }

    const [allMatches, originCity, flightPrices] = await Promise.all([
      MatchModel.getAll(),
      CityModel.getById(originCityId),
      FlightPriceModel.getAll()
    ]);

    if (!originCity) return res.status(404).json({ error: 'Origin city not found.' });

    const bestValueResult = BestValueFinder.findBestValue(
      allMatches, 
      budget, 
      originCityId, 
      flightPrices, 
      originCity
    );

    res.status(200).json(bestValueResult);
  } catch (error) {
    console.error('Error finding best value:', error);
    res.status(500).json({ error: 'Failed to find best value' });
  }
});

export default router;
