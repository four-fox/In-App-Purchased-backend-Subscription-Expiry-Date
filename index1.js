// import express from "express";
// import bodyParser from "body-parser";
// import axios from "axios";
// import jwt from "jsonwebtoken";
// import { readFileSync } from "fs";
// import AppleReceiptVerify from "node-apple-receipt-verify";

// const app = express();
// app.use(bodyParser.json());

// // ---------- CONFIG ----------
// const PRIVATE_KEY_PATH = "./AuthKey_4QFD92XVYW_pdm.p8"; // downloaded .p8
// const KEY_ID = "4QFD92XVYW"; // Key ID from App Store Connect
// const ISSUER_ID = "a876998d-6c53-4959-94c9-306fc466d903"; // Issuer ID
// const ENVIRONMENT = "sandbox"; // "production" or "sandbox"
// const APP_SHARED_SECRET = "cbb1b9e4c13741e195195395066c84f7"; // optional

// // const BUNDLE_ID = "com.gologonow.tinytotscreenlock";

// // Shared secret not needed for this flow; keep if you also use verifyReceipt

// // ---------- Helpers ----------
// function createAppleJWT() {
//   const privateKey = readFileSync(PRIVATE_KEY_PATH, "utf8");
//   const token = jwt.sign(
//     {
//       iss: ISSUER_ID,
//       iat: Math.floor(Date.now() / 1000),
//       exp: Math.floor(Date.now() / 1000) + 20 * 60, // 20 minutes
//       aud: "appstoreconnect-v1",
//     },
//     privateKey,
//     {
//       algorithm: "ES256",
//       header: { alg: "ES256", kid: KEY_ID, typ: "JWT" },
//     }
//   );
//   return token;
// }
// console.log(createAppleJWT());



// app.post("/verify-subscription-ios-from-receipt", async (req, res) => {
//   const { receiptData } = req.body;
//   if (!receiptData)
//     return res.status(400).json({ error: "receiptData is required" });

//   try {
//     // 1) Parse receipt locally to get originalTransactionId
//     // node-apple-receipt-verify returns decoded purchases in a convenient shape
//     // Configure AppleReceiptVerify if you want (shared secret / env). Here we just call validate.
//     AppleReceiptVerify.config({
//       secret: APP_SHARED_SECRET || "",
//       environment: ENVIRONMENT, // 'sandbox' or 'production' — library uses this for verifyReceipt fallback if used
//     });

//     const validation = await AppleReceiptVerify.validate({
//       receipt: receiptData,
//     });

//     console.log(validation);


//     return res.status(200).json({
//       data: validation,
//     });
//   } catch (err) {
//     console.error("verify error:", err.response?.data || err.message || err);
//     // If App Store server returns error codes, include them
//     const payload = err.response?.data ?? { message: err.message };
//     return res
//       .status(500)
//       .json({ error: "Verification failed", detail: payload });
//   }
// });

// app.listen(3000, () => console.log("Server running on http://0.0.0.0:3000"));

// // import express from "express";
// // import bodyParser from "body-parser";
// // import AppleReceiptVerify from "node-apple-receipt-verify";
// // import { GoogleAuth } from "google-auth-library";
// // import GOOGLE_SERVICE_ACCOUNT from "./tiny-tot-2a153-76682f326fbb.json" assert { type: "json" };
// // import axios from "axios";
// // import { AppStoreServerAPI, Environment } from "app-store-server-api";

// // // =======================
// // // CONFIG
// // // =======================

// // // Apple
// // // const KEY_ID = "4QFD92XVYW";
// // // const ISSUER_ID = "a876998d-6c53-4959-94c9-306fc466d903";
// // // const PRIVATE_KEY_PATH = "./AuthKey_4QFD92XVYW_pdm.p8";
// // // const PRIVATE_KEY = readFileSync(PRIVATE_KEY_PATH, "utf8");

// // // const APP_SHARED_SECRET = "a6e9649b876e4760aa2e95531e9bbfcc";
// // // const ENVIRONMENT = "sandbox"; // "production" in live

// // // Google
// // const GOOGLE_API_URL =
// //   "https://androidpublisher.googleapis.com/androidpublisher/v3/applications";

// // const auth = new GoogleAuth({
// //   credentials: GOOGLE_SERVICE_ACCOUNT,
// //   scopes: ["https://www.googleapis.com/auth/androidpublisher"],
// // });

// // // // Configure AppleReceiptVerify
// // // AppleReceiptVerify.config({
// // //   secret: APP_SHARED_SECRET, // only for iOS auto-renewable shared secret if needed
// // //   environment: ENVIRONMENT, // or 'sandbox' if testing
// // // });

// // const app = express();
// // app.use(bodyParser.json());
// // app.use(express.json());

// // app.post("/verify-subscription", async (req, res) => {
// //   const { platform, productId, receiptData, receipt } = req.body;

