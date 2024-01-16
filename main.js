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

    // console.log(equity_id);

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

    // console.log(quarterly_price_data);
    let price_keys = Object.keys(quarterly_price_data);

    let [EPSQ, EPSQH] = getEPSQuaterly();
    let [EPSY, EPSYH] = getEPSYearly();

    let [ROEQ, ROEQH] = getROEQuaterly();
    let [ROEY, ROEYH] = getROEYearly();

    let [SHOLQ, SHOLQH] = getShareHoldingQuaterly();
    let [SHOLY, SHOLYH] = getShareHoldingYearly();

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

    let [DERY, DERYH] = getDERatioYearly(EPSY, EPSYH);

    let [CASHFY, CASHFYH] = getCashFlowYearly();

    let [ROCEY, ROCEYH] = getROCEYearly();

    let parent = document.getElementsByClassName("card card-large")[0];

    parent.innerHTML += `
    <br />
    <br />
    <canvas style="height:500px; margin-left:8%;"  id="chart-quaterly"> </canvas>
    <br />
    <br />
    <canvas style="height:500px; margin-left:8%;"  id="chart-yearly"> </canvas>
    `;

    let spot_scaled_price = getSpotScaledPrice(
      quarterly_price_data,
      EPSQH,
      price_keys,
      50
    );
    let xCord = EPSQH;

    data = {
      labels: xCord,
      datasets: [
        {
          label: "Spot Price trend",
          backgroundColor: "rgba(0,0,0,0.2)",
          borderColor: "rgb(0, 0, 0)",
          data: spot_scaled_price,
          tension: 0.3
        },
        {
          label: "Earning per Share (EPS)",
          backgroundColor: "rgba(255,0,0,0.2)",
          borderColor: "rgb(255, 99, 132)",
          data: EPSQ,
          tension: 0.3
        },
        {
          label: "Return on Equity (ROE)",
          backgroundColor: "rgba(0,255,0,0.2)",
          borderColor: "rgba(0,255,0,0.4)",
          data: ROEQ,
          tension: 0.3
        },
        {
          label: "Price to Earn Ratio (P/E Ratio)",
          backgroundColor: "rgba(0,0,255,0.2)",
          borderColor: "rgba(0,0,255,0.4)",
          data: PERQ,
          tension: 0.3
        },
        {
          label: "Share Holding (FII + DII + Promoters)",
          backgroundColor: "rgba(75, 192, 192, 0.8)",
          borderColor: "rgba(75, 192, 192, 0.7)",
          data: [0, ...SHOLQ],
          tension: 0.3
        }
      ]
    };
    config = {
      type: "line",
      data,
      options: {
        responsive: false,
        plugins: {
          legend: {
            position: "top",
            align: "start",
            labels: {
              padding: 10
            }
          }
        },
        maintainAspectRatio: false
      }
    };

    new Chart(document.getElementById("chart-quaterly"), config);

    spot_scaled_price = getSpotScaledPrice(
      quarterly_price_data,
      EPSYH,
      price_keys,
      400
    );

    xCord = EPSYH;
    data = {
      labels: xCord,
      datasets: [
        {
          label: "Spot Price trend",
          backgroundColor: "rgba(0,0,0,0.2)",
          borderColor: "rgb(0, 0, 0)",
          data: spot_scaled_price,
          tension: 0.3
        },
        {
          label: "Earning per Share (EPS)",
          backgroundColor: "rgba(255,0,0,0.2)",
          borderColor: "rgb(255, 99, 132)",
          data: EPSY,
          tension: 0.3
        },
        {
          label: "Return on Equity (ROE)",
          backgroundColor: "rgba(0,255,0,0.2)",
          borderColor: "rgba(0,255,0,0.4)",
          data: ROEY,
          tension: 0.3
        },
        {
          label: "Price to Earn Ratio (P/E Ratio)",
          backgroundColor: "rgba(0,0,255,0.2)",
          borderColor: "rgba(0,0,255,0.4)",
          data: PERY,
          tension: 0.3
        },
        {
          label: "Debt to Earn Ratio (D/E Ratio)",
          backgroundColor: "rgba(153, 102, 255, 0.8)",
          borderColor: "rgba(153, 102, 255, 0.8)",
          data: DERY,
          tension: 0.3
        },
        {
          label: "Cash Flow",
          backgroundColor: "rgba(201, 203, 207, 1)",
          borderColor: "rgba(201, 203, 207, 1)",
          data: CASHFY,
          tension: 0.3
        },
        {
          label: "Return on Capital Employed (ROCE)",
          backgroundColor: "rgba(54, 162, 235, 0.8)",
          borderColor: "rgba(54, 162, 235, 0.8)",
          data: ROCEY,
          tension: 0.3
        },
        {
          label: "Share Holding (FII + DII + Promoters)",
          backgroundColor: "rgba(75, 192, 192, 0.8)",
          borderColor: "rgba(75, 192, 192, 0.7)",
          data: [0, 0, 0, 0, ...SHOLY],
          tension: 0.3
        }
      ]
    };
    config = {
      type: "line",
      data,
      options: {
        responsive: false,
        plugins: {
          legend: {
            position: "top",
            align: "start",
            labels: {
              padding: 10
            }
          }
        },
        maintainAspectRatio: false
      }
    };

    new Chart(document.getElementById("chart-yearly"), config);
  }
}

