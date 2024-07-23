const express = require("express");
const axios = require("axios");
const app = express();
app.use(express.json());
const { IgApiClient } = require("instagram-private-api");
const fs = require('fs');
const SESSION_FILE_PATH = "./ig_session.json";

// store session
const saveSession = async () => {
  const cookies = await ig.state.serializeCookieJar();
  fs.writeFileSync(SESSION_FILE_PATH, JSON.stringify(cookies));
};

const loadSession = async () => {
  if (fs.existsSync(SESSION_FILE_PATH)) {
    const cookies = JSON.parse(fs.readFileSync(SESSION_FILE_PATH));
    await ig.state.deserializeCookieJar(cookies);
  }
};

// Initialize Supabase client
const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = "https://ynbhzepfkimfgmmsumbb.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InluYmh6ZXBma2ltZmdtbXN1bWJiIiwicm9sZSI6ImFub24iLCJpYXQiOjE2OTg0NDc0NDAsImV4cCI6MjAxNDAyMzQ0MH0.vgtE8S-eEMykRsZBCKCpQ5E3pm49YWenakZWb4dNiG4";
const supabase = createClient(supabaseUrl, supabaseKey);

// get access token
const clientId = "84527a4691268ce7c9a2ae8aafd159c6";
const clientSecret = "a910cc36f1022c54f569a3ce28238fb4";

