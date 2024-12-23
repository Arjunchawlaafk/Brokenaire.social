const express = require('express');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Your API key for NewsData.io
const API_KEY = 'pub_56585245ec35367f6ff2cbbb58060ffe8f1e6';
const BASE_URL = 'https://newsdata.io/api/1/news';

// The query parameters for fetching negative business or finance news
const query = 'scam OR scandal OR fraud OR "stock all time low" OR "market crash" OR "business loss" OR "financial crisis" OR "bankruptcy" OR "Ponzi scheme" OR "mismanagement" OR "insider trading" OR "accounting fraud" OR "investment bubble" OR "liquidity crisis" OR "corporate scandal" OR "market manipulation" OR "Ponzi fraud" OR "ethical breach" OR "fraudulent scheme" OR "illegal trading" OR "unregulated market" OR "financial misreporting"';

// Initialize Express app
const app = express();
const port = 10000;

// Serve static files (like CSS, JS, and images) from the root directory
app.use(express.static(path.join(__dirname)));

// Function to fetch news articles with pagination support
const fetchNews = async (page = null) => {
    try {
        const params = {
            q: query,
            apiKey: API_KEY,
            language: 'en',
            category: 'business',
        };

        // Add page parameter if available
        if (page) {
            params.page = page;
        }

        const response = await axios.get(BASE_URL, { params });
        return response.data || {};
    } catch (error) {
        console.error('Error fetching news:', error.response?.data || error.message);
        return {};
    }
};

// Function to add a delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const fetchMultipleNewsBatches = async (totalArticles = 100) => {
    const allArticles = [];
    let currentPage = null;

    // Read existing articles from newsdata.json
    let oldArticles = [];
    if (fs.existsSync('newsdata.json')) {
        const oldData = JSON.parse(fs.readFileSync('newsdata.json', 'utf-8'));
        oldArticles = Object.values(oldData).flat(); // Flatten pages into a single array
    }

    while (allArticles.length < totalArticles) {
        const newsData = await fetchNews(currentPage);

        // Check if the results are valid
        if (!newsData.results || newsData.results.length === 0) {
            console.log('No more articles available.');
            break;
        }

        console.log(`Fetched ${newsData.results.length} articles in this batch.`);

        // Append new articles to the list
        allArticles.push(...newsData.results);

        // Limit to the required number of articles
        if (allArticles.length >= totalArticles) {
            allArticles.length = totalArticles;
        }

        // Update the current page
        currentPage = newsData.nextPage || null;

        // If no next page is available, stop fetching
        if (!currentPage) {
            console.log('No more pages available.');
            break;
        }

        console.log(`Fetched ${allArticles.length} articles so far...`);

        // Delay before the next API call to avoid rate limits
        await delay(2000);
    }

    console.log(`Total new articles fetched: ${allArticles.length}`);

    // Process and filter unique articles
    const uniqueTitles = new Set();
    const processedNewArticles = allArticles.map((item, index) => ({
        serial: index + 1,
        title: item.title,
        url: item.link,
        date: item.pubDate,
        sentiment: item.sentiment || 'N/A',
        source: item.source_id,
        source_name: item.source_name || 'Unknown',
        content: item.content || 'Content not available',
        description: item.description || 'Description not available',
        image_url: item.image_url || 'Image not available',
        duplicate: item.duplicate || false,
    })).filter(article => {
        if (uniqueTitles.has(article.title)) return false;
        uniqueTitles.add(article.title);
        return true;
    });

    // Supplement with older articles if needed
    const combinedArticles = [...processedNewArticles];
    for (const article of oldArticles) {
        if (combinedArticles.length >= totalArticles) break;
        if (!uniqueTitles.has(article.title)) {
            combinedArticles.push(article);
            uniqueTitles.add(article.title);
        }
    }

    console.log(`Total combined articles: ${combinedArticles.length}`);

    // Split articles into pages of 20
    const pageSize = 20;
    const pagesData = {};
    const totalPages = Math.ceil(combinedArticles.length / pageSize);

    for (let i = 0; i < totalPages; i++) {
        pagesData[`page${i + 1}`] = combinedArticles.slice(i * pageSize, (i + 1) * pageSize);
    }

    console.log(`Pages created: ${Object.keys(pagesData).length}`);

    // Save to JSON file
    fs.writeFileSync('newsdata.json', JSON.stringify(pagesData, null, 2), 'utf-8');
    console.log('Data saved to newsdata.json');
};



// Immediately fetch news when the server starts
fetchMultipleNewsBatches(100);

// Fetch articles every 3 hours (10800000 ms)
setInterval(() => {
    fetchMultipleNewsBatches(100);
}, 25200000); // 5 hours in milliseconds

// Serve other static HTML pages
app.get('/Home', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/Contact', (req, res) => {
    res.sendFile(path.join(__dirname, 'contact.html'));
});

app.get('/About-us', (req, res) => {
    res.sendFile(path.join(__dirname, 'about.html'));
});

app.get('/Privacy-Policy', (req, res) => {
    res.sendFile(path.join(__dirname, 'privacypolicy.html'));
});

app.get('/Terms-and-Conditions', (req, res) => {
    res.sendFile(path.join(__dirname, 'termsandconditions.html'));
});

app.get('/page-2', (req, res) => {
    res.sendFile(path.join(__dirname, 'page2.html'));
});

app.get('/page-3', (req, res) => {
    res.sendFile(path.join(__dirname, 'page3.html'));
});

app.get('/page-4', (req, res) => {
    res.sendFile(path.join(__dirname, 'page4.html'));
});

app.get('/page-5', (req, res) => {
    res.sendFile(path.join(__dirname, 'page5.html'));
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).send('OK');
});
