chrome.runtime.onMessage.addListener(gotMessage);

async function gotMessage(message, sender, sendResponse) {
  if (message.text === "go") {
    console.log("Earth Activated");
    console.log(
      "Made by shubhamcodex - https://github.com/imshubhamcodex/Pluto---Chain-data-Analytics"
    );

    let current_url_arr = window.location.toString().split("/");
    let equity_name = current_url_arr[current_url_arr.length - 3];

    let search_api_url = "https://www.screener.in/api/company/search/?q=";
    let search_url = search_api_url + encodeURIComponent(equity_name);
    let equity_id = "00";
    let quarterly_price_data = {};

    await fetch(search_url)
      .then(response => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.json();
      })
      .then(data => {
        equity_id = data[0].id;
      })
      .catch(error => {
        console.error("Error during Search API request:", error);
      });

    console.log(equity_id);

    let price_url =
      "https://www.screener.in/api/company/" +
      equity_id +
      "/chart/?q=Price-DMA50-DMA200-Volume&days=10000&consolidated=true";

    await fetch(price_url)
      .then(response => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.json();
      })
      .then(data => {
        data.datasets[0].values.forEach(entry => {
          const [year, month, day] = entry[0].split("-");
          const quarter = Math.ceil(month / 3);
          const key = `${year}-Q${quarter}${quarter == 1
            ? "-Mar"
            : quarter == 2 ? "-Jun" : quarter == 3 ? "-Sep" : "-Dec"}`;

          if (!quarterly_price_data[key]) {
            quarterly_price_data[key] = [];
          }
          quarterly_price_data[key].push(parseFloat(entry[1])); // Convert the value to a number if needed
        });
      })
      .catch(error => {
        console.error("Error during Price API request:", error);
      });

    console.log(quarterly_price_data);

    let price_keys = Object.keys(quarterly_price_data);
    let numberOfKeys = price_keys.length;

    console.log("Lenght of price: ", numberOfKeys);

    let [EPSQ, EPSQH] = getEPSQuaterly();
    let [EPSY, EPSYH] = getEPSYearly();

    let [ROEQ, ROEQH] = getROEQuaterly();
    let [ROEY, ROEYH] = getROEYearly();

    let [PERQ, PERQH] = getPERatioQuaterly(
      EPSQ,
      EPSQH,
      price_keys,
      quarterly_price_data
    );

    let [PERY, PERYH] = getPERatioYearly(
      EPSY,
      EPSYH,
      price_keys,
      quarterly_price_data
    );

    console.log([PERY, PERYH]);
  }
}

function getEPSQuaterly() {
  let raw_table = document.getElementsByClassName("data-table")[1];

  let table_head_text = raw_table.childNodes[1].innerText;
  table_head_text = table_head_text.replace(/[\n]/g, "");
  table_head_text = table_head_text.split("\t");
  table_head_text.shift();
  let table_body_text = raw_table.childNodes[3].childNodes[21].innerText.split(
    "\t"
  );
  table_body_text.shift();

  // console.log(table_head_text);
  // console.log(table_body_text);

  return [table_body_text, table_head_text];
}

function getEPSYearly() {
  let raw_table = document.getElementsByClassName("data-table")[2];

  let table_head_text = raw_table.childNodes[1].innerText;
  table_head_text = table_head_text.replace(/[\n]/g, "");
  table_head_text = table_head_text.split("\t");
  table_head_text.shift();
  let table_body_text = raw_table.childNodes[3].childNodes[21].innerText.split(
    "\t"
  );
  table_body_text.shift();
  if (table_head_text[table_head_text.length - 1] == "TTM") {
    table_head_text.pop();
    table_body_text.pop();
  }

  // console.log(table_head_text);
  // console.log(table_body_text);

  return [table_body_text, table_head_text];
}

function getROEQuaterly() {
  let income = getIncomeQuaretly();
  let income_header = getIncomeHeaderQuaretly();
  // console.log(income_header);
  // console.log(income);

  let assets_and_liability = getAssetsAndLib();
  let assets_and_liability_header = getAssetsAndLibHeader();
  // console.log(assets_and_liability_header);
  // console.log(assets_and_liability);

  let ROE_data = [];

  for (let i = 0; i < income_header.length; i++) {
    header_matched = false;
    for (let j = 0; j < assets_and_liability_header.length; j++) {
      if (income_header[i] == assets_and_liability_header[j]) {
        let ratio =
          Number(income[i].replace(/,/g, "")) * 100 / assets_and_liability[j];
        ROE_data.push(ratio.toFixed(2));
        header_matched = true;
        break;
      }

      let income_yr = income_header[i].split(" ")[1];
      let asset_and_lib_yr = assets_and_liability_header[j].split(" ")[1];

      if (income_yr == asset_and_lib_yr) {
        matched_year_index = j;
      }
    }

    if (!header_matched) {
      let ratio =
        Number(income[i].replace(/,/g, "")) *
        100 /
        assets_and_liability[matched_year_index];
      ROE_data.push(ratio.toFixed(2));
    }
  }

  // console.log(ROE_data);
  return [ROE_data, income_header];
}