// //   if (
// //     !platform ||
// //     !productId ||
// //     (platform === "ios" && !receiptData) ||
// //     (platform === "android" && !receipt)
// //   ) {
// //     return res.status(400).json({ error: "Missing required fields" });
// //   }

// //   if (platform == "ios") {
// //     let response;
// //     try {
// //       response = await axios.post(
// //         "https://buy.itunes.apple.com/verifyReceipt",
// //         {
// //           "receipt-data": receiptData,
// //           password: APP_SHARED_SECRET,
// //           "exclude-old-transactions": false,
// //         }
// //       );
// //       // 2️⃣ If the response indicates sandbox receipt (21007), re-try with sandbox URL
// //       if (response.data.status === 21007) {
// //         response = await axios.post(
// //           "https://sandbox.itunes.apple.com/verifyReceipt",
// //           {
// //             "receipt-data": receiptData,
// //             password: APP_SHARED_SECRET,
// //             "exclude-old-transactions": false,
// //           }
// //         );
// //       }

// //       // ✅ Extract latest receipt info
// //       const latestReceiptInfo = response.data.latest_receipt_info;
// //       let isExpired = true;

// //       if (latestReceiptInfo && latestReceiptInfo.length > 0) {
// //         const lastTransaction = latestReceiptInfo[latestReceiptInfo.length - 1];
// //         const expiresDateMs = Number(lastTransaction.expires_date_ms);
// //         const now = Date.now();
// //         isExpired = expiresDateMs <= now; // ✅ true if expired
// //       }

// //       // ✅ Send JSON safely
// //       res.json({
// //         status: 200,
// //         data: response.data,
// //         isExpired,
// //       });
// //     } catch (err) {
// //       console.error(err);
// //       res.status(500).json({ error: "Failed to parse receipt" });
// //     }
// //   }

// //   if (platform == "android") {
// //     try {
// //       // Get Google OAuth token
// //       const client = await auth.getClient();
// //       const accessToken = await client.getAccessToken();
// //       const packageName = "com.gologonow.tinytotscreenlock"; // Your app package name

// //       const response = await fetch(
// //         `${GOOGLE_API_URL}/${packageName}/purchases/subscriptions/${productId}/tokens/${receipt}`,
// //         {
// //           headers: {
// //             Authorization: `Bearer ${accessToken.token || accessToken}`,
// //           },
// //         }
// //       );

// //       const data = await response.json();
// //       const now = Date.now();
// //       const isExpired = Number(data["expiryTimeMillis"]) <= now;
// //       // Google gives autoRenewing directly
// //       return res.json({
// //         status: 200,
// //         data,
// //         isExpired,
// //       });
// //     } catch (err) {
// //       console.error(err);
// //       return res.status(500).json({ error: "Verification failed" });
// //     }
// //   }
// // });

// // app.listen(3000, () => console.log("Server running on http://localhost:3000"));

// // // =======================
// // // HELPER: Apple JWT
// // // =======================

// // // function createAppleJWT() {
// // //   token = jwt.sign(
// // //     {
// // //       iss: ISSUER_ID,
// // //       // iat and exp in seconds
// // //       iat: Math.floor(Date.now() / 1000),
// // //       exp: Math.floor(Date.now() / 1000) + 20 * 60, // 20 min validity
// // //       aud: "appstoreconnect-v1",
// // //     },
// // //     PRIVATE_KEY,
// // //     {
// // //       algorithm: "ES256",
// // //       header: { alg: "ES256", kid: KEY_ID, typ: "JWT" },
// // //     }
// // //   );
// // //   return token;
// // // }

// // // =======================
// // // EXPRESS APP
// // // =======================

// // // createAppleJWT();

// // // try {
// // //   // Call App Store Server API
// // //   await axios.get(
// // //     `https://api.appstoreconnect.apple.com/v1/subscriptions/${validation[0].transactionId}`,
// // //     {
// // //       headers: {
// // //         Authorization: `Bearer ${token}`,
// // //       },
// // //     }
// // //   );
// // //   console.log("Response :${response}");
// // //   res.json({
// // //     validation,
// // //     fullData: subscriptionData,
// // //   });
// // // } catch (err) {
// // //   console.error(err.response?.data || err.message);
// // //   res.status(500).json({ error: "Failed to verify subscription" });
// // // }


//       // createAppleJWT();

//       // try {
//       //   // Call App Store Server API
//       //   await axios.get(
//       //     `https://api.appstoreconnect.apple.com/v1/subscriptions/${validation[0].transactionId}`,
//       //     {
//       //       headers: {
//       //         Authorization: `Bearer ${token}`,
//       //       },
//       //     }
//       //   );
//       //   console.log("Response :${response}");
//       //   res.json({
//       //     validation,
//       //     fullData: subscriptionData,
//       //   });
//       // } catch (err) {
//       //   console.error(err.response?.data || err.message);
//       //   res.status(500).json({ error: "Failed to verify subscription" });
//       // }