function scaleValue(value, oldMin, oldMax, newMin, newMax) {
  return (value - oldMin) * (newMax - newMin) / (oldMax - oldMin) + newMin;
}

function getSpotScaledPrice(quarterly_price_data, EPSQH, price_keys, max) {
  let spot_price_quaterly = [];

  EPSQH.forEach(head => {
    price_keys.forEach(key => {
      let year = key.split("-")[0];
      let mon = key.split("-")[2];
      let h_year = head.split(" ")[1];
      let h_mon = head.split(" ")[0];

      if (year == h_year && mon == h_mon) {
        let price = quarterly_price_data[key];
        let last_traded_price = price[0];
        spot_price_quaterly.push(last_traded_price);
      }
    });
  });

  // console.log(spot_price_quaterly);

  let spot_dupp = [...spot_price_quaterly];

  spot_dupp.sort((a, b) => a - b);
  let min_spot_price = spot_dupp[0];
  let max_spot_price = spot_dupp[spot_dupp.length - 1];

  let spot_price_scaled = [];
  spot_price_quaterly.forEach(ele => {
    let scaled_value = scaleValue(ele, min_spot_price, max_spot_price, 0, max);
    spot_price_scaled.push(scaled_value.toFixed(2));
  });

  // console.log(spot_price_scaled);

  return spot_price_scaled;
}

function getEPSQuaterly() {
  let raw_table = document.getElementsByClassName("data-table")[1];

  let table_head_text = raw_table.childNodes[1].innerText;
  table_head_text = table_head_text.replace(/[\n]/g, "");
  table_head_text = table_head_text.split("\t");
  table_head_text.shift();

  let table_body_text = raw_table.childNodes[3].children[10].innerText.split(
    "\t"
  );
  table_body_text.shift();

  // console.log(table_head_text);
  // console.log(table_body_text);

  let EPS_scaled = [];
  if (table_body_text[table_body_text.length - 1] < 15) {
    table_body_text.forEach(ele => {
      EPS_scaled.push(Number(ele) + 20);
    });

    return [EPS_scaled, table_head_text];
  }

  return [table_body_text, table_head_text];
}

function getEPSYearly() {
  let raw_table = document.getElementsByClassName("data-table")[2];

  let table_head_text = raw_table.childNodes[1].innerText;
  table_head_text = table_head_text.replace(/[\n]/g, "");
  table_head_text = table_head_text.split("\t");
  table_head_text.shift();
  if (raw_table.childNodes[3].childNodes.length < 22) return [[], []];

  let table_body_text = raw_table.childNodes[3].children[10].innerText.split(
    "\t"
  );
  table_body_text.shift();
  if (table_head_text[table_head_text.length - 1] == "TTM") {
    table_head_text.pop();
    table_body_text.pop();
  }

  // console.log(table_head_text);
  // console.log(table_body_text);

  let scaled_EPS = [];
  table_body_text.forEach(ele => {
    scaled_EPS.push(2 * ele);
  });

  return [scaled_EPS, table_head_text];
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
  let table_body_text = raw_table.childNodes[3].children[4].innerText.split(
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
        let esp = Number(EPSQ[i]);

        let price = quarterly_price_data[key];
        let last_traded_price = price[0];

        let ratio = last_traded_price / (2 * esp);

        PERatio.push(ratio);
      }
    });
  });

  return [PERatio, EPSQH];
}

function getPERatioYearly(EPSY, EPSYH, price_keys, quarterly_price_data) {
  let [PERatio, EPSYHDup] = getPERatioQuaterly(
    EPSY,
    EPSYH,
    price_keys,
    quarterly_price_data
  );
  let PERatio_scaled = [];
  PERatio.forEach(ele => {
    PERatio_scaled.push(ele * 20);
  });

  return [PERatio_scaled, EPSYH];
}

