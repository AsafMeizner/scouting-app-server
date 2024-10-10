import type { NextApiRequest, NextApiResponse } from 'next';
import { MongoClient } from 'mongodb';

const url = process.env.DATABASE_URL || 'your-mongodb-url';
const client = new MongoClient(url);
const dbName = 'scouting-test';

const PASSWORD = 'team5951'; // Set your plaintext password here

type ResponseData = {
  message: string;
  entries?: any[];
  entryIds?: string[];
  error?: string;
};

// Define the expected structure for validation
const validateEntryStructure = (entry: any) => {
  // Ensure entry is an object and not null
  if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
    console.error('Invalid entry: not a valid object or is an array', entry);
    return false;
  }

  const requiredFields = [
    'scouter', 'matchNumber', 'teamNumber', 'Prsp', 'noShow', 'Mved', 'ausc', 'auskpm',
    'a_gp_Path', 'auf', 'tsc', 'tsm', 'tamps', 'tampm', 'tfs', 'Fou', 'epo', 'cn', 'dto',
    'yc', 'co', 'submissionTime'
  ];

  const validChoices = {
    Prsp: ['Source', 'Middle', 'Amp'],
    a_gp_Path: ['1', '2', '3', '4', '5', '6', '7', '8'],
    epo: ['No', 'P', 'Os', 'Hm', 'Fh'],
    yc: ['No Card', 'Yellow', 'Red']
  };

  // Ensure all required fields are present in the entry
  for (const field of requiredFields) {
    if (!(field in entry)) {
      console.error(`Missing required field: ${field}`, entry);
      return false;
    }
  }

  // Validate specific field values
  if (!validChoices.Prsp.includes(entry.Prsp)) return false;
  if (!validChoices.a_gp_Path.includes(entry.a_gp_Path)) return false;
  if (!validChoices.epo.includes(entry.epo)) return false;
  if (!validChoices.yc.includes(entry.yc)) return false;

  return true;
};

// example http request
// POST /api/entries

// curl -X POST "http://localhost:3000/api/entries" ^ -H "x-password: team5951" ^ -H "Content-Type: application/json" ^ -d "{\"entries\": [{ \"scouter\": \"אליה\", \"matchNumber\": 1, \"teamNumber\": 5987, \"Prsp\": \"Source\", \"noShow\": false, \"Mved\": true, \"ausc\": 1, \"auskpm\": 4, \"a_gp_Path\": \"8\", \"auf\": 4, \"tamps\": 0, \"tsc\": 3, \"tfs\": 2, \"cn\": 1, \"Fou\": 1, \"epo\": \"Os\", \"dto\": false, \"yc\": \"No Card\", \"co\": \"5 פאולים\", \"tsm\": 0, \"tampm\": 1, \"submissionTime\": 1727789079096 }, { \"scouter\": \"רועי\", \"matchNumber\": 2, \"teamNumber\": 5554, \"Prsp\": \"Middle\", \"noShow\": false, \"Mved\": true, \"ausc\": 1, \"auskpm\": 1, \"a_gp_Path\": \"7\", \"auf\": 1, \"tamps\": 2, \"tsc\": 3, \"tfs\": 2, \"cn\": 0, \"Fou\": 1, \"epo\": \"Os\", \"dto\": false, \"yc\": \"No Card\", \"co\": \"No fouls\", \"tsm\": 1, \"tampm\": 1, \"submissionTime\": 1728472230785 }]}"

// GET /api/entries

// curl -X GET "http://localhost:3000/api/entries" -H "x-password: team5951"

async function handler(req: NextApiRequest, res: NextApiResponse<ResponseData>) {
  // Set CORS headers for all requests
  res.setHeader('Access-Control-Allow-Origin', '*'); // Allow any origin
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS'); // Allow specific HTTP methods
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-password'); // Allow specific headers

  // Handle the preflight (OPTIONS) request
  if (req.method === 'OPTIONS') {
    return res.status(200).end(); // Respond to OPTIONS request with 200
  }

  // Check for password in request headers or body
  const password = req.headers['x-password'] || req.body.password;
  if (password !== PASSWORD) {
    return res.status(403).json({ message: 'Forbidden: Invalid password' });
  }

  if (req.method === 'GET') {
    // Handle GET request: Fetch all entries
    try {
      await client.connect();
      const db = client.db(dbName);
      const entries = await db.collection('entries').find().toArray();
      res.status(200).json({ message: 'Entries fetched successfully', entries });
    } catch (error) {
      console.error('Error fetching entries:', error);
      res.status(500).json({ message: 'Error fetching entries', error: (error as Error).message });
    } finally {
      await client.close();
    }
  } else if (req.method === 'POST') {
    // Handle POST request: Create multiple entries (bulk insert)
    try {
      await client.connect();
      const db = client.db(dbName);
      const { entries } = req.body; // Expecting an array of entries

      if (!Array.isArray(entries)) {
        return res.status(400).json({ message: 'Invalid request: entries should be an array' });
      }

      // Validate each entry
      const invalidEntries = entries.filter(entry => !validateEntryStructure(entry));
      if (invalidEntries.length > 0) {
        return res.status(400).json({ message: 'Some entries have invalid structure' });
      }

      const insertedIds: string[] = [];

      // Iterate over each entry
      for (const entry of entries) {
        const { matchNumber, teamNumber, submissionTime } = entry;

        // Check if an entry with the same matchNumber and teamNumber already exists
        const existingEntry = await db.collection('entries').findOne({
          matchNumber: matchNumber,
          teamNumber: teamNumber
        });

        if (existingEntry) {
          // If the existing entry has an older submissionTime, update it
          if (existingEntry.submissionTime < submissionTime) {
            const result = await db.collection('entries').updateOne(
              { _id: existingEntry._id },
              { $set: { ...entry, timestamp: new Date() } }
            );
            if (result.modifiedCount > 0) {
              insertedIds.push(existingEntry._id.toString());
            } else {
              return res.status(500).json({ message: 'Error updating entry' });
            }
          }
        } else {
          // If no existing entry, insert a new entry
          const result = await db.collection('entries').insertOne({
            ...entry,
            timestamp: new Date()
          });
          insertedIds.push(result.insertedId.toString());
        }
      }

      if (insertedIds.length > 0) {
        res.status(201).json({
          message: 'Entries processed successfully',
          entryIds: insertedIds
        });
      } else {
        res.status(400).json({ message: 'No new entries to process' });
      }
    } catch (error) {
      console.error('Error processing entries:', error);
      res.status(500).json({ message: 'Error processing entries', error: (error as Error).message });
    } finally {
      await client.close();
    }
  } else {
    res.status(405).json({ message: 'Method Not Allowed' });
  }
}

export default handler;
