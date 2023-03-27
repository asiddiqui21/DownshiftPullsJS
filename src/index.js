const express = require('express');
const axios = require('axios');
const moment = require('moment');
const Chart = require('chart.js');
const cors = require('cors');
const auth = require('./auth.js')

const app = express();

// Add CORS handling for localhost calls in index.html
app.use(cors());

const GITHUB_URL = 'https://api.github.com/repos/downshift-js/downshift';

// Add git auth token
const AUTH_TOKEN = ''


const groupOpenAndClosedByMonths = (data) => {
    // Map service response to include current state, created
    const mappedDownshiftResponse = data.map( res => {
      const created = moment(res.created_at).startOf('month');
      const closed = res.closed_at ? moment(res.closed_at).startOf('month') : null;
      const state = res.state

      return { created, closed, state };
    });

    //console.log(mappedDownshiftResponse)

    const requestsPerMonth = {};
    mappedDownshiftResponse.forEach( res => {
      const month = res.created.format('MM-YYYY');
      if (!requestsPerMonth[month]) {
        requestsPerMonth[month] = {
          opened: 0,
          closed: 0,
        };
      }

//      Code assumes we only want to see if current state is open
      if (res.state === 'open') {
        requestsPerMonth[month].opened++;
      } else {
        requestsPerMonth[month].closed++;
      }

//    Code assumes we include every pull request as an opened request
//      requestsPerMonth[month].opened++;
//      if (res.closed) {
//        requestsPerMonth[month].closed++;
//      }

    });
    return requestsPerMonth;
};

app.get('/api/pull', auth.authenticate, async (req, res) => {
  try {
    const { data } = await axios.get(`${GITHUB_URL}/pulls?state=all`, {
      headers: { Authorization: `token ${AUTH_TOKEN}` },
    });

    //res.json(groupOpenAndClosedByMonths(data))
    const groupOpenAndClosedByMonthsData = groupOpenAndClosedByMonths(data)

    // Create the chart
    const chartData = {
      labels: Object.keys(groupOpenAndClosedByMonthsData),
      datasets: [
        {
          label: 'PRs Opened',
          data: Object.values(groupOpenAndClosedByMonthsData).map(data => data.opened),
          backgroundColor: "rgba(255, 206, 86, 0.2)",
          borderColor: "rgba(255, 206, 86, 1)",
          borderWidth: 1
        },
        {
          label: 'PRs Closed',
          data: Object.values(groupOpenAndClosedByMonthsData).map(data => data.closed),
          backgroundColor: "rgba(144, 238, 144, 0.2)", // Light green color
          borderColor: "rgba(144, 238, 144, 1)",
          borderWidth: 1
        }
      ]
    };

    res.json(chartData); // Return chart data as JSON

  } catch (error) {
    console.error(error);
    res.status(500).send('Server Error');
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
