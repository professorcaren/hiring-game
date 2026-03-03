// Hiring Conjoint Experiment
// SOCI 101
(function () {
  'use strict';

  // --- Configuration ---
  const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwboY4HtuK_6541O6nft8LRZj8HFtUb5NuJcmHH_bFwtOgYWtXSuP4ryNjAp0ay2-qy/exec';
  const NUM_ROUNDS = 5;

  // --- Attribute Pools ---

  // Name pairs signal both gender and class (validated research names)
  // Each pair: { male: [low, high], female: [low, high], lastLow, lastHigh }
  const NAME_PAIRS = [
    { male: ['Kevin', 'Jonathan'],     female: ['Tiffany', 'Katherine'],   lastLow: 'Miller',   lastHigh: 'Whitman' },
    { male: ['Brian', 'Alexander'],    female: ['Crystal', 'Alexandra'],   lastLow: 'Collins',  lastHigh: 'Prescott' },
    { male: ['Jason', 'Christopher'],  female: ['Amber', 'Elizabeth'],     lastLow: 'Turner',   lastHigh: 'Langley' },
    { male: ['Eric', 'Matthew'],       female: ['Heather', 'Victoria'],    lastLow: 'Dawson',   lastHigh: 'Harrington' },
    { male: ['Ryan', 'Nicholas'],      female: ['Brandie', 'Caroline'],    lastLow: 'Foster',   lastHigh: 'Montgomery' },
  ];

  const ATTRIBUTES = {
    phd: {
      1: ['Harvard', 'Princeton', 'Yale', 'Columbia', 'Stanford', 'University of Chicago'],
      2: ['UC Berkeley', 'University of Michigan', 'UW-Madison', 'UCLA'],
      3: ['Indiana University', 'Ohio State University', 'Penn State University', 'University of Georgia', 'Temple University'],
      4: ['University of Akron', 'University of Memphis', 'Portland State University', 'University of North Texas'],
    },
    pubs: [2, 5, 9],
    teaching: [4.1, 4.3, 4.6],
  };

  const PHD_TIER_LABELS = { 1: 'Ivy/Elite', 2: 'Top State', 3: 'Mid-Tier', 4: 'Low-Prestige' };

  // Bio templates — same info (name, school, pubs, teaching), different wording
  function pronouns(p) {
    if (p.gender === 'female') return { subj: 'She', obj: 'her', poss: 'Her' };
    return { subj: 'He', obj: 'him', poss: 'His' };
  }

  const BIO_TEMPLATES = [
    function (p) {
      var pr = pronouns(p);
      return pr.subj + ' is completing ' + pr.poss.toLowerCase() + ' PhD in Sociology at ' + p.phd +
        '. ' + pr.subj + ' has published ' + p.pubs + ' peer-reviewed article' + (p.pubs === 1 ? '' : 's') +
        ' and received a teaching evaluation score of ' + p.teaching + '/5.0.';
    },
    function (p) {
      var pr = pronouns(p);
      return pr.subj + ' is a doctoral candidate in Sociology at ' + p.phd +
        '. ' + pr.poss + ' record includes ' + p.pubs + ' peer-reviewed publication' + (p.pubs === 1 ? '' : 's') +
        ', and ' + pr.poss.toLowerCase() + ' teaching evaluations average ' + p.teaching + ' out of 5.0.';
    },
    function (p) {
      var pr = pronouns(p);
      return pr.subj + ' is finishing ' + pr.poss.toLowerCase() + ' doctorate in Sociology at ' + p.phd +
        '. ' + pr.subj + ' has authored ' + p.pubs + ' peer-reviewed paper' + (p.pubs === 1 ? '' : 's') +
        ' and holds a teaching rating of ' + p.teaching + '/5.0.';
    },
    function (p) {
      var pr = pronouns(p);
      return pr.subj + ' is a PhD candidate in Sociology at ' + p.phd +
        ' with ' + p.pubs + ' peer-reviewed publication' + (p.pubs === 1 ? '' : 's') +
        '. Students rate ' + pr.poss.toLowerCase() + ' teaching ' + p.teaching + '/5.0.';
    },
  ];

  // --- State ---
  var state = {
    sessionId: '',
    round: 0,
    pairs: [],
    results: [],
  };

  document.addEventListener('DOMContentLoaded', init);

  function init() {
    if (new URLSearchParams(window.location.search).get('admin') === 'true') {
      showAdmin();
      return;
    }
    state.sessionId = generateSessionId();
    document.getElementById('start-btn').addEventListener('click', startExperiment);
  }

  function generateSessionId() {
    return Math.random().toString(36).substring(2, 8);
  }

  function generateProfile() {
    var genderKey = Math.random() < 0.5 ? 'male' : 'female';
    var classKey = Math.random() < 0.5 ? 'low' : 'high';
    var pair = NAME_PAIRS[Math.floor(Math.random() * NAME_PAIRS.length)];

    var classIdx = classKey === 'low' ? 0 : 1;
    var firstName = pair[genderKey][classIdx];
    var lastName = classKey === 'low' ? pair.lastLow : pair.lastHigh;

    var phdTier = String(Math.floor(Math.random() * 4) + 1);
    var schools = ATTRIBUTES.phd[phdTier];
    var school = schools[Math.floor(Math.random() * schools.length)];
    var pubs = ATTRIBUTES.pubs[Math.floor(Math.random() * ATTRIBUTES.pubs.length)];
    var teaching = ATTRIBUTES.teaching[Math.floor(Math.random() * ATTRIBUTES.teaching.length)];

    return {
      name: firstName + ' ' + lastName,
      gender: genderKey,
      nameClass: classKey,
      phd: school,
      phdTier: Number(phdTier),
      pubs: pubs,
      teaching: teaching,
    };
  }

  function generatePairs() {
    var pairs = [];
    for (var i = 0; i < NUM_ROUNDS; i++) {
      var left = generateProfile();
      var right = generateProfile();
      while (left.gender === right.gender && left.nameClass === right.nameClass &&
             left.phdTier === right.phdTier &&
             left.pubs === right.pubs && left.teaching === right.teaching) {
        right = generateProfile();
      }
      pairs.push({ left: left, right: right });
    }
    return pairs;
  }

  function startExperiment() {
    state.pairs = generatePairs();
    state.round = 0;
    showScreen('comparison-screen');
    showRound();
  }

  function showScreen(id) {
    document.querySelectorAll('.screen').forEach(function (s) { s.classList.remove('active'); });
    document.getElementById(id).classList.add('active');
  }

  function showRound() {
    var pair = state.pairs[state.round];
    var r = state.round;

    // Randomly assign which profile appears on top (left) vs bottom (right)
    var swapped = Math.random() < 0.5;
    var topProfile = swapped ? pair.right : pair.left;
    var bottomProfile = swapped ? pair.left : pair.right;
    state.currentSwapped = swapped;

    document.getElementById('round-label').textContent = 'Pair ' + (r + 1) + ' of ' + NUM_ROUNDS;
    document.getElementById('progress-fill').style.width = ((r / NUM_ROUNDS) * 100) + '%';

    fillCard('left', topProfile);
    fillCard('right', bottomProfile);

    replaceCardListener('card-left', function () { selectCandidate('top'); });
    replaceCardListener('card-right', function () { selectCandidate('bottom'); });
  }

  function fillCard(side, profile) {
    document.getElementById(side + '-name').textContent = profile.name;
    var template = BIO_TEMPLATES[Math.floor(Math.random() * BIO_TEMPLATES.length)];
    document.getElementById(side + '-bio').textContent = template(profile);
  }

  function replaceCardListener(id, handler) {
    var el = document.getElementById(id);
    var clone = el.cloneNode(true);
    el.parentNode.replaceChild(clone, el);
    clone.addEventListener('click', handler);
  }

  function selectCandidate(chosenPosition) {
    var pair = state.pairs[state.round];
    var swapped = state.currentSwapped;

    // Map display position to card element
    var cardId = chosenPosition === 'top' ? 'card-left' : 'card-right';
    document.getElementById(cardId).classList.add('selected');
    document.getElementById('card-left').style.pointerEvents = 'none';
    document.getElementById('card-right').style.pointerEvents = 'none';

    // Map display position back to original profile
    var chosenSide;
    if (chosenPosition === 'top') {
      chosenSide = swapped ? 'right' : 'left';
    } else {
      chosenSide = swapped ? 'left' : 'right';
    }

    state.results.push({
      round: state.round + 1,
      left: pair.left,
      right: pair.right,
      chosenSide: chosenSide,
      chosenPosition: chosenPosition,
    });

    setTimeout(function () {
      document.getElementById('card-left').classList.remove('selected');
      document.getElementById('card-right').classList.remove('selected');
      document.getElementById('card-left').style.pointerEvents = '';
      document.getElementById('card-right').style.pointerEvents = '';
      state.round++;
      if (state.round < NUM_ROUNDS) {
        showRound();
      } else {
        submitResults();
      }
    }, 350);
  }

  function submitResults() {
    showScreen('thankyou-screen');

    if (!APPS_SCRIPT_URL) {
      console.warn('No APPS_SCRIPT_URL set — results not submitted.');
      return;
    }

    var payload = {
      sessionId: state.sessionId,
      results: state.results,
    };

    fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify(payload),
    }).catch(function (err) {
      console.error('Submit error:', err);
    });
  }

  // --- Admin Dashboard ---

  function showAdmin() {
    showScreen('admin-screen');
    if (!APPS_SCRIPT_URL) {
      document.getElementById('admin-status').textContent = 'Error: No APPS_SCRIPT_URL configured.';
      return;
    }
    fetchAdminData();
  }

  function fetchAdminData() {
    fetch(APPS_SCRIPT_URL, { redirect: 'follow' })
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(function (rows) {
        if (!rows.length) {
          document.getElementById('admin-status').textContent = 'No responses yet.';
          return;
        }
        document.getElementById('admin-status').textContent = '';
        var sessions = new Set(rows.map(function (r) { return r.session_id; }));
        document.getElementById('response-count').textContent =
          rows.length + ' choices from ' + sessions.size + ' students';
        renderCharts(rows);
        renderRegression(rows);
      })
      .catch(function (err) {
        document.getElementById('admin-status').textContent = 'Error loading data: ' + err.message;
      });
  }

  function computeHireRates(rows, getAttribute) {
    var counts = {};
    rows.forEach(function (row) {
      var leftVal = getAttribute(row, 'left');
      var rightVal = getAttribute(row, 'right');
      [leftVal, rightVal].forEach(function (val) {
        if (!counts[val]) counts[val] = { chosen: 0, total: 0 };
      });
      counts[leftVal].total++;
      counts[rightVal].total++;
      var chosenVal = row.chosen_side === 'left' ? leftVal : rightVal;
      counts[chosenVal].chosen++;
    });
    var result = {};
    for (var key in counts) {
      result[key] = counts[key].total > 0 ? counts[key].chosen / counts[key].total : 0;
    }
    return result;
  }

  function renderCharts(rows) {
    var genderRates = computeHireRates(rows, function (row, side) {
      return row[side + '_gender'].charAt(0).toUpperCase() + row[side + '_gender'].slice(1);
    });
    makeBar('chart-gender', genderRates, ['Male', 'Female']);

    var classRates = computeHireRates(rows, function (row, side) {
      return row[side + '_class'] === 'high' ? 'High-Class Name' : 'Low-Class Name';
    });
    makeBar('chart-class', classRates, ['High-Class Name', 'Low-Class Name']);

    var pubRates = computeHireRates(rows, function (row, side) {
      return row[side + '_pubs'] + ' pubs';
    });
    makeBar('chart-pubs', pubRates, ['2 pubs', '5 pubs', '9 pubs']);

    var teachRates = computeHireRates(rows, function (row, side) {
      return row[side + '_teaching'] + '/5.0';
    });
    makeBar('chart-teaching', teachRates, ['4.1/5.0', '4.3/5.0', '4.6/5.0']);

    var phdRates = computeHireRates(rows, function (row, side) {
      return PHD_TIER_LABELS[row[side + '_phd_tier']] || 'Tier ' + row[side + '_phd_tier'];
    });
    makeBar('chart-phd', phdRates, ['Ivy/Elite', 'Top State', 'Mid-Tier', 'Low-Prestige']);

    // Position bias (descriptive only, not in regression)
    var positionCounts = { top: 0, bottom: 0, total: 0 };
    rows.forEach(function (row) {
      if (row.chosen_position) {
        positionCounts[row.chosen_position]++;
        positionCounts.total++;
      }
    });
    if (positionCounts.total > 0) {
      var posRates = {
        'Top Card': positionCounts.top / positionCounts.total,
        'Bottom Card': positionCounts.bottom / positionCounts.total,
      };
      makeBar('chart-position', posRates, ['Top Card', 'Bottom Card']);
    }
  }

  function makeBar(canvasId, rates, orderedLabels) {
    var labels = orderedLabels.filter(function (l) { return rates[l] !== undefined; });
    var data = labels.map(function (l) { return Math.round(rates[l] * 100); });
    new Chart(document.getElementById(canvasId), {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Hire Rate (%)',
          data: data,
          backgroundColor: '#2563eb',
          borderRadius: 6,
        }],
      },
      options: {
        responsive: true,
        layout: { padding: { top: 30 } },
        scales: {
          x: { ticks: { font: { size: 14, weight: 'bold' } } },
          y: { beginAtZero: true, max: 100, ticks: { callback: function (v) { return v + '%'; } } },
        },
        plugins: {
          legend: { display: false },
          datalabels: {
            anchor: 'end',
            align: 'end',
            formatter: function (v) { return v + '%'; },
            font: { size: 22, weight: 'bold' },
            color: '#1a1a1a',
          },
        },
      },
      plugins: [{
        id: 'datalabels',
        afterDatasetsDraw: function (chart) {
          var ctx = chart.ctx;
          chart.data.datasets.forEach(function (dataset, i) {
            var meta = chart.getDatasetMeta(i);
            meta.data.forEach(function (bar, index) {
              var value = dataset.data[index];
              ctx.save();
              ctx.font = 'bold 22px Inter, sans-serif';
              ctx.fillStyle = '#1a1a1a';
              ctx.textAlign = 'center';
              ctx.textBaseline = 'bottom';
              ctx.fillText(value + '%', bar.x, bar.y - 6);
              ctx.restore();
            });
          });
        },
      }],
    });
  }

  function renderRegression(rows) {
    var observations = [];
    rows.forEach(function (row) {
      ['left', 'right'].forEach(function (side) {
        var chosen = row.chosen_side === side ? 1 : 0;
        observations.push({
          y: chosen,
          female: row[side + '_gender'] === 'female' ? 1 : 0,
          high_class: row[side + '_class'] === 'high' ? 1 : 0,
          phd_top_state: Number(row[side + '_phd_tier']) === 2 ? 1 : 0,
          phd_mid_tier: Number(row[side + '_phd_tier']) === 3 ? 1 : 0,
          phd_low_prestige: Number(row[side + '_phd_tier']) === 4 ? 1 : 0,
          pubs_5: Number(row[side + '_pubs']) === 5 ? 1 : 0,
          pubs_9: Number(row[side + '_pubs']) === 9 ? 1 : 0,
          teaching_4_3: Number(row[side + '_teaching']) === 4.3 ? 1 : 0,
          teaching_4_6: Number(row[side + '_teaching']) === 4.6 ? 1 : 0,
        });
      });
    });

    var featureNames = ['female', 'high_class', 'phd_top_state', 'phd_mid_tier', 'phd_low_prestige',
                        'pubs_5', 'pubs_9', 'teaching_4_3', 'teaching_4_6'];
    var featureLabels = ['Female (vs. Male)', 'High-Class Name (vs. Low)', 'Top State (vs. Ivy)', 'Mid-Tier (vs. Ivy)',
                         'Low-Prestige (vs. Ivy)', '5 Pubs (vs. 2)', '9 Pubs (vs. 2)',
                         'Teaching 4.3 (vs. 4.1)', 'Teaching 4.6 (vs. 4.1)'];

    var n = observations.length;
    var k = featureNames.length;
    var X = [];
    var y = [];
    for (var i = 0; i < n; i++) {
      var row = [1];
      for (var j = 0; j < k; j++) {
        row.push(observations[i][featureNames[j]]);
      }
      X.push(row);
      y.push(observations[i].y);
    }

    var beta = new Array(k + 1).fill(0);
    for (var iter = 0; iter < 25; iter++) {
      var W = [];
      var z = [];
      for (var i = 0; i < n; i++) {
        var eta = dot(X[i], beta);
        var p = sigmoid(eta);
        p = Math.max(1e-6, Math.min(1 - 1e-6, p));
        var w = p * (1 - p);
        W.push(w);
        z.push(eta + (y[i] - p) / w);
      }
      beta = wls(X, W, z, k + 1);
    }

    var W_final = [];
    for (var i = 0; i < n; i++) {
      var p = sigmoid(dot(X[i], beta));
      p = Math.max(1e-6, Math.min(1 - 1e-6, p));
      W_final.push(p * (1 - p));
    }
    var info = xtwx(X, W_final, k + 1);
    var cov = invertMatrix(info);
    var se = cov ? cov.map(function (row, i) { return Math.sqrt(Math.max(0, row[i])); }) : new Array(k + 1).fill(NaN);

    var html = '<table><thead><tr><th>Variable</th><th>Coeff (log-odds)</th><th>SE</th><th>p-value</th></tr></thead><tbody>';
    for (var j = 0; j < k; j++) {
      var b = beta[j + 1];
      var s = se[j + 1];
      var zStat = isFinite(s) && s > 0 ? b / s : 0;
      var pVal = 2 * (1 - normalCDF(Math.abs(zStat)));
      var stars = pVal < 0.001 ? '***' : pVal < 0.01 ? '**' : pVal < 0.05 ? '*' : '';
      html += '<tr><td>' + featureLabels[j] + '</td><td>' + b.toFixed(3) + '</td><td>' +
              s.toFixed(3) + '</td><td>' + pVal.toFixed(3) + ' ' + stars + '</td></tr>';
    }
    html += '</tbody></table>';
    html += '<p style="font-size:0.75rem;color:#666;margin-top:0.5rem;">Reference: Male, Low-Class Name, Ivy/Elite PhD, 2 publications, 4.1 teaching eval. * p&lt;.05 ** p&lt;.01 *** p&lt;.001</p>';
    document.getElementById('regression-table-container').innerHTML = html;
  }

  // --- Math helpers ---
  function sigmoid(x) { return 1 / (1 + Math.exp(-x)); }
  function dot(a, b) { var s = 0; for (var i = 0; i < a.length; i++) s += a[i] * b[i]; return s; }

  function wls(X, W, z, p) {
    var info = xtwx(X, W, p);
    var xtwz = new Array(p).fill(0);
    for (var i = 0; i < X.length; i++) {
      for (var j = 0; j < p; j++) {
        xtwz[j] += X[i][j] * W[i] * z[i];
      }
    }
    var inv = invertMatrix(info);
    if (!inv) return new Array(p).fill(0);
    var beta = new Array(p).fill(0);
    for (var j = 0; j < p; j++) {
      for (var kk = 0; kk < p; kk++) {
        beta[j] += inv[j][kk] * xtwz[kk];
      }
    }
    return beta;
  }

  function xtwx(X, W, p) {
    var m = [];
    for (var j = 0; j < p; j++) {
      m[j] = new Array(p).fill(0);
      for (var kk = 0; kk < p; kk++) {
        for (var i = 0; i < X.length; i++) {
          m[j][kk] += X[i][j] * W[i] * X[i][kk];
        }
      }
    }
    return m;
  }

  function invertMatrix(matrix) {
    var n = matrix.length;
    var aug = matrix.map(function (row, i) {
      var r = row.slice();
      for (var j = 0; j < n; j++) r.push(i === j ? 1 : 0);
      return r;
    });
    for (var col = 0; col < n; col++) {
      var maxRow = col;
      for (var row = col + 1; row < n; row++) {
        if (Math.abs(aug[row][col]) > Math.abs(aug[maxRow][col])) maxRow = row;
      }
      var tmp = aug[col]; aug[col] = aug[maxRow]; aug[maxRow] = tmp;
      if (Math.abs(aug[col][col]) < 1e-12) return null;
      var pivot = aug[col][col];
      for (var j = 0; j < 2 * n; j++) aug[col][j] /= pivot;
      for (var row = 0; row < n; row++) {
        if (row === col) continue;
        var factor = aug[row][col];
        for (var j = 0; j < 2 * n; j++) aug[row][j] -= factor * aug[col][j];
      }
    }
    return aug.map(function (row) { return row.slice(n); });
  }

  function normalCDF(x) {
    var t = 1 / (1 + 0.2316419 * Math.abs(x));
    var d = 0.3989422804014327;
    var p = d * Math.exp(-x * x / 2) * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
    return x > 0 ? 1 - p : p;
  }

})();
