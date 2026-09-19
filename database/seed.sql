-- =============================================================================
-- AGRI CRAFT-AI — PostgreSQL Database Seed Data
-- Verified official schemes, agricultural loans, mandi prices, and demo farmer
-- =============================================================================

-- Clear existing data safely
TRUNCATE scheme_matches, government_schemes, loan_recommendations, loans, market_prices, crops, farmers RESTART IDENTITY CASCADE;

-- -----------------------------------------------------------------------------
-- 1. Seed Demo Farmers
-- -----------------------------------------------------------------------------
INSERT INTO farmers (id, name, phone, email, location, land_area, land_type)
VALUES
    (1, 'Murugan K', '9876543210', 'murugan.k@agricraft.demo', 'Thanjavur', 2.50, 'Alluvial'),
    (2, 'Lakshmi Raman', '9876543211', 'lakshmi.r@agricraft.demo', 'Coimbatore', 4.00, 'Red Loam'),
    (3, 'Senthil Nathan', '9876543212', 'senthil.n@agricraft.demo', 'Madurai', 1.80, 'Black Clay');

SELECT setval('farmers_id_seq', (SELECT MAX(id) FROM farmers));

-- -----------------------------------------------------------------------------
-- 2. Seed Registered Farmer Crops
-- -----------------------------------------------------------------------------
INSERT INTO crops (farmer_id, crop_name, season, area, sowing_date, expected_harvest_date)
VALUES
    (1, 'Paddy (Rice)', 'Kharif / Kuruvai', 2.50, '2026-06-15', '2026-10-25'),
    (2, 'Cotton', 'Kharif', 4.00, '2026-05-20', '2026-11-15'),
    (3, 'Tomato', 'Zaid / Summer', 1.80, '2026-07-01', '2026-09-30');

-- -----------------------------------------------------------------------------
-- 3. Seed Government Schemes
-- -----------------------------------------------------------------------------
INSERT INTO government_schemes (scheme_name, description, eligibility, benefits, required_documents, official_url, state)
VALUES
    (
        'PM-KISAN Samman Nidhi',
        'Direct income support to landholding farmer families across India to meet agriculture and domestic needs.',
        'All landholding farmer families with cultivable land. Excludes institutional landholders, income tax payers, and high-income professionals.',
        '₹6,000 per year directly transferred to bank account in 3 equal installments of ₹2,000 every four months via DBT.',
        'Aadhaar Card, Bank Account Passbook (Aadhaar/NPCI linked), Land Ownership Record (Patta / Chitta / RoR), Active Mobile Number',
        'https://pmkisan.gov.in',
        'All India'
    ),
    (
        'Pradhan Mantri Fasal Bima Yojana (PMFBY)',
        'Comprehensive agricultural crop loss insurance protecting farmers against non-preventable natural risks, pest attacks, and adverse weather.',
        'All farmers growing notified crops in notified areas, including sharecroppers and tenant farmers.',
        'Extremely low farmer premium: 1.5% for Rabi crops, 2.0% for Kharif crops, 5.0% for Annual Commercial/Horticultural crops. Balance subsidized by Govt.',
        'Aadhaar Card, Bank Passbook with IFSC, Land Patta or Registered Tenant Agreement, Sowing Certificate (Adangal from VAO)',
        'https://pmfby.gov.in',
        'All India'
    ),
    (
        'PM Krishi Sinchayee Yojana (Per Drop More Crop - Drip Subsidy)',
        'Promotes water conservation through micro-irrigation systems (drip and sprinkler) to maximize water-use efficiency and crop productivity.',
        'Farmers with verified cultivable agricultural land and an active assured water source (borewell, open well, or canal).',
        '100% subsidy for Small & Marginal farmers in Tamil Nadu; 75% financial assistance for Medium and Large category farmers.',
        'Aadhaar Card copy, Small/Marginal Farmer Certificate from Tahsildar/VAO, Land Patta / Chitta / FMB Sketch, Water & Electricity connection proof, Soil & Water test report',
        'https://pmksy.gov.in',
        'All India'
    ),
    (
        'Kalaignar All Village Integrated Agriculture Development Programme',
        'Flagship Tamil Nadu state initiative bringing overall agricultural development, water harvesting, and fallow land conversion to village panchayats.',
        'Farmers residing and farming in village panchayats selected under the state integrated village scheme.',
        'Free distribution of coconut saplings, vegetable seed minikits, 50% subsidy on sprayers/tarpaulins, and community farm pond desilting.',
        'Farmer Aadhaar Card, Smart Family Ration Card, Uzhavan Mobile App Registration ID, Land Patta/Chitta copy',
        'https://www.tn.gov.in/department/1',
        'Tamil Nadu'
    ),
    (
        'Sub-Mission on Agricultural Mechanization (SMAM)',
        'Financial assistance to promote farm mechanization, lower labor dependency, and increase precision in farming operations.',
        'Individual farmers, SHGs, and Farmer Producer Organizations (FPOs) who have not availed machinery subsidy in the past 5 years.',
        '40% to 50% capital subsidy on tractors, power tillers, rotavators, power weeders, and drone spray equipment.',
        'Aadhaar Card, Bank Account Details, Land Ownership Patta, Farmer Category Certificate (SC/ST/Women/Small/Marginal), Dealer Proforma Invoice',
        'https://agrimachinery.nic.in',
        'All India'
    );

