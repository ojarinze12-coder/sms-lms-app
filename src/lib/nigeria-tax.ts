export interface TaxCalculationResult {
  grossIncome: number;
  annualGross: number;
  consolidatedRelief: number;
  taxableIncome: number;
  monthlyTax: number;
  annualTax: number;
  taxBrackets: TaxBracket[];
}

export interface TaxBracket {
  min: number;
  max: number;
  rate: number;
  tax: number;
}

const TAX_BRACKETS: TaxBracket[] = [
  { min: 0, max: 300000, rate: 7, tax: 0 },
  { min: 300000, max: 600000, rate: 11, tax: 0 },
  { min: 600000, max: 1100000, rate: 15, tax: 0 },
  { min: 1100000, max: 1600000, rate: 19, tax: 0 },
  { min: 1600000, max: 3200000, rate: 21, tax: 0 },
  { min: 3200000, max: Infinity, rate: 24, tax: 0 },
];

export const CONSOLIDATED_RELIEF = 200000;

export function calculateMonthlyPayroll(
  basicSalary: number,
  housingAllowance: number = 0,
  transportAllowance: number = 0,
  otherAllowances: number = 0,
  pensionRate: number = 8,
  includeNHF: boolean = true,
  nhfRate: number = 2.5
): {
  grossEarnings: number;
  totalDeductions: number;
  netPay: number;
  taxDetails: TaxCalculationResult;
  pensionDeduction: number;
  nhfDeduction: number;
} {
  const grossEarnings = basicSalary + housingAllowance + transportAllowance + otherAllowances;
  
  const pensionDeduction = Math.round((basicSalary * (pensionRate / 100)) * 100) / 100;
  
  const nhfDeduction = includeNHF 
    ? Math.round((basicSalary * (nhfRate / 100)) * 100) / 100 
    : 0;

  const taxDetails = calculatePAYETax(grossEarnings);

  const totalDeductions = taxDetails.monthlyTax + pensionDeduction + nhfDeduction;
  const netPay = grossEarnings - totalDeductions;

  return {
    grossEarnings: Math.round(grossEarnings * 100) / 100,
    totalDeductions: Math.round(totalDeductions * 100) / 100,
    netPay: Math.round(netPay * 100) / 100,
    taxDetails,
    pensionDeduction,
    nhfDeduction,
  };
}

export function calculatePAYETax(monthlyGross: number): TaxCalculationResult {
  const annualGross = monthlyGross * 12;
  
  const consolidatedRelief = CONSOLIDATED_RELIEF + (monthlyGross * 12 * 0.01);
  
  const taxableIncome = Math.max(0, annualGross - consolidatedRelief);
  
  let remainingIncome = taxableIncome;
  let totalAnnualTax = 0;
  const taxBrackets: TaxBracket[] = [];

  for (const bracket of TAX_BRACKETS) {
    if (remainingIncome <= 0) break;
    
    const bracketSize = bracket.max - bracket.min;
    const taxableInBracket = Math.min(remainingIncome, bracketSize);
    const taxInBracket = (taxableInBracket * bracket.rate) / 100;
    
    taxBrackets.push({
      min: bracket.min,
      max: bracket.max === Infinity ? taxableIncome : bracket.max,
      rate: bracket.rate,
      tax: Math.round(taxInBracket * 100) / 100,
    });
    
    totalAnnualTax += taxInBracket;
    remainingIncome -= taxableInBracket;
  }

  totalAnnualTax = Math.round(totalAnnualTax * 100) / 100;
  const monthlyTax = Math.round((totalAnnualTax / 12) * 100) / 100;

  return {
    grossIncome: monthlyGross,
    annualGross,
    consolidatedRelief: Math.round(consolidatedRelief * 100) / 100,
    taxableIncome: Math.round(taxableIncome * 100) / 100,
    monthlyTax,
    annualTax: totalAnnualTax,
    taxBrackets,
  };
}

export function getTaxRateDescription(): string {
  return `
Nigerian PAYE Tax Brackets (Annual):
- ₦0 - ₦300,000: 7%
- ₦300,001 - ₦600,000: 11%
- ₦600,001 - ₦1,100,000: 15%
- ₦1,100,001 - ₦1,600,000: 19%
- ₦1,600,001 - ₦3,200,000: 21%
- Above ₦3,200,000: 24%

Consolidated Relief: ₦200,000 + 1% of gross income
Pension Deduction: 8% of basic salary (mandatory)
NHF Deduction: 2.5% of basic salary (optional)
  `.trim();
}
