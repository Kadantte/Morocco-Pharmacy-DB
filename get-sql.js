const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const https = require('https');

// Function to get data from a single page
const getDataFromPage = async (url) => {
  try {
    console.log(`Fetching data from: ${url}`);
    const response = await axios.get(url, { httpsAgent: new https.Agent({ rejectUnauthorized: false }) });
    const $ = cheerio.load(response.data);

    // Log the first 500 characters of the page for debugging
    console.log(response.data.substring(0, 500));

    const data = [];
    $('table.table tbody tr').each((index, element) => {
      const columns = $(element).find('td.text-left');
      const name = $(columns[0]).text().trim(); // Assuming the name is in the first td.text-left
      const city = $(columns[1]).text().trim(); // Assuming the city is in the second td.text-left

      // Log each entry found for debugging
      console.log(`Found pharmacy: Name - ${name}, City - ${city}`);
      data.push({ name, city });
    });

    console.log(`Fetched ${data.length} entries from page.`);
    return data;
  } catch (error) {
    console.error(`Error fetching data from ${url}:`, error);
    return [];
  }
};

// Loop through all pages and collect data
const collectData = async () => {
  const allData = [];
  const baseUrl = 'https://dmp.sante.gov.ma/basesdedonnes/pharmacies?page=';

  for (let pageNum = 1; pageNum <= 180; pageNum++) {
    const url = baseUrl + pageNum;
    const pageData = await getDataFromPage(url);
    allData.push(...pageData);
    console.log(`Processed page ${pageNum}, total entries so far: ${allData.length}`);
  }

  // Create SQL statements
  const createTableStatement = `
CREATE TABLE IF NOT EXISTS pharmacies (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  city VARCHAR(255) NOT NULL
);

`;

  const insertStatements = allData.map(entry => 
    `INSERT INTO pharmacies (name, city) VALUES ('${entry.name.replace(/'/g, "''")}', '${entry.city.replace(/'/g, "''")}');`
  ).join('\n');

  const sqlContent = createTableStatement + insertStatements;

  // Write data to SQL file
  fs.writeFileSync('pharmacies.sql', sqlContent);

  console.log('Data has been written to pharmacies.sql');
};

// Start the data collection process
collectData();
