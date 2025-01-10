# Profitability Calculator

## Overview
This is currently a front-end application that calculates various fees and profitability metrics for transactions. We aim to extend it into a full-stack solution with an API backend.

## Explanation of business terms:

Product Category: Determines referral fee percentage and category-specific requirements
Selling Price: Your listing price, including GST
Weight: Actual product weight, affects shipping costs
Shipping Mode:

Easy Ship: Amazon picks up and delivers, you store
FBA: Amazon stores and ships

Service Level:

Standard: Regular delivery timeline
Express: Faster delivery, higher fees

Product Size:

Standard: Normal sized items
Oversize: Larger items with special handling

Location:

Local: Within city delivery
National: Pan-India delivery

These factors combine to determine your total Amazon fees and potential profits.


## Current Features
- Interactive pricing calculator
- Fee structure visualization
- Detailed cost breakdown
- Static fee calculations

## Proposed API Extension

### Goals
- Create a backend API to manage fee structures
- Integration with the given spreadsheet data(See below)
- Dynamic fee calculation(From the api)

### Planned API Endpoints
```http
POST /api/v1/profitability-calculator
```

## Extending the Project

### Adding New Fee Structures

1. Access the fee structure spreadsheet at: https://docs.google.com/spreadsheets/d/1o_yM63Grl_QB6lpuXE3spbrMeCs-hIMXCVyghj8FmV0/edit?usp=sharing

2. Instead of using `data/fees.ts`, create an API that fetches the fee structure by using the data present in the spreadsheet.

3. Update the `feeCalculators.ts` file to use the new API endpoint for fetching fee structures.

4. Ensure that the new API endpoint is properly integrated into the project and tested for functionality.

5. Update the documentation to reflect the new API endpoint and its usage.

How to run

1. Clone the repository
2. Install dependencies: `npm install`
3. Run development server: `npm run dev`

## API Documentation

### Calculate Profitability
http
POST /api/v1/profitability-calculator
Content-Type: application/json

Response:
```
json
{
"breakdown": {
"referralFee": 10,
"weightHandlingFee": 10.0,
"closingFee": 5.0,
"pickAndPackFee": 20
},
"totalFees": 45,
"netEarnings": 200
}
```

## Scoring Mechanism

The submission will be evaluated based on:

1. Code Quality:
   - Code maintainability
   - Performance benchmarks
   - Error handling

2. Fee Calculation Accuracy:
   - Referral fee precision across product categories
   - Weight handling fee accuracy for different shipping modes
   - Closing fee calculations for various price ranges
   - Pick & pack fee correctness for FBA/non-FBA modes

3. Net Earnings Validation:
   - Edge case handling
   - Decimal precision handling
   - Currency conversion accuracy (if applicable)


## Note
1. The Front end code and logic given here is just for explanatory purposes
2. You are free to remove and write your own logic when implementing the api
3. Make sure that the code is well tested

How to run (after assingment)

1. Clone the repository
Frontend:
1. Install dependencies: `npm install`
2. Run development server: `npm run dev`

Backend:
1. cd .\backend\
2. node server.js

