import { Router } from 'express';
import * as CityModel from '../models/City';

const router = Router();

/**
 * City Routes — YOUR TASK #1
 *
 * Implement the REST endpoints for cities.
 */

// ============================================================
//  GET /api/cities — Return all host cities
// ============================================================
//
// TODO: Implement this endpoint
//
// This should return all 16 host cities as a JSON array.
//
// Hint: The CityModel is already imported and has a getAll() method.
//
// Expected response: [{ id, name, country, latitude, longitude, stadium }, ...]
//
// ============================================================

router.get('/', async (_req, res) => {
   
  /*
   * We'll fetch all the cities using the model provided. I chose to implement an async pattern to ensure that the fetch requests don't block any other requests being executed simultaneously.
   * Good practice to wrap the block in a try catch; ensures that any failed api requests will gracefully end rather than hanging or crashing the server. 
   * Block will either send a 500 status code or respond with a clean JSON response.
   */
  
  
  try {
    const cities = await CityModel.getAll();

    // Return the cities as a JSON response and a 200 OK response, good practice when fetching via a REST API.
    res.status(200).json(cities);
  } catch (error){
    // Log any errors for later debugging
    console.error('Error fetching cities: ', error);

    // Return a 500 internal server error if cities couldn't be retrieved
    res.status(500).json({ error: 'Failed to fetch cities'})
  }
});

export default router;
