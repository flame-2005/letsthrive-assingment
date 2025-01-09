import express from "express";
import { google } from "googleapis";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

// Google Sheets configuration
const SPREADSHEET_ID = "1o_yM63Grl_QB6lpuXE3spbrMeCs-hIMXCVyghj8FmV0";
const sheets = google.sheets({ version: "v4" });

async function getAuthClient() {
  return new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  }).getClient();
}

async function fetchSheetData() {
  const authClient = await getAuthClient();

  const ranges = {
    referralFees: "'Referral fees'!A1:C",
    closingFees: "'Closing fees'!A1:F",
    weightHandlingFees: "'Weight handling fees'!A1:F",
    otherFees: "'Other Fees'!A1:C",
  };

  try {
    const results = await Promise.all(
      Object.entries(ranges).map(async ([key, range]) => {
        console.log(`Fetching range: ${range}`);
        const response = await sheets.spreadsheets.values.get({
          auth: authClient,
          spreadsheetId: SPREADSHEET_ID,
          range,
        });
        return { key, data: response.data.values || [] };
      })
    );

    return results.reduce((acc, { key, data }) => ({ ...acc, [key]: data }), {});
  } catch (error) {
    console.error("Error fetching sheet data:", error.message);
    throw error;
  }
}

function calculateProfitability({ referralFees, closingFees, weightHandlingFees, otherFees }, input) {
  const { productCategory, sellingPrice, weight, shippingMode, serviceLevel } = input;

  // Referral Fee Calculation
  const referralData = referralFees.find(row => row[0] === productCategory);
  if (!referralData) throw new Error("Invalid product category.");
  const referralFeePercentage = parseFloat(referralData[2]) || 0;
  const referralFee = (sellingPrice * referralFeePercentage) / 100;

  // Closing Fee Calculation
  const closingFeeData = closingFees.find(row => {
    const range = row[0]?.split("-");
    if (!range) return false;
    const min = parseFloat(range[0].replace("₹", "").trim());
    const max = range[1] ? parseFloat(range[1].replace("₹", "").trim()) : Infinity;
    return sellingPrice >= min && sellingPrice <= max;
  });
  const closingFee = closingFeeData ? parseFloat(closingFeeData[shippingMode === "FBA" ? 1 : 4]) || 0 : 0;

  // Weight Handling Fee Calculation
  const weightData = weightHandlingFees.find(row => row[0] === serviceLevel);
  const weightHandlingFee = weightData ? parseFloat(weightData[5]) * weight : 0;

  // Other Fees Calculation
  const otherFeeData = otherFees.find(row => row[1] === productCategory);
  const additionalFee = otherFeeData ? parseFloat(otherFeeData[2]) || 0 : 0;

  // Total and Net Earnings
  const totalFees = referralFee + closingFee + weightHandlingFee + additionalFee;
  const netEarnings = sellingPrice - totalFees;

  return {
    breakdown: {
      referralFee,
      closingFee,
      weightHandlingFee,
      additionalFee,
    },
    totalFees,
    netEarnings,
  };
}

export { calculateProfitability };

app.post("/api/v1/profitability-calculator", async (req, res) => {
  try {
    const { productCategory, sellingPrice, weight, shippingMode, serviceLevel } = req.body;

    if (!productCategory || !sellingPrice || !weight || !shippingMode || !serviceLevel) {
      return res.status(400).json({ error: "Missing required fields." });
    }

    const sheetData = await fetchSheetData();
    const result = calculateProfitability(sheetData, req.body);

    res.json(result);
  } catch (error) {
    console.error("Error in profitability calculation:", error.message);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
