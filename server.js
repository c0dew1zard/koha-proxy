const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

// Koha API Configuration
const KOHA_BASE_URL = process.env.KOHA_BASE_URL;
const TOKEN_URL = `${KOHA_BASE_URL}/api/v1/oauth/token`;
const IMPORT_URL = `${KOHA_BASE_URL}/api/v1/biblios`;
const CLIENT_ID = process.env.KOHA_CLIENT_ID;
const CLIENT_SECRET = process.env.KOHA_CLIENT_SECRET;


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


// Default route to check if the service is running and to get the public IP
app.get("/", async (req, res) => {
    try {
        // Get public IP
        const response = await axios.get("https://api64.ipify.org?format=json");
        const publicIP = response.data.ip;

        console.log("TOKEN_URL:", TOKEN_URL);
        console.log("CLIENT_ID:", CLIENT_ID);
        console.log("CLIENT_SECRET:", CLIENT_SECRET);
        console.log("Public IP Address:", publicIP); // Log IP to the console

        // Respond with the message and the public IP
        res.status(200).send({
            message: "Webservice is running",
            publicIP: publicIP
        });
    } catch (error) {
        console.error("Error getting public IP:", error);
        res.status(500).send({
            message: "Error getting public IP",
            error: error.message
        });
    }
});


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

        console.log("TOKEN_URL:", TOKEN_URL);
        console.log("CLIENT_ID:", CLIENT_ID);
        console.log("CLIENT_SECRET:", CLIENT_SECRET);

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

