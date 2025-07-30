let itemLineNo = 0;
const itemsSection = document.getElementById('itemsSection');
const generateBtn = document.getElementById('generateBtn');

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

function itemRowHTML(id) {
    return `<div class="form-row items-row" id="itemRow-${id}">
    <div class="form-group">
      <label>Item:
        <input type="text" class="item" required autocomplete="off">
      </label>
    </div>
    <div class="form-group">
      <label>Quantity:
        <input type="number" class="qty" min="1" placeholder="Qty" required autocomplete="off" onkeydown="preventScrollChange(event)">
      </label>
    </div>
    <div class="form-group">
      <label>Rate:
        <input type="number" class="rate" min="0" placeholder="Rate" required autocomplete="off" onkeydown="preventScrollChange(event)">
      </label>
    </div>
    <div class="form-group">
      <label>Amount:
        <input type="text" class="amount" placeholder="Amount" readonly tabindex="-1">
      </label>
    </div>
    <div class="form-group remove-btn-group" style="align-self:end;margin-bottom:5px;">
      ${id === 0 ? '' : `<button type="button" class="remove-btn" onclick="removeItemRow('itemRow-${id}')">×</button>`}
    </div>
  </div>`;
}

function addFirstItemRow() {
    itemLineNo = 0;
    itemsSection.innerHTML = itemRowHTML(0);
    addAutoAmountEvents();
    addKeyboardNavigation();
    updateGrandTotal(); // Total amount reset/update
}
addFirstItemRow();

window.addItemRow = function () {
    itemLineNo++;
    const id = itemLineNo;
    itemsSection.insertAdjacentHTML('beforeend', itemRowHTML(id));
    addAutoAmountEvents();
    addKeyboardNavigation();
    setTimeout(() => {
        itemsSection.querySelector(`#itemRow-${id} .item`).focus();
    }, 40);
    updateGrandTotal(); // Total amount update when new row added
};

window.removeItemRow = function (rowId) {
    document.getElementById(rowId).remove();
    updateGrandTotal(); // Total amount update when row removed
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
    document.querySelectorAll('.items-row').forEach(row => {
        let qty = +row.querySelector('.qty').value || 0;
        let rate = +row.querySelector('.rate').value || 0;
        let amountField = row.querySelector('.amount');
        amountField.value = (qty && rate) ? qty * rate : '';
    });
    updateGrandTotal(); // <<=== Grand Total update!
}

function updateGrandTotal() {
    let total = 0;
    document.querySelectorAll('.items-row').forEach(row => {
        const qty = +row.querySelector('.qty').value || 0;
        const rate = +row.querySelector('.rate').value || 0;
        total += (qty && rate) ? qty * rate : 0;
    });
    // अगर grandTotal का element मिलेगा तो update करें
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
    document.querySelectorAll('.items-row').forEach(row => {
        if (!ok) return;
        const item = row.querySelector('.item'), qty = row.querySelector('.qty'), rate = row.querySelector('.rate');
        if (!item.value.trim()) { if (setFocusOnError) showAlert('कृपया सभी आइटम नाम भरें।', item); ok = false; }
        else if (!qty.value.trim() || isNaN(qty.value) || +qty.value < 1) { if (setFocusOnError) showAlert('Quantity सही दर्ज करें।', qty); ok = false; }
        else if (!rate.value.trim() || isNaN(rate.value) || +rate.value < 0) { if (setFocusOnError) showAlert('Rate सही दर्ज करें।', rate); ok = false; }
    });
    return ok;
}
function validateSingleRow(row) {
    const item = row.querySelector('.item'), qty = row.querySelector('.qty'), rate = row.querySelector('.rate');
    if (!item.value.trim()) { showAlert('कृपया आइटम नाम भरें।', item); return false; }
    if (!qty.value.trim() || isNaN(qty.value) || +qty.value < 1) { showAlert('Quantity सही दर्ज करें।', qty); return false; }
    if (!rate.value.trim() || isNaN(rate.value) || +rate.value < 0) { showAlert('Rate सही दर्ज करें।', rate); return false; }
    return true;
}

// Keyboard Navigation + Amount Enter Event
function addKeyboardNavigation() {
    setTimeout(() => {
        const estFormInputs = Array.from(document.querySelectorAll('input:not([readonly])'));
        estFormInputs.forEach((input, idx) => {
            input.onkeydown = function (e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    if (e.shiftKey) {
                        if (idx > 0) estFormInputs[idx - 1].focus();
                    } else {
                        if (input.classList.contains('rate')) {
                            const row = input.closest('.items-row');
                            const amountField = row.querySelector('.amount');
                            if (amountField) amountField.focus();
                        } else {
                            if (idx < estFormInputs.length - 1) estFormInputs[idx + 1].focus();
                        }
                    }
                }
            };
        });

        // Amount field पर भी Enter का event
        document.querySelectorAll('.amount').forEach(amountInput => {
            amountInput.onkeydown = function (e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    const row = amountInput.closest('.items-row');
                    if (row) saveItemWorkflow(row);
                }
            };
        });
    }, 100);
}

