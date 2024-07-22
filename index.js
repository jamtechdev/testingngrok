const express = require("express");
const axios = require("axios");
const app = express();
app.use(express.json());
const { IgApiClient } = require("instagram-private-api");

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
    throw error; // Re-throw error to be handled by the caller
  }
};

// get ads
const getNewMessages = async () => {
  const ig = new IgApiClient();
  ig.state.generateDevice("heystak.io");
  console.log("IG_USERNAME:", "heystak.io");
  console.log("IG_PASSWORD:", "Heystak12!" ? "Loaded" : "Not Loaded");

  await ig.account.login("heystak.io", "Heystak12!");

  const inboxFeed = ig.feed.directInbox();
  const threads = await inboxFeed.items();

  // A set to keep track of processed message IDs
  const processedMessageIds = new Set();

  // Load processed message IDs from storage (this is just an example)
  // In a real application, you would load this from a database or file
  // const processedMessageIds = new Set(loadProcessedMessageIdsFromStorage());

  for (const thread of threads) {
    const messages = thread.items;
    for (const message of messages) {
      console.log(message?.item_type);

      // console.log(message.item_type, message.media_share , "neetx");

      // thread.thread_id,
      // message.item_id,
      // message.text || "",
      // message.user_id,
      // message.item_type,
      // message.media_share
    }
  }
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
              Authorization: `Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImp0aSI6IjgzNmQzNDQxMWJhYmZjNTM5MDc1ODhhODExYTAwMzFkMDQwNWJmOWRiZWY3NDJlZTY2MWE5NWZkMDVmOWNjODlhZTA0YWYzNzM2ZmEzZjFkIn0.eyJhdWQiOiI4NDUyN2E0NjkxMjY4Y2U3YzlhMmFlOGFhZmQxNTljNiIsImp0aSI6IjgzNmQzNDQxMWJhYmZjNTM5MDc1ODhhODExYTAwMzFkMDQwNWJmOWRiZWY3NDJlZTY2MWE5NWZkMDVmOWNjODlhZTA0YWYzNzM2ZmEzZjFkIiwiaWF0IjoxNzIxMzkwOTI3LCJuYmYiOjE3MjEzOTA5MjcsImV4cCI6MTcyMTM5NDUyNywic3ViIjoiIiwic2NvcGVzIjpbXSwidXNlciI6eyJpZCI6ODc3NTcxOCwiZ3JvdXBfaWQiOm51bGwsInBhcmVudF9pZCI6bnVsbCwiY29udGV4dCI6eyJhY2NsaW0iOiIwIn0sImFyZWEiOiJyZXN0IiwiYXBwX2lkIjpudWxsfX0.XIdZyo8mGBdrYBwyds1f2vJKuvI5wAwBqrcmIlZqmyT6bsWqbzn1UoyVcZ6lrLEiEuaTUzclAXNsy-cefmkyUSR6s1PZ_uTaqTf-0U0y3Z6j015DYnEG5vliwbIL2jh139stVQ8UmtLUacL_KZpJeRx0QbFwz6qKK5R01RCEnQ2f805J2EvnVgw3lqrJfPrcpw7O3IZ6GjGwKbLRA-IZtSM0rN4_aKPcPVTJXylUKpBJvnUbklRnR_67aKMdUjWO7p7uxppRx1I7kRzwmdL7tsCYcpfjQ7PpYXTKBD_bHYn_ycKAnjlazp5nZauvMRBIXI7sP_FApYZRVKKLLwbhAw`,
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
                Authorization: `Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImp0aSI6IjgzNmQzNDQxMWJhYmZjNTM5MDc1ODhhODExYTAwMzFkMDQwNWJmOWRiZWY3NDJlZTY2MWE5NWZkMDVmOWNjODlhZTA0YWYzNzM2ZmEzZjFkIn0.eyJhdWQiOiI4NDUyN2E0NjkxMjY4Y2U3YzlhMmFlOGFhZmQxNTljNiIsImp0aSI6IjgzNmQzNDQxMWJhYmZjNTM5MDc1ODhhODExYTAwMzFkMDQwNWJmOWRiZWY3NDJlZTY2MWE5NWZkMDVmOWNjODlhZTA0YWYzNzM2ZmEzZjFkIiwiaWF0IjoxNzIxMzkwOTI3LCJuYmYiOjE3MjEzOTA5MjcsImV4cCI6MTcyMTM5NDUyNywic3ViIjoiIiwic2NvcGVzIjpbXSwidXNlciI6eyJpZCI6ODc3NTcxOCwiZ3JvdXBfaWQiOm51bGwsInBhcmVudF9pZCI6bnVsbCwiY29udGV4dCI6eyJhY2NsaW0iOiIwIn0sImFyZWEiOiJyZXN0IiwiYXBwX2lkIjpudWxsfX0.XIdZyo8mGBdrYBwyds1f2vJKuvI5wAwBqrcmIlZqmyT6bsWqbzn1UoyVcZ6lrLEiEuaTUzclAXNsy-cefmkyUSR6s1PZ_uTaqTf-0U0y3Z6j015DYnEG5vliwbIL2jh139stVQ8UmtLUacL_KZpJeRx0QbFwz6qKK5R01RCEnQ2f805J2EvnVgw3lqrJfPrcpw7O3IZ6GjGwKbLRA-IZtSM0rN4_aKPcPVTJXylUKpBJvnUbklRnR_67aKMdUjWO7p7uxppRx1I7kRzwmdL7tsCYcpfjQ7PpYXTKBD_bHYn_ycKAnjlazp5nZauvMRBIXI7sP_FApYZRVKKLLwbhAw`,
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

// store data from webhook
function storeData(data) {
  const username = data[0]?.contact.username;
  const lastMessage = data[0]?.contact.last_message;
  const contact_id = data[0]?.contact.id;
  const date = data[0]?.date;
  return { username, lastMessage, contact_id, date };
}

const inComingDetails = [];

// Endpoint to receive incoming messages
app.post("/webhook/incoming", async (req, res) => {
  try {
    const data = req.body;
    console.log(data[0]?.info?.message, data);
    const userData = storeData(data);
    const check = await inComingDetails.find(
      (obj) =>
        obj.contact_id === userData.contact_id &&
        obj.lastMessage === userData.lastMessage
    );
    // console.log(check, "neet", userData, inComingDetails);
    if (check) {
      return res.sendStatus(200);
    } else {
      inComingDetails.push(userData);
      await getNewMessages();
      // await callAnotherApi(userData);
    }
    // console.log(userData, "neet");
    // Call another API with the stored data

    return res.sendStatus(200); // Corrected to use sendStatus
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
});

// Endpoint to send outgoing messages
app.post("/webhook/outgoing", async (req, res) => {
  const data = req.body;
  console.log(data, "neet");
  return res.sendStatus(200); // Corrected to use sendStatus
});

const PORT = process.env.PORT || 8090;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Mock function to send a message to Instagram
async function sendOutgoingMessage(to, body) {
  // Replace with your actual implementation to send a message to Instagram
  console.log(`Sending message to ${to}: ${body}`);
  return { to, body };
}
