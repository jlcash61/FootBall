const nflDivisions = {
    "AFC East": ["Buffalo Bills", "Miami Dolphins", "New England Patriots", "New York Jets"],
    "AFC North": ["Baltimore Ravens", "Cincinnati Bengals", "Cleveland Browns", "Pittsburgh Steelers"],
    "AFC South": ["Houston Texans", "Indianapolis Colts", "Jacksonville Jaguars", "Tennessee Titans"],
    "AFC West": ["Denver Broncos", "Kansas City Chiefs", "Las Vegas Raiders", "Los Angeles Chargers"],
    "NFC East": ["Dallas Cowboys", "New York Giants", "Philadelphia Eagles", "Washington Commanders"],
    "NFC North": ["Chicago Bears", "Detroit Lions", "Green Bay Packers", "Minnesota Vikings"],
    "NFC South": ["Atlanta Falcons", "Carolina Panthers", "New Orleans Saints", "Tampa Bay Buccaneers"],
    "NFC West": ["Arizona Cardinals", "Los Angeles Rams", "San Francisco 49ers", "Seattle Seahawks"]
};

const divisionsContainer = document.getElementById('divisions');
const picksContainer = document.getElementById('picks');
const scheduleContainer = document.getElementById('schedule');

// Define the start date of the NFL season on a Thursday
const seasonStartDate = new Date(Date.UTC(2024, 8, 5)); // September 5, 2024, which is a Thursday

// Calculate the start date of each week in the NFL season
function getWeekStartDates(startDate) {
    const weeks = [];
    for (let i = 0; i < 18; i++) { // Assuming 18 weeks in the season
        const weekStart = new Date(startDate.getTime() + i * 7 * 24 * 60 * 60 * 1000); // Add 7 days for each week
        weeks.push(weekStart);
    }
    return weeks;
}

// Group events by their corresponding week
function groupEventsByWeek(events, weekStartDates) {
    const groupedEvents = {};

    events.forEach(event => {
        const eventDate = new Date(event.date);
        for (let i = 0; i < weekStartDates.length; i++) {
            if (eventDate >= weekStartDates[i] && (i === weekStartDates.length - 1 || eventDate < weekStartDates[i + 1])) {
                const weekNumber = i + 1;
                if (!groupedEvents[weekNumber]) {
                    groupedEvents[weekNumber] = [];
                }
                groupedEvents[weekNumber].push(event);
                break;
            }
        }
    });

    return groupedEvents;
}

// Display the schedule grouped by week
function displaySchedule(data) {
    const weekStartDates = getWeekStartDates(seasonStartDate);
    const groupedEvents = groupEventsByWeek(data.events, weekStartDates);

    scheduleContainer.innerHTML = '';

    Object.keys(groupedEvents).forEach(weekNumber => {
        scheduleContainer.innerHTML += `<h2>Week ${weekNumber}</h2>`;
        groupedEvents[weekNumber].forEach(event => {
            const eventDate = new Date(event.date);
            scheduleContainer.innerHTML += `
                <div>
                    <h2>${event.name}</h2>
                    <p>Date: ${eventDate.toLocaleString()}</p>
                    <p>Venue: ${event.competitions[0].venue.fullName}, ${event.competitions[0].venue.address.city}, ${event.competitions[0].venue.address.state}</p>
                    <p>Teams: ${event.competitions[0].competitors.map(team => team.team.displayName).join(' vs ')}</p>
                    <p>Score: ${event.competitions[0].competitors.map(team => team.score).join(' - ')}</p>
                </div>
            `;
        });
    });
}

// Fetch and display the schedule
let globalData = null; // Store the fetched data globally

async function fetchSchedule() {
    const url = 'https://us-central1-footballdata-2024.cloudfunctions.net/getNflSchedule'; // Replace with your actual Firebase Function URL

    try {
        const response = await fetch(url);
        globalData = await response.json();
        displaySchedule(globalData); // Display all weeks initially
        rebuildDivisionSelectors(globalData.events); // Rebuild selectors with all weeks
    } catch (error) {
        console.error('Error fetching the schedule:', error);
        scheduleContainer.innerHTML = '<p>Error loading schedule.</p>';
    }
}

function filterByWeek() {
    const selectedWeek = parseInt(document.getElementById('week').value, 10);
    if (!selectedWeek) {
        displaySchedule(globalData); // Display all weeks if none is selected
        rebuildDivisionSelectors(globalData.events); // Rebuild selectors with all weeks
        return;
    }

    const weekStartDates = getWeekStartDates(seasonStartDate);
    const groupedEvents = groupEventsByWeek(globalData.events, weekStartDates);

    // Display only the selected week
    scheduleContainer.innerHTML = `<h2>Week ${selectedWeek}</h2>`;
    if (groupedEvents[selectedWeek]) {
        groupedEvents[selectedWeek].forEach(event => {
            const eventDate = new Date(event.date);
            scheduleContainer.innerHTML += `
                <div>
                    <h2>${event.name}</h2>
                    <p>Date: ${eventDate.toLocaleString()}</p>
                    <p>Venue: ${event.competitions[0].venue.fullName}, ${event.competitions[0].venue.address.city}, ${event.competitions[0].venue.address.state}</p>
                    <p>Teams: ${event.competitions[0].competitors.map(team => team.team.displayName).join(' vs ')}</p>
                    <p>Score: ${event.competitions[0].competitors.map(team => team.score).join(' - ')}</p>
                </div>
            `;
        });
        rebuildDivisionSelectors(groupedEvents[selectedWeek]); // Rebuild selectors with only selected week
    } else {
        scheduleContainer.innerHTML += '<p>No games scheduled for this week.</p>';
        rebuildDivisionSelectors([]); // Clear selectors if no games
    }
}

function updatePicks() {
    const selectedTeams = {};
    document.querySelectorAll('select').forEach(select => {
        if (select.value) {
            selectedTeams[select.id] = select.value;
        }
    });

    let displayPicks = `<h2>Your Picks:</h2>`;
    Object.entries(selectedTeams).forEach(([division, teamAndOpponent]) => {
        const [teamName, opponent] = teamAndOpponent.includes(' vs ') ? teamAndOpponent.split(' vs ') : [teamAndOpponent, 'No opponent'];
        displayPicks += `<p>${division}: ${teamName} vs ${opponent}</p>`;
    });

    picksContainer.innerHTML = displayPicks;
}

function rebuildDivisionSelectors(games) {
    divisionsContainer.innerHTML = ''; // Clear existing selectors

    for (const [division, teams] of Object.entries(nflDivisions)) {
        const divisionTeams = teams.map(team => {
            let opponent = 'No opponent';
            games.forEach(event => {
                const competitors = event.competitions[0].competitors.map(c => c.team.displayName);
                if (competitors.includes(team)) {
                    opponent = competitors.find(c => c !== team);
                }
            });
            return opponent !== 'No opponent' ? `${team} vs ${opponent}` : team;
        });

        divisionsContainer.appendChild(createSelect(division, divisionTeams));
    }
}

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
}

fetchSchedule();
