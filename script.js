const SUPABASE_URL = "https://jojbseebuydixvsrfsnd.supabase.co";
const SUPABASE_KEY = "sb_publishable_OTd0hQkBCX5SYgJkTXAXZQ_FLtTXAER";

const supabaseClient = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

let currentSession = null;

loadSessions();

async function loadSessions() {
  const { data } = await supabaseClient
    .from("sessions")
    .select("*")
    .eq("active", true);

  const sportsDiv = document.getElementById("sports");
  sportsDiv.innerHTML = "";

  data.forEach(session => {
    const image =
      session.sport_type.toLowerCase().includes("women")
        ? "womensfootball.png"
        : "mensfootball.png";

    const ukDate = new Date(session.game_date).toLocaleDateString("en-GB");

    sportsDiv.innerHTML += `
  <div class="card" onclick="openSession(${session.id})">
    <img src="${image}" class="cardImg" alt="${session.sport_type}">
    <div class="cardContent">
      <div class="ballIcon">⚽</div>
      <div>
        <h2>${session.sport_type}</h2>
        <p>${ukDate}</p>
      </div>
      <span class="viewTag">View Session</span>
    </div>
  </div>
`;
  });
}

async function openSession(id) {
  currentSession = id;

  document.getElementById("sports").style.display = "none";
  document.getElementById("bookingSection").classList.remove("hidden");

  const { data: session } = await supabaseClient
    .from("sessions")
    .select("*")
    .eq("id", id)
    .single();

  document.getElementById("sessionTitle").innerText =
    session.sport_type;

  document.getElementById("sessionInfo").innerText =
    `${session.game_date} ${session.game_time}`;

  loadParticipants();
}

async function loadParticipants() {
  const { data } = await supabaseClient
    .from("bookings")
    .select("*")
    .eq("session_id", currentSession)
    .eq("cancelled", false)
    .order("created_at");

  const { data: session } = await supabaseClient
    .from("sessions")
    .select("*")
    .eq("id", currentSession)
    .single();

  const gameDateTime = new Date(`${session.game_date}T${session.game_time}`);
  const now = new Date();
  const hoursUntilGame = (gameDateTime - now) / (1000 * 60 * 60);
  const canCancel = hoursUntilGame > 24;

  let greenLimit = 0;

// Less than 10 players
if (data.length < 10) {
  greenLimit = 0;
}

// Exactly 10
else if (data.length === 10) {
  greenLimit = 10;
}

// 11
else if (data.length === 11) {
  greenLimit = 10;
}

// Even numbers between 12 and 14
else if (data.length === 12 || data.length === 14) {
  greenLimit = data.length;
}

// 13
else if (data.length === 13) {
  greenLimit = 12;
}

// More than 14
else if (data.length > 14) {
  greenLimit = 14;
}

  const container = document.getElementById("participants");
  container.innerHTML = "";

  data.forEach((player, index) => {
    let status = "";

if (data.length < 10) {
  status = "awaiting";
} else {
  status = index < greenLimit
    ? "confirmed"
    : "waiting";
}
    const colour = status === "confirmed" ? "confirmed" : "waiting";

    container.innerHTML += `
      <div class="player ${colour}">
        <div>
          <strong>${player.name}</strong><br>
          <small>${status.toUpperCase()}</small>
        </div>

        ${
          canCancel
            ? `<button class="cancelBtn" onclick="cancelBooking(${player.id}, '${player.email}')">Remove</button>`
            : `<small>Locked</small>`
        }
      </div>
    `;
  });
}
async function cancelBooking(bookingId, bookingEmail) {
  const enteredEmail = prompt("Please enter your email to remove your booking:");

  if (!enteredEmail) return;

  if (enteredEmail.toLowerCase().trim() !== bookingEmail.toLowerCase().trim()) {
    alert("Email does not match this booking.");
    return;
  }

  const confirmRemove = confirm("Are you sure you want to remove your booking?");

  if (!confirmRemove) return;

  await supabaseClient
    .from("bookings")
    .update({ cancelled: true })
    .eq("id", bookingId);

  alert("Your booking has been removed.");

  loadParticipants();
}

document
  .getElementById("bookingForm")
  .addEventListener("submit", async e => {

    e.preventDefault();

    const name =
      document.getElementById("name").value;

    const email =
      document.getElementById("email").value;

    const phone =
      document.getElementById("phone").value;

    await supabaseClient
      .from("bookings")
      .insert([
        {
          session_id: currentSession,
          name,
          email,
          phone
        }
      ]);

    document.getElementById("bookingForm").reset();

    loadParticipants();
  });

function goBack() {
  document.getElementById("sports").style.display = "grid";
  document.getElementById("bookingSection").classList.add("hidden");
}
