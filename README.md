# Vietnamese Gold Price API

- This API provides endpoints for fetching gold prices from three different sources: SJC, DOJI, and PNJ.

## Usage

- To use this API, simply make GET requests to the desired endpoint:
  GET /api/sjc
  GET /api/doji
  GET /api/pnj

## Format

- **Response Format:**

```json
{
"updatedAt": "Timestamp of the last update",
"data": [
{
"type": "Type of gold",
"buy": "Buying price",
"sell": "Selling price"
},
...
]
}
```

# Notes

- This API scrapes data from the respective websites of SJC, DOJI, and PNJ, and therefore relies on their availability and accuracy of data.
- Please use the data responsibly and refer to the official websites for the most accurate and up-to-date information.
