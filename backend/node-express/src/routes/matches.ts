import { Router } from 'express';
import * as MatchModel from '../models/Match';

const router = Router();

/**
 * Match Routes — YOUR TASK #2
 *
 * Implement the REST endpoints for matches.
 */

// ============================================================
//  GET /api/matches — Return matches with optional filters
// ============================================================
//
// TODO: Implement this endpoint
//
// Query parameters (both optional):
//   ?city=city-atlanta    → filter by city ID
//   ?date=2026-06-14      → filter by date (YYYY-MM-DD)
//
// Hint: MatchModel.getAll() accepts an optional filters object:
//   MatchModel.getAll({ city: 'city-atlanta', date: '2026-06-14' })
//
// The model already handles the filtering — you just need to
// extract the query params and pass them through.
//
// Expected response: [{ id, homeTeam, awayTeam, city, kickoff, group, matchDay }, ...]
//   where homeTeam, awayTeam, and city are full objects (not just IDs)
//
// ============================================================

/*
 * The optional filters, city and date, will be extracted from the Express req.query object.
 * We can dynamically construct the filters object using only conditions that we define, ensures that only strictly defined values can be filtered and returned.
 * Again async is used within a try/catch block to ensure that simultaneous requests don't block the event loop, and to gracefully handle any errors.

*/

router.get('/', async (_req, res) => {
  
    // We'll use a try catch again to ensure any unsuccessful requests fail gracefully.
    try {
      const filters: { city?: string; date?: string } = {};

      // We'll extract each of the optional parameters if the data type is compatible, i.e. a string.
      if (typeof _req.query.city === 'string') {
        filters.city = _req.query.city;
      }
      if (typeof _req.query.date === 'string') {
        filters.date = _req.query.date;
      }

      // Returns the fetched matches with optional filters applied
      const matches  = await MatchModel.getAll(filters);
      res.status(200).json(matches);
  
      // Gracefully ends with a 500 status code
    } catch (error){
      console.error ('Error fetching matches: ', error);
      res.status(500).json({ error: 'Failed to fetch matches'});
    }
});

// ============================================================
//  GET /api/matches/:id — Return a single match by ID
// ============================================================
//
// TODO: Implement this endpoint
//
// Hint: MatchModel.getById(id) returns a match or undefined.
// Return 404 if the match is not found.
//
// ============================================================

router.get('/:id',async (_req, res) => {
 
  /*
   * The 'id' is extracted from the URL route parameters.
   * The block is surrounded in a try/catch and handles cases with appropriate error codes depending on the case.
   */

  try {
    const matchId = _req.params.id;
    const match = await MatchModel.getById(matchId);

    if (!match){
      // Return a 404 if the match ID can't be found, standard HTTP for a failed resource retrieval
      return res.status(404).json({error: `Match with ID ${matchId} not found`})
    }
    res.status(200).json(match);

  } catch (error) {
    console.error(`Error fetching match ${_req.params.id}:`, error);
    res.status(500).json({error: 'Failed to fetch match details'});
  }
});

export default router;
