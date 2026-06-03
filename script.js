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
    sportsDiv.innerHTML += `
      <div class="card">
        <h2>${session.sport_type}</h2>
        <p>${session.game_date}</p>
        <button onclick="openSession(${session.id})">
          View Session
        </button>
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

  const container =
    document.getElementById("participants");

  container.innerHTML = "";

  data.forEach((player, index) => {

    let greenLimit = 10;

if (data.length >= 10 && data.length <= 14 && data.length % 2 === 0) {
  greenLimit = data.length;
}

if (data.length >= 10 && data.length <= 14 && data.length % 2 !== 0) {
  greenLimit = data.length - 1;
}

if (data.length > 14) {
  greenLimit = 14;
}

let status = index < greenLimit ? "confirmed" : "waiting";

    const colour =
      status === "confirmed"
        ? "confirmed"
        : "waiting";

    container.innerHTML += `
      <div class="player ${colour}">
        <span>${player.name}</span>
        <span>${status.toUpperCase()}</span>
      </div>
    `;
  });
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
