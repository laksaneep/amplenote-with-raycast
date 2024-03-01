import { OAuth } from "@raycast/api";
import fetch from "node-fetch";
import { get } from "lodash";
// import config from "../../config";
import { CLIENT_ID, INBOX_ID } from "../../config";

// import dotenv from "dotenv";
// dotenv.config();

// import dotenv from "dotenv";

// // Parsing the env file.
// // dotenv.config({ path: path.join(__dirname, "/.env") });

// const processEnv: { [key: string]: any } = {};

// dotenv.config({ processEnv });

// console.log("CLIENT_ID", CLIENT_ID); // Universee
// console.log("INBOX_ID", INBOX_ID); // Universee

// key
const clientId = "9869b44f590df799ba8d8b272233155bbc8f870436ab23d5ad75a76fde4a7031";
console.log("----- clidntId  :", clientId);

const client = new OAuth.PKCEClient({
  redirectMethod: OAuth.RedirectMethod.Web,
  providerName: "Amplenote",
  providerIcon: "dropbox-logo.png",
  providerId: "amplenote",
  description: "Connect your Amplenote account...",
});

// Inbox note id
const uuidNotes = "16bb98ba-d04c-11ee-a79d-260f5e6888ec";
// Authorization

export async function authorize(): Promise<void> {
  const tokenSet = await client.getTokens();
  if (tokenSet?.accessToken) {
    if (tokenSet.refreshToken && tokenSet.isExpired()) {
      await client.setTokens(await refreshTokens(tokenSet.refreshToken));
    }
    return;
  }

  const authRequest = await client.authorizationRequest({
    endpoint: "https://login.amplenote.com/login",
    clientId: clientId,
    scope: "notes:create-content-action notes:create notes:list",
    extraParameters: { redirect_uri: "https://raycast.com/redirect/extension" },
  });

  try {
    const { authorizationCode } = await client.authorize(authRequest);
    const token = await fetchTokens(authRequest, authorizationCode);
    console.log("--- token : ", token);
    await client.setTokens(token);
  } catch (error) {
    console.log("--- error : ", error);
  }
}

export async function fetchTokens(
  authRequest: OAuth.AuthorizationRequest,
  authCode: string
): Promise<OAuth.TokenResponse> {
  const params = new URLSearchParams();
  params.append("client_id", clientId);
  params.append("code", authCode);
  params.append("code_verifier", authRequest.codeVerifier);
  params.append("grant_type", "authorization_code");
  params.append("redirect_uri", "https://raycast.com/redirect/extension");

  const response = await fetch("https://api.amplenote.com/oauth/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: params,
  });
  if (!response.ok) {
    console.error("fetch tokens error:", await response.text());
    throw new Error(response.statusText);
  }
  return (await response.json()) as OAuth.TokenResponse;
}

async function refreshTokens(refreshToken: string): Promise<OAuth.TokenResponse> {
  const params = new URLSearchParams();
  params.append("client_id", clientId);
  params.append("refresh_token", refreshToken);
  params.append("grant_type", "refresh_token");

  const response = await fetch("https://api.amplenote.com/oauth/token", { method: "POST", body: params });
  if (!response.ok) {
    console.error("refresh tokens error:", await response.text());
    throw new Error(response.statusText);
  }
  const tokenResponse = (await response.json()) as OAuth.TokenResponse;
  tokenResponse.refresh_token = tokenResponse.refresh_token ?? refreshToken;
  return tokenResponse;
}

// API
export async function fetchItems(): Promise<{ id: string; title: string }[]> {
  const response = await fetch("https://api.amplenote.com/v4/notes", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${(await client.getTokens())?.accessToken}`,
    },
  });
  if (!response.ok) {
    console.error("fetch items error:", await response.text());
    throw new Error(response.statusText);
  }
  const json = (await response.json()) as { entries: { uuid: string; name: string }[] };
  console.log("---- json : ", get(json, "notes", []));
  const noteList = get(json, "notes", []);

  const resultNotes = noteList.sort(function (a, b) {
    var aTimeStamp = get(a, "timestamps.active");
    var bTimeStamp = get(b, "timestamps.active");

    return bTimeStamp - aTimeStamp;
  });

  return resultNotes.slice(0, 10).map((item: any) => ({ id: item.uuid, title: item.name }));
}

export async function addNewTask(todo: string): Promise<void> {
  const insertNotes = {
    type: "INSERT_NODES",
    nodes: [
      {
        type: "check_list_item",
        content: [
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: todo,
              },
            ],
          },
        ],
      },
    ],
  };

  const response = await fetch(`https://api.amplenote.com/v4/notes/${uuidNotes}/actions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${(await client.getTokens())?.accessToken}`,
    },
    body: JSON.stringify(insertNotes),
  });
  if (!response.ok) {
    console.error("add note error:", await response.text());
    throw new Error(response.statusText);
  } else {
    console.log("Add new note successfully!!!");
  }
}
