const express = require("express");
const puppeteer = require("puppeteer");
const cors = require('cors');
const app = express();

require("dotenv").config();

// Use CORS middleware
app.use(cors());

function formatUpdatedAt(timestamp) {
  const date = new Date(timestamp);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear().toString();
  return `${hours}:${minutes} ${month}/${day}/${year}`;
}

app.get("/api/sjc", async (req, res) => {
	try {
		const browser = await puppeteer.launch();
		const page = await browser.newPage();
		await page.goto(process.env.SJC_URL);

		// Wait for the component to appear
		await page.waitForSelector("table");
		await page.waitForSelector(".float_left");
		await page.waitForSelector(".float_left");

		// Extract data from table rows
		const data = await page.evaluate(() => {
			const rows = Array.from(document.querySelectorAll("table tbody tr"));
			return rows.slice(1).map((row) => {
				const columns = Array.from(row.querySelectorAll("td"));
				return columns.reduce((acc, column, index) => {
					const value = column.textContent.trim().replace(/[\n\r]+/g, "");
					if (index === 1 || index === 2) {
						// Remove commas, divide by 10,000, and add commas for thousands separators
						acc[index === 1 ? "buy" : "sell"] = (parseFloat(value.replace(/,/g, "")) / 10000).toLocaleString();
					} else {
						acc["type"] = value;
					}
					return acc;
				}, {});
			});
		});

		// Remove the last item from the array
		data.pop();

		// Extract updatedAt from the specified class
		const updatedAt = await page.evaluate(() => {
			return document.querySelector(".w350.m5l.float_left.red_text.bg_white").textContent.trim();
		});

		const formatedData = {
			updatedAt: formatUpdatedAt(updatedAt),
			data,
		};

		await browser.close();
		res.json(formatedData);
	} catch (error) {
		console.error("Error scraping data:", error);
		res.status(500).send("Error scraping data");
	}
});

app.get("/api/doji", async (req, res) => {
	try {
		const browser = await puppeteer.launch();
		const page = await browser.newPage();
		await page.goto(process.env.DOJI_URL);

		// Wait for the second table to appear
		await page.waitForSelector("._table");

		// Extract data from the second table
		const data = await page.evaluate(() => {
			// Select the second table
			const secondTable = document.querySelectorAll("._table")[1];
			// Extract data from the second table
			const types = Array.from(secondTable.querySelectorAll("._taxonomy ._block")).map((block) => block.textContent.trim());
			const buyPrices = Array.from(secondTable.querySelectorAll("._buy ._block")).map((block) => block.textContent.trim());
			const sellPrices = Array.from(secondTable.querySelectorAll("._Sell ._block")).map((block) => block.textContent.trim());

			// Extract updatedAt from the specified class
			const updatedAt = secondTable.querySelector("._desc").textContent.trim().replace("Cập nhập lúc:", "").trim();

			const data = types.map((type, index) => ({
				type,
				buy: buyPrices[index],
				sell: sellPrices[index],
			}));

			data.pop();

			return {
        updatedAt,
				data,
			};
		});

		await browser.close();

		res.json(data);
	} catch (error) {
		console.error("Error scraping data:", error);
		res.status(500).send("Error scraping data");
	}
});

app.get("/api/pnj", async (req, res) => {
	try {
		const browser = await puppeteer.launch();
		const page = await browser.newPage();
		await page.goto(process.env.PNJ_URL);

		// Wait for the table to appear
		await page.waitForSelector(".bang-gia-vang-outer table");

		// Extract data from the second table
		const data = await page.evaluate(() => {
			const rows = Array.from(document.querySelectorAll(".bang-gia-vang-outer table tbody tr"));
			return rows.map((row) => {
				const columns = row.querySelectorAll("td");
				return {
					type: columns[0].textContent.trim(),
					buy: columns[1].querySelector("span").textContent.trim(),
					sell: columns[2].querySelector("span").textContent.trim(),
				};
			});
		});

		// Extract updatedAt from the specified element
		const updatedAt = await page.evaluate(() => {
			return document.getElementById("time-now").textContent.trim();
		});

		await browser.close();

		const formattedData = {
      updatedAt: formatUpdatedAt(updatedAt),
			data,
		};

		res.json(formattedData);
	} catch (error) {
		console.error("Error scraping data:", error);
		res.status(500).send("Error scraping data");
	}
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
	console.log(`Server listening on port ${PORT}`);
});
