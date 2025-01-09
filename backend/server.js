import express from "express";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import cors from "cors";
import { google } from "googleapis";

dotenv.config();

const app = express();
app.use(bodyParser.json());
app.use(cors({ origin: "http://localhost:5173" }));

const SPREADSHEET_ID = "1o_yM63Grl_QB6lpuXE3spbrMeCs-hIMXCVyghj8FmV0";
const sheets = google.sheets("v4");

// Authenticate Google Sheets API
async function getAuthClient() {
  const googleAuth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });
  return googleAuth.getClient();
}

// Fetch data from Google Sheets
async function fetchSheetData() {
  const authClient = await getAuthClient();

  const ranges = {
    referralFees: "'Referral fees'!A1:C",
    closingFees: "'Closing fees'!A1:F",
    weightHandlingFees: "'Weight handling fees'!A1:E",
    otherFees: "'Other Fees'!A1:C",
  };

  const requests = Object.entries(ranges).map(async ([key, range]) => {
    const response = await sheets.spreadsheets.values.get({
      auth: authClient,
      spreadsheetId: SPREADSHEET_ID,
      range,
    });
    return { key, data: response.data.values || [] };
  });

  const results = await Promise.all(requests);

  return results.reduce((acc, { key, data }) => {
    acc[key] = data;
    return acc;
  }, {});
}

// Clean and parse numeric values
function parseValue(value) {
  if (!value) return 0;
  return parseFloat(value.replace(/[^0-9.]/g, "").trim()) || 0;
}

// Profitability Calculation Logic
function calculateProfitability(sheetData, input) {
    const { productCategory, sellingPrice, weight, shippingMode, serviceLevel } = input;
  
    // 1. Referral Fee
    const referralRow = sheetData.referralFees.find(
      row => row[0]?.trim().toLowerCase() === productCategory.trim().toLowerCase()
    );
    if (!referralRow) throw new Error(`Invalid product category: ${productCategory}`);
    const referralFee = (sellingPrice * parseFloat(referralRow[2])) / 100;
  
    // 2. Closing Fee
    const closingRow = sheetData.closingFees.find(row => {
      const [minStr, maxStr] = (row[0] || "").split("-").map(s => s.replace(/[₹,\s]/g, ""));
      const min = parseFloat(minStr);
      const max = maxStr ? parseFloat(maxStr) : Infinity;
      return sellingPrice >= min && sellingPrice <= max;
    });
    
    const shippingModeMap = {
      'fba': 1,       // FBA Normal
      'fba_exception': 2,  // FBA Exception
      'easyship': 3,  // Easy Ship (Standard)
      'selfship': 4,  // Self Ship
      'sellerflex': 5 // Seller Flex
    };
    
    const closingFeeIndex = shippingModeMap[shippingMode.toLowerCase()];
    if (closingFeeIndex === undefined) {
      throw new Error(`Invalid shipping mode: ${shippingMode}. Must be one of: FBA, FBA_Exception, EasyShip, SelfShip, SellerFlex`);
    }
    
    const closingFee = closingRow ? parseFloat(closingRow[closingFeeIndex]?.replace(/[₹,\s]/g, "") || "0") : 0;
  
    // 3. Weight Handling Fee
    const serviceLevelMap = {
      'local': 2,
      'regional': 3,
      'national': 4,
      'ixd': 5
    };
  
    const normalizedServiceLevel = serviceLevel.toLowerCase();
    const weightFeeIndex = serviceLevelMap[normalizedServiceLevel];
  
    if (weightFeeIndex === undefined) {
      throw new Error(`Invalid service level: ${serviceLevel}. Must be one of: Local, Regional, National, IXD`);
    }
  
    // Mapping descriptive weight ranges to numeric ranges
    const weightRangeMapping = {
      'First 500g': [0, 500],
      'Additional 500g up to 1kg': [500, 1000],
      'Additional kg after 1kg': [1000, 1500],
      'Additional kg after 5kg': [5000, 10000],
      'First 12kg': [0, 12000],
      'Each additional kg after 12kg': [12000, Infinity]
    };
  
    // Check the raw weight handling fees data
    console.log("Weight Handling Fees Data: ", sheetData.weightHandlingFees);
  
    const weightRow = sheetData.weightHandlingFees.find(row => {
      if (!row[1]) return false;
      
      // Find the numeric range for the weight description
      const weightRange = weightRangeMapping[row[1]];
      if (!weightRange) return false;
  
      const [min, max] = weightRange;
      console.log(`Checking weight: ${weight} against range: ${min}-${max}`);
      
      return weight >= min && weight <= max;
    });
  
    if (!weightRow) throw new Error(`No matching weight range found for weight: ${weight}`);
  
    const weightHandlingFee = parseFloat(weightRow[weightFeeIndex]?.replace(/[₹,\s]/g, "") || "0");
  
    // 4. Other Fees
    const otherRow = sheetData.otherFees.find(
      row => row[1]?.trim().toLowerCase() === productCategory.trim().toLowerCase()
    );
    const additionalFee = otherRow ? parseFloat(otherRow[2]?.replace(/[₹,\s]/g, "") || "0") : 0;
  
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
  
  
  

// API endpoint for profitability calculator
app.post("/api/v1/profitability-calculator", async (req, res) => {
  try {
    const { productCategory, sellingPrice, weight, shippingMode, serviceLevel } = req.body;

    if (!productCategory || !sellingPrice || !weight || !shippingMode || !serviceLevel) {
      return res.status(400).json({ error: "Missing required fields." });
    }

    const sheetData = await fetchSheetData();
    const result = calculateProfitability(sheetData, {
      productCategory,
      sellingPrice: parseFloat(sellingPrice),
      weight: parseFloat(weight),
      shippingMode,
      serviceLevel,
    });

    res.json(result);
  } catch (error) {
    console.error("Error calculating profitability:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
