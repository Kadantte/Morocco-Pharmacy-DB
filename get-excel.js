const axios = require('axios');
const cheerio = require('cheerio');
const xlsx = require('xlsx');
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
      data.push({ Name: name, City: city });
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

  // Write data to Excel
  const worksheet = xlsx.utils.json_to_sheet(allData);
  const workbook = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(workbook, worksheet, 'Pharmacies');
  xlsx.writeFile(workbook, 'pharmacies.xlsx');

  console.log('Data has been written to pharmacies.xlsx');
};

// Start the data collection process
collectData();