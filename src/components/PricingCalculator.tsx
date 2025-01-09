import React, { useState } from "react";
import { Calculator } from "lucide-react";

const categories = [
  "Automotive - Helmets & Riding Gloves",
  "Automotive - Tyres & Rims",
  "Automotive Vehicles",
  "Baby - Hardlines",
  "Baby - Strollers",
  "Baby - Diapers",
  "Books",
];

export default function PricingCalculator() {
  const [formData, setFormData] = useState({
    productCategory: categories[0],
    sellingPrice: 0,
    weight: 0.5,
    shippingMode: "EasyShip",
    serviceLevel: "Local",
  });

  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleCalculate = async () => {
    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const response = await fetch("http://localhost:3000/api/v1/profitability-calculator", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to calculate fees");
      }

      const data = await response.json();
      setResults(data);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "sellingPrice" || name === "weight" ? parseFloat(value) : value,
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="flex items-center gap-3 mb-8">
            <Calculator className="w-8 h-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">Amazon Pricing Calculator</h1>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Product Category</label>
                <select
                  name="productCategory"
                  value={formData.productCategory}
                  onChange={handleInputChange}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Selling Price (₹)</label>
                <input
                  type="number"
                  name="sellingPrice"
                  value={formData.sellingPrice}
                  onChange={handleInputChange}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Weight (kg)</label>
                <input
                  type="number"
                  name="weight"
                  value={formData.weight}
                  onChange={handleInputChange}
                  step="0.1"
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Shipping Mode</label>
                <select
                  name="shippingMode"
                  value={formData.shippingMode}
                  onChange={handleInputChange}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="EasyShip">Easy Ship</option>
                  <option value="FBA">FBA</option>
                  <option value="SelfShip">Self Ship</option>
                  <option value="FBA_Exception">FBA Exception</option>
                  <option value="SellerFlex">Seller Flex</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Service Level</label>
                <select
                  name="serviceLevel"
                  value={formData.serviceLevel}
                  onChange={handleInputChange}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="Local">Local</option>
                  <option value="Regional">Regional</option>
                  <option value="National">National</option>
                  <option value="IXD">IXD</option>
                </select>
              </div>

              <button
                onClick={handleCalculate}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
              >
                {loading ? "Calculating..." : "Calculate Fees"}
              </button>
            </div>

            {error && (
              <div className="text-red-600 text-sm mt-4">
                <p>{error}</p>
              </div>
            )}

            {results && (
              <div className="bg-gray-50 p-6 rounded-lg">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Fee Breakdown</h2>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Referral Fee:</span>
                    <span className="font-medium">₹{results.breakdown?.referralFee?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Weight Handling Fee:</span>
                    <span className="font-medium">₹{results.breakdown?.weightHandlingFee?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Closing Fee:</span>
                    <span className="font-medium">₹{results.breakdown?.closingFee?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Pick & Pack Fee:</span>
                    <span className="font-medium">₹{results.breakdown?.additionalFee?.toFixed(2)}</span>
                  </div>
                  <div className="h-px bg-gray-200 my-4"></div>
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Total Fees:</span>
                    <span className="text-blue-600">₹{results.totalFees?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Net Earnings:</span>
                    <span className="text-green-600">₹{results.netEarnings?.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
