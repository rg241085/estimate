let itemLineNo = 0;
const itemsSection = document.getElementById('itemsSection');

// Set current date & auto serial number
function setDefaultDateSerial() {
  let today = new Date();
  let yyyy = today.getFullYear();
  let mm = String(today.getMonth() + 1).padStart(2, '0');
  let dd = String(today.getDate()).padStart(2, '0');
  let forSerial = `${dd}${mm}${yyyy.toString().slice(-2)}`;
  document.getElementById('date').value = `${yyyy}-${mm}-${dd}`;
  document.getElementById('vchNumber').value = `${forSerial}-001`;
}
setDefaultDateSerial();

function showAlert(msg, input) {
  alert(msg);
  setTimeout(() => { if (input) input.focus(); }, 10);
}

function removeNumberSpinners() {
  document.querySelectorAll('input[type="number"]').forEach(n => {
    n.setAttribute('pattern', '[0-9]*');
    n.setAttribute('inputmode', 'numeric');
  });
}
removeNumberSpinners();

function itemTableHTML() {
  return `
    <table class="items-table">
      <thead>
        <tr>
          <th>S.N.</th>
          <th>Item</th>
          <th>Quantity</th>
          <th>Rate</th>
          <th>Amount</th>
          <th></th>
        </tr>
      </thead>
      <tbody id="itemsBody"></tbody>
    </table>
  `;
}

function itemRowHTML(id) {
  return `
    <tr class="item-row" id="itemRow-${id}">
      <td class="sn">${id + 1}</td>
      <td><input type="text" class="item" required autocomplete="off" placeholder="Item"></td>
      <td><input type="number" class="qty" min="1" placeholder="Qty" required autocomplete="off" onkeydown="preventScrollChange(event)"></td>
      <td><input type="number" class="rate" min="0" placeholder="Rate" required autocomplete="off" onkeydown="preventScrollChange(event)"></td>
      <td><input type="text" class="amount" placeholder="Amount" readonly tabindex="-1"></td>
      ${id === 0 ? '' : '<td class="remove-btn" onclick="removeItemRow(\'itemRow-' + id + '\')">×</td>'}
    </tr>
  `;
}

function addFirstItemRow() {
  itemLineNo = 0;
  itemsSection.innerHTML = itemTableHTML();
  document.getElementById('itemsBody').innerHTML = itemRowHTML(0);
  addAutoAmountEvents();
  addKeyboardNavigation();
  updateGrandTotal();
}
addFirstItemRow();

window.addItemRow = function () {
  itemLineNo++;
  const id = itemLineNo;
  const itemsBody = document.getElementById('itemsBody');
  itemsBody.insertAdjacentHTML('beforeend', itemRowHTML(id));
  addAutoAmountEvents();
  addKeyboardNavigation();
  setTimeout(() => {
    itemsBody.querySelector(`#itemRow-${id} .item`).focus();
  }, 40);
  updateGrandTotal();
};

window.removeItemRow = function (rowId) {
  document.getElementById(rowId).remove();
  updateGrandTotal();
  addKeyboardNavigation();
};

function preventScrollChange(e) {
  if (['ArrowUp', 'ArrowDown'].includes(e.key) || e.type === 'wheel')
    e.preventDefault();
}
window.preventScrollChange = preventScrollChange;

function addAutoAmountEvents() {
  document.querySelectorAll('.qty, .rate').forEach(input => {
    input.removeEventListener('input', autoAmountAll);
    input.addEventListener('input', autoAmountAll);
    input.removeEventListener('wheel', preventScrollChange);
    input.addEventListener('wheel', preventScrollChange, { passive: false });
  });
}
function autoAmountAll() {
  document.querySelectorAll('.item-row').forEach(row => {
    let qty = +row.querySelector('.qty').value || 0;
    let rate = +row.querySelector('.rate').value || 0;
    let amountField = row.querySelector('.amount');
    amountField.value = (qty && rate) ? qty * rate : '';
  });
  updateGrandTotal();
}