const getToken = async () => {
  try {
    const response = await axios.post(
      "https://api.sendpulse.com/oauth/access_token",
      new URLSearchParams({
        grant_type: "client_credentials",
        client_id: clientId,
        client_secret: clientSecret,
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    const accessToken = response.data.access_token;
    console.log("Access Token:", accessToken);
    return accessToken;
  } catch (error) {
    console.error("Error obtaining access token:", error);
    throw error;
  }
};

const ig = new IgApiClient();

const loginToInstagram = async () => {
  ig.state.generateDevice("heystak.io");
  await loadSession();

  try {
    await ig.account.login("heystakio", "Heystak12!");
    console.log("Logged into Instagram");
    await saveSession();
  } catch (e) {
    if (e.message.includes("checkpoint_required")) {
      console.log("Checkpoint error triggered");
      await ig.challenge.auto(true); // Requesting verification code

      console.log("Challenge URL:", ig.state.checkpoint); // Checkpoint URL
      const { code } = await promptUserForCode(); // Custom function to get code from user
      await ig.challenge.sendSecurityCode(code);
    } else {
      console.error("Error logging in:", e);
    }
  }
};
const promptUserForCode = async () => {
  const readline = require("readline").createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    readline.question("Enter the security code: ", (code) => {
      readline.close();
      resolve({ code });
    });
  });
};

const getNewMessages = async () => {
  const inboxFeed = ig.feed.directInbox();
  const threads = await inboxFeed.items();

  const processedMessageIds = new Set();

  threads.forEach((thread) => {
    thread.items.forEach((message) => {
      if (!processedMessageIds.has(message.fbid)) {
        console.log("New message:", message.item_type);
        if (message.item_type === "media_share") {
          const post_id = message?.media_share?.id;
          const brand_logo = message?.media_share?.user?.profile_pic_url;
          const brand_username = message?.media_share?.user?.username;
          const brand_fullname = message?.media_share?.user?.full_name;
          const caption_text = message?.media_share?.caption?.text;
          const ad_id = message?.media_share?.ad_id;
          const product_images = message?.media_share?.carousel_media?.map(
            (item) => item.image_versions2.candidates[0].url
          );
          const product_link = message?.media_share?.carousel_media[0].link;

          console.log(
            post_id,
            brand_logo,
            brand_username,
            brand_fullname,
            caption_text,
            ad_id,
            product_images,
            product_link
          );
          console.log(JSON.stringify(message?.media_share));
        }

        processedMessageIds.add(message.fbid);
      }
    });
  });
};

async function callAnotherApi(userData) {
  try {
    if (!isNaN(userData.lastMessage)) {
      const { data: user, error } = await supabase
        .from("channels")
        .select("*")
        .eq("channel_name", userData?.username)
        .eq("otp", userData?.lastMessage);

      if (error) {
        console.error("Error fetching user:", error.message);
        return error.message;
      }

      if (!user || user.length === 0) {
        const postData = {
          contact_id: userData.contact_id,
          messages: [
            {
              type: "text",
              message: {
                text: "Account not verified. please make sure that the verification code and Instagram account are connected",
              },
            },
          ],
        };

        const sendResponse = await axios.post(
          "https://api.sendpulse.com/instagram/contacts/send",
          postData,
          {
            headers: {
              Authorization: `Bearer ${await getToken()}`,
              "Content-Type": "application/json",
            },
          }
        );

        console.log("Response from SendPulse API:", sendResponse.data);
        return true;
      } else {
        const { data: user, error } = await supabase
          .from("channels")
          .select("id, is_verified")
          .eq("channel_name", userData?.username);

        if (user[0].is_verified) {
          return true;
        } else {
          console.log(user[0]?.id);
          const { data: updateUser, error } = await supabase
            .from("channels")
            .update({ is_verified: true })
            .eq("id", user[0].id);
          console.log(updateUser, error, "neetx");
          const postData = {
            contact_id: userData.contact_id,
            messages: [
              {
                type: "text",
                message: {
                  text: "Otp Verified Successful 🎉🎉",
                },
              },
            ],
          };
          const sendResponse = await axios.post(
            "https://api.sendpulse.com/instagram/contacts/send",
            postData,
            {
              headers: {
                Authorization: `Bearer ${await getToken()}`,
                "Content-Type": "application/json",
              },
            }
          );
        }

        return true;
      }
    } else {
      console.log(userData, "neet");
      return false;
    }
  } catch (error) {
    console.error("Error calling another API:", error);
    return error.message;
  }
}

function storeData(data) {
  const username = data[0]?.contact.username;
  const lastMessage = data[0]?.contact.last_message;
  const contact_id = data[0]?.contact.id;
  const date = data[0]?.date;
  return { username, lastMessage, contact_id, date };
}

const inComingDetails = [];

app.post("/webhook/incoming", async (req, res) => {
  try {
    const data = req.body;
    console.log(JSON.stringify(data));
    console.log(data[0]?.info?.message, data);
    const userData = storeData(data);
    const check = await inComingDetails.find(
      (obj) =>
        obj.contact_id === userData.contact_id &&
        obj.lastMessage === userData.lastMessage
    );
    if (check) {
      return res.sendStatus(200);
    } else {
      inComingDetails.push(userData);
      await getNewMessages();
      // await callAnotherApi(userData);
    }

    return res.sendStatus(200);
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
});

app.post("/webhook/outgoing", async (req, res) => {
  const data = req.body;
  console.log(data, "neet");
  return res.sendStatus(200);
});

// const VERIFY_TOKEN = "navneet12";

// app.get("/webhook", (req, res) => {
//   const mode = req.query["hub.mode"];
//   const token = req.query["hub.verify_token"];
//   const challenge = req.query["hub.challenge"];

//   console.log("GET request received", req.query);

//   if (mode && token) {
//     if (mode === "subscribe" && token === VERIFY_TOKEN) {
//       console.log("WEBHOOK_VERIFIED");
//       res.status(200).send(challenge);
//     } else {
//       console.log("Forbidden: Invalid token");
//       res.sendStatus(403);
//     }
//   } else {
//     console.log("Bad Request: Missing mode or token");
//     res.sendStatus(400);
//   }
// });

// app.post("/webhook", (req, res) => {
//   const body = req.body;
//   console.log("POST request received", JSON.stringify(body, null, 2));

//   if (body.object === "instagram") {
//     body.entry.forEach((entry) => {
//       const webhookEvent = entry.messaging[0];
//       console.log("Instagram Event", webhookEvent);

//       // Handle the event here
//     });

//     res.status(200).send("EVENT_RECEIVED");
//   } else {
//     console.log("Not Found: Object is not Instagram");
//     res.sendStatus(404);
//   }
// });

const PORT = process.env.PORT || 8090;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

async function sendOutgoingMessage(to, body) {
  console.log(`Sending message to ${to}: ${body}`);
  return { to, body };
}

// Ensure you login once at the start
(async () => {
  await loginToInstagram();
})();
