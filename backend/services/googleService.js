const axios = require("axios");

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI;

/**
 * Exchange OAuth authorization code for access token
 */
const getAccessToken = async (code) => {
    try {
        const response = await axios.post(
            "https://oauth2.googleapis.com/token",
            {
                client_id: CLIENT_ID,
                client_secret: CLIENT_SECRET,
                code,
                redirect_uri: REDIRECT_URI,
                grant_type: "authorization_code",
            },
            {
                headers: {
                    "Content-Type": "application/json",
                },
            }
        );

        return response.data.access_token;
    } catch (err) {
        console.error("Google OAuth token exchange failed:", err.response?.data || err.message);
        throw err;
    }
};

/**
 * Fetch Google user profile info using access token
 */
const getGoogleUser = async (accessToken) => {
    try {
        const response = await axios.get(
            "https://www.googleapis.com/oauth2/v2/userinfo",
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            }
        );

        return response.data;
    } catch (err) {
        console.error("Failed to fetch Google user info:", err.response?.data || err.message);
        throw err;
    }
};

module.exports = { getAccessToken, getGoogleUser };
