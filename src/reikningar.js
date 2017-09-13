const axios = require("axios");

const BASE_URL = "http://opnirreikningar.is";

async function maxTimePeriod() {
  try {
    const { data } = await axios.get(`${BASE_URL}/rest/max_time_period`);

    return data;
  } catch (e) {
    console.error(e);
    throw e;
  }
}

let draw = 0;

async function getInvoices(fromDate, toDate, start, length) {
  try {
    const { data } = await axios.get(`${BASE_URL}/data_pagination_search`, {
      params: {
        vendor_id: "",
        type_id: "",
        org_id: "",
        timabil_fra: fromDate,
        timabil_til: toDate,
        draw: draw++,
        "columns[0][data]": "org_name",
        "columns[0][name]": "",
        "columns[0][searchable]": "true",
        "columns[0][orderable]": "true",
        "columns[0][search][value]": "",
        "columns[0][search][regex]": "false",
        "columns[1][data]": "check_date",
        "columns[1][name]": "",
        "columns[1][searchable]": "true",
        "columns[1][orderable]": "true",
        "columns[1][search][value]": "",
        "columns[1][search][regex]": "false",
        "columns[2][data]": "vendor_name",
        "columns[2][name]": "",
        "columns[2][searchable]": "true",
        "columns[2][orderable]": "true",
        "columns[2][search][value]": "",
        "columns[2][search][regex]": "false",
        "columns[3][data]": "invoice_amount",
        "columns[3][name]": "",
        "columns[3][searchable]": "true",
        "columns[3][orderable]": "true",
        "columns[3][search][value]": "",
        "columns[3][search][regex]": "false",
        "columns[4][data]": "check_amount",
        "columns[4][name]": "",
        "columns[4][searchable]": "true",
        "columns[4][orderable]": "true",
        "columns[4][search][value]": "",
        "columns[4][search][regex]": "false",
        "columns[5][data]": "",
        "columns[5][name]": "",
        "columns[5][searchable]": "true",
        "columns[5][orderable]": "true",
        "columns[5][search][value]": "",
        "columns[5][search][regex]": "false",
        "columns[6][data]": "6",
        "columns[6][name]": "",
        "columns[6][searchable]": "true",
        "columns[6][orderable]": "true",
        "columns[6][search][value]": "",
        "columns[6][search][regex]": "false",
        "order[0][column]": "1",
        "order[0][dir]": "desc",
        start: start + "",
        length: length + "",
        "search[value]": "",
        "search[regex]": "false"
      }
    });

    return data.data;
  } catch (e) {
    console.error(e);
    throw e;
  }
}

module.exports = {
  maxTimePeriod,
  getInvoices
};