function getIncomeQuaretly() {
  let raw_table = document.getElementsByClassName("data-table")[1];
  let table_body_text = raw_table.childNodes[3].childNodes[9].innerText.split(
    "\t"
  );
  table_body_text.shift();

  return table_body_text;
}

function getIncomeHeaderQuaretly() {
  let raw_table = document.getElementsByClassName("data-table")[1];
  let table_head_text = raw_table.childNodes[1].innerText;
  table_head_text = table_head_text.replace(/[\n]/g, "");
  table_head_text = table_head_text.split("\t");
  table_head_text.shift();
  return table_head_text;
}

function getAssetsAndLib() {
  let raw_table = document.getElementsByClassName("data-table")[3];
  let lib = raw_table.childNodes[3].childNodes[7].innerText.split("\t");
  lib.shift();
  let assets = raw_table.childNodes[3].childNodes[17].innerText.split("\t");
  assets.shift();

  // console.log(lib);
  // console.log(assets);

  let asset_and_lib = [];

  assets.forEach((ele, i) => {
    asset_and_lib.push(
      Number(ele.replace(/,/g, "")) - Number(lib[i].replace(/,/g, ""))
    );
  });

  return asset_and_lib;
}

function getAssetsAndLibHeader() {
  let raw_table = document.getElementsByClassName("data-table")[3];
  let table_head_text = raw_table.childNodes[1].innerText;
  table_head_text = table_head_text.replace(/[\n]/g, "");
  table_head_text = table_head_text.split("\t");
  table_head_text.shift();
  return table_head_text;
}

function getROEYearly() {
  let [income_header, isTTM] = getIncomeHeaderYearly();
  let income = getIncomeYearly(isTTM);
  // console.log(income_header);
  // console.log(income);

  let assets_and_liability = getAssetsAndLib();
  let assets_and_liability_header = getAssetsAndLibHeader();
  // console.log(assets_and_liability_header);
  // console.log(assets_and_liability);

  let ROE_data = [];

  for (let i = 0; i < income_header.length; i++) {
    for (let j = 0; j < assets_and_liability_header.length; j++) {
      if (income_header[i] == assets_and_liability_header[j]) {
        let ratio =
          Number(income[i].replace(/,/g, "")) * 100 / assets_and_liability[j];
        ROE_data.push(ratio.toFixed(2));
        break;
      }
    }
  }

  // console.log(ROE_data);
  return [ROE_data, income_header];
}

function getIncomeHeaderYearly() {
  let raw_table = document.getElementsByClassName("data-table")[2];

  let table_head_text = raw_table.childNodes[1].innerText;
  table_head_text = table_head_text.replace(/[\n]/g, "");
  table_head_text = table_head_text.split("\t");
  table_head_text.shift();

  let isTTM = false;
  if (table_head_text[table_head_text.length - 1] == "TTM") {
    isTTM = true;
    table_head_text.pop();
  }

  return [table_head_text, isTTM];
}

function getIncomeYearly(isTTM) {
  let raw_table = document.getElementsByClassName("data-table")[2];
  let table_body_text = raw_table.childNodes[3].childNodes[9].innerText.split(
    "\t"
  );
  table_body_text.shift();
  if (isTTM) {
    table_body_text.pop();
  }

  return table_body_text;
}

function getPERatioQuaterly(EPSQ, EPSQH, price_keys, quarterly_price_data) {
  let PERatio = [];

  EPSQH.forEach((head, i) => {
    price_keys.forEach(key => {
      let year = key.split("-")[0];
      let mon = key.split("-")[2];
      let h_year = head.split(" ")[1];
      let h_mon = head.split(" ")[0];

      if (year == h_year && mon == h_mon) {
        let esp = Number(EPSQ[i].replace(/,/g, ""));

        let price = quarterly_price_data[key];
        let last_traded_price = price[price.length - 1];

        let ratio = last_traded_price / esp;

        PERatio.push(ratio);
      }
    });
  });

  return [[PERatio], [EPSQH]];
}

function getPERatioYearly(EPSQ, EPSQH, price_keys, quarterly_price_data) {
  return getPERatioQuaterly(EPSQ, EPSQH, price_keys, quarterly_price_data);
}
