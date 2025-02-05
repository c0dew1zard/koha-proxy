const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

// Koha API Configuration
const KOHA_BASE_URL = "https://opac.cm-gaia.pt";
const TOKEN_URL = `${KOHA_BASE_URL}/api/v1/oauth/token`;
const IMPORT_URL = `${KOHA_BASE_URL}/api/v1/biblios`;
const CLIENT_ID = "70c04012-4034-426f-b0af-60a307172f82";
const CLIENT_SECRET = "c3e4910a-09ea-4087-89f9-4456eed69ec0";


// CORS middleware to allow all origins (can be customized later)
//app.use(cors());


app.use(cors({
  origin: "*", // Change "*" to your frontend URL for security
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));


// To parse JSON bodies in POST requests
app.use(express.json());


// Middleware to handle XML body parsing
app.use(express.raw({ type: 'application/marcxml+xml', limit: '10mb' }));


// Define a single route to import unimarc to koha
app.post('/api/v1/import', async (req, res) => {
    try {
        console.log('PASSOU AQUI', req.body.toString());

        let unimarcRecord = req.body.toString();
        //console.log('UNIMARC:', unimarcRecord);
        
        let koharesponse = await importMARCXML(unimarcRecord);

        console.log('importMARCXML', koharesponse);

        res.status(200).json(koharesponse);
    } catch (error) {
        console.log("ERRO AQUI");
        //console.error('Error fetching token:', error);
        res.status(500).json({ error: 'Failed to fetch token from Koha' });
    }
});


// Start the server
app.listen(port, () => {
    console.log(`Proxy server running on http://localhost:${port}`);
});


// Function to get OAuth2 token for Koha
async function getAccessToken() {
    try {
      const response = await axios.post(
        TOKEN_URL,
        new URLSearchParams({
          grant_type: "client_credentials",
          client_id: CLIENT_ID,
          client_secret: CLIENT_SECRET,
        }),
        { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
      );
  
      return response.data.access_token;
    } catch (error) {
      console.error("Error getting access token:", error.response?.data || error);
      return null;
    }
  }

// Function to import MARCXML record into Koha
async function importMARCXML(marcxmlRecord) {
    const token = await getAccessToken();
    if (!token) {
      console.error("Failed to obtain access token.");
      return;
    }
  
    try {
      const response = await axios.post(
        IMPORT_URL,
        marcxmlRecord,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/marcxml+xml",
          },
        }
      );

      //console.log('importMARCXML', response.data);

      return response.data;
  
      //console.log("MARCXML import successful:", response.data);
    } catch (error) {
      return error.response?.data || error;  
      //console.error("Error importing MARCXML:", error.response?.data || error);
    }
  }