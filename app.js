const nflDivisions = {
    "AFC East": ["Bills", "Dolphins", "Patriots", "Jets"],
    "AFC North": ["Ravens", "Bengals", "Browns", "Steelers"],
    "AFC South": ["Texans", "Colts", "Jaguars", "Titans"],
    "AFC West": ["Broncos", "Chiefs", "Raiders", "Chargers"],
    "NFC East": ["Cowboys", "Giants", "Eagles", "Commanders"],
    "NFC North": ["Bears", "Lions", "Packers", "Vikings"],
    "NFC South": ["Falcons", "Panthers", "Saints", "Buccaneers"],
    "NFC West": ["Cardinals", "Rams", "49ers", "Seahawks"]
};

const divisionsContainer = document.getElementById('divisions');
const picksContainer = document.getElementById('picks');
const scheduleContainer = document.getElementById('schedule');

function createSelect(division, teams) {
    const div = document.createElement('div');
    div.className = 'division';
    div.innerHTML = `
        <label for="${division}">${division}:</label>
        <select id="${division}" onchange="updatePicks()">
            <option value="">Select a team</option>
            ${teams.map(team => `<option value="${team}">${team}</option>`).join('')}
        </select>
    `;
    return div;
}

function initApp() {
    for (const [division, teams] of Object.entries(nflDivisions)) {
        divisionsContainer.appendChild(createSelect(division, teams));
    }

    // Add Sunday Night Game
    const allTeams = Object.values(nflDivisions).flat();
    divisionsContainer.appendChild(createSelect("Sunday Night Game", allTeams));

    // Fetch and display the schedule
    fetchSchedule();
}

async function fetchSchedule() {
const url = 'https://us-central1-footballdata-2024.cloudfunctions.net/getNflSchedule'; // Replace with your actual Firebase Function URL

try {
const response = await fetch(url);
const data = await response.json();
displaySchedule(data);
} catch (error) {
console.error('Error fetching the schedule:', error);
scheduleContainer.innerHTML = '<p>Error loading schedule.</p>';
}
}


function displaySchedule(data) {
// Ensure data has an 'events' array
if (data.events && Array.isArray(data.events)) {
scheduleContainer.innerHTML = data.events.map(event => `
    <div>
        <h2>${event.name}</h2>
        <p>Date: ${new Date(event.date).toLocaleString()}</p>
        <p>Venue: ${event.competitions[0].venue.fullName}, ${event.competitions[0].venue.address.city}, ${event.competitions[0].venue.address.state}</p>
        <p>Teams: ${event.competitions[0].competitors.map(team => team.team.displayName).join(' vs ')}</p>
        <p>Score: ${event.competitions[0].competitors.map(team => team.score).join(' - ')}</p>
    </div>
`).join('');
} else {
scheduleContainer.innerHTML = '<p>No events available.</p>';
}
}


function updatePicks() {
    const picks = {};
    document.querySelectorAll('select').forEach(select => {
        if (select.value) {
            picks[select.id] = select.value;
        }
    });

    picksContainer.innerHTML = `
        <h2>Your Picks:</h2>
        ${Object.entries(picks).map(([division, team]) => `
            <p>${division}: ${team}</p>
        `).join('')}
    `;
}

initApp();