-- -----------------------------------------------------------------------------
-- 4. Seed Verified Agricultural Loans
-- -----------------------------------------------------------------------------
INSERT INTO loans (loan_name, provider, interest_rate, maximum_amount, tenure, eligibility, application_url)
VALUES
    (
        'Kisan Credit Card (KCC) Scheme',
        'Nationalized Banks / RRBs / Cooperative Banks (NABARD Supported)',
        '4.0% p.a. (Effective after 3% prompt repayment incentive; 7% standard)',
        'Up to ₹3,00,000 (Collateral-free up to ₹1,60,000)',
        '5 Years (Annual renewal upon seasonal harvest repayment)',
        'All farmers, individual/joint cultivators, tenant farmers, oral lessees, SHGs cultivating verified agricultural land',
        'https://pib.gov.in/PressReleasePage.aspx?PRID=1908241'
    ),
    (
        'Agricultural Gold Loan',
        'State Bank of India / Canara Bank / Public Sector Banks',
        '7.0% - 7.5% p.a. (Concessional priority sector agri lending rate)',
        'Up to ₹25,00,000 (Based on gold appraiser valuation, up to 75% LTV)',
        '12 Months bullet repayment or multi-year crop cycle',
        'Farmers with documented proof of agricultural activity, owning gold jewelry to pledge',
        'https://sbi.co.in/web/agri-rural/agriculture-banking/agri-gold-loan'
    ),
    (
        'Farm Mechanization / Tractor Loan',
        'NABARD / Commercial Banks / HDFC Agri',
        '8.5% - 9.75% p.a.',
        'Up to 85% - 90% of Tractor or Equipment on-road quotation',
        '5 to 7 Years with structured half-yearly/annual harvest EMIs',
        'Farmers owning minimum 2 acres of irrigated cultivable land with demonstrated repayment capacity',
        'https://www.nabard.org'
    ),
    (
        'Pradhan Mantri MUDRA Yojana (Agri-Allied)',
        'Public Sector Banks / Regional Rural Banks / Microfinance Institutions',
        '8.0% - 9.5% p.a. (Collateral-free micro enterprise credit)',
        'Shishu (up to ₹50,000), Kishore (₹50k - ₹5L), Tarun (₹5L - ₹10L)',
        '3 to 5 Years',
        'Rural agri-entrepreneurs and farmers engaged in dairy, poultry, goat rearing, bee-keeping, and food processing',
        'https://www.mudra.org.in'
    );

-- -----------------------------------------------------------------------------
-- 5. Seed Mandi Market Prices
-- -----------------------------------------------------------------------------
INSERT INTO market_prices (crop_name, market_name, location, price, unit, price_date, source)
VALUES
    ('Paddy', 'Thanjavur Regulated Market', 'Thanjavur', 2320.00, 'Quintal', '2026-09-19', 'Government of India / Agmarknet'),
    ('Paddy', 'Thiruvarur Regulated Market', 'Thiruvarur', 2350.00, 'Quintal', '2026-09-19', 'Government of India / Agmarknet'),
    ('Paddy', 'Nagapattinam Market', 'Nagapattinam', 2420.00, 'Quintal', '2026-09-19', 'Government of India / Agmarknet'),
    ('Cotton', 'Coimbatore Mandi', 'Coimbatore', 7450.00, 'Quintal', '2026-09-19', 'e-NAM Agricultural Portal'),
    ('Tomato', 'Madurai Central Market', 'Madurai', 2600.00, 'Quintal', '2026-09-19', 'e-NAM Agricultural Portal'),
    ('Turmeric', 'Erode Regulated Market (Semmampalayam)', 'Erode', 16800.00, 'Quintal', '2026-09-19', 'Agmarknet / Spices Board'),
    ('Groundnut', 'Salem Market', 'Salem', 6950.00, 'Quintal', '2026-09-19', 'Government of India / Agmarknet'),
    ('Maize', 'Dharmapuri Mandi', 'Dharmapuri', 2240.00, 'Quintal', '2026-09-19', 'Government of India / Agmarknet'),
    ('Banana', 'Tirunelveli Wholesale Market', 'Tirunelveli', 3200.00, 'Quintal', '2026-09-19', 'State Agricultural Marketing Board'),
    ('Sugarcane', 'Cuddalore Regulated Market', 'Cuddalore', 3150.00, 'Tonne', '2026-09-19', 'FRP Procurement Center');

-- -----------------------------------------------------------------------------
-- 6. Seed Initial Demo Loan Recommendation & Scheme Matches
-- -----------------------------------------------------------------------------
INSERT INTO loan_recommendations (
    farmer_id, cibil_score, existing_loan_status, repayment_capacity,
    land_crop_score, location_score, total_match_score, recommendation_reason
) VALUES (
    1, 26.00, 24.00, 18.00, 14.00, 9.00, 91.00,
    'Strong credit profile (CIBIL ~720), on-time historical repayment, healthy debt-to-income margin (0.24), and 2.5 acres irrigated land in Thanjavur. Best match for 4% Kisan Credit Card (KCC) scheme. Informational score only; bank credit policy applies.'
);

INSERT INTO scheme_matches (farmer_id, scheme_id, eligibility_status, match_reason)
VALUES
    (1, 1, 'ELIGIBLE', 'Landholding farmer with 2.5 acres meets PM-KISAN landholder income support criteria.'),
    (1, 2, 'ELIGIBLE', 'Paddy cultivation in Thanjavur qualifies under notified Kharif crop insurance with 2% premium subvention.'),
    (1, 3, 'ELIGIBLE', 'Small farmer category (< 5 acres) qualifies for 100% drip irrigation subsidy under Tamil Nadu PMKSY.');