function getDERatioYearly(EPSY, EPSYH) {
  let raw_table = document.getElementsByClassName("data-table")[5];

  let table_head_text = raw_table.childNodes[1].innerText;
  table_head_text = table_head_text.replace(/[\n]/g, "");
  table_head_text = table_head_text.split("\t");
  table_head_text.shift();

  let table_body_text = raw_table.childNodes[3].children[0].innerText.split(
    "\t"
  );
  table_body_text.shift();

  let isTTM = false;
  if (table_head_text[table_head_text.length - 1] == "TTM") {
    isTTM = true;
    table_head_text.pop();
    table_body_text.pop();
  }

  let DERatio = [];

  table_head_text.forEach((head, i) => {
    EPSYH.forEach((ele, j) => {
      if (ele == head) {
        let ratio =
          Number(table_body_text[i].replace(/[\n]/g, "")) / Number(EPSY[j]);

        DERatio.push(100 * ratio);
      }
    });
  });

  return [DERatio, table_head_text];
}

function getCashFlowYearly() {
  let raw_table = document.getElementsByClassName("data-table")[4];

  let table_head_text = raw_table.childNodes[1].innerText;
  table_head_text = table_head_text.replace(/[\n]/g, "");
  table_head_text = table_head_text.split("\t");
  table_head_text.shift();

  let table_body_text = raw_table.childNodes[3].children[3].innerText.split(
    "\t"
  );
  table_body_text.shift();

  let isTTM = false;
  if (table_head_text[table_head_text.length - 1] == "TTM") {
    isTTM = true;
    table_head_text.pop();
    table_body_text.pop();
  }

  let cashflow = [];
  table_body_text.forEach(ele => {
    let cash = Number(ele.replace(/,/g, "")) / 100;
    cashflow.push(cash);
  });

  return [cashflow, table_head_text];
}

function getROCEYearly() {
  let raw_table = document.getElementsByClassName("data-table")[5];
  let table_head_text = raw_table.childNodes[1].innerText;
  table_head_text = table_head_text.replace(/[\n]/g, "");
  table_head_text = table_head_text.split("\t");
  table_head_text.shift();

  let table_body_text = raw_table.childNodes[3].children[5].innerText.split(
    "\t"
  );
  table_body_text.shift();

  let isTTM = false;
  if (table_head_text[table_head_text.length - 1] == "TTM") {
    isTTM = true;
    table_head_text.pop();
    table_body_text.pop();
  }

  let ROCE = [];

  table_body_text.forEach(ele => {
    let ratio = 6 * Number(ele.replace(/[, %]/g, ""));
    ROCE.push(ratio);
  });

  return [ROCE, table_head_text];
}

function getShareHoldingQuaterly() {
  let raw_table = document.getElementsByClassName("data-table")[6];

  let table_head_text = raw_table.childNodes[1].innerText;
  table_head_text = table_head_text.replace(/[\n]/g, "");
  table_head_text = table_head_text.split("\t");
  table_head_text.shift();

  let table_body_text = raw_table.childNodes[3].children[
    raw_table.childNodes[3].children.length - 1
  ].innerText.split("\t");
  table_body_text.shift();

  let isTTM = false;
  if (table_head_text[table_head_text.length - 1] == "TTM") {
    isTTM = true;
    table_head_text.pop();
    table_body_text.pop();
  }

  let SHOL = [];

  table_body_text.forEach(ele => {
    let ratio = Number(ele.replace(/,/g, "")) / 100000;
    SHOL.push(ratio.toFixed(3));
  });

  return [SHOL, table_head_text];
}

function getShareHoldingYearly() {
  document
    .getElementsByClassName("active")[3]
    .parentElement.children[1].click();

  let raw_table = document.getElementsByClassName("data-table")[7];

  let table_head_text = raw_table.childNodes[1].innerText;
  table_head_text = table_head_text.replace(/[\n]/g, "");
  table_head_text = table_head_text.split("\t");
  table_head_text.shift();

  let table_body_text = raw_table.childNodes[3].children[
    raw_table.childNodes[3].children.length - 1
  ].innerText.split("\t");
  table_body_text.shift();

  let isTTM = false;
  if (table_head_text[table_head_text.length - 1] == "TTM") {
    isTTM = true;
    table_head_text.pop();
    table_body_text.pop();
  }

  let SHOL = [];

  table_body_text.forEach(ele => {
    let ratio = Number(ele.replace(/,/g, "")) * 4 / 100000;
    SHOL.push(ratio.toFixed(3));
  });

  return [SHOL, table_head_text];
}



function saveScrollPosition() {
  localStorage.setItem('scrollPosition', window.scrollY);
}

function restoreScrollPosition() {
  const savedScrollPosition = localStorage.getItem('scrollPosition');

  if (savedScrollPosition !== null) {
    window.scrollTo(0, savedScrollPosition);
  }
}

window.addEventListener('scroll', saveScrollPosition);
window.addEventListener('load', restoreScrollPosition);
