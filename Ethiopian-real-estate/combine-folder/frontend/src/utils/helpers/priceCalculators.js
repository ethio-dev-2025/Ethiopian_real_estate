export const calculateMortgage = (price, downPaymentPercent = 20, interestRate = 12, years = 20) => {
  const loanAmount = price * (1 - downPaymentPercent / 100)
  const monthlyRate = interestRate / 100 / 12
  const numberOfPayments = years * 12
  
  const monthlyPayment = loanAmount * monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments) / (Math.pow(1 + monthlyRate, numberOfPayments) - 1)
  
  return {
    loanAmount,
    monthlyPayment: Math.round(monthlyPayment),
    totalPayment: Math.round(monthlyPayment * numberOfPayments),
    totalInterest: Math.round(monthlyPayment * numberOfPayments - loanAmount),
  }
}

export const calculateROI = (purchasePrice, monthlyRent, annualExpenses, appreciationRate = 5) => {
  const annualRent = monthlyRent * 12
  const netOperatingIncome = annualRent - annualExpenses
  const capRate = (netOperatingIncome / purchasePrice) * 100
  const cashOnCash = (netOperatingIncome / (purchasePrice * 0.2)) * 100
  const annualAppreciation = purchasePrice * (appreciationRate / 100)
  const totalReturn = netOperatingIncome + annualAppreciation
  const roi = (totalReturn / purchasePrice) * 100
  
  return {
    capRate: capRate.toFixed(2),
    cashOnCash: cashOnCash.toFixed(2),
    roi: roi.toFixed(2),
    annualReturn: Math.round(totalReturn),
  }
}

export const calculateRentalYield = (propertyPrice, monthlyRent, annualExpenses) => {
  const annualRent = monthlyRent * 12
  const netIncome = annualRent - annualExpenses
  const grossYield = (annualRent / propertyPrice) * 100
  const netYield = (netIncome / propertyPrice) * 100
  
  return {
    grossYield: grossYield.toFixed(2),
    netYield: netYield.toFixed(2),
  }
}

export const calculatePricePerSqft = (price, sqft) => {
  if (!sqft || sqft === 0) return 0
  return Math.round(price / sqft)
}

export const calculateEstimatedValue = (price, appreciationRate, years) => {
  return Math.round(price * Math.pow(1 + appreciationRate / 100, years))
}

export default {
  calculateMortgage,
  calculateROI,
  calculateRentalYield,
  calculatePricePerSqft,
  calculateEstimatedValue,
}
