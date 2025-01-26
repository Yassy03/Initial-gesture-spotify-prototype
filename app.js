// Spotify Authorization URL and Client ID
const AUTHORIZE = "https://accounts.spotify.com/authorize";
const client_id = "a42ad546aaf8417aabecb6cffbc9df41"; // Replace with your Client ID
const redirect_uri = "http://localhost:5174/"; // Replace with your redirect URI
let accessToken = null; // Placeholder for the access token
let playbackPosition = 0;
let isPlaying = false;
let currentMood = "neutral";// Add a state variable to track if the playlist is playing


const scopes = [
    "user-read-private",
    "user-read-email",
    "streaming",
    "user-read-playback-state",
    "user-modify-playback-state"
].join(" ");

const playlistsByMood = { // Replace with your actual playlist IDs
    happy: "37i9dQZF1EIgG2NEOhqsD7",
    sad: "37i9dQZF1DWVV27DiNWxkR",
    neutral:"37i9dQZF1EIVSlvdSI76kJ",
    surprised: "37i9dQZF1EIZvbvrhfHXQ5" 
  };
  
 // Default mood
  

function authenticateSpotify() {
    const authUrl = `${AUTHORIZE}?client_id=${encodeURIComponent(client_id)}&response_type=token&redirect_uri=${encodeURIComponent(redirect_uri)}&scope=${encodeURIComponent(scopes)}&show_dialog=true`;
    window.location.href = authUrl; // Redirect to Spotify’s authorization page
}

function handleToken() {
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    accessToken = params.get("access_token");

    if (accessToken) {
        console.log("Access Token:", accessToken);
        alert("Spotify authenticated successfully!");
    } else {
        console.error("Failed to get access token.");
    }
}

async function playPlaylist() {
    if (isPlaying) {
        console.log("Playlist is already playing.");
        return;
    }
    const endpoint = "https://api.spotify.com/v1/me/player/play";
    const deviceId = await getActiveDevices();

    if (!deviceId) {
        console.error("No active device found. Make sure Spotify is open and active on a device.");
        return;
    }

    const selectedPlaylistId = playlistsByMood[currentMood]; // Get playlist based on current mood

    const requestBody = {
        context_uri: `spotify:playlist:${selectedPlaylistId}`,
        position_ms: playbackPosition // Resume from the last paused position
    };

    console.log("Sending play request with body:", requestBody);

    const response = await fetch(`${endpoint}?device_id=${deviceId}`, {
        method: "PUT",
        headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify(requestBody)
    });

    if (response.ok) {
        console.log("Playback started successfully!");
        isPlaying = true;
    } else {
        const errorMessage = await response.text();
        console.error("Error resuming playback:", response.status, errorMessage);

        if (response.status === 403) {
            alert("Playback failed: Ensure you have a Spotify Premium account.");
        } else if (response.status === 404) {
            alert("Playback failed: No active device found. Open Spotify on a device.");
        }
    }
}



// Function to pause the playlist and save the playback position
async function pausePlaylist() {
    if (!isPlaying) {
        console.log("Playlist is not playing.");
        return;
    }
    const endpoint = "https://api.spotify.com/v1/me/player";

    // Get the current playback state to fetch the position
    const response = await fetch(endpoint, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${accessToken}`
        }
    });

    if (response.ok) {
        const data = await response.json();
        playbackPosition = data.progress_ms || 0; // Save the current position
        console.log("Current Playback Position:", playbackPosition);

        // Send pause request
        const pauseEndpoint = `${endpoint}/pause`;
        const pauseResponse = await fetch(pauseEndpoint, {
            method: "PUT",
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        });

        if (pauseResponse.ok) {
            console.log("Playback paused successfully!");
            isPlaying = false;
        } else {
            console.error("Error pausing playback:", pauseResponse.status, await pauseResponse.text());
        }
    } else {
        console.error("Error fetching playback state:", response.status, await response.text());
    }
}

// Function to get active devices
async function getActiveDevices() {
    const endpoint = "https://api.spotify.com/v1/me/player/devices";
    const response = await fetch(endpoint, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${accessToken}`
        }
    });

    if (response.ok) {
        const data = await response.json();
        console.log("Active Devices:", data.devices);

        if (data.devices.length > 0) {
            return data.devices[0].id; // Return the first active device
        } else {
            alert("No active devices found. Open Spotify on a device.");
            return null;
        }
    } else {
        console.error("Error fetching devices:", response.status, await response.text());
        return null;
    }
}

// Run token handler on page load
window.onload = handleToken;

// Add event listener after the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const authButton = document.getElementById('authButton');
    if (authButton) {
        authButton.addEventListener('click', authenticateSpotify);
        console.log("button clicked");
    }
});