function updateGrandTotal() {
  let total = 0;
  document.querySelectorAll('.item-row').forEach(row => {
    const qty = +row.querySelector('.qty').value || 0;
    const rate = +row.querySelector('.rate').value || 0;
    total += (qty && rate) ? qty * rate : 0;
  });
  total += getExtraChargesTotal();
  let totalElem = document.getElementById('grandTotal');
  if (totalElem) totalElem.innerText = '₹' + total;
}

function validateForm(setFocusOnError = true) {
  const mobileInput = document.getElementById('mobileNumber');
  const mobile = mobileInput.value.trim();
  if (!/^\d{10}$/.test(mobile)) {
    if (setFocusOnError) showAlert('मोबाइल नंबर 10 अंकों का होना चाहिए।', mobileInput);
    return false;
  }
  let ok = true;
  document.querySelectorAll('.item-row').forEach(row => {
    if (!ok) return;
    const item = row.querySelector('.item'), qty = row.querySelector('.qty'), rate = row.querySelector('.rate');
    if (!item.value.trim()) { if (setFocusOnError) showAlert('कृपया सभी आइटम नाम भरें।', item); ok = false; }
    else if (!qty.value.trim() || isNaN(qty.value) || +qty.value < 1) { if (setFocusOnError) showAlert('Quantity सही दर्ज करें।', qty); ok = false; }
    else if (!rate.value.trim() || isNaN(rate.value) || +rate.value < 0) { if (setFocusOnError) showAlert('Rate सही दर्ज करें。', rate); ok = false; }
  });
  // Validate extra charges
  if (ok) {
    document.querySelectorAll('.extra-charge-row').forEach(row => {
      if (!ok) return;
      const name = row.querySelector('.extra-charge-name');
      const amount = row.querySelector('.extra-charge-amount');
      if (!name.value.trim()) { if (setFocusOnError) showAlert('कृपया Extra Charge का नाम भरें।', name); ok = false; }
      else if (!amount.value.trim() || isNaN(amount.value) || +amount.value < 0) { if (setFocusOnError) showAlert('Extra Charge का Amount सही दर्ज करें।', amount); ok = false; }
    });
  }
  return ok;
}

function validateSingleRow(row) {
  const item = row.querySelector('.item'), qty = row.querySelector('.qty'), rate = row.querySelector('.rate');
  if (!item.value.trim()) { showAlert('कृपया आइटम नाम भरें।', item); return false; }
  if (!qty.value.trim() || isNaN(qty.value) || +qty.value < 1) { showAlert('Quantity सही दर्ज करें。', qty); return false; }
  if (!rate.value.trim() || isNaN(rate.value) || +rate.value < 0) { showAlert('Rate सही दर्ज करें。', rate); return false; }
  return true;
}

// ---- ITEMS KEYBOARD NAVIGATION (Enter/Shift+Enter) ----
function addKeyboardNavigation() {
  setTimeout(() => {
    const estFormInputs = Array.from(document.querySelectorAll('input:not([readonly]):not(.extra-charge-name):not(.extra-charge-amount)'));
    estFormInputs.forEach((input, idx) => {
      input.onkeydown = null; // Reset previous
      input.onkeydown = function (e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          if (e.shiftKey) {
            if (idx > 0) estFormInputs[idx - 1].focus();
          } else {
            if (input.classList.contains('rate')) {
              const row = input.closest('.item-row');
              const amountField = row.querySelector('.amount');
              if (amountField) amountField.focus();
            } else {
              if (idx < estFormInputs.length - 1) estFormInputs[idx + 1].focus();
            }
          }
        }
      };
    });

    document.querySelectorAll('.amount').forEach(amountInput => {
      amountInput.onkeydown = null;
      amountInput.onkeydown = function (e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          const row = amountInput.closest('.item-row');
          if (row) saveItemWorkflow(row);
        }
      };
    });
  }, 50);
}

