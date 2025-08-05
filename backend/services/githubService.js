const axios = require("axios");

const CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;

/**
 * Exchanges OAuth code for GitHub access token
 */
const getAccessToken = async (code) => {
    try {
        const response = await axios.post(
            "https://github.com/login/oauth/access_token",
            {
                client_id: CLIENT_ID,
                client_secret: CLIENT_SECRET,
                code,
            },
            {
                headers: {
                    Accept: "application/json",
                },
            }
        );

        return response.data.access_token;
    } catch (err) {
        console.error("GitHub OAuth token exchange failed:", err.response?.data || err.message);
        throw err;
    }
};

/**
 * Fetches user's GitHub profile using access token
 */
const getGitHubUser = async (accessToken) => {
    try {
        const response = await axios.get("https://api.github.com/user", {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                Accept: "application/vnd.github+json",
            },
        });

        return response.data;
    } catch (err) {
        console.error("Failed to fetch GitHub user:", err.response?.data || err.message);
        throw err;
    }
};

module.exports = { getAccessToken, getGitHubUser };
