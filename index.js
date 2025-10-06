import express from "express";

import bodyParser from "body-parser";

import AppleReceiptVerify from "node-apple-receipt-verify";
import { GoogleAuth } from "google-auth-library";
import GOOGLE_SERVICE_ACCOUNT from "./tiny-tot-2a153-76682f326fbb.json" assert { type: "json" };

// =======================
// CONFIG
// =======================

// Apple
const PRIVATE_KEY_PATH = "./AuthKey_4QFD92XVYW_pdm.p8"; // downloaded .p8
const KEY_ID = "4QFD92XVYW"; // Key ID from App Store Connect
const ISSUER_ID = "a876998d-6c53-4959-94c9-306fc466d903"; // Issuer ID
const ENVIRONMENT = "sandbox"; // "production" or "sandbox"
const APP_SHARED_SECRET = "cbb1b9e4c13741e195195395066c84f7"; // optional

function createAppleJWT() {
  const privateKey = readFileSync(PRIVATE_KEY_PATH, "utf8");
  const token = jwt.sign(
    {
      iss: ISSUER_ID,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 20 * 60, // 20 minutes
      aud: "appstoreconnect-v1",
    },
    privateKey,
    {
      algorithm: "ES256",
      header: { alg: "ES256", kid: KEY_ID, typ: "JWT" },
    }
  );
  return token;
}

// Google
const GOOGLE_API_URL =
  "https://androidpublisher.googleapis.com/androidpublisher/v3/applications";

const auth = new GoogleAuth({
  credentials: GOOGLE_SERVICE_ACCOUNT,
  scopes: ["https://www.googleapis.com/auth/androidpublisher"],
});

const app = express();
app.use(bodyParser.json());
app.use(express.json());

app.post("/verify-subscription", async (req, res) => {
  const { platform, productId, receiptData, receipt } = req.body;

  if (
    !platform ||
    !productId ||
    (platform === "ios" && !receiptData) ||
    (platform === "android" && !receipt)
  ) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  if (platform == "ios") {
    try {
      AppleReceiptVerify.config({
        secret: APP_SHARED_SECRET || "",
        environment: ENVIRONMENT, // 'sandbox' or 'production' — library uses this for verifyReceipt fallback if used
      });

      // Verify and decode the receipt
      const validation = await AppleReceiptVerify.validate({
        receipt: receiptData,
      });

      if (!validation.length) {
        return res.status(200).json({ status: 200, isExpired: true });
      }

      // res.json({
      //   validation,
      // });
      
      const now = Date.now();
      const isExpired = Number(validation[0]["expirationDate"]) <= now;

      return res.json({
        status: 200,
        data: validation,
        isExpired,
      });
      
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to parse receipt" });
    }
  }

  if (platform == "android") {
    try {
      // Get Google OAuth token
      const client = await auth.getClient();
      const accessToken = await client.getAccessToken();
      const packageName = "com.gologonow.tinytotscreenlock"; // Your app package name

      const response = await fetch(
        `${GOOGLE_API_URL}/${packageName}/purchases/subscriptions/${productId}/tokens/${receipt}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken.token || accessToken}`,
          },
        }
      );

      const data = await response.json();
      const now = Date.now();
      const isExpired = Number(data["expiryTimeMillis"]) <= now;

      // Google gives autoRenewing directly
      return res.json({
        status: 200,
        data: data,
        isExpired,
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Verification failed" });
    }
  }
});

app.listen(3000, () => console.log("Server running on http://localhost:3000"));