function saveItemWorkflow(row) {
  if (!validateSingleRow(row)) return;
  if (confirm('Do you want to save this item?')) {
    if (confirm('Item saved.\nDo you want to add another item?')) {
      addItemRow();
    } else {
      const firstExtraField = document.querySelector('.extra-charge-name');
      if (firstExtraField) {
        firstExtraField.focus();
      } else {
        document.getElementById("generateBtn").focus();
      }
    }
  } else {
    row.querySelector('.amount').focus();
  }
}

// --- Extra Charges Logic ---
let extraChargeLineNo = 0;
const extraChargesList = document.getElementById('extraChargesList');
const addExtraChargeBtn = document.getElementById('addExtraChargeBtn');

function extraChargeTableHTML() {
  return `
    <table class="extra-charges-table">
      <tbody id="extraChargesBody"></tbody>
    </table>
  `;
}

function extraChargeRowHTML(id) {
  return `
    <tr class="extra-charge-row" id="extraChargeRow-${id}">
      <td><input type="text" class="extra-charge-name" placeholder="Charge Name" required></td>
      <td><input type="number" class="extra-charge-amount" placeholder="Amount" min="0" required onkeydown="preventScrollChange(event)"></td>
      ${id === 0 ? '' : '<td class="remove-extra-btn" onclick="removeExtraChargeRow(\'extraChargeRow-' + id + '\')">×</td>'}
    </tr>
  `;
}

function addFirstExtraChargeRow() {
  extraChargeLineNo = 0;
  extraChargesList.innerHTML = extraChargeTableHTML();
  document.getElementById('extraChargesBody').innerHTML = extraChargeRowHTML(0);
  addExtraChargeInputEvents();
}
function addExtraChargeRow() {
  extraChargeLineNo++;
  const extraChargesBody = document.getElementById('extraChargesBody');
  extraChargesBody.insertAdjacentHTML('beforeend', extraChargeRowHTML(extraChargeLineNo));
  addExtraChargeInputEvents();
}

window.removeExtraChargeRow = function (rowId) {
  document.getElementById(rowId).remove();
  updateGrandTotal();
};

addExtraChargeBtn.onclick = addExtraChargeRow;

function getExtraChargesTotal() {
  let total = 0;
  document.querySelectorAll('.extra-charge-amount').forEach(input => {
    total += Number(input.value) || 0;
  });
  return total;
}

function addExtraChargeInputEvents() {
  document.querySelectorAll('.extra-charge-amount').forEach(input => {
    input.removeEventListener('input', updateGrandTotal);
    input.addEventListener('input', updateGrandTotal);
    input.removeEventListener('wheel', preventScrollChange);
    input.addEventListener('wheel', preventScrollChange, { passive: false });
  });
}

function validateSingleExtraRow(row) {
  const name = row.querySelector('.extra-charge-name');
  const amt = row.querySelector('.extra-charge-amount');
  if (!name.value.trim()) { showAlert('कृपया Extra Charge का नाम भरें।', name); return false; }
  if (!amt.value.trim() || isNaN(amt.value) || +amt.value < 0) { showAlert('Amount सही दर्ज करें。', amt); return false; }
  return true;
}

function saveExtraChargeWorkflow(row) {
  if (!validateSingleExtraRow(row)) return;
  if (confirm('Do you want to save this extra charge?')) {
    if (confirm('Extra charge saved.\nDo you want to add another extra charge?')) {
      addExtraChargeRow();
      setTimeout(() => {
        const allNames = document.querySelectorAll('.extra-charge-name');
        allNames[allNames.length - 1].focus();
      }, 40);
    } else {
      document.getElementById("generateBtn").focus();
    }
  } else {
    row.querySelector('.extra-charge-amount').focus();
  }
}

// ---- EVENT DELEGATION: Extra Charge Row Keyboard Workflow ----
document.getElementById('estimateForm').addEventListener('keydown', function (e) {
  // Amount field Enter => saveExtraChargeWorkflow
  if (
    e.target.classList.contains('extra-charge-amount') &&
    e.key === 'Enter'
  ) {
    e.preventDefault();
    const row = e.target.closest('.extra-charge-row');
    saveExtraChargeWorkflow(row);
  }
  // Name field Enter => shift focus to amount
  else if (
    e.target.classList.contains('extra-charge-name') &&
    e.key === 'Enter'
  ) {
    e.preventDefault();
    const row = e.target.closest('.extra-charge-row');
    const next = row.querySelector('.extra-charge-amount');
    if (next) next.focus();
  }
});