function saveItemWorkflow(row) {
    if (!validateSingleRow(row)) return;

    if (confirm('Do you want to save this item?')) {
        if (confirm('Item saved.\nDo you want to add another item?')) {
            addItemRow();
        } else {
            document.getElementById("generateBtn").focus();
        }
    } else {
        row.querySelector('.amount').focus();
    }
}

function openEstimatePreview() {
    if (!validateForm(true)) return;
    const date = document.getElementById('date').value;
    const vchNumber = document.getElementById('vchNumber').value;
    const name = document.getElementById('customerName').value;
    const mobile = document.getElementById('mobileNumber').value;
    let rowsHtml = '', grandTotal = 0;
    document.querySelectorAll('.items-row').forEach(row => {
        const item = row.querySelector('.item').value;
        const qty = +row.querySelector('.qty').value, rate = +row.querySelector('.rate').value;
        const amount = qty * rate;
        if (item && qty && rate) {
            rowsHtml += `<tr>
        <td>${item}</td>
        <td>${qty}</td>
        <td>${rate}</td>
        <td>${amount}</td>
      </tr>`;
            grandTotal += amount;
        }
    });
    let previewHtml = `
    <html>
    <head>
      <title>Estimate Preview</title>
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; background:#f4f7fa; margin:0; }
        .est-wrap { max-width:700px; margin:24px auto;background:#fff;box-shadow:0 2px 10px rgba(55,133,233,0.09);}
        .est-head { background:#f3f8fe; border-bottom:2px solid #3785e9; padding:16px; text-align:center;font-size:24px;color:#3785e9;font-weight:700; border-radius:10px 10px 0 0;}
        .est-info { margin:14px 30px 8px 30px; }
        .est-info strong { color:#223050; min-width:126px; display:inline-block;}
        table { width:90%;margin:25px auto 8px auto;border-collapse:collapse;font-size:18px;}
        th, td { border:1px solid #b8cae2;padding:10px 13px;text-align:left;}
        th { background:#e9f2fb;color:#2357c9;font-size:18px;font-weight:600;}
        .est-table-footer td {font-weight:bold;background:#f6f6fc;}
        .print-btn, .pdf-btn {
          background:#3785e9;color:white; font-weight:600; padding:10px 25px;
          border:none; border-radius:6px;font-size:17px;cursor:pointer;margin:16px 5px 30px 5px;
        }
        .print-btn:hover, .pdf-btn:hover { background: #2357c9; }
      </style>
    </head>
    <body>
      <div class="est-wrap">
        <div class="est-head">Estimate</div>
        <div class="est-info"><strong>Date:</strong> ${date.replace(/-/g, '-')} &nbsp; <strong>Vch. No.:</strong> ${vchNumber}</div>
        <div class="est-info"><strong>Customer Name:</strong> ${name} &nbsp; <strong>Mobile:</strong> ${mobile}</div>
        <table>
          <tr>
            <th>Item</th>
            <th>Qty</th>
            <th>Rate (₹)</th>
            <th>Amount (₹)</th>
          </tr>
          ${rowsHtml}
          <tr class="est-table-footer">
            <td colspan="3">Total</td>
            <td>₹${grandTotal}</td>
          </tr>
        </table>
        <div style="text-align:center;">
          <button class="print-btn" onclick="window.print()">Print</button>
          <button class="pdf-btn" onclick="downloadPDF()">Download PDF</button>
        </div>
      </div>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>
      <script>
      function downloadPDF() {
        html2pdf(document.querySelector('.est-wrap'), {
          margin:0.5, filename:'Estimate.pdf', image:{type:'jpeg', quality:0.98}, html2canvas:{scale:2}
        });
      }
      </script>
    </body>
    </html>`;
    const prevWin = window.open('', '_blank');
    prevWin.document.write(previewHtml);
    prevWin.document.close();
}

// "Add New Estimate" button
document.getElementById('newEstimateBtn').onclick = function () {
    document.getElementById('estimateForm').reset();
    setDefaultDateSerial();
    addFirstItemRow();
    document.getElementById('customerName').focus();
    updateGrandTotal();
};
