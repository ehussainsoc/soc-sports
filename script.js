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
        ? "womens-football.jpg"
        : "mens-football.jpg";

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

  const ukDate = new Date(session.game_date).toLocaleDateString("en-GB");

  document.getElementById("sessionTitle").innerText = session.sport_type;
  document.getElementById("sessionInfo").innerText =
    `${ukDate} at ${session.game_time}`;

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

  const container = document.getElementById("participants");
  container.innerHTML = "";

  let greenLimit = 0;

  if (data.length < 10) {
    greenLimit = 0;
  } else if (data.length === 10) {
    greenLimit = 10;
  } else if (data.length === 11) {
    greenLimit = 10;
  } else if (data.length === 12) {
    greenLimit = 12;
  } else if (data.length === 13) {
    greenLimit = 12;
  } else if (data.length >= 14) {
    greenLimit = 14;
  }

  data.forEach((player, index) => {
    let status = index < greenLimit ? "confirmed" : "waiting";
    let statusText = "";

    if (data.length < 10) {
      status = "waiting";
      const needed = 10 - data.length;
      statusText = `Awaiting minimum numbers - ${needed} more player${needed === 1 ? "" : "s"} needed`;
    } else if ((data.length === 11 && index >= 10) || (data.length === 13 && index >= 12)) {
      status = "waiting";
      statusText = "Awaiting 1 more player to create even teams";
    } else if (data.length > 14 && index >= 14) {
      status = "waiting";
      statusText = "Waiting List";
    } else {
      status = "confirmed";
      statusText = "Confirmed";
    }

    const colour = status === "confirmed" ? "confirmed" : "waiting";

    container.innerHTML += `
      <div class="player ${colour}">
        <div>
          <strong>${player.name}</strong><br>
          <small>${statusText}</small>
        </div>

        ${
          canCancel
            ? `<button class="cancelBtn" onclick="event.stopPropagation(); cancelBooking(${player.id}, '${player.email}')">Remove</button>`
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

    const name = document.getElementById("name").value;
    const email = document.getElementById("email").value;
    const phone = document.getElementById("phone").value;

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