// Open Estimate Preview including extra charges
function openEstimatePreview() {
  if (!validateForm(true)) return;
  const date = document.getElementById('date').value;
  const vchNumber = document.getElementById('vchNumber').value;
  const name = document.getElementById('customerName').value;
  const mobile = document.getElementById('mobileNumber').value;
  let rowsHtml = '', itemsTotal = 0;

  document.querySelectorAll('.item-row').forEach(row => {
    const item = row.querySelector('.item').value;
    const qty = +row.querySelector('.qty').value, rate = +row.querySelector('.rate').value;
    const amount = qty * rate;
    if (item && qty && rate) {
      rowsHtml += `<tr>
                <td>${item}</td>
                <td>${qty}</td>
                <td>₹${rate}</td>
                <td>₹${amount}</td>
            </tr>`;
      itemsTotal += amount;
    }
  });

  // Collect extra charges
  let extraChargesRows = '', extraChargesTotal = 0;
  document.querySelectorAll('.extra-charge-row').forEach(row => {
    const extraName = row.querySelector('.extra-charge-name').value.trim();
    const amt = +row.querySelector('.extra-charge-amount').value || 0;
    if (extraName && amt) {
      extraChargesRows += `<tr class="extra-row">
                    <td colspan="3">${extraName}</td>
                    <td>₹${amt}</td>
                </tr>`;
      extraChargesTotal += amt;
    }
  });
  const grandTotal = itemsTotal + extraChargesTotal;

  let previewHtml = `
    <html>
    <head>
      <title>Estimate Preview</title>
      <meta name="viewport" content="width=device-width,initial-scale=1">
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; background:#f4f8fb; margin:0; }
        .est-wrap {
          max-width:780px; margin:34px auto 24px auto; background:#fff;
          box-shadow:0 6px 36px rgba(55,133,233,0.13);
          border-radius:14px; padding-bottom:28px;
        }
        .est-head {
          background: #1976d2; /* Solid fallback color */
          background: linear-gradient(90deg,#1976d2 60%,#60a5fa 100%);
          color:white; font-size:2.2em; font-weight:900;
          letter-spacing:2px; padding:24px 0 18px 0;
          text-align:center; text-transform:uppercase;
          box-shadow:0 2px 10px rgba(50,100,200,0.06);
          border-radius:14px 14px 0 0;
          -webkit-print-color-adjust: exact; /* Force color printing in Webkit browsers */
          print-color-adjust: exact; /* Standard property for color printing */
        }
        .est-info-box {
          background:#f3f6fb; border:1.5px solid #d2e3fa;
          border-radius:9px; margin:26px 34px 18px 34px;
          padding:18px 22px; font-size:1.11em; color:#2357c9;
          display:flex; flex-wrap:wrap; gap:24px 60px; align-items:center; justify-content:flex-start;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .est-info-label { font-weight:700; min-width:120px; display:inline-block;}
        .est-table-area { padding:0 28px 0 28px;}
        table {
          width:100%; border-collapse:collapse; margin:20px 0 0 0;
          box-shadow:0 2px 12px rgba(80,120,210,0.09);
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        th, td { border:1.5px solid #c2dbf6; padding:13px 12px; }
        th {
          background:#e3ecfb;
          color:#1976d2;
          font-size:1.11em; font-weight:700; text-align:left;
          letter-spacing:0.5px;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        td { font-size:1.07em; }
        td:last-child, th:last-child { text-align:right;}
        .extra-row td {
          background:#f7fafd; color:#4b5563; font-weight:500; font-size:0.9em;
          padding: 3px 6px;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .est-table-footer td {
          font-weight:bold; background:#e6ffe9; font-size:1.12em; color:#15803d;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .other-charges-head {
          text-align:right; font-weight:500; color:#555; font-size:0.9em;
          padding:5px 6px 0 0; border:none; background:none;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .est-footer-btns {
          text-align:center; margin-top:20px;
        }
        .print-btn, .pdf-btn {
          background: #1976d2;
          background: linear-gradient(90deg,#1976d2 60%,#60a5fa 100%);
          color:white; font-weight:700; padding:10px 25px;
          border:none; border-radius:6px;
          font-size:1em; cursor:pointer; margin:0 5px 0 5px;
          letter-spacing:1px; transition:0.2s;
          box-shadow:0 2px 8px rgba(55,133,233,0.12);
        }
        .print-btn:hover, .pdf-btn:hover { background: #1565c0; }
        @media (max-width:700px) {
          .est-wrap { max-width:97vw; border-radius:0; padding-bottom:18px;}
          .est-head { font-size:1.45em; padding:16px 0 12px;}
          .est-info-box { font-size:1em; margin:16px 7vw 12px 7vw; padding:13px 7vw;}
          .est-table-area { padding:0 4vw;}
          table { font-size:1em; }
          th, td { padding:8px 4px;}
          .extra-row td { padding: 2px 4px; font-size: 0.85em; }
          .other-charges-head { font-size: 0.85em; padding: 3px 4px 0 0; }
          .est-footer-btns { margin-top:15px; }
          .print-btn, .pdf-btn { padding:8px 20px; font-size:0.9em; margin:0 4px; }
        }
        @media print {
          .print-btn, .pdf-btn { display:none !important; }
          body { background: #fff !important; }
          .est-wrap { box-shadow:none !important; }
          * { -webkit-print-color-adjust: exact; print-color-adjust: exact; } /* Apply to all elements */
        }
      </style>
    </head>
    <body>
      <div class="est-wrap">
        <div class="est-head">Estimate</div>
        <div class="est-info-box">
          <div><span class="est-info-label">Date:</span> ${date.split('-').reverse().join('-')}</div>
          <div><span class="est-info-label">Vch. No.:</span> ${vchNumber}</div>
          <div><span class="est-info-label">Customer:</span> ${name}</div>
          <div><span class="est-info-label">Mobile:</span> ${mobile}</div>
        </div>
        <div class="est-table-area">
          <table>
            <tr>
              <th>Item</th>
              <th>Qty</th>
              <th>Rate (₹)</th>
              <th>Amount (₹)</th>
            </tr>
            ${rowsHtml || '<tr><td colspan="4" style="text-align:center;color:#9da1a7;">No items added.</td></tr>'}
            ${extraChargesRows ? `<tr><td colspan="4" class="other-charges-head">Other Charges</td></tr>${extraChargesRows}` : ''}
            <tr class="est-table-footer">
              <td colspan="3">Grand Total</td>
              <td>₹${grandTotal}</td>
            </tr>
          </table>
        </div>
        <div class="est-footer-btns">
          <button class="print-btn" onclick="window.print()">Print</button>
          <button class="pdf-btn" onclick="downloadPDF()">Download PDF</button>
        </div>
      </div>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>
      <script>
        function downloadPDF() {
          html2pdf(document.querySelector('.est-wrap'), {
            margin:0.3, filename:'Estimate.pdf', image:{type:'jpeg', quality:0.98}, html2canvas:{scale:2, useCORS: true}
          });
        }
      </script>
    </body>
    </html>
  `;

  const prevWin = window.open('', '_blank');
  prevWin.document.write(previewHtml);
  prevWin.document.close();
}


// "Add New Estimate" button
document.getElementById('newEstimateBtn').onclick = function () {
  document.getElementById('estimateForm').reset();
  setDefaultDateSerial();
  addFirstItemRow();
  addFirstExtraChargeRow();
  document.getElementById('customerName').focus();
  updateGrandTotal();
};

// Initialize extra charges section on load
addFirstExtraChargeRow();
// Initialize keyboard navigation for items
addKeyboardNavigation();  