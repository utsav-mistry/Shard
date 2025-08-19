/**
 * @fileoverview Google Service
 * @description Handles Google OAuth integration for user authentication
 * @module services/googleService
 * @requires axios
 * @author Utsav Mistry
 * @version 1.0.0
 */

const axios = require("axios");

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI;

/**
 * Exchanges OAuth authorization code for access token
 * @async
 * @function getAccessToken
 * @param {string} code - OAuth authorization code from Google
 * @returns {Promise<string>} Google access token
 * @throws {Error} If token exchange fails
 * @example
 * const token = await getAccessToken('4/0AX4XfWh...');
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
 * Fetches Google user profile information using access token
 * @async
 * @function getGoogleUser
 * @param {string} accessToken - Google OAuth access token
 * @returns {Promise<Object>} User profile data from Google
 * @throws {Error} If user info retrieval fails
 * @example
 * const user = await getGoogleUser('ya29.a0ARrdaM...');
 * console.log(user.email); // user@gmail.com
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

/**
 * @namespace googleService
 * @description Service for Google OAuth authentication and user data retrieval
 */
module.exports = { getAccessToken, getGoogleUser